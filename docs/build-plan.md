# Adaptive Pace — 프로덕션 빌드 플랜

> 작성일: 2026-04-08
> 목표: 프로덕션 레벨 MVP 출시 → ProductHunt 론칭 → 유료 전환 검증

---

## 0. 전체 개요

### 제품 한 줄 요약
크리에이터가 번아웃으로 콘텐츠 생산을 멈추면, 시스템이 자동 감지하고 과거 고성과 콘텐츠를 LLM으로 재가공하여 자동 발행하는 소셜 스케줄러.

### 시간 예산
- 평일: 4시간/일 × 5일 = 20시간/주
- 주말: 8~10시간 (토+일)
- 주당 총: **약 28~30시간**

### 기술 스택

| 레이어 | 기술 | 선정 이유 |
|--------|------|----------|
| 프론트엔드 | **Next.js 14+ (App Router) + TypeScript** | SSR + API Routes 통합, Vercel 무료 배포 |
| UI 컴포넌트 | **shadcn/ui + Tailwind CSS** | 빠른 대시보드 구축, 커스터마이징 자유도 |
| 백엔드 | **Next.js API Routes + Server Actions** | 별도 서버 불필요, 프론트와 통합 |
| 데이터베이스 | **Supabase (PostgreSQL)** | 무료 티어, Auth 내장, Realtime |
| 인증 | **Supabase Auth + 소셜 OAuth** | 각 플랫폼 OAuth 통합 |
| 크론/스케줄링 | **Vercel Cron + Supabase Edge Functions** | 서버리스, 무료~저비용 |
| LLM | **Gemini 2.5 Flash API** | 최저 비용, 충분한 품질 |
| 소셜 API | **Threads API + LinkedIn API + Bluesky AT Protocol** | 3개 플랫폼 무료 |
| 결제 | **LemonSqueezy** | MoR, 사업자 없이 시작, 세금 대행 |
| 호스팅 | **Vercel** | Next.js 최적화, 무료 티어 |
| 모니터링 | **Sentry (무료 티어)** | 에러 추적 |

> **Spring Boot를 안 쓰는 이유**: 별도 서버 운영 비용 발생 + Vercel 무료 배포 불가.
> Next.js API Routes로 백엔드를 통합하면 인프라 비용 $0으로 시작 가능.
> Java/Spring 경험이 있으므로 TypeScript 백엔드 적응은 빠를 것으로 예상.

---

## 1. 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                    프론트엔드 (Next.js)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐  │
│  │ 대시보드  │ │ 큐 관리  │ │ 분석     │ │ 설정   │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘  │
├─────────────────────────────────────────────────────┤
│                  API Layer (Next.js API Routes)       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐  │
│  │ Auth API │ │ Post API │ │ Social   │ │ Billing│  │
│  │          │ │          │ │ API      │ │ API    │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘  │
├─────────────────────────────────────────────────────┤
│                  서비스 레이어                         │
│  ┌──────────────────┐  ┌─────────────────────────┐   │
│  │ Scheduler Engine │  │ Burnout Detection Engine│   │
│  │ (Vercel Cron)    │  │ (규칙 기반 감지)         │   │
│  └────────┬─────────┘  └────────────┬────────────┘   │
│           │                         │                 │
│  ┌────────▼─────────┐  ┌───────────▼────────────┐   │
│  │ Social Publisher  │  │ LLM Rewriter           │   │
│  │ (Threads/LI/BS)  │  │ (Gemini Flash)         │   │
│  └──────────────────┘  └────────────────────────┘   │
├─────────────────────────────────────────────────────┤
│                  데이터 레이어                         │
│  ┌──────────────────────────────────────────────┐    │
│  │              Supabase (PostgreSQL)            │    │
│  │  users | social_accounts | posts | queue     │    │
│  │  analytics | style_profiles | subscriptions  │    │
│  └──────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### 핵심 DB 스키마 (초안)

