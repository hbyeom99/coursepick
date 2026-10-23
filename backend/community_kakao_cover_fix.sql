-- Fix legacy cover membership check for an all-Kakao itinerary.
-- Existing validate_course_schedule() still requires a Kakao visit for null cover.
-- No course data, RLS, grants or place data are modified.
begin;
do $$
declare item record;
begin
 for item in
   select conname from pg_constraint
   where conrelid='public.courses'::regclass and contype='c'
     and pg_get_constraintdef(oid) ilike '%cover_place_id%'
     and pg_get_constraintdef(oid) ilike '%place_ids%'
     and pg_get_constraintdef(oid) ilike '%ANY%'
 loop
   execute format('alter table public.courses drop constraint %I',item.conname);
 end loop;
end $$;
alter table public.courses add constraint courses_native_cover_membership_check
 check(cover_place_id is null or cover_place_id=any(place_ids));
commit;

-- Confirm the replacement check; no application rows are returned.
select conname,pg_get_constraintdef(oid) as definition
from pg_constraint where conrelid='public.courses'::regclass
 and conname='courses_native_cover_membership_check';
