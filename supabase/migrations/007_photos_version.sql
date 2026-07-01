-- Photo metadata participates in the same optimistic-concurrency protocol as
-- items and locations. The web client has always emitted photo.version, but
-- the original photos table omitted the matching cloud column.
alter table public.photos
  add column if not exists version integer not null default 1;

comment on column public.photos.version is
  'Monotonic optimistic-concurrency version for photo metadata sync.';