```sql
-- 사용자
users (id, email, name, plan, created_at)

-- 연결된 소셜 계정
social_accounts (id, user_id, platform, access_token, refresh_token, 
                 token_expires_at, profile_data, created_at)

-- 콘텐츠 (발행된 글 + 큐에 있는 글)
posts (id, user_id, social_account_id, content, media_urls,
       status [draft|queued|published|recycled], 
       published_at, engagement_score, is_evergreen, created_at)

-- 스케줄링 큐
queue (id, user_id, post_id, scheduled_at, platform, status)

-- 인게이지먼트 데이터
analytics (id, post_id, likes, comments, reposts, 
           impressions, fetched_at)

-- 크리에이터 스타일 프로필 (LLM 재가공용)
style_profiles (id, user_id, tone_description, avg_sentence_length,
                emoji_frequency, sample_posts_json, updated_at)

-- 번아웃 상태 추적
burnout_status (id, user_id, mode [active|survival], 
                last_active_post_at, survival_entered_at,
                posts_in_last_14d, avg_posts_30d)

-- 구독/결제
subscriptions (id, user_id, lemonsqueezy_id, plan, 
               status, current_period_end)
```

---

## 2. 빌드 페이즈

### Phase 0: 프로젝트 세팅 (1주)

> 목표: 개발 환경 완성, 빈 프로젝트가 Vercel에 배포되는 상태

| # | 태스크 | 예상 시간 |
|---|--------|----------|
| 0-1 | Next.js + TypeScript + Tailwind + shadcn/ui 프로젝트 초기화 | 2h |
| 0-2 | Supabase 프로젝트 생성 + DB 스키마 마이그레이션 | 3h |
| 0-3 | Supabase Auth 설정 (이메일 + Google 로그인) | 2h |
| 0-4 | Vercel 배포 파이프라인 구성 (GitHub 연동, 프리뷰 배포) | 1h |
| 0-5 | 프로젝트 구조 세팅 (폴더, 린팅, 환경변수) | 2h |
| 0-6 | 도메인 구매 + 연결 | 1h |
| 0-7 | Sentry 에러 모니터링 연동 | 1h |
|   | **소계** | **12h (약 0.5주)** |

### Phase 1: 소셜 계정 연동 (2~3주)

> 목표: 사용자가 3개 플랫폼 계정을 연결하고, 토큰이 안전하게 저장되는 상태

| # | 태스크 | 예상 시간 |
|---|--------|----------|
| 1-1 | **Bluesky OAuth** 연동 (가장 쉬움, 먼저 구현) | 6h |
| 1-2 | **LinkedIn OIDC** 연동 (w_member_social 권한) | 8h |
| 1-3 | **Threads OAuth** 연동 (Meta App Review 준비 포함) | 10h |
| 1-4 | 토큰 암호화 저장 + 자동 갱신 로직 (특히 Meta 60일 토큰) | 8h |
| 1-5 | 소셜 계정 관리 UI (연결/해제/상태 표시) | 6h |
| 1-6 | 각 플랫폼 프로필 정보 가져오기 | 4h |
| 1-7 | Meta App Review 제출 (Threads — 심사 대기 병렬 진행) | 4h |
|   | **소계** | **46h (약 1.5~2주)** |

**주의사항:**
- Threads App Review는 수일~수주 걸릴 수 있으므로 Phase 1 초반에 제출
- 토큰 갱신 실패 시 사용자에게 재연결 알림 보내는 로직 필수
- 모든 토큰은 Supabase에 암호화 저장 (AES-256)

### Phase 2: 콘텐츠 관리 + 스케줄링 (2~3주)

> 목표: 사용자가 글을 작성하고, 예약 발행할 수 있는 Active Mode 완성

