-- Nexus Chat: Supabase Auth-backed profiles and private messaging.
-- Apply with `supabase db push` or paste into the Supabase SQL editor.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (length(btrim(display_name)) between 1 and 80),
  username text not null check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  bio text not null default '' check (length(bio) <= 280),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username));
create index if not exists profiles_display_name_trgm_idx
  on public.profiles using gin (display_name gin_trgm_ops);
create index if not exists profiles_username_trgm_idx
  on public.profiles using gin (username gin_trgm_ops);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  is_group boolean not null default false,
  created_at timestamptz not null default now(),
  direct_user_low uuid references public.profiles(id) on delete cascade,
  direct_user_high uuid references public.profiles(id) on delete cascade,
  last_message text,
  last_message_at timestamptz,
  last_sender_id uuid references public.profiles(id) on delete set null,
  constraint conversations_direct_pair_check check (
    (is_group and direct_user_low is null and direct_user_high is null)
    or
    (not is_group and direct_user_low is not null and direct_user_high is not null and direct_user_low < direct_user_high)
  )
);
create unique index if not exists conversations_unique_direct_pair
  on public.conversations (direct_user_low, direct_user_high)
  where is_group = false;

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index if not exists conversation_members_user_id_idx on public.conversation_members (user_id);
create index if not exists conversation_members_conversation_id_idx on public.conversation_members (conversation_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(btrim(body)) between 1 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists messages_conversation_id_idx on public.messages (conversation_id);
create index if not exists messages_conversation_created_at_idx on public.messages (conversation_id, created_at);
create index if not exists messages_created_at_idx on public.messages (created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
drop trigger if exists messages_set_updated_at on public.messages;
create trigger messages_set_updated_at before update on public.messages
for each row execute function public.set_updated_at();

create or replace function public.update_conversation_preview()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations
     set last_message = new.body,
         last_message_at = new.created_at,
         last_sender_id = new.sender_id
   where id = new.conversation_id;
  return new;
end;
$$;
drop trigger if exists messages_update_conversation_preview on public.messages;
create trigger messages_update_conversation_preview after insert on public.messages
for each row execute function public.update_conversation_preview();

-- This SECURITY DEFINER helper avoids recursive RLS evaluation on conversation_members.
create or replace function public.is_conversation_member(target_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.conversation_members as cm
     where cm.conversation_id = target_conversation_id
       and cm.user_id = (select auth.uid())
  );
$$;
revoke all on function public.is_conversation_member(uuid) from anon, authenticated, public;
grant execute on function public.is_conversation_member(uuid) to authenticated;

-- Registration requires Supabase email confirmation. Phone is optional.
-- This SECURITY DEFINER helper exposes only a boolean, never auth.users fields.
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

-- A single RPC performs an atomic, duplicate-safe creation of a direct conversation.
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

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

-- RLS is the row-level boundary; explicit grants also keep unneeded write paths closed.
revoke all on table public.profiles, public.conversations, public.conversation_members, public.messages from anon, authenticated, public;
grant select, insert, update on table public.profiles to authenticated;
grant select on table public.conversations, public.conversation_members to authenticated;
revoke insert, update on table public.profiles from authenticated;
grant insert (id, display_name, username, bio, avatar_url) on table public.profiles to authenticated;
grant update (display_name, username, bio, avatar_url) on table public.profiles to authenticated;
grant select on table public.messages to authenticated;
grant insert (conversation_id, sender_id, body) on table public.messages to authenticated;

-- Profile rows contain public fields only. Auth email, phone, and secrets remain in auth.users.
drop policy if exists "Authenticated users can read public profiles" on public.profiles;
create policy "Authenticated users can read public profiles" on public.profiles
  for select to authenticated using (public.is_nexus_user_verified());
drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()) and public.is_nexus_user_verified());
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) and public.is_nexus_user_verified())
  with check (id = (select auth.uid()) and public.is_nexus_user_verified());

-- Conversation creation and membership writes are restricted to the RPC above.
drop policy if exists "Members can read their conversations" on public.conversations;
create policy "Members can read their conversations" on public.conversations
  for select to authenticated using (public.is_nexus_user_verified() and public.is_conversation_member(id));
drop policy if exists "Members can read relevant memberships" on public.conversation_members;
create policy "Members can read relevant memberships" on public.conversation_members
  for select to authenticated using (public.is_nexus_user_verified() and public.is_conversation_member(conversation_id));

-- Messages are visible only to members, and senders can never impersonate another account.
drop policy if exists "Members can read conversation messages" on public.messages;
create policy "Members can read conversation messages" on public.messages
  for select to authenticated using (public.is_nexus_user_verified() and public.is_conversation_member(conversation_id));
drop policy if exists "Members can send as themselves" on public.messages;
create policy "Members can send as themselves" on public.messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and public.is_nexus_user_verified()
    and public.is_conversation_member(conversation_id)
  );
-- Profile avatars are public; writes are limited to a user's own storage folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "Avatar images are publicly readable" on storage.objects;
create policy "Avatar images are publicly readable" on storage.objects
  for select to public using (bucket_id = 'avatars');
drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar" on storage.objects
  for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar" on storage.objects
  for delete to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Supabase Realtime publishes newly inserted messages to authorized subscribers.
do $$
begin
  if not exists (
    select 1
      from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;
