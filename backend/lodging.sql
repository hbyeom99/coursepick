-- Optional lodging details; existing non-lodging rows remain unchanged.
alter table public.places add column if not exists lodging_info jsonb;