| # | 태스크 | 예상 시간 |
|---|--------|----------|
| 2-1 | 콘텐츠 작성 에디터 (텍스트 + 이미지 업로드) | 10h |
| 2-2 | 멀티 플랫폼 동시 발행 (플랫폼별 포맷 변환) | 8h |
| 2-3 | 스케줄링 큐 UI (드래그&드롭 캘린더) | 12h |
| 2-4 | **Vercel Cron** — 예약 시간에 자동 발행 | 6h |
| 2-5 | 발행 후 상태 업데이트 + 에러 핸들링 | 4h |
| 2-6 | 각 플랫폼별 포스팅 API 통합 (Threads/LinkedIn/Bluesky) | 10h |
| 2-7 | 발행 이력 조회 UI | 4h |
|   | **소계** | **54h (약 2주)** |

### Phase 3: 인게이지먼트 추적 + 콘텐츠 점수화 (1.5주)

> 목표: 발행된 글의 성과를 수집하고, 에버그린 후보를 자동 식별

| # | 태스크 | 예상 시간 |
|---|--------|----------|
| 3-1 | 각 플랫폼 인게이지먼트 API 연동 (좋아요/댓글/리포스트) | 10h |
| 3-2 | 성과 점수 계산 로직 (가중 평균: 좋아요×1 + 댓글×3 + 리포스트×5) | 4h |
| 3-3 | 에버그린 후보 자동 태깅 (상위 10% 자동 마킹) | 3h |
| 3-4 | 간단한 분석 대시보드 (글별 성과, 추세 차트) | 8h |
| 3-5 | Cron — 매일 1회 인게이지먼트 데이터 수집 | 4h |
|   | **소계** | **29h (약 1~1.5주)** |

### Phase 4: 번아웃 감지 + Survival Mode (2주) ★ 핵심 차별화

> 목표: 사용자 활동 중단을 자동 감지하고 모드를 전환하는 엔진 완성

| # | 태스크 | 예상 시간 |
|---|--------|----------|
| 4-1 | **번아웃 감지 엔진** (규칙 기반) | 8h |
|     | - 큐 비어있음 ≥ 7일 | |
|     | - 최근 14일 포스팅 < 직전 30일 평균의 30% | |
|     | - 수동 Pause 미활성 | |
| 4-2 | Active → Survival 모드 자동 전환 로직 | 6h |
| 4-3 | Survival → Active 복귀 감지 (사용자가 새 글 작성 시) | 4h |
| 4-4 | Survival Mode 자동 발행 스케줄러 (주 2~3회) | 6h |
| 4-5 | "시스템이 유지 중입니다" 이메일/인앱 알림 | 6h |
| 4-6 | 대시보드에 모드 상태 표시 (Active/Survival 배지) | 4h |
| 4-7 | Cron — 매일 1회 번아웃 상태 체크 | 4h |
|   | **소계** | **38h (약 1.5주)** |

### Phase 5: LLM 재가공 엔진 (2주) ★ 핵심 기술

> 목표: 과거 고성과 콘텐츠를 크리에이터의 목소리로 재가공하는 엔진 완성

| # | 태스크 | 예상 시간 |
|---|--------|----------|
| 5-1 | **스타일 프로필 생성기** (사용자의 기존 글 분석 → 스타일 추출) | 10h |
| 5-2 | **재가공 프롬프트 엔진** (few-shot + 스타일 프로필 주입) | 12h |
| 5-3 | Gemini Flash API 연동 + 에러 핸들링 + 폴백(flash-lite) | 6h |
| 5-4 | 플랫폼별 포맷 변환 (LinkedIn→Threads, 길이 조절 등) | 6h |
| 5-5 | 중복 방지 로직 (최근 30일 내 재발행 제외, 최소 간격) | 4h |
| 5-6 | 재가공 품질 자동 검증 (환각 체크, 길이 체크) | 6h |
| 5-7 | 재가공 결과 미리보기 UI (Survival Mode 대시보드) | 6h |
| 5-8 | **voice-test-plan.md 기반 품질 테스트 수행** | 10h |
|   | **소계** | **60h (약 2주)** |

