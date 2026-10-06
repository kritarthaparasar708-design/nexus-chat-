-- Existing databases may have already applied the initial migration, which required
-- both email and phone confirmation. Replace that gate with email confirmation only.
create or replace function public.is_nexus_user_verified()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from auth.users as u
     where u.id = (select auth.uid())
       and u.email_confirmed_at is not null
  );
$$;
revoke all on function public.is_nexus_user_verified() from anon, authenticated, public;
grant execute on function public.is_nexus_user_verified() to authenticated;

-- Keep the RPC's error message aligned with the email-only access requirement.
create or replace function public.create_direct_conversation(target_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  requester_id uuid := auth.uid();
  pair_low uuid;
  pair_high uuid;
  conversation_id uuid;
begin
  if requester_id is null then
    raise exception 'Authentication required';
  end if;
  if not public.is_nexus_user_verified() then
    raise exception 'Verify your email before starting a conversation';
  end if;
  if target_user_id is null or target_user_id = requester_id then
    raise exception 'Choose another registered user';
  end if;
  if not exists (select 1 from public.profiles where id = requester_id)
     or not exists (select 1 from public.profiles where id = target_user_id) then
    raise exception 'Both users must have completed their profiles';
  end if;

  pair_low := least(requester_id, target_user_id);
  pair_high := greatest(requester_id, target_user_id);
  perform pg_advisory_xact_lock(hashtextextended(pair_low::text || ':' || pair_high::text, 0));

  select id into conversation_id
    from public.conversations
   where is_group = false
     and direct_user_low = pair_low
     and direct_user_high = pair_high;

  if conversation_id is null then
    insert into public.conversations (is_group, direct_user_low, direct_user_high)
    values (false, pair_low, pair_high)
    returning id into conversation_id;
  end if;

  insert into public.conversation_members (conversation_id, user_id)
  values (conversation_id, pair_low), (conversation_id, pair_high)
  on conflict (conversation_id, user_id) do nothing;

  return conversation_id;
end;
$$;
revoke all on function public.create_direct_conversation(uuid) from anon, authenticated, public;
grant execute on function public.create_direct_conversation(uuid) to authenticated;
