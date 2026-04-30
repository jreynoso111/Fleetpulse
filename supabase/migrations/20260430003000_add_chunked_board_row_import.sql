create or replace function public.pulse_import_board_rows(
  target_board_id text,
  imported_rows jsonb,
  merge_key text default null
)
returns table (
  inserted_count integer,
  updated_count integer,
  skipped_count integer,
  total_active_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_board public.pulse_boards;
  caller_profile public.pulse_profiles;
  row_payload jsonb;
  row_position integer;
  row_item_id text;
  matched_item_id text;
  normalized_merge_value text;
  next_position integer;
  inserted_total integer := 0;
  updated_total integer := 0;
  skipped_total integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.' using errcode = 'insufficient_privilege';
  end if;

  if jsonb_typeof(coalesce(imported_rows, '[]'::jsonb)) <> 'array' then
    raise exception 'Imported rows must be a JSON array.' using errcode = 'invalid_parameter_value';
  end if;

  select *
  into target_board
  from public.pulse_boards
  where id = target_board_id;

  if target_board.id is null then
    raise exception 'Board not found.' using errcode = 'no_data_found';
  end if;

  select *
  into caller_profile
  from public.pulse_profiles
  where id = auth.uid()
    and workspace_id = target_board.workspace_id
    and disabled is not true;

  if caller_profile.id is null then
    raise exception 'You do not have access to this workspace.' using errcode = 'insufficient_privilege';
  end if;

  if caller_profile.role <> 'admin'
    and target_board.owner_user_id <> auth.uid()
    and not exists (
      select 1
      from jsonb_array_elements(coalesce(target_board.shared_with, '[]'::jsonb)) as share(value)
      where (share.value ->> 'userId') = auth.uid()::text
        and coalesce((share.value ->> 'accepted')::boolean, false)
        and coalesce(share.value ->> 'permission', 'view') = 'edit'
    )
  then
    raise exception 'You do not have permission to import rows into this board.' using errcode = 'insufficient_privilege';
  end if;

  select coalesce(max(position), 0)
  into next_position
  from public.pulse_board_items
  where board_id = target_board_id;

  for row_payload, row_position in
    select value, ordinality::integer
    from jsonb_array_elements(imported_rows) with ordinality
  loop
    if jsonb_typeof(row_payload) <> 'object' then
      skipped_total := skipped_total + 1;
      continue;
    end if;

    matched_item_id := null;
    row_item_id := nullif(row_payload ->> 'id', '');

    if row_item_id is not null then
      select item_id
      into matched_item_id
      from public.pulse_board_items
      where board_id = target_board_id
        and item_id = row_item_id
      limit 1;
    end if;

    if matched_item_id is null and nullif(trim(coalesce(merge_key, '')), '') is not null then
      normalized_merge_value := lower(trim(row_payload ->> merge_key));

      if normalized_merge_value is not null and normalized_merge_value <> '' then
        select item_id
        into matched_item_id
        from public.pulse_board_items
        where board_id = target_board_id
          and is_deleted = false
          and lower(trim(row_data ->> merge_key)) = normalized_merge_value
        order by position
        limit 1;
      end if;
    end if;

    if matched_item_id is null then
      row_item_id := coalesce(row_item_id, 'item-' || gen_random_uuid()::text);
      next_position := next_position + 1;

      insert into public.pulse_board_items (
        workspace_id,
        board_id,
        item_id,
        row_name,
        row_data,
        position,
        is_deleted,
        deleted_at,
        created_by,
        updated_by,
        created_at,
        updated_at
      )
      values (
        target_board.workspace_id,
        target_board_id,
        row_item_id,
        coalesce(row_payload ->> 'name', ''),
        jsonb_set(row_payload, '{id}', to_jsonb(row_item_id), true),
        next_position,
        false,
        null,
        auth.uid(),
        auth.uid(),
        timezone('utc', now()),
        timezone('utc', now())
      );

      inserted_total := inserted_total + 1;
    else
      update public.pulse_board_items
      set row_name = coalesce(row_payload ->> 'name', row_name),
          row_data = jsonb_set(row_data || row_payload, '{id}', to_jsonb(matched_item_id), true),
          is_deleted = false,
          deleted_at = null,
          updated_by = auth.uid(),
          updated_at = timezone('utc', now())
      where board_id = target_board_id
        and item_id = matched_item_id;

      updated_total := updated_total + 1;
    end if;
  end loop;

  update public.pulse_boards as board
  set updated_at = timezone('utc', now())
  where board.id = target_board_id;

  select count(*)::integer
  into total_active_count
  from public.pulse_board_items
  where board_id = target_board_id
    and is_deleted = false;

  inserted_count := inserted_total;
  updated_count := updated_total;
  skipped_count := skipped_total;

  return next;
end;
$$;

grant execute on function public.pulse_import_board_rows(text, jsonb, text) to authenticated;
