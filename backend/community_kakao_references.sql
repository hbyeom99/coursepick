-- Allow mixed native/Kakao visits without storing external place bodies.
-- Does not delete places or courses, and does not change RLS/grants.
begin;
alter table public.courses alter column cover_place_id drop not null;
do $$
declare constraint_row record;
begin
 for constraint_row in
   select conname from pg_constraint
   where conrelid='public.courses'::regclass and contype='c'
     and (pg_get_constraintdef(oid) ilike '%cardinality(place_ids)%'
       or (pg_get_constraintdef(oid) ilike '%cover_place_id%'
         and pg_get_constraintdef(oid) ilike '%place_ids%'
         and pg_get_constraintdef(oid) ilike '%ANY%'))
 loop
   execute format('alter table public.courses drop constraint %I', constraint_row.conname);
 end loop;
end $$;
alter table public.courses add constraint courses_native_place_count_check
 check(cardinality(place_ids) between 0 and 7);
alter table public.courses add constraint courses_native_cover_membership_check
 check(cover_place_id is null or cover_place_id=any(place_ids));
alter table public.courses drop constraint if exists courses_total_visit_count_check;
alter table public.courses add constraint courses_total_visit_count_check
 check(jsonb_typeof(schedule)='array' and jsonb_array_length(schedule) between 2 and 7);

create or replace function public.validate_course_schedule()
returns trigger language plpgsql set search_path=public as $$
declare item jsonb; ref jsonb; native_ids text[] := '{}'; kakao_ids text[] := '{}';
 visit_day integer; last_day integer := 1; last_end integer := 0;
 start_minutes integer; stay integer;
begin
 if cardinality(new.place_ids) <> (select count(distinct id) from unnest(new.place_ids) as ids(id)) then
   raise exception 'Duplicate native place IDs';
 end if;
 if exists(select 1 from unnest(new.place_ids) as ids(id) where id is null or not exists(select 1 from public.places p where p.id=ids.id)) then
   raise exception 'Unknown native place ID';
 end if;
 for item in select value from jsonb_array_elements(new.schedule) loop
   if coalesce(item->>'label','')='' or coalesce(item->>'start_time','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
     or coalesce(item->>'duration_minutes','') !~ '^[0-9]+$' then
     raise exception 'Invalid visit timing';
   end if;
   stay=(item->>'duration_minutes')::integer;
   if stay not between 1 and 1440 then raise exception 'Invalid duration'; end if;
   if coalesce(item->>'day','1') !~ '^[1-3]$' then raise exception 'Invalid day'; end if;
   visit_day=coalesce(item->>'day','1')::integer;
   if visit_day<last_day or visit_day>last_day+1 then raise exception 'Invalid day order'; end if;
   if visit_day<>last_day then last_end=0;last_day=visit_day;end if;
   start_minutes=split_part(item->>'start_time',':',1)::integer*60+split_part(item->>'start_time',':',2)::integer;
   if start_minutes<last_end or start_minutes+stay>1440 then raise exception 'Overlapping visit';end if;
   last_end=start_minutes+stay;
   if item ? 'kakao_ref' then
     ref=item->'kakao_ref';
     if jsonb_typeof(ref) is distinct from 'object' then raise exception 'Invalid Kakao reference object';end if;
     if (select count(*) from jsonb_object_keys(ref))<>5
       or not(ref ?& array['placeId','day','query','category','page'])
       or coalesce(ref->>'placeId','') !~ '^[0-9]{1,40}$'
       or ref->>'day' is distinct from visit_day::text
       or char_length(trim(coalesce(ref->>'query',''))) not between 1 and 80
       or ref->>'category' not in ('전체','맛집','카페','관광','체험','숙소')
       or coalesce(ref->>'page','') !~ '^([1-9]|[1-3][0-9]|4[0-5])$'
       or item->>'place_id' is not null then
       raise exception 'Invalid Kakao reference';
     end if;
     if ref->>'placeId'=any(kakao_ids) then raise exception 'Duplicate Kakao place';end if;
     kakao_ids=array_append(kakao_ids,ref->>'placeId');
   else
     if coalesce(item->>'place_id','')='' then raise exception 'Missing native visit';end if;
     native_ids=array_append(native_ids,item->>'place_id');
   end if;
 end loop;
 if native_ids is distinct from new.place_ids then raise exception 'Invalid native visit order';end if;
 if new.cover_place_id is null and cardinality(kakao_ids)=0 then raise exception 'Missing cover';end if;
 if new.cover_place_id is not null and not(new.cover_place_id=any(native_ids)) then raise exception 'Invalid native cover';end if;
 return new;
end;
$$;
commit;