### Phase 6: 결제 연동 (1주)

> 목표: LemonSqueezy 구독 결제가 동작하고, 플랜별 기능 제한이 작동

| # | 태스크 | 예상 시간 |
|---|--------|----------|
| 6-1 | LemonSqueezy 스토어 세팅 + 상품 생성 (Free/Pro) | 3h |
| 6-2 | Checkout 연동 (결제 페이지 리다이렉트) | 4h |
| 6-3 | Webhook 수신 — 구독 생성/갱신/취소 이벤트 처리 | 6h |
| 6-4 | 플랜별 기능 제한 미들웨어 (Free=1채널, Pro=3채널) | 4h |
| 6-5 | 구독 관리 UI (현재 플랜, 업그레이드, 취소) | 4h |
| 6-6 | 가격 페이지 (랜딩) | 3h |
|   | **소계** | **24h (약 1주)** |

### Phase 7: 랜딩 페이지 + 론칭 준비 (1.5주)

> 목표: ProductHunt 론칭 가능한 상태

| # | 태스크 | 예상 시간 |
|---|--------|----------|
| 7-1 | 랜딩 페이지 (히어로, 기능 소개, 가격, CTA) | 12h |
| 7-2 | 영문 Privacy Policy + Terms of Service (Termly 활용) | 3h |
| 7-3 | 온보딩 플로우 (가입 → 소셜 연결 → 첫 글 작성 가이드) | 8h |
| 7-4 | 이메일 템플릿 (환영, Survival 진입, 복귀 축하) | 4h |
| 7-5 | SEO 기본 설정 (메타태그, OG이미지, sitemap) | 3h |
| 7-6 | ProductHunt 제출물 준비 (스크린샷, 영상, 설명) | 6h |
| 7-7 | 베타 테스터 모집 (Reddit, Indie Hackers 글 작성) | 4h |
|   | **소계** | **40h (약 1.5주)** |

### Phase 8: QA + 안정화 (1주)

> 목표: 실 사용자가 써도 깨지지 않는 상태

| # | 태스크 | 예상 시간 |
|---|--------|----------|
| 8-1 | E2E 테스트 (가입 → 연결 → 발행 → Survival 진입 전체 플로우) | 8h |
| 8-2 | 토큰 만료 시나리오 테스트 (특히 Meta 60일) | 4h |
| 8-3 | 에러 핸들링 점검 (API 실패, rate limit, 네트워크 오류) | 4h |
| 8-4 | 모바일 반응형 체크 | 4h |
| 8-5 | 성능 최적화 (Lighthouse 점수, API 응답 시간) | 4h |
| 8-6 | 보안 점검 (OWASP 기본, SQL injection, XSS, 토큰 노출) | 4h |
|   | **소계** | **28h (약 1주)** |

---

## 3. 전체 타임라인

```
Phase 0: 프로젝트 세팅              ██░░░░░░░░░░░░░░░░░░░░░░  1주
Phase 1: 소셜 계정 연동             ░░████░░░░░░░░░░░░░░░░░░  2~3주
Phase 2: 콘텐츠 관리 + 스케줄링     ░░░░░░████░░░░░░░░░░░░░░  2~3주
Phase 3: 인게이지먼트 추적          ░░░░░░░░░░██░░░░░░░░░░░░  1.5주
Phase 4: 번아웃 감지 + Survival     ░░░░░░░░░░░░███░░░░░░░░░  2주
Phase 5: LLM 재가공 엔진            ░░░░░░░░░░░░░░░███░░░░░░  2주
Phase 6: 결제 연동                  ░░░░░░░░░░░░░░░░░░██░░░░  1주
Phase 7: 랜딩 + 론칭 준비           ░░░░░░░░░░░░░░░░░░░░██░░  1.5주
Phase 8: QA + 안정화                ░░░░░░░░░░░░░░░░░░░░░░██  1주
                                    ──────────────────────────
                                    총 약 14~16주 (3.5~4개월)
```

