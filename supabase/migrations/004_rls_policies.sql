alter table public.households enable row level security; alter table public.household_members enable row level security; alter table public.items enable row level security; alter table public.locations enable row level security; alter table public.photos enable row level security; alter table public.tags enable row level security; alter table public.item_tags enable row level security; alter table public.history enable row level security; alter table public.sync_ops enable row level security; alter table public.device_sync enable row level security; alter table public.conflicts enable row level security; alter table public.backup_snapshots enable row level security;

create or replace function public.is_household_member(target_household uuid) returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from household_members where household_id = target_household and user_id = auth.uid() and status = 'active') $$;
create or replace function public.is_household_admin(target_household uuid) returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from household_members where household_id = target_household and user_id = auth.uid() and status = 'active' and role = 'admin') $$;

do $$ declare t text; begin
  foreach t in array array['items','locations','photos','tags','item_tags','history','sync_ops','device_sync','conflicts','backup_snapshots'] loop
    execute format('drop policy if exists %I_member_select on public.%I', t, t);
    execute format('create policy %I_member_select on public.%I for select using (public.is_household_member(household_id))', t, t);
    execute format('drop policy if exists %I_member_insert on public.%I', t, t);
    execute format('create policy %I_member_insert on public.%I for insert with check (public.is_household_member(household_id))', t, t);
    execute format('drop policy if exists %I_member_update on public.%I', t, t);
    execute format('create policy %I_member_update on public.%I for update using (public.is_household_member(household_id)) with check (public.is_household_member(household_id))', t, t);
  end loop;
end $$;

drop policy if exists households_member_select on public.households; create policy households_member_select on public.households for select using (public.is_household_member(id));
drop policy if exists households_admin_update on public.households; create policy households_admin_update on public.households for update using (public.is_household_admin(id)) with check (public.is_household_admin(id));
drop policy if exists household_members_member_select on public.household_members; create policy household_members_member_select on public.household_members for select using (public.is_household_member(household_id));
drop policy if exists household_members_admin_write on public.household_members; create policy household_members_admin_write on public.household_members for all using (public.is_household_admin(household_id)) with check (public.is_household_admin(household_id));

drop policy if exists items_admin_delete_restore on public.items; create policy items_admin_delete_restore on public.items for update using (public.is_household_admin(household_id) or deleted_at is null) with check (public.is_household_admin(household_id) or deleted_at is null);
