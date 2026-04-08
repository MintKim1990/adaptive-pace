# Adaptive Pace — 소셜 미디어 번아웃 방지 스케줄러

> 크리에이터가 번아웃으로 콘텐츠 생산을 멈추면, 시스템이 자동 감지하고
> 과거 고성과 콘텐츠를 LLM으로 재가공하여 자동 발행하는 소셜 스케줄러.

## 기술 스택

- **프레임워크**: Next.js (App Router) + TypeScript
- **UI**: shadcn/ui + Tailwind CSS v4
- **DB**: Supabase (PostgreSQL)
- **인증**: Supabase Auth + 소셜 OAuth (Threads, LinkedIn, Bluesky)
- **LLM**: Gemini 2.5 Flash API
- **결제**: LemonSqueezy (MoR)
- **배포**: Vercel
- **모니터링**: Sentry

## 프로젝트 구조

```
src/
├── app/                    ← Next.js App Router
│   ├── (auth)/             ← 로그인/회원가입 (인증 불필요)
│   ├── (dashboard)/        ← 대시보드 (인증 필요)
│   │   ├── page.tsx        ← 메인 대시보드
│   │   ├── queue/          ← 큐 관리
│   │   ├── analytics/      ← 분석
│   │   └── settings/       ← 설정
│   ├── api/                ← API Routes (백엔드)
│   │   ├── auth/           ← OAuth 콜백
│   │   ├── posts/          ← 콘텐츠 CRUD
│   │   ├── social/         ← 소셜 API 프록시
│   │   ├── cron/           ← Vercel Cron 엔드포인트
│   │   └── webhooks/       ← LemonSqueezy 웹훅
│   └── page.tsx            ← 랜딩 페이지
├── components/             ← UI 컴포넌트
├── lib/
│   ├── supabase/           ← DB 클라이언트 + 쿼리
│   ├── social/             ← 소셜 API 클라이언트
│   │   ├── threads.ts
│   │   ├── linkedin.ts
│   │   └── bluesky.ts
│   ├── llm/                ← Gemini API + 프롬프트
│   ├── scheduler/          ← 스케줄링 엔진
│   ├── burnout/            ← 번아웃 감지 엔진
│   └── billing/            ← LemonSqueezy 연동
├── types/                  ← TypeScript 타입 정의
└── hooks/                  ← React 커스텀 훅
```

## 핵심 비즈니스 로직

### Active Mode (사용자 활성)
1. 사용자가 콘텐츠 큐에 글 작성
2. 예약 시간에 Threads/LinkedIn/Bluesky에 자동 발행
3. 발행 후 인게이지먼트 데이터 수집 → 점수화
4. 상위 10% 콘텐츠를 에버그린으로 자동 태깅

### Survival Mode (번아웃 감지 시)
1. 큐 비어있음 >= 7일 + 포스팅 빈도 급감 → 번아웃 판정
2. 에버그린 콘텐츠 중 선택 → Gemini Flash로 재가공
3. 크리에이터의 스타일 프로필(few-shot) 적용
4. 주 2~3회 자동 발행 + "시스템이 유지 중입니다" 알림
5. 사용자가 새 글 작성 시 → Active Mode 복귀

### 번아웃 감지 규칙 (MVP)
```
IF 큐 비어있음 >= 7일
  AND 최근 14일 포스팅 < 직전 30일 평균의 30%
  AND 수동 Pause 미활성
THEN → Survival Mode 자동 전환
```

## 코딩 컨벤션

- 모든 파일 TypeScript strict mode
- API Routes에서 에러는 적절한 HTTP 상태 코드와 함께 반환
- DB 쿼리는 src/lib/supabase/ 에 집중 (컴포넌트에서 직접 쿼리 금지)
- 소셜 API 호출은 src/lib/social/ 에 집중
- 환경변수는 .env.local에 관리, 절대 커밋하지 않음

## 환경변수 (필요 목록)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# 소셜 OAuth
THREADS_APP_ID=
THREADS_APP_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=

# LLM
GEMINI_API_KEY=

# 결제
LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_WEBHOOK_SECRET=

# 앱
NEXT_PUBLIC_APP_URL=
CRON_SECRET=
```
