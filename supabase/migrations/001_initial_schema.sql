-- =============================================
-- Adaptive Pace: 초기 DB 스키마
-- =============================================

-- 1. 사용자 프로필 (Supabase Auth와 연결)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'team')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 새 유저 가입 시 프로필 자동 생성
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. 연결된 소셜 계정
create table public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null check (platform in ('threads', 'linkedin', 'bluesky')),
  platform_user_id text,
  platform_username text,
  display_name text,
  avatar_url text,
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(user_id, platform)
);

alter table public.social_accounts enable row level security;

create policy "Users can manage own social accounts"
  on public.social_accounts for all
  using (auth.uid() = user_id);

-- 3. 콘텐츠 (발행된 글 + 큐에 있는 글)
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  media_urls text[] default '{}',
  status text not null default 'draft'
    check (status in ('draft', 'queued', 'publishing', 'published', 'failed', 'recycled')),
  is_evergreen boolean not null default false,
  engagement_score real default 0,
  original_post_id uuid references public.posts(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.posts enable row level security;

create policy "Users can manage own posts"
  on public.posts for all
  using (auth.uid() = user_id);

-- 4. 발행 기록 (어떤 글이 어떤 플랫폼에 발행됐는지)
create table public.publications (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  social_account_id uuid not null references public.social_accounts(id) on delete cascade,
  platform text not null check (platform in ('threads', 'linkedin', 'bluesky')),
  platform_post_id text,
  scheduled_at timestamptz,
  published_at timestamptz,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'publishing', 'published', 'failed')),
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.publications enable row level security;

create policy "Users can view own publications"
  on public.publications for all
  using (
    exists (
      select 1 from public.posts
      where posts.id = publications.post_id
      and posts.user_id = auth.uid()
    )
  );

-- 5. 인게이지먼트 데이터
create table public.analytics (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references public.publications(id) on delete cascade,
  likes integer not null default 0,
  comments integer not null default 0,
  reposts integer not null default 0,
  impressions integer default 0,
  fetched_at timestamptz not null default now()
);

alter table public.analytics enable row level security;

create policy "Users can view own analytics"
  on public.analytics for all
  using (
    exists (
      select 1 from public.publications p
      join public.posts po on po.id = p.post_id
      where p.id = analytics.publication_id
      and po.user_id = auth.uid()
    )
  );

-- 6. 크리에이터 스타일 프로필 (LLM 재가공용)
create table public.style_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade unique,
  tone_description text,
  avg_sentence_length real,
  emoji_frequency real,
  common_expressions text[] default '{}',
  sample_posts jsonb default '[]',
  updated_at timestamptz not null default now()
);

alter table public.style_profiles enable row level security;

create policy "Users can manage own style profile"
  on public.style_profiles for all
  using (auth.uid() = user_id);

-- 7. 번아웃 상태 추적
create table public.burnout_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade unique,
  mode text not null default 'active' check (mode in ('active', 'survival', 'paused')),
  last_active_post_at timestamptz,
  survival_entered_at timestamptz,
  posts_in_last_14d integer not null default 0,
  avg_posts_30d real not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.burnout_status enable row level security;

create policy "Users can view own burnout status"
  on public.burnout_status for all
  using (auth.uid() = user_id);

-- 8. 구독/결제
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade unique,
  lemonsqueezy_customer_id text,
  lemonsqueezy_subscription_id text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'team')),
  status text not null default 'active'
    check (status in ('active', 'cancelled', 'past_due', 'paused')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can view own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- =============================================
-- 인덱스
-- =============================================
create index idx_posts_user_status on public.posts(user_id, status);
create index idx_posts_user_evergreen on public.posts(user_id, is_evergreen) where is_evergreen = true;
create index idx_publications_scheduled on public.publications(scheduled_at, status) where status = 'scheduled';
create index idx_social_accounts_user on public.social_accounts(user_id);
create index idx_burnout_status_mode on public.burnout_status(mode) where mode = 'survival';

-- =============================================
-- updated_at 자동 갱신 트리거
-- =============================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at();
create trigger update_social_accounts_updated_at before update on public.social_accounts
  for each row execute function public.update_updated_at();
create trigger update_posts_updated_at before update on public.posts
  for each row execute function public.update_updated_at();
create trigger update_style_profiles_updated_at before update on public.style_profiles
  for each row execute function public.update_updated_at();
create trigger update_burnout_status_updated_at before update on public.burnout_status
  for each row execute function public.update_updated_at();
create trigger update_subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.update_updated_at();
