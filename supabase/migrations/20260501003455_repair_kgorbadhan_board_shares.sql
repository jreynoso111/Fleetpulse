with target_profile as (
  select id, email, workspace_id
  from public.pulse_profiles
  where lower(email) = 'kgorbadhan@mntfunding.com'
  limit 1
),
normalized_shares as (
  select
    board.id as board_id,
    jsonb_agg(
      case
        when lower(share.value ->> 'email') = 'kgobardhan@mntfunding.com'
          then jsonb_set(
            jsonb_set(share.value, '{userId}', to_jsonb(target_profile.id::text), true),
            '{email}',
            to_jsonb(target_profile.email),
            true
          )
        else share.value
      end
      order by share.ordinality
    ) as shared_with
  from public.pulse_boards as board
  join target_profile
    on target_profile.workspace_id = board.workspace_id
  cross join lateral jsonb_array_elements(coalesce(board.shared_with, '[]'::jsonb)) with ordinality as share(value, ordinality)
  group by board.id
)
update public.pulse_boards as board
set shared_with = normalized_shares.shared_with
from normalized_shares
where normalized_shares.board_id = board.id
  and board.shared_with is distinct from normalized_shares.shared_with;

insert into public.pulse_notifications (
  user_id,
  title,
  description,
  link,
  type,
  meta
)
select
  shared_profile.id,
  'Board share request',
  'Accept ' || board.name || ' to add it to your workspace with ' || coalesce(share.value ->> 'permission', 'view') || ' access.',
  '/app/boards/' || board.slug,
  'board-share-request',
  jsonb_build_object(
    'boardId', board.id,
    'permission', coalesce(share.value ->> 'permission', 'view'),
    'ownerUserId', board.owner_user_id,
    'ownerEmail', coalesce(owner_profile.email, ''),
    'accepted', false
  )
from public.pulse_boards as board
cross join lateral jsonb_array_elements(coalesce(board.shared_with, '[]'::jsonb)) as share(value)
join public.pulse_profiles as shared_profile
  on shared_profile.id = (share.value ->> 'userId')::uuid
  and shared_profile.workspace_id = board.workspace_id
left join public.pulse_profiles as owner_profile
  on owner_profile.id = board.owner_user_id
where lower(shared_profile.email) = 'kgorbadhan@mntfunding.com'
  and coalesce((share.value ->> 'accepted')::boolean, false) is false
  and not exists (
    select 1
    from public.pulse_notifications as notification
    where notification.user_id = shared_profile.id
      and notification.type = 'board-share-request'
      and notification.meta ->> 'boardId' = board.id
  );
