begin;
-- Zip migration: new tables only; existing places, courses and member data are untouched.
create table if not exists public.zip_rooms (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 name text not null check (char_length(name) between 1 and 20),
 description text not null default '' check (char_length(description)<=100),
 region text not null,
 start_date date not null,
 end_date date not null check (end_date>=start_date and end_date-start_date<=30),
 image_path text,
 payload jsonb not null default '{"title":"","days":[]}',
 revision bigint not null default 0,
 created_at timestamptz not null default now()
);
create table if not exists public.zip_room_members (
 room_id uuid not null references public.zip_rooms(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 taste jsonb,
 keywords jsonb not null default '[]',
 joined_at timestamptz not null default now(),
 primary key(room_id,user_id)
);
create index if not exists zip_members_user_idx on public.zip_room_members(user_id,room_id);
create table if not exists public.zip_room_invites (
 id uuid primary key default gen_random_uuid(),
 room_id uuid not null references public.zip_rooms(id) on delete cascade,
 created_by uuid not null references auth.users(id) on delete cascade,
 recipient_id uuid references auth.users(id) on delete cascade,
 token_hash text unique,
 expires_at timestamptz not null default now()+interval '7 days',
 created_at timestamptz not null default now(),
 check(recipient_id is not null or token_hash is not null)
);
create index if not exists zip_invite_recipient_idx on public.zip_room_invites(recipient_id,expires_at);
alter table public.zip_rooms enable row level security;
alter table public.zip_room_members enable row level security;
alter table public.zip_room_invites enable row level security;
-- All access goes through the backend, which verifies the authenticated member.
revoke all on public.zip_rooms,public.zip_room_members,public.zip_room_invites from anon,authenticated;
grant all on public.zip_rooms,public.zip_room_members,public.zip_room_invites to service_role;

create or replace function public.zip_create_room(room jsonb, creator uuid)
returns uuid language plpgsql security invoker set search_path=public as $$
declare new_id uuid;
begin
 insert into zip_rooms(owner_id,name,description,region,start_date,end_date,image_path,payload)
 values(creator,room->>'name',coalesce(room->>'description',''),room->>'region',
 (room->>'start_date')::date,(room->>'end_date')::date,room->>'image_path',room->'payload') returning id into new_id;
 insert into zip_room_members(room_id,user_id) values(new_id,creator);
 return new_id;
end; $$;
revoke all on function public.zip_create_room(jsonb,uuid) from public,anon,authenticated;
grant execute on function public.zip_create_room(jsonb,uuid) to service_role;

commit;
