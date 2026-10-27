-- Apply after 202610270006_admin_accounts.sql.
-- Everyone gets a settings page: their own details, and what they want to be
-- told about.

alter table public.profiles
  add column if not exists phone text not null default '',
  add column if not exists time_zone text not null default '',
  add column if not exists notify_announcements boolean not null default true,
  add column if not exists notify_homework boolean not null default true,
  add column if not exists notify_results boolean not null default true;

-- Until now only an admin could write a profile, so nobody could correct their
-- own name. A person may now edit their own row.
create policy profiles_self_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- That policy alone would let anyone set their own role to admin, because row
-- level security cannot compare the old row with the new one. This can.
create function public.guard_profile_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only an academy admin can change a role';
  end if;
  return new;
end $$;
create trigger profiles_role_guard before update on public.profiles
  for each row execute function public.guard_profile_role();
