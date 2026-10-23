begin;
create table if not exists public.editorial_courses (
 id text primary key,
 title text not null check(char_length(title) between 1 and 100),
 description text not null,
 region text not null,
 transport text not null check(transport in ('자동차','도보','대중교통')),
 tags jsonb not null default '[]' check(jsonb_typeof(tags)='array'),
 days jsonb not null check(jsonb_typeof(days)='array'),
 notices jsonb not null default '[]' check(jsonb_typeof(notices)='array'),
 priority integer not null default 100,
 publication_status text not null default 'draft' check(publication_status in ('draft','published','archived')),
 cover_place_id text references public.places(id),
 source text not null,
 created_at timestamptz not null default now()
);
alter table public.editorial_courses enable row level security;
revoke all on public.editorial_courses from anon, authenticated;
grant select,insert,update,delete on public.editorial_courses to service_role;
notify pgrst,'reload schema';
commit;
