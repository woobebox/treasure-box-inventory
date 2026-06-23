create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete cascade,
  parent_id uuid references public.locations(id), type text not null, name text not null, path text not null, sort_order integer not null default 0,
  version integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz,
  constraint locations_no_self_parent check (parent_id is null or parent_id <> id)
);
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete cascade,
  created_by uuid not null references auth.users(id), updated_by uuid not null references auth.users(id), current_location_id uuid references public.locations(id),
  cover_photo_id uuid, name text not null, normalized_name text not null, category text not null default '', status text not null default 'active', notes text,
  due_at timestamptz, version integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete cascade, item_id uuid not null references public.items(id) on delete cascade,
  storage_key text not null, thumb_key text not null, local_main_blob_key text, local_thumb_blob_key text, width integer not null, height integer not null,
  mime_type text not null, byte_size integer not null, thumb_byte_size integer not null, exif_stripped boolean not null default true, original_retained boolean not null default false,
  taken_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz,
  constraint photos_no_originals check (original_retained = false)
);
create table if not exists public.tags (id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete cascade, name text not null, normalized_name text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, unique(household_id, normalized_name));
create table if not exists public.item_tags (item_id uuid not null references public.items(id) on delete cascade, tag_id uuid not null references public.tags(id) on delete cascade, household_id uuid not null references public.households(id) on delete cascade, created_at timestamptz not null default now(), primary key(item_id, tag_id));
create index if not exists items_household_updated_idx on public.items(household_id, updated_at); create index if not exists locations_household_parent_idx on public.locations(household_id, parent_id); create index if not exists photos_household_item_idx on public.photos(household_id, item_id);