### 예상 일정 (주 28~30시간 기준)

| 마일스톤 | 예상 시점 |
|---------|----------|
| Phase 0 완료 (빈 프로젝트 배포) | 1주차 |
| Phase 1 완료 (소셜 계정 연결 동작) | 3~4주차 |
| Phase 2 완료 (Active Mode 동작) | 6주차 |
| Phase 3 완료 (인게이지먼트 수집) | 7~8주차 |
| Phase 4 완료 (Survival Mode 동작) | 9~10주차 |
| Phase 5 완료 (LLM 재가공 동작) | 11~12주차 |
| Phase 6 완료 (결제 동작) | 13주차 |
| Phase 7+8 완료 (**ProductHunt 론칭**) | **14~16주차** |

---

## 4. 구현 순서 근거

### "왜 이 순서인가?"

```
Phase 0 (세팅) → 당연히 먼저
  ↓
Phase 1 (소셜 연동) → 모든 기능의 기반. 토큰 없으면 아무것도 안 됨
  ↓                   + Threads 심사 제출을 빨리 해야 대기 시간 확보
Phase 2 (스케줄링) → Active Mode = 가장 기본 기능. 이것만으로도 사용 가능
  ↓
Phase 3 (인게이지먼트) → 에버그린 선별의 전제 조건. 데이터 축적 시작
  ↓
Phase 4 (번아웃 감지) → 핵심 차별화 #1. Phase 3의 데이터가 필요
  ↓
Phase 5 (LLM 재가공) → 핵심 차별화 #2. Phase 3+4와 결합하여 Survival Mode 완성
  ↓
Phase 6 (결제) → 기능이 완성된 후에 결제를 붙여야 가치가 명확
  ↓
Phase 7+8 (론칭) → 모든 게 안정화된 후 세상에 공개
```

### Phase 1에서 Threads 심사를 먼저 제출하는 이유

```
Week 1: Bluesky 연동 (즉시 가능) + Threads App Review 제출
Week 2: LinkedIn 연동
Week 3: Threads 심사 결과 수신 (기대) → 연동 완료

심사가 지연되더라도 Bluesky + LinkedIn으로 Phase 2~5 진행 가능
```

---

## 5. 리스크 & 대응

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| Threads App Review 반려 | 중 | 중 | 반려 사유 수정 후 재제출. 최악의 경우 2개 플랫폼으로 론칭 |
| Meta 60일 토큰 갱신 실패 | 중 | 높 | 만료 7일 전 이메일 알림 + 대시보드 경고. 사용자에게 재연결 유도 |
| Gemini API 정책 변경 | 낮 | 중 | flash-lite 폴백. 최악 시 OpenAI gpt-4o-mini로 전환 |
| Vercel Cron 무료 한도 초과 | 낮 | 중 | Supabase Edge Functions로 이관 또는 Vercel Pro ($20/월) |
| LLM 재가공 품질 부족 | 중 | 높 | voice-test-plan.md 기반 대량 테스트 → 프롬프트 튜닝 → 모델 업그레이드 |
| 초기 유저 확보 어려움 | 높 | 높 | 아래 마케팅 전략 참조 |

---

## 6. 초기 유저 확보 전략

> 크리에이터 경험이 없는 개발자의 현실적 마케팅 플랜

### 론칭 전 (빌드 기간 중)

| 채널 | 행동 | 시점 |
|------|------|------|
| **Reddit** | r/SaaS, r/indiehackers, r/socialmedia에 빌드 과정 공유 | Phase 2부터 |
| **Indie Hackers** | 빌드 로그 연재 ("Building a burnout-proof social scheduler") | Phase 2부터 |
| **LinkedIn** | 본인 계정에 주 1회 빌드 과정 포스팅 (직접 Build in Public) | Phase 1부터 |
| **Waitlist** | 랜딩 페이지에 이메일 수집 | Phase 2 중간 |

