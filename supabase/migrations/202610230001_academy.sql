-- Run in a new Supabase project with the SQL editor or Supabase CLI.
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'parent' check (role in ('parent','teacher','admin')),
  created_at timestamptz not null default now()
);
create function public.new_user_profile() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.new_user_profile();

create function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create table public.survey_forms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  description text not null default '',
  questions jsonb not null default '[]'::jsonb check (jsonb_typeof(questions) = 'array'),
  published boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.influencers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique check (code ~ '^[A-Z0-9_-]{3,32}$'),
  commission_percent numeric(5,2) not null default 0 check (commission_percent between 0 and 100),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.survey_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.survey_forms(id),
  parent_name text not null default '',
  email text not null,
  phone text not null default '',
  country text not null,
  consent boolean not null,
  children jsonb not null check (jsonb_typeof(children) = 'array' and jsonb_array_length(children) between 1 and 8),
  answers jsonb not null default '{}'::jsonb,
  source_type text not null check (source_type in ('website','friend','influencer','other')),
  source_detail text not null default '',
  influencer_id uuid references public.influencers(id),
  status text not null default 'new' check (status in ('new','contacted','qualified','enrolled','closed')),
  created_at timestamptz not null default now()
);
create index on public.survey_submissions(created_at desc);
create index on public.survey_submissions(influencer_id);
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.survey_submissions(id) on delete cascade,
  child_index integer not null check (child_index >= 0),
  grade integer not null check (grade between 1 and 6),
  teacher_id uuid references public.profiles(id),
  status text not null default 'pending' check (status in ('pending','active','paused','completed','cancelled')),
  tuition_amount numeric(12,2) not null default 0 check (tuition_amount >= 0),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  commission_percent numeric(5,2) not null default 0 check (commission_percent between 0 and 100),
  created_at timestamptz not null default now(),
  unique(submission_id, child_index)
);
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  grade integer not null check (grade between 1 and 6),
  teacher_id uuid references public.profiles(id),
  schedule_text text not null default '',
  time_zone text not null default 'UTC',
  meeting_url text not null default '',
  created_at timestamptz not null default now()
);
alter table public.enrollments add column class_id uuid references public.classes(id);
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  starts_at timestamptz not null,
  topic text not null,
  summary text not null default '',
  created_at timestamptz not null default now()
);
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  status text not null check (status in ('present','absent','late','excused')),
  unique(lesson_id,enrollment_id)
);
create table public.exams (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  instructions text not null default '',
  questions jsonb not null default '[]'::jsonb check (jsonb_typeof(questions)='array' and jsonb_array_length(questions) between 1 and 30),
  due_at timestamptz,
  published boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.exam_submissions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers)='object'),
  score numeric(5,2) check (score between 0 and 100),
  feedback text not null default '',
  submitted_at timestamptz not null default now(),
  unique(exam_id,enrollment_id)
);
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'pending' check (status in ('pending','paid','refunded','failed')),
  reference text not null default '',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.payments(enrollment_id, status);
