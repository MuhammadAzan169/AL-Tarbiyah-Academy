-- Apply after 202610230001_academy.sql. Adds the school workflow used by every portal.
alter table public.enrollments add column student_name text not null default '';
alter table public.enrollments add column student_email text not null default '';
create unique index enrollments_student_email_unique on public.enrollments(lower(student_email)) where student_email<>'';
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('parent','student','teacher','admin'));
create table public.timetable_slots (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6),
  starts_local time not null,
  duration_minutes integer not null check (duration_minutes between 15 and 180),
  subject text not null default 'Islamic Studies',
  created_at timestamptz not null default now()
);
create index on public.timetable_slots(class_id, weekday);

create table public.homework_assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  instructions text not null,
  due_at timestamptz,
  resource_url text not null default '',
  published boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.homework_assignments(class_id, due_at);
create table public.homework_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.homework_assignments(id) on delete cascade,
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  answer text not null check (length(answer) between 1 and 10000),
  score numeric(5,2) check (score between 0 and 100),
  feedback text not null default '',
  submitted_at timestamptz not null default now(),
  unique(assignment_id,enrollment_id)
);

create table public.class_announcements (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);
create index on public.class_announcements(class_id, created_at desc);

create table public.progress_notes (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  topic text not null,
  note text not null,
  next_step text not null default '',
  created_at timestamptz not null default now()
);
create index on public.progress_notes(enrollment_id, created_at desc);

alter table public.timetable_slots enable row level security;
alter table public.homework_assignments enable row level security;
alter table public.homework_submissions enable row level security;
alter table public.class_announcements enable row level security;
alter table public.progress_notes enable row level security;

-- These helpers avoid nested RLS queries and centralize class and child access.
create function public.teaches_class(target_class uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.classes where id=target_class and teacher_id=auth.uid());
$$;
create function public.belongs_to_class(target_class uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.enrollments e join public.survey_submissions s on s.id=e.submission_id
    where e.class_id=target_class and (lower(s.email)=lower(auth.jwt()->>'email')
      or (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='student')
        and lower(e.student_email)=lower(auth.jwt()->>'email')))
  );
$$;
create function public.owns_enrollment(target_enrollment uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.enrollments e join public.survey_submissions s on s.id=e.submission_id
    where e.id=target_enrollment and (lower(s.email)=lower(auth.jwt()->>'email')
      or (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='student')
        and lower(e.student_email)=lower(auth.jwt()->>'email')))
  );
$$;
create function public.teaches_enrollment(target_enrollment uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.enrollments e join public.classes c on c.id=e.class_id
    where e.id=target_enrollment and c.teacher_id=auth.uid()
  );
$$;

-- Student access is limited to the one enrollment email entered by an admin.
create policy enrollments_student_read on public.enrollments for select to authenticated using (
  exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='student')
  and student_email<>'' and lower(student_email)=lower(auth.jwt()->>'email')
);
create policy classes_student_read on public.classes for select to authenticated using (public.belongs_to_class(id));
create policy lessons_student_read on public.lessons for select to authenticated using (public.belongs_to_class(class_id));
create policy attendance_student_read on public.attendance for select to authenticated using (public.owns_enrollment(enrollment_id));
create policy exams_student_read on public.exams for select to authenticated using (published and public.belongs_to_class(class_id));
create policy exam_submissions_student_read on public.exam_submissions for select to authenticated using (public.owns_enrollment(enrollment_id));
create policy exam_submissions_student_insert on public.exam_submissions for insert to authenticated with check (
  score is null and feedback='' and public.owns_enrollment(enrollment_id) and
  exists(select 1 from public.exams x join public.enrollments e on e.class_id=x.class_id
    where x.id=exam_id and x.published and e.id=enrollment_id and (x.due_at is null or x.due_at>=now()))
);
create function public.assign_student_by_email(target_email text) returns void
language plpgsql security definer set search_path=public as $$
declare v_user uuid;
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  if not exists(select 1 from public.enrollments where lower(student_email)=lower(trim(target_email)))
    then raise exception 'Assign this email to an enrollment first'; end if;
  select id into v_user from auth.users where lower(email)=lower(trim(target_email));
  if v_user is null then raise exception 'Ask this student to sign in first'; end if;
  update public.profiles set role='student' where id=v_user and role='parent';
  if not found then raise exception 'This account cannot be changed to a student role'; end if;
