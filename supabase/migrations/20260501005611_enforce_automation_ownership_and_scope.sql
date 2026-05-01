create or replace function public.pulse_is_workspace_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pulse_profiles as profile
    where profile.id = auth.uid()
      and profile.workspace_id = public.pulse_current_workspace_id()
      and profile.role = 'admin'
      and profile.disabled is not true
  )
$$;

grant execute on function public.pulse_is_workspace_admin() to authenticated;
revoke execute on function public.pulse_is_workspace_admin() from public, anon;

alter table public.pulse_automations
  add column if not exists configuration jsonb not null default '{}'::jsonb,
  add column if not exists target_user_id uuid references public.pulse_profiles(id) on delete cascade,
  add column if not exists created_by_user_id uuid references public.pulse_profiles(id) on delete cascade;

update public.pulse_automations
set created_by_user_id = coalesce(created_by_user_id, target_user_id)
where created_by_user_id is null
  and target_user_id is not null;

update public.pulse_automations
set target_user_id = created_by_user_id
where target_user_id is null
  and created_by_user_id is not null
  and not exists (
    select 1
    from public.pulse_profiles as profile
    where profile.id = pulse_automations.created_by_user_id
      and profile.workspace_id = pulse_automations.workspace_id
      and profile.role = 'admin'
      and profile.disabled is not true
  );

drop policy if exists "Users can read workspace automations" on public.pulse_automations;
drop policy if exists "Admins can manage workspace automations" on public.pulse_automations;
drop policy if exists "pulse_automations_select" on public.pulse_automations;
drop policy if exists "pulse_automations_insert" on public.pulse_automations;
drop policy if exists "pulse_automations_update" on public.pulse_automations;
drop policy if exists "pulse_automations_delete" on public.pulse_automations;

create policy "pulse_automations_select"
on public.pulse_automations for select
to authenticated
using (
  workspace_id = public.pulse_current_workspace_id()
  and (
    created_by_user_id = auth.uid()
    or target_user_id = auth.uid()
    or target_user_id is null
    or public.pulse_is_workspace_admin()
  )
);

create policy "pulse_automations_insert"
on public.pulse_automations for insert
to authenticated
with check (
  workspace_id = public.pulse_current_workspace_id()
  and created_by_user_id = auth.uid()
  and (
    target_user_id = auth.uid()
    or (target_user_id is null and public.pulse_is_workspace_admin())
  )
);

create policy "pulse_automations_update"
on public.pulse_automations for update
to authenticated
using (
  workspace_id = public.pulse_current_workspace_id()
  and (
    created_by_user_id = auth.uid()
    or public.pulse_is_workspace_admin()
  )
)
with check (
  workspace_id = public.pulse_current_workspace_id()
  and (
    created_by_user_id = auth.uid()
    or public.pulse_is_workspace_admin()
  )
  and (
    target_user_id = created_by_user_id
    or (target_user_id is null and public.pulse_is_workspace_admin())
  )
);

create policy "pulse_automations_delete"
on public.pulse_automations for delete
to authenticated
using (
  workspace_id = public.pulse_current_workspace_id()
  and (
    created_by_user_id = auth.uid()
    or public.pulse_is_workspace_admin()
  )
);
