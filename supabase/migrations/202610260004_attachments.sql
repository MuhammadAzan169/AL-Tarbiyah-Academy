-- Apply after 202610260003_qr_settings.sql. Adds file attachments stored in Google Drive.
-- Bytes live in Drive; this table is the authority on who may reach them. The browser
-- never receives a Drive file id: it passes an attachment id to the drive-broker function,
-- which re-reads this table as the calling user so these policies decide every access.

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  context text not null check (context in ('homework_submission','exam_submission','lesson_material','class_resource')),
  context_id uuid not null,
  drive_file_id text,
  file_name text not null check (length(file_name) between 1 and 255),
  mime_type text not null,
  size_bytes bigint not null check (size_bytes between 1 and 26214400),
  status text not null default 'pending' check (status in ('pending','ready')),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  -- A ready row must name its Drive file; a pending row must not be readable as one.
  constraint attachments_ready_has_file check (status='pending' or drive_file_id is not null)
);
create index on public.attachments(context, context_id);
create index on public.attachments(owner_id, created_at desc);
-- Lets the broker reconcile Drive files whose upload was abandoned.
create index on public.attachments(status, created_at) where status='pending';

alter table public.attachments enable row level security;

-- Access is resolved from whatever the attachment is attached to, so these mirror the
-- policies already protecting homework, exams, lessons and classes.
create function public.can_read_attachment(target_context text, target_id uuid) returns boolean
language sql stable security definer set search_path=public as $$
  select case target_context
    when 'homework_submission' then exists(
      select 1 from public.homework_submissions s where s.id=target_id
      and (public.is_admin() or public.teaches_enrollment(s.enrollment_id) or public.owns_enrollment(s.enrollment_id)))
    when 'exam_submission' then exists(
      select 1 from public.exam_submissions s where s.id=target_id
      and (public.is_admin() or public.teaches_enrollment(s.enrollment_id) or public.owns_enrollment(s.enrollment_id)))
    when 'lesson_material' then exists(
      select 1 from public.lessons l where l.id=target_id
      and (public.is_admin() or public.teaches_class(l.class_id) or public.belongs_to_class(l.class_id)))
    when 'class_resource' then
      public.is_admin() or public.teaches_class(target_id) or public.belongs_to_class(target_id)
    else false end;
$$;

-- Writing is narrower than reading: a learner attaches only to their own submission,
-- and only staff attach teaching material.
create function public.can_write_attachment(target_context text, target_id uuid) returns boolean
language sql stable security definer set search_path=public as $$
  select case target_context
    when 'homework_submission' then exists(
      select 1 from public.homework_submissions s where s.id=target_id and public.owns_enrollment(s.enrollment_id))
    when 'exam_submission' then exists(
      select 1 from public.exam_submissions s where s.id=target_id and public.owns_enrollment(s.enrollment_id))
    when 'lesson_material' then exists(
      select 1 from public.lessons l where l.id=target_id
      and (public.is_admin() or public.teaches_class(l.class_id)))
    when 'class_resource' then public.is_admin() or public.teaches_class(target_id)
    else false end;
$$;

create policy attachments_read on public.attachments for select to authenticated using (
  status='ready' and public.can_read_attachment(context, context_id)
);
-- The uploader keeps sight of their own rows, including while bytes are still going up.
create policy attachments_owner_read on public.attachments for select to authenticated using (
  owner_id=auth.uid()
);
create policy attachments_insert on public.attachments for insert to authenticated with check (
  owner_id=auth.uid() and status='pending' and drive_file_id is null
  and public.can_write_attachment(context, context_id)
);
-- Only the uploader completes an upload, and only once.
create policy attachments_confirm on public.attachments for update to authenticated using (
  owner_id=auth.uid() and status='pending'
) with check (owner_id=auth.uid() and public.can_write_attachment(context, context_id));
create policy attachments_delete on public.attachments for delete to authenticated using (
  owner_id=auth.uid() or public.is_admin() or public.can_write_attachment(context, context_id)
);