create table public.commission_payouts (
  id uuid primary key default gen_random_uuid(),
  influencer_id uuid not null references public.influencers(id),
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  reference text not null default '',
  created_at timestamptz not null default now()
);
create table public.teacher_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  country text not null,
  experience text not null,
  status text not null default 'new' check (status in ('new','reviewing','approved','declined')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.survey_forms enable row level security;
alter table public.influencers enable row level security;
alter table public.survey_submissions enable row level security;
alter table public.enrollments enable row level security;
alter table public.classes enable row level security;
alter table public.lessons enable row level security;
alter table public.attendance enable row level security;
alter table public.exams enable row level security;
alter table public.exam_submissions enable row level security;
alter table public.payments enable row level security;
alter table public.commission_payouts enable row level security;
alter table public.teacher_applications enable row level security;

create policy profiles_read on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy profiles_admin_update on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy forms_public_read on public.survey_forms for select to anon, authenticated using (published or public.is_admin());
create policy forms_admin_insert on public.survey_forms for insert to authenticated with check (public.is_admin());
create policy forms_admin_update on public.survey_forms for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy forms_admin_delete on public.survey_forms for delete to authenticated using (public.is_admin());
create policy influencers_admin_all on public.influencers for all to authenticated using (public.is_admin()) with check (public.is_admin());
create function public.teaches_submission(target_id uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.enrollments where submission_id=target_id and teacher_id=auth.uid());
$$;
create policy submissions_admin_read on public.survey_submissions for select to authenticated using (public.is_admin() or lower(email) = lower(auth.jwt()->>'email'));
create policy submissions_teacher_read on public.survey_submissions for select to authenticated using (
  public.teaches_submission(id)
);
create policy submissions_admin_update on public.survey_submissions for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy enrollments_read on public.enrollments for select to authenticated using (
  public.is_admin() or teacher_id = auth.uid() or exists (
    select 1 from public.survey_submissions s where s.id = submission_id and lower(s.email) = lower(auth.jwt()->>'email')
  )
);
create policy enrollments_admin_insert on public.enrollments for insert to authenticated with check (public.is_admin());
create policy enrollments_admin_update on public.enrollments for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy classes_read on public.classes for select to authenticated using (
  public.is_admin() or teacher_id = auth.uid() or exists (
    select 1 from public.enrollments e join public.survey_submissions s on s.id=e.submission_id
    where e.class_id=classes.id and lower(s.email)=lower(auth.jwt()->>'email')
  )
);
create policy classes_admin_insert on public.classes for insert to authenticated with check (public.is_admin());
create policy classes_admin_update on public.classes for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy lessons_read on public.lessons for select to authenticated using (
  public.is_admin() or exists(select 1 from public.classes c where c.id=class_id and c.teacher_id=auth.uid())
  or exists(select 1 from public.enrollments e join public.survey_submissions s on s.id=e.submission_id where e.class_id=lessons.class_id and lower(s.email)=lower(auth.jwt()->>'email'))
);
create policy lessons_teacher_insert on public.lessons for insert to authenticated with check (
  public.is_admin() or exists(select 1 from public.classes c where c.id=class_id and c.teacher_id=auth.uid())
);
create policy lessons_teacher_update on public.lessons for update to authenticated using (
  public.is_admin() or exists(select 1 from public.classes c where c.id=class_id and c.teacher_id=auth.uid())
) with check (public.is_admin() or exists(select 1 from public.classes c where c.id=class_id and c.teacher_id=auth.uid()));
create policy attendance_read on public.attendance for select to authenticated using (
  public.is_admin() or exists(select 1 from public.lessons l join public.classes c on c.id=l.class_id where l.id=lesson_id and c.teacher_id=auth.uid())
  or exists(select 1 from public.enrollments e join public.survey_submissions s on s.id=e.submission_id where e.id=enrollment_id and lower(s.email)=lower(auth.jwt()->>'email'))
);
create policy attendance_teacher_insert on public.attendance for insert to authenticated with check (
  public.is_admin() or exists(select 1 from public.lessons l join public.classes c on c.id=l.class_id where l.id=lesson_id and c.teacher_id=auth.uid())
);
create policy attendance_teacher_update on public.attendance for update to authenticated using (
  public.is_admin() or exists(select 1 from public.lessons l join public.classes c on c.id=l.class_id where l.id=lesson_id and c.teacher_id=auth.uid())
) with check (public.is_admin() or exists(select 1 from public.lessons l join public.classes c on c.id=l.class_id where l.id=lesson_id and c.teacher_id=auth.uid()));
create function public.check_attendance_class() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from public.lessons l join public.enrollments e on e.class_id=l.class_id where l.id=new.lesson_id and e.id=new.enrollment_id)
    then raise exception 'Student is not assigned to this class'; end if;
  return new;
