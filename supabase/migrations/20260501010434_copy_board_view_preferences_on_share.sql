create or replace function public.pulse_copy_board_view_preferences_for_share(
  target_board_id text,
  target_user_id uuid,
  source_preferences jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_board public.pulse_boards;
  preferences_to_copy jsonb;
begin
  select *
  into target_board
  from public.pulse_boards
  where id = target_board_id
    and workspace_id = public.pulse_current_workspace_id();

  if not found then
    raise exception 'Board not found';
  end if;

  if target_board.owner_user_id <> auth.uid() and not public.pulse_is_workspace_admin() then
    raise exception 'Only the board owner can copy board view preferences.';
  end if;

  if not exists (
    select 1
    from public.pulse_profiles as profile
    where profile.id = target_user_id
      and profile.workspace_id = target_board.workspace_id
      and profile.disabled is not true
  ) then
    raise exception 'Target user not found in this workspace.';
  end if;

  if target_user_id <> target_board.owner_user_id and not exists (
    select 1
    from jsonb_array_elements(coalesce(target_board.shared_with, '[]'::jsonb)) as share(value)
    where (share.value ->> 'userId') = target_user_id::text
  ) then
    raise exception 'Target user does not have this board shared.';
  end if;

  preferences_to_copy = coalesce(
    source_preferences,
    (
      select preferences
      from public.pulse_board_view_preferences
      where user_id = auth.uid()
        and board_id = target_board_id
    ),
    '{}'::jsonb
  );

  preferences_to_copy = preferences_to_copy - 'undoStack' - 'redoStack';

  insert into public.pulse_board_view_preferences (user_id, board_id, preferences)
  values (target_user_id, target_board_id, preferences_to_copy)
  on conflict (user_id, board_id) do update
    set preferences = excluded.preferences;
end;
$$;

grant execute on function public.pulse_copy_board_view_preferences_for_share(text, uuid, jsonb) to authenticated;
revoke execute on function public.pulse_copy_board_view_preferences_for_share(text, uuid, jsonb) from public, anon;
