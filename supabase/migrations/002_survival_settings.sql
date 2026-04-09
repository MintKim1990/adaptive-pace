-- Survival Mode 설정 필드 추가
alter table public.burnout_status
  add column if not exists survival_enabled boolean not null default true,
  add column if not exists survival_rewrite_mode text not null default 'original'
    check (survival_rewrite_mode in ('original', 'rewrite')),
  add column if not exists survival_frequency integer not null default 3,
  add column if not exists survival_consent_at timestamptz;
