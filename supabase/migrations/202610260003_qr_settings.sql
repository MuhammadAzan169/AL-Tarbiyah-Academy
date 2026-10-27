-- QR artwork preferences remain attached to their form or influencer record.
-- Destination URLs are derived from the current form slug and referral code.
alter table public.survey_forms
  add column if not exists qr_label text,
  add column if not exists qr_dark text not null default '#153e30',
  add column if not exists qr_light text not null default '#ffffff';

alter table public.influencers
  add column if not exists qr_label text,
  add column if not exists qr_dark text not null default '#153e30',
  add column if not exists qr_light text not null default '#ffffff';
