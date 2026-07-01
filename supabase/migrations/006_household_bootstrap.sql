-- Bootstrap RPC: lets an authenticated user create their first household and
-- become its admin member atomically. This resolves the RLS chicken-and-egg:
-- households has no INSERT policy and household_members only allows existing
-- admins to write, so a brand-new user could otherwise never create one.
--
-- security definer runs with the function owner's rights (bypassing RLS) but we
-- bind every write to auth.uid(), so a caller can only ever create a household
-- owned by themselves.
create or replace function public.create_household(p_name text)
returns public.households
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_household public.households;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if coalesce(btrim(p_name), '') = '' then
    raise exception 'household_name_required';
  end if;

  insert into public.households (name, created_by)
  values (btrim(p_name), v_uid)
  returning * into v_household;

  insert into public.household_members (household_id, user_id, role, status, joined_at)
  values (v_household.id, v_uid, 'admin', 'active', now());

  return v_household;
end;
$$;

grant execute on function public.create_household(text) to authenticated;
