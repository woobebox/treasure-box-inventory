create extension if not exists "pgcrypto";

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  role text not null check (role in ('admin', 'member')),
  status text not null default 'invited' check (status in ('invited', 'active', 'removed')),
  invited_by uuid references auth.users(id),
  invited_at timestamptz,
  joined_at timestamptz,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create index if not exists household_members_user_idx on public.household_members(user_id, status);
create index if not exists household_members_household_idx on public.household_members(household_id, status);
