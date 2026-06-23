insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('compressed-photos', 'compressed-photos', false, 10485760, array['image/webp','image/jpeg','image/png']) on conflict (id) do update set public = false;

create or replace function public.storage_household_id(object_name text) returns uuid language sql immutable as $$ select nullif(split_part(object_name, '/', 1), '')::uuid $$;

drop policy if exists compressed_photos_member_select on storage.objects;
create policy compressed_photos_member_select on storage.objects for select using (bucket_id = 'compressed-photos' and public.is_household_member(public.storage_household_id(name)));
drop policy if exists compressed_photos_member_insert on storage.objects;
create policy compressed_photos_member_insert on storage.objects for insert with check (bucket_id = 'compressed-photos' and public.is_household_member(public.storage_household_id(name)));
drop policy if exists compressed_photos_admin_delete on storage.objects;
create policy compressed_photos_admin_delete on storage.objects for delete using (bucket_id = 'compressed-photos' and public.is_household_admin(public.storage_household_id(name)));
