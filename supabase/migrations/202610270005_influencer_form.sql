-- Apply after 202610260004_attachments.sql.
-- A referral code is resolved from the ?ref= value when a form is submitted, so a
-- code already works on every form. This column only records which form that
-- partner's own link and QR artwork should point at. Null means the academy picks
-- one when sharing, which is what a partner promoting the academy rather than a
-- particular survey wants.
alter table public.influencers
  add column if not exists form_id uuid references public.survey_forms(id) on delete set null;
create index if not exists influencers_form_id_idx on public.influencers(form_id);
