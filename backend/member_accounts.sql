-- Run once in Supabase SQL Editor. Existing demo tables are untouched.
create table if not exists public.member_data (
 user_id uuid not null references auth.users(id) on delete cascade,
 data_key text not null,
 value jsonb not null,
 updated_at timestamptz not null default now(),
 primary key (user_id,data_key)
);
alter table public.member_data enable row level security;
drop policy if exists member_own_data on public.member_data;
create policy member_own_data on public.member_data for all to authenticated
 using (auth.uid()=user_id) with check (auth.uid()=user_id);
revoke all on public.member_data from anon;
grant select,insert,update,delete on public.member_data to authenticated;