### 론칭 시

| 채널 | 행동 |
|------|------|
| **ProductHunt** | 메인 론칭 (화~목 중 선택) |
| **Hacker News** | "Show HN: I built a social scheduler that detects burnout" |
| **Reddit** | 관련 서브레딧 5곳에 론칭 포스트 |
| **베타 테스터** | Waitlist + Reddit에서 모은 50명에게 Pro 1개월 무료 |

### 론칭 후

| 채널 | 행동 | 주기 |
|------|------|------|
| **SEO** | 블로그: "social media burnout", "evergreen content strategy" 롱테일 키워드 | 주 1회 |
| **통합 디렉토리** | SaaSHub, AlternativeTo, G2 등에 등록 | 1회 |
| **크리에이터 파트너십** | 소셜 미디어 관련 뉴스레터에 스폰서/소개 요청 | 월 2회 |

---

## 7. 비용 요약 (론칭까지)

| 항목 | 비용 |
|------|------|
| Vercel | $0 (무료 티어) |
| Supabase | $0 (무료 티어) |
| Gemini API | $0 (무료 티어로 개발 + 테스트) |
| 도메인 | ~$12 |
| Sentry | $0 (무료 티어) |
| LemonSqueezy | $0 (판매 시 수수료만) |
| **총 론칭까지 비용** | **~$12** |

---

## 8. GO/NO-GO 체크포인트

각 Phase 완료 시 점검:

| 시점 | 체크 | NO-GO 시 |
|------|------|----------|
| Phase 1 후 | 3개 플랫폼 중 최소 2개 연동 성공? | Threads 심사 지연 시 2개로 진행 |
| Phase 2 후 | 실제 글이 발행되는가? | API 문제 디버깅 |
| Phase 5 후 | LLM 재가공 품질 B등급(7.0+) 이상? | 프롬프트 튜닝 또는 모델 변경 |
| Phase 7 후 | 본인이 직접 2주 사용해도 안정적? | Phase 8 연장 |

---

## 9. 새 레포지토리 생성 시 초기 구조

```
adaptive-pace/
├── src/
│   ├── app/                    ← Next.js App Router
│   │   ├── (auth)/             ← 로그인/회원가입
│   │   ├── (dashboard)/        ← 대시보드 (인증 필요)
│   │   │   ├── page.tsx        ← 메인 대시보드
│   │   │   ├── queue/          ← 큐 관리
│   │   │   ├── analytics/      ← 분석
│   │   │   └── settings/       ← 설정
│   │   ├── api/                ← API Routes
│   │   │   ├── auth/           ← OAuth 콜백
│   │   │   ├── posts/          ← CRUD
│   │   │   ├── social/         ← 소셜 API 프록시
│   │   │   ├── cron/           ← Vercel Cron 엔드포인트
│   │   │   └── webhooks/       ← LemonSqueezy 웹훅
│   │   ├── layout.tsx
│   │   └── page.tsx            ← 랜딩 페이지
│   ├── components/             ← 공유 UI 컴포넌트
│   ├── lib/
│   │   ├── supabase/           ← DB 클라이언트 + 쿼리
│   │   ├── social/             ← 소셜 API 클라이언트
│   │   │   ├── threads.ts
│   │   │   ├── linkedin.ts
│   │   │   └── bluesky.ts
│   │   ├── llm/                ← Gemini API + 프롬프트
│   │   ├── scheduler/          ← 스케줄링 엔진
│   │   ├── burnout/            ← 번아웃 감지 엔진
│   │   └── billing/            ← LemonSqueezy 연동
│   └── types/                  ← TypeScript 타입 정의
├── supabase/
│   └── migrations/             ← DB 마이그레이션
├── tests/
│   └── voice-test/             ← LLM 품질 테스트
├── public/
├── .env.local
├── CLAUDE.md                   ← 프로젝트 컨텍스트
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```