end $$;
create trigger attendance_class before insert or update on public.attendance for each row execute function public.check_attendance_class();
create policy exams_read on public.exams for select to authenticated using (
  public.is_admin() or exists(select 1 from public.classes c where c.id=class_id and c.teacher_id=auth.uid())
  or (published and exists(select 1 from public.enrollments e join public.survey_submissions s on s.id=e.submission_id where e.class_id=exams.class_id and lower(s.email)=lower(auth.jwt()->>'email')))
);
create policy exams_staff_insert on public.exams for insert to authenticated with check (
  public.is_admin() or exists(select 1 from public.classes c where c.id=class_id and c.teacher_id=auth.uid())
);
create policy exams_staff_update on public.exams for update to authenticated using (
  public.is_admin() or exists(select 1 from public.classes c where c.id=class_id and c.teacher_id=auth.uid())
) with check (public.is_admin() or exists(select 1 from public.classes c where c.id=class_id and c.teacher_id=auth.uid()));
create policy exam_submissions_read on public.exam_submissions for select to authenticated using (
  public.is_admin() or exists(select 1 from public.exams x join public.classes c on c.id=x.class_id where x.id=exam_id and c.teacher_id=auth.uid())
  or exists(select 1 from public.enrollments e join public.survey_submissions s on s.id=e.submission_id where e.id=enrollment_id and lower(s.email)=lower(auth.jwt()->>'email'))
);
create policy exam_submissions_parent_insert on public.exam_submissions for insert to authenticated with check (
  score is null and feedback = '' and
  exists(select 1 from public.exams x join public.enrollments e on e.class_id=x.class_id join public.survey_submissions s on s.id=e.submission_id
    where x.id=exam_id and x.published and (x.due_at is null or x.due_at >= now()) and e.id=enrollment_id and lower(s.email)=lower(auth.jwt()->>'email'))
);
create policy exam_submissions_staff_update on public.exam_submissions for update to authenticated using (
  public.is_admin() or exists(select 1 from public.exams x join public.classes c on c.id=x.class_id where x.id=exam_id and c.teacher_id=auth.uid())
) with check (public.is_admin() or exists(select 1 from public.exams x join public.classes c on c.id=x.class_id where x.id=exam_id and c.teacher_id=auth.uid()));
create policy payments_read on public.payments for select to authenticated using (
  public.is_admin() or exists (
    select 1 from public.enrollments e join public.survey_submissions s on s.id = e.submission_id
    where e.id = enrollment_id and lower(s.email) = lower(auth.jwt()->>'email')
  )
);
create policy payments_admin_insert on public.payments for insert to authenticated with check (public.is_admin());
create policy payments_admin_update on public.payments for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy payouts_admin_all on public.commission_payouts for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy teacher_app_admin_all on public.teacher_applications for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy teacher_app_public_insert on public.teacher_applications for insert to anon, authenticated with check (status = 'new');

