-- Apply after 202610270005_influencer_form.sql.
-- Lets an admin see and remove academy accounts. Sign-in addresses live in
-- auth.users, which the browser cannot read, so both functions run as definer
-- and check is_admin() themselves before touching anything.

create function public.admin_list_accounts()
returns table (id uuid, email text, full_name text, role text, created_at timestamptz, last_sign_in_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, u.email::text, p.full_name, p.role, p.created_at, u.last_sign_in_at
  from public.profiles p join auth.users u on u.id = p.id
  where public.is_admin()
  order by p.created_at;
$$;
revoke all on function public.admin_list_accounts() from public;
grant execute on function public.admin_list_accounts() to authenticated;

-- Removing an account deletes the sign-in and cascades to the profile. Classes and
-- enrollments point at a teacher without a cascade, so a teacher who still holds
-- classes is refused rather than silently detached from them: the academy should
-- hand those groups to someone before the account goes.
create function public.admin_delete_user(target uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_role text; v_classes integer;
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  if target = auth.uid() then raise exception 'You cannot remove your own account'; end if;

  select role into v_role from public.profiles where id = target;
  if v_role is null then raise exception 'That account no longer exists'; end if;

  if v_role = 'admin' and (select count(*) from public.profiles where role = 'admin') <= 1 then
    raise exception 'Grant another admin before removing the last one';
  end if;

  select count(*) into v_classes from public.classes where teacher_id = target;
  if v_classes > 0 then
    raise exception 'This teacher still holds % class group(s). Assign another teacher first.', v_classes;
  end if;

  delete from auth.users where id = target;
end $$;
revoke all on function public.admin_delete_user(uuid) from public;
grant execute on function public.admin_delete_user(uuid) to authenticated;
