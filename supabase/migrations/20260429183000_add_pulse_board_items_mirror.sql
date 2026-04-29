create table if not exists public.pulse_board_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.pulse_workspaces(id) on delete cascade,
  board_id text not null references public.pulse_boards(id) on delete cascade,
  item_id text not null,
  row_name text not null default '',
  row_data jsonb not null default '{}'::jsonb,
  position integer not null default 0,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  created_by uuid references public.pulse_profiles(id) on delete set null,
  updated_by uuid references public.pulse_profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (board_id, item_id)
);

create index if not exists pulse_board_items_workspace_board_idx
  on public.pulse_board_items(workspace_id, board_id, position);

create index if not exists pulse_board_items_item_id_idx
  on public.pulse_board_items(item_id);

create or replace function public.pulse_sync_board_items_from_board()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  with normalized_items as (
    select
      new.workspace_id,
      new.id as board_id,
      coalesce(item.value ->> 'id', 'item-' || item.ordinality::text) as item_id,
      coalesce(item.value ->> 'name', '') as row_name,
      case
        when item.value ? 'id' then item.value
        else jsonb_set(item.value, '{id}', to_jsonb('item-' || item.ordinality::text), true)
      end as row_data,
      item.ordinality::integer as position
    from jsonb_array_elements(
      case
        when jsonb_typeof(coalesce(new.items, '[]'::jsonb)) = 'array' then coalesce(new.items, '[]'::jsonb)
        when jsonb_typeof(coalesce(new.items, '[]'::jsonb)) = 'object' then jsonb_build_array(new.items)
        else '[]'::jsonb
      end
    ) with ordinality as item(value, ordinality)
    where jsonb_typeof(item.value) = 'object'
  ),
  upserted_items as (
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
    select
      normalized_items.workspace_id,
      normalized_items.board_id,
      normalized_items.item_id,
      normalized_items.row_name,
      normalized_items.row_data,
      normalized_items.position,
      false,
      null,
      current_user_id,
      current_user_id,
      timezone('utc', now()),
      timezone('utc', now())
    from normalized_items
    on conflict (board_id, item_id) do update
      set workspace_id = excluded.workspace_id,
          row_name = excluded.row_name,
          row_data = excluded.row_data,
          position = excluded.position,
          is_deleted = false,
          deleted_at = null,
          updated_by = current_user_id,
          updated_at = timezone('utc', now())
    returning item_id
  )
  update public.pulse_board_items
  set is_deleted = true,
      deleted_at = coalesce(deleted_at, timezone('utc', now())),
      updated_by = current_user_id,
      updated_at = timezone('utc', now())
  where board_id = new.id
    and item_id not in (select item_id from upserted_items)
    and is_deleted = false;

  return new;
end;
$$;

drop trigger if exists pulse_sync_board_items_after_board_write on public.pulse_boards;

create trigger pulse_sync_board_items_after_board_write
after insert or update of items on public.pulse_boards
for each row
execute function public.pulse_sync_board_items_from_board();

insert into public.pulse_board_items (
  workspace_id,
  board_id,
  item_id,
  row_name,
  row_data,
  position,
  is_deleted,
  created_at,
  updated_at
)
select
  board.workspace_id,
  board.id,
  coalesce(item.value ->> 'id', 'item-' || item.ordinality::text),
  coalesce(item.value ->> 'name', ''),
  case
    when item.value ? 'id' then item.value
    else jsonb_set(item.value, '{id}', to_jsonb('item-' || item.ordinality::text), true)
  end,
  item.ordinality::integer,
  false,
  coalesce(board.created_at, timezone('utc', now())),
  timezone('utc', now())
from public.pulse_boards as board
cross join lateral jsonb_array_elements(
  case
    when jsonb_typeof(coalesce(board.items, '[]'::jsonb)) = 'array' then coalesce(board.items, '[]'::jsonb)
    when jsonb_typeof(coalesce(board.items, '[]'::jsonb)) = 'object' then jsonb_build_array(board.items)
    else '[]'::jsonb
  end
) with ordinality as item(value, ordinality)
where jsonb_typeof(item.value) = 'object'
on conflict (board_id, item_id) do update
  set row_name = excluded.row_name,
      row_data = excluded.row_data,
      position = excluded.position,
      is_deleted = false,
      deleted_at = null,
      updated_at = timezone('utc', now());

alter table public.pulse_board_items enable row level security;

