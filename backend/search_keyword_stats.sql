create table if not exists public.search_keyword_stats (
  keyword text primary key,
  search_count bigint not null default 0 check (search_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.search_keyword_stats enable row level security;
revoke all on public.search_keyword_stats from anon, authenticated;
grant all on public.search_keyword_stats to service_role;

create or replace function public.record_search_keyword(keyword_value text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.search_keyword_stats(keyword, search_count, updated_at)
  values (keyword_value, 1, now())
  on conflict (keyword) do update
    set search_count = public.search_keyword_stats.search_count + 1,
        updated_at = now();
end;
$$;

revoke all on function public.record_search_keyword(text) from public, anon, authenticated;
grant execute on function public.record_search_keyword(text) to service_role;
