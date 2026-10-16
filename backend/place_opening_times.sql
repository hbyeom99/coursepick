-- Preserve places.opening_hours; normalize place opening times independently of course schedules.
create table if not exists public.place_opening_times (
 place_id text primary key references public.places(id) on delete cascade,
 original_text text not null,
 source_hash text not null,
 opening_time time,
 explicit_weekdays jsonb,
 status text not null check (status in ('normalized','review_pending')),
 review_reason text not null default '',
 evidence text not null default '',
 normalization_version text not null default 'opening-v1',
 updated_at timestamptz not null default now()
);
alter table public.place_opening_times enable row level security;
revoke all on public.place_opening_times from anon, authenticated;
grant select,insert,update on public.place_opening_times to service_role;