drop policy if exists "Users can read board item rows in their workspace" on public.pulse_board_items;
create policy "Users can read board item rows in their workspace"
on public.pulse_board_items
for select
to authenticated
using (
  workspace_id = public.pulse_current_workspace_id()
  and (
    exists (
      select 1
      from public.pulse_profiles as profile
      where profile.id = auth.uid()
        and profile.workspace_id = pulse_board_items.workspace_id
        and profile.role = 'admin'
        and profile.disabled is not true
    )
    or exists (
      select 1
      from public.pulse_boards as board
      where board.id = pulse_board_items.board_id
        and board.workspace_id = pulse_board_items.workspace_id
        and (
          board.owner_user_id = auth.uid()
          or exists (
            select 1
            from jsonb_array_elements(coalesce(board.shared_with, '[]'::jsonb)) as share(value)
            where (share.value ->> 'userId') = auth.uid()::text
              and coalesce((share.value ->> 'accepted')::boolean, false)
          )
        )
    )
  )
);

drop policy if exists "Board item rows are maintained by board writes" on public.pulse_board_items;
create policy "Board item rows are maintained by board writes"
on public.pulse_board_items
for all
to authenticated
using (false)
with check (false);

create or replace view public.pulse_board_item_export
with (security_invoker = true)
as
select
  item.workspace_id,
  item.board_id,
  board.name as board_name,
  board.slug as board_slug,
  item.item_id,
  item.row_name,
  item.row_data,
  item.position,
  item.is_deleted,
  item.deleted_at,
  item.created_at,
  item.updated_at,
  item.created_by,
  created_profile.email as created_by_email,
  created_profile.name as created_by_name,
  item.updated_by,
  updated_profile.email as updated_by_email,
  updated_profile.name as updated_by_name
from public.pulse_board_items as item
join public.pulse_boards as board
  on board.id = item.board_id
left join public.pulse_profiles as created_profile
  on created_profile.id = item.created_by
left join public.pulse_profiles as updated_profile
  on updated_profile.id = item.updated_by;

grant select on public.pulse_board_item_export to authenticated;

create or replace view public.pulse_board_access_export
with (security_invoker = true)
as
select
  board.workspace_id,
  board.id as board_id,
  board.name as board_name,
  board.slug as board_slug,
  board.owner_user_id as user_id,
  owner_profile.email as user_email,
  owner_profile.name as user_name,
  'owner'::text as permission,
  true as accepted,
  'owner'::text as access_source,
  array[]::text[] as view_columns
from public.pulse_boards as board
left join public.pulse_profiles as owner_profile
  on owner_profile.id = board.owner_user_id
union all
select
  board.workspace_id,
  board.id as board_id,
  board.name as board_name,
  board.slug as board_slug,
  (share.value ->> 'userId')::uuid as user_id,
  coalesce(share.value ->> 'email', shared_profile.email) as user_email,
  shared_profile.name as user_name,
  coalesce(share.value ->> 'permission', 'view') as permission,
  coalesce((share.value ->> 'accepted')::boolean, false) as accepted,
  'share'::text as access_source,
  coalesce(
    array(
      select jsonb_array_elements_text(share.value -> 'viewColumns')
      where jsonb_typeof(share.value -> 'viewColumns') = 'array'
    ),
    array[]::text[]
  ) as view_columns
from public.pulse_boards as board
cross join lateral jsonb_array_elements(coalesce(board.shared_with, '[]'::jsonb)) as share(value)
left join public.pulse_profiles as shared_profile
  on shared_profile.id = (share.value ->> 'userId')::uuid;

grant select on public.pulse_board_access_export to authenticated;

create or replace function public.pulse_export_board_rows(target_board_id text)
returns table (
  workspace_id uuid,
  board_id text,
  board_name text,
  board_slug text,
  item_id text,
  row_name text,
  row_data jsonb,
  position integer,
  is_deleted boolean,
  deleted_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  created_by uuid,
  created_by_email text,
  created_by_name text,
  updated_by uuid,
  updated_by_email text,
  updated_by_name text
)
language sql
security invoker
set search_path = ''
as $$
  select
    export_row.workspace_id,
    export_row.board_id,
    export_row.board_name,
    export_row.board_slug,
    export_row.item_id,
    export_row.row_name,
    export_row.row_data,
    export_row.position,
    export_row.is_deleted,
    export_row.deleted_at,
    export_row.created_at,
    export_row.updated_at,
    export_row.created_by,
    export_row.created_by_email,
    export_row.created_by_name,
    export_row.updated_by,
    export_row.updated_by_email,
    export_row.updated_by_name
  from public.pulse_board_item_export as export_row
  where export_row.board_id = target_board_id
    and exists (
      select 1
      from public.pulse_board_access_export as access
      where access.board_id = export_row.board_id
        and access.user_id = auth.uid()
        and access.accepted = true
    )
  order by export_row.position, export_row.updated_at, export_row.item_id;
$$;

grant execute on function public.pulse_export_board_rows(text) to authenticated;
