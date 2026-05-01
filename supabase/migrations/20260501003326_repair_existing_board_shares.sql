with normalized_shares as (
  select
    board.id as board_id,
    coalesce(
      jsonb_agg(
        case
          when profile.id is not null
            then jsonb_set(share.value, '{userId}', to_jsonb(profile.id::text), true)
          else share.value
        end
        order by share.ordinality
      ),
      '[]'::jsonb
    ) as shared_with
  from public.pulse_boards as board
  cross join lateral jsonb_array_elements(coalesce(board.shared_with, '[]'::jsonb)) with ordinality as share(value, ordinality)
  left join public.pulse_profiles as profile
    on lower(profile.email) = lower(share.value ->> 'email')
    and profile.workspace_id = board.workspace_id
    and profile.disabled is not true
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
  and shared_profile.disabled is not true
left join public.pulse_profiles as owner_profile
  on owner_profile.id = board.owner_user_id
where coalesce((share.value ->> 'accepted')::boolean, false) is false
  and not exists (
    select 1
    from public.pulse_notifications as notification
    where notification.user_id = shared_profile.id
      and notification.type = 'board-share-request'
      and notification.meta ->> 'boardId' = board.id
  );
