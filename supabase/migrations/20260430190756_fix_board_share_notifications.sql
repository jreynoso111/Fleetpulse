drop policy if exists "Users can read accessible boards" on public.pulse_boards;
create policy "Users can read accessible boards"
on public.pulse_boards for select
to authenticated
using (
  workspace_id = public.pulse_current_workspace_id()
  and (
    owner_user_id = auth.uid()
    or exists (
      select 1
      from jsonb_array_elements(coalesce(shared_with, '[]'::jsonb)) as shared(entry)
      where (entry->>'userId')::uuid = auth.uid()
    )
    or exists (
      select 1
      from public.pulse_profiles as profile
      where profile.id = auth.uid()
        and profile.workspace_id = pulse_boards.workspace_id
        and profile.role = 'admin'
        and profile.disabled is not true
    )
  )
);

drop policy if exists "Users can manage their notifications" on public.pulse_notifications;
drop policy if exists "Users can read their notifications" on public.pulse_notifications;
drop policy if exists "Users can update their notifications" on public.pulse_notifications;
drop policy if exists "Users can delete their notifications" on public.pulse_notifications;
drop policy if exists "Workspace users can create notifications for workspace users" on public.pulse_notifications;

create policy "Users can read their notifications"
on public.pulse_notifications for select
to authenticated
using (user_id = auth.uid());

create policy "Users can update their notifications"
on public.pulse_notifications for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete their notifications"
on public.pulse_notifications for delete
to authenticated
using (user_id = auth.uid());

create policy "Workspace users can create notifications for workspace users"
on public.pulse_notifications for insert
to authenticated
with check (
  exists (
    select 1
    from public.pulse_profiles as sender
    join public.pulse_profiles as recipient
      on recipient.workspace_id = sender.workspace_id
    where sender.id = auth.uid()
      and sender.disabled is not true
      and recipient.id = pulse_notifications.user_id
      and recipient.disabled is not true
  )
);

create or replace function public.pulse_accept_board_share(target_board_id text)
returns public.pulse_boards
language plpgsql
security definer
set search_path = public
as $$
declare
  target_board public.pulse_boards;
begin
  select *
  into target_board
  from public.pulse_boards
  where id = target_board_id
    and workspace_id = public.pulse_current_workspace_id()
    and exists (
      select 1
      from jsonb_array_elements(coalesce(shared_with, '[]'::jsonb)) as share(value)
      where (share.value ->> 'userId') = auth.uid()::text
    )
  for update;

  if not found then
    raise exception 'Board share not found';
  end if;

  update public.pulse_boards as board
  set shared_with = (
        select coalesce(jsonb_agg(
          case
            when (share.value ->> 'userId') = auth.uid()::text
              then jsonb_set(share.value, '{accepted}', 'true'::jsonb, true)
            else share.value
          end
        ), '[]'::jsonb)
        from jsonb_array_elements(coalesce(board.shared_with, '[]'::jsonb)) as share(value)
      )
  where board.id = target_board_id
  returning * into target_board;

  return target_board;
end;
$$;

create or replace function public.pulse_reject_board_share(target_board_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.pulse_boards as board
  set shared_with = (
        select coalesce(jsonb_agg(share.value), '[]'::jsonb)
        from jsonb_array_elements(coalesce(board.shared_with, '[]'::jsonb)) as share(value)
        where (share.value ->> 'userId') <> auth.uid()::text
      )
  where board.id = target_board_id
    and board.workspace_id = public.pulse_current_workspace_id()
    and exists (
      select 1
      from jsonb_array_elements(coalesce(board.shared_with, '[]'::jsonb)) as share(value)
      where (share.value ->> 'userId') = auth.uid()::text
    );
end;
$$;

grant execute on function public.pulse_accept_board_share(text) to authenticated;
grant execute on function public.pulse_reject_board_share(text) to authenticated;
revoke execute on function public.pulse_accept_board_share(text) from public, anon;
revoke execute on function public.pulse_reject_board_share(text) from public, anon;