-- Public submission resolves influencer codes on the server; visitors cannot choose the rate or influencer id.
create function public.submit_survey(payload jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_form public.survey_forms%rowtype;
  v_influencer uuid;
  v_source text;
  v_id uuid;
  v_child jsonb;
  v_question jsonb;
  v_answer jsonb;
begin
  select * into v_form from public.survey_forms where slug = payload->>'form_slug' and published;
  if not found then raise exception 'Survey unavailable'; end if;
  if length(coalesce(payload->>'email','')) > 254 or coalesce(payload->>'email','') !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    then raise exception 'Valid email required'; end if;
  if coalesce(payload->>'country','') = '' or payload->>'consent' not in ('true','false')
    then raise exception 'Country and contact preference are required'; end if;
  if jsonb_typeof(payload->'children') <> 'array' or jsonb_array_length(payload->'children') not between 1 and 8
    then raise exception 'Add at least one child'; end if;
  if length(payload::text) > 30000 then raise exception 'Survey too large'; end if;
  for v_child in select value from jsonb_array_elements(payload->'children') loop
    if coalesce(v_child->>'age','') !~ '^[0-9]{1,2}$' or (v_child->>'age')::integer not between 4 and 18
      or coalesce(v_child->>'grade','') not in ('Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6')
      or coalesce(v_child->>'listening','') = '' or coalesce(v_child->>'reading','') = '' or coalesce(v_child->>'writing','') = ''
      then raise exception 'Complete each child’s age, grade and English level'; end if;
  end loop;
  if jsonb_typeof(coalesce(payload->'answers','{}'::jsonb)) <> 'object' then raise exception 'Invalid answers'; end if;
  for v_question in select value from jsonb_array_elements(v_form.questions) loop
    if v_question->>'required' = 'true' then
      v_answer := payload->'answers'->(v_question->>'id');
      if v_answer is null or v_answer = 'null'::jsonb or v_answer = '""'::jsonb or v_answer = '[]'::jsonb
        then raise exception 'Please complete all required questions'; end if;
    end if;
  end loop;
  select id into v_influencer from public.influencers where code = upper(trim(coalesce(payload->>'referral_code',''))) and active;
  if coalesce(payload->>'referral_code','') <> '' and v_influencer is null then raise exception 'Referral code is invalid or inactive'; end if;
  v_source := case when v_influencer is not null then 'influencer'
    when payload->>'source_type' in ('friend','other') then payload->>'source_type' else 'website' end;
  insert into public.survey_submissions(form_id,parent_name,email,phone,country,consent,children,answers,source_type,source_detail,influencer_id)
  values (v_form.id,left(coalesce(payload->>'parent_name',''),120),lower(trim(payload->>'email')),
    left(coalesce(payload->>'phone',''),60),left(payload->>'country',100),(payload->>'consent')::boolean,payload->'children',
    coalesce(payload->'answers','{}'::jsonb),v_source,left(coalesce(payload->>'source_detail',''),250),v_influencer)
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.submit_survey(jsonb) from public;
grant execute on function public.submit_survey(jsonb) to anon, authenticated;

-- A stable percentage is copied onto each enrollment so later rate changes do not rewrite history.
create function public.set_enrollment_commission() returns trigger language plpgsql security definer set search_path = public as $$
begin
  select coalesce(i.commission_percent, 0) into new.commission_percent
  from public.survey_submissions s left join public.influencers i on i.id = s.influencer_id
  where s.id = new.submission_id;
  return new;
end $$;
create trigger enrollment_commission before insert on public.enrollments for each row execute function public.set_enrollment_commission();

-- Admin can grant a teacher role after the applicant has signed in once.
create function public.assign_teacher_by_email(target_email text) returns void
language plpgsql security definer set search_path = public as $$
declare v_user uuid;
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  select id into v_user from auth.users where lower(email) = lower(trim(target_email));
  if v_user is null then raise exception 'Ask this teacher to sign in first'; end if;
  update public.profiles set role = 'teacher' where id = v_user and role <> 'admin';
end $$;
revoke all on function public.assign_teacher_by_email(text) from public;
grant execute on function public.assign_teacher_by_email(text) to authenticated;

insert into public.survey_forms(slug,title,description,published,questions) values (
  'parent-interest', 'Parent Interest & Enrollment Survey',
  'Tell us about your children, English level, class schedule and enrollment plans. Submitting does not confirm a place.', true,
  '[
    {"id":"interest","label":"How interested are you in enrolling your child in our Islamic Studies programme?","type":"single","required":true,"options":["Very interested","Interested","Somewhat interested"]},
    {"id":"start","label":"When would you like your child to start classes?","type":"single","required":true,"options":["Immediately or within 2 weeks","Within 1 month","Within 2–3 months","Within 4–6 months","More than 6 months from now"]},
    {"id":"decision","label":"What information would help you make your enrollment decision?","type":"multi","options":["Reviewing the Islamic Studies syllabus","Understanding the class schedule","Understanding the subjects and topics covered","Learning how online classes are conducted","Other information"]},
    {"id":"syllabus","label":"After reviewing the syllabus, how well does it meet your expectations?","type":"single","options":["Meets my expectations very well","Meets my expectations somewhat","Does not meet my expectations"]},
    {"id":"days_per_week","label":"How many days per week would you prefer your child to attend classes?","type":"single","required":true,"options":["3 days per week","4 days per week"]},
    {"id":"days","label":"Which days of the week would suit your family for classes?","type":"multi","required":true,"options":["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]},
    {"id":"preferred_times","label":"What days and times would be most suitable for your child’s classes?","type":"long"},
    {"id":"duration","label":"How long would you prefer each class to last?","type":"single","required":true,"options":["45 minutes","60 minutes"]},
    {"id":"time_zone","label":"What is your local time zone?","type":"short"},
    {"id":"topics","label":"Which areas of Islamic Studies are you most interested in your child learning?","type":"multi","options":["Aqeedah (Islamic beliefs)","Fiqh (foundational Islamic rulings and worship)","Hadith","Seerah (the life of Prophet Muhammad ﷺ)","Stories of the Prophets and Companions","Islamic manners and character","Islamic history","Other topics included in the grade-level syllabus"]}
  ]'::jsonb
);