end $$;
revoke all on function public.assign_student_by_email(text) from public;
grant execute on function public.assign_student_by_email(text) to authenticated;

create policy classes_teacher_insert on public.classes for insert to authenticated with check (
  teacher_id=auth.uid() and exists(select 1 from public.profiles where id=auth.uid() and role='teacher')
);
create policy classes_teacher_update on public.classes for update to authenticated using (
  teacher_id=auth.uid()
) with check (teacher_id=auth.uid());

create function public.sync_enrollment_teacher() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.class_id is not null then
    select c.teacher_id into new.teacher_id from public.classes c where c.id=new.class_id;
  else
    new.teacher_id := null;
  end if;
  return new;
end $$;
create trigger enrollment_teacher_from_class before insert or update of class_id on public.enrollments
for each row execute function public.sync_enrollment_teacher();
create function public.sync_class_teacher() returns trigger language plpgsql security definer set search_path=public as $$
begin
  update public.enrollments set teacher_id=new.teacher_id where class_id=new.id;
  return new;
end $$;
create trigger class_teacher_to_enrollments after update of teacher_id on public.classes
for each row when (old.teacher_id is distinct from new.teacher_id) execute function public.sync_class_teacher();

create policy timetable_read on public.timetable_slots for select to authenticated using (
  public.is_admin() or public.teaches_class(class_id) or public.belongs_to_class(class_id)
);
create policy timetable_insert on public.timetable_slots for insert to authenticated with check (
  public.is_admin() or public.teaches_class(class_id)
);
create policy timetable_update on public.timetable_slots for update to authenticated using (
  public.is_admin() or public.teaches_class(class_id)
) with check (public.is_admin() or public.teaches_class(class_id));
create policy timetable_delete on public.timetable_slots for delete to authenticated using (
  public.is_admin() or public.teaches_class(class_id)
);

create policy homework_read on public.homework_assignments for select to authenticated using (
  public.is_admin() or public.teaches_class(class_id) or (published and public.belongs_to_class(class_id))
);
create policy homework_insert on public.homework_assignments for insert to authenticated with check (
  public.is_admin() or public.teaches_class(class_id)
);
create policy homework_update on public.homework_assignments for update to authenticated using (
  public.is_admin() or public.teaches_class(class_id)
) with check (public.is_admin() or public.teaches_class(class_id));
create policy homework_delete on public.homework_assignments for delete to authenticated using (
  public.is_admin() or public.teaches_class(class_id)
);

create policy homework_submission_read on public.homework_submissions for select to authenticated using (
  public.is_admin() or public.teaches_enrollment(enrollment_id) or public.owns_enrollment(enrollment_id)
);
create policy homework_submission_insert on public.homework_submissions for insert to authenticated with check (
  score is null and feedback='' and public.owns_enrollment(enrollment_id) and
  exists(select 1 from public.homework_assignments a join public.enrollments e on e.class_id=a.class_id
    where a.id=assignment_id and a.published and e.id=enrollment_id and (a.due_at is null or a.due_at>=now()))
);
create policy homework_submission_staff_update on public.homework_submissions for update to authenticated using (
  public.is_admin() or public.teaches_enrollment(enrollment_id)
) with check (public.is_admin() or public.teaches_enrollment(enrollment_id));

create policy announcements_read on public.class_announcements for select to authenticated using (
  public.is_admin() or public.teaches_class(class_id) or public.belongs_to_class(class_id)
);
create policy announcements_insert on public.class_announcements for insert to authenticated with check (
  public.is_admin() or public.teaches_class(class_id)
);
create policy announcements_update on public.class_announcements for update to authenticated using (
  public.is_admin() or public.teaches_class(class_id)
) with check (public.is_admin() or public.teaches_class(class_id));
create policy announcements_delete on public.class_announcements for delete to authenticated using (
  public.is_admin() or public.teaches_class(class_id)
);

create policy progress_read on public.progress_notes for select to authenticated using (
  public.is_admin() or public.teaches_enrollment(enrollment_id) or public.owns_enrollment(enrollment_id)
);
create policy progress_insert on public.progress_notes for insert to authenticated with check (
  public.is_admin() or public.teaches_enrollment(enrollment_id)
);
create policy progress_update on public.progress_notes for update to authenticated using (
  public.is_admin() or public.teaches_enrollment(enrollment_id)
) with check (public.is_admin() or public.teaches_enrollment(enrollment_id));
