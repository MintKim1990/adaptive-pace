# Adaptive Pace — 증빙 데이터 아카이브

> 이 문서는 파이프라인 각 Phase에서 수집된 #9 Adaptive Pace 관련 원본 데이터를 보존한다.

---

## 1. ideas.md 원본 (#9)

> 출처: `research/ideas.md` — Phase 2 브레인스토밍 결과

### 아이디어 #9: Adaptive Pace 소셜 콘텐츠 자동화 엔진

- **유형**: 교집합 (B 사이클 3-1 ★★ 6주 번아웃 + C 기회 3-3 + A 시그널 3-2)
- **이름**: EverPost Engine
- **타겟**: 매주 12개+ 게시물 올리는 스몰 비즈니스 오너/1인 크리에이터
- **핵심 가치**: 번아웃 자체를 막지 않고, 번아웃 시 시스템이 인계받아 에버그린 콘텐츠 자동 재가공/재발행. "시스템이 안전하게 유지 중입니다. 쉬고 오세요"
- **순환 메커니즘**: Active Mode (열정적 생산) ↔ Survival Mode (시스템 자동 인계). 번아웃 → 복귀 → 번아웃 = 6주 주기 내부 순환 (트렌드/유행 순환)
- **기술적 구현 방향**: 다중 소셜 API 연동 + LLM 기반 맥락 유지 리포스팅 엔진. 7일+ 큐 비어있으면 번아웃 자동 판별 → 과거 인게이지먼트 상위 10% 추출 → LLM 트렌드 맞춤 변형 → 주 2회 자동 발행

---

## 2. evidence-full.md 원본 (#9)

> 출처: `research/evidence/evidence-full.md` — Phase 2.5 Deep Research 증빙 수집

### #9 Adaptive Pace (소셜미디어 번아웃 방지 스케줄러)

#### 유사 제품 및 가격
- **Buffer**: 소셜미디어 스케줄링 — $6/채널/월~
- **MeetEdgar**: 자동 재발행 — $29.99/월~
- **Publer**: 소셜미디어 스케줄링 — $12/월~
- **Pallyy**: 소셜미디어 관리 — $15/월~
- **Hypefury**: X/Twitter 특화 스케줄러 — $19/월~
- **OneUpApp**: 소셜미디어 리사이클링 — **$50K MRR** (소셜 콘텐츠 자동 재활용 특화)

#### 시장 증거
- 크리에이터 번아웃 문제 심각: 41% 크리에이터가 번아웃 경험 (Vibely 2024 조사)
- "번아웃 감지 → 자동 페이스 조절" 기능을 가진 제품은 현재 **존재하지 않음**
- Buffer/MeetEdgar는 단순 스케줄링, 번아웃 방지는 미지원
- 크리에이터 이코노미 2025년 $250B+ 규모
- **OneUpApp $50K MRR** — 콘텐츠 자동 재활용만으로 월 5만 달러 달성 가능 증명

#### 경쟁 현황
- 소셜미디어 스케줄링 시장 자체는 극도로 포화
- 하지만 "번아웃 감지 + 자동 조절" 니치는 미개척
- Buffer가 2025년 "pause recommendations" 기능 실험 중 (아직 출시 안 됨)
- 핵심 차별화: 데이터 기반 번아웃 예측 + 자동 콘텐츠 재활용

#### 커뮤니티 반응
- Reddit r/Entrepreneur: "Creator burnout is killing my business" (2025, 700+ upvotes)
- Twitter/X: #CreatorBurnout 해시태그 꾸준한 사용
- 인디해커스: "I need a tool that tells me to slow down" — 감성적 공감 다수

#### 지불 의향 데이터
- 크리에이터: $10~25/월 (Buffer/Hypefury 가격대 대비)
- 번아웃 방지 프리미엄: 기존 스케줄러 대비 $5~10 추가 지불 의향

---

## 3. screening.md 원본 (#9)

> 출처: `research/screening.md` — Phase 3 Gate 1 스크리닝

### MAYBE 후보 분류

| # | 아이디어 | 위험 제약 | 사유 |
|---|---------|----------|------|
| 9 | Adaptive Pace (번아웃 방지 스케줄러) | H2 WARNING, H4 WARNING | 소셜 스케줄링 시장 극도 포화(Buffer $6/월~), VC 투자 기업 다수. **단, "번아웃 감지+자동 조절" 니치는 미개척 (0개 경쟁)**. OneUpApp $50K MRR 선례. 기술적 돌파: 데이터 기반 번아웃 예측 알고리즘 = 자동화/데이터 처리 차별화(T3: WARNING). 41% 크리에이터 번아웃 경험이라는 수요 데이터 존재 |

### MAYBE 우선순위 1위

| 순위 | # | 아이디어 | S4 증빙 강도 | WARNING 수 | WTP 명시성 | 풀 토론 사유 |
|------|---|---------|------------|-----------|----------|------------|
| 1 | #9 | Adaptive Pace | 강 (OneUpApp $50K MRR, 41% 번아웃 경험, 미개척 니치) | 2 (H2, H4) | 명시 ($10~25/월) | **LR5 교훈 직접 적용**: WARNING 2개이나 "번아웃 감지" 니치는 경쟁자 0개. OneUpApp이 콘텐츠 재활용만으로 $50K MRR = 유사 패턴 증명. Buffer가 pause 기능 실험 중이나 미출시 |

---

## 4. 최종-판정.md 원본 (#9)

> 출처: `research/최종-판정.md` — Round 3 후보 6

### 후보 6: Adaptive Pace 소셜 자동화 (#9) — 번아웃 방지 스케줄러

- **판정**: **CONDITIONAL GO**
- **토론 결과**: Gate 1 H2 WARNING + H4 WARNING → Gate 2 WARNING 2개(S1, S3) → Gate 3 3라운드: 반대파 R1 REFUTE → 찬성파 R1 REFUTE → 반대파 R2 PARTIAL(H4/LC1 수용) → 찬성파 R2 PARTIAL → **반대파 R3 PARTIAL(CONCEDE 근접)** → 심판 판정: 찬성파 승
- **쟁점 6개: 찬성파 5승, 무승부 1개(S3), 반대파 0승**
- **핵심 강점**:
  - **(1) "역인센티브 니치" — VC가 구조적으로 들어오기 어렵다.** "사용자에게 쉬라고 하는 기능"은 VC 메트릭(MAU/사용시간/포스트 수)과 정면 충돌. Buffer가 Pause를 "mental health toggle"이라 부르나 적극 push하지 않는 이유. H4 WARNING 유지 정당
  - **(2) OneUpApp $83K~$100K MRR 선행 사례.** 2인 부트스트랩 팀이 "에버그린 콘텐츠 자동 재활용"만으로 월 $83K~$100K 달성. 동일 패턴의 WTP가 풍부하게 검증됨
  - **(3) 41% 크리에이터 번아웃 — 마케팅 훅으로서의 트렌드 가치.** MBO Partners 2024, Billion Dollar Boy(52% 번아웃), Creators 4 Mental Health(62% 번아웃). #CreatorBurnout 트렌드 활용한 바이럴 잠재력 (L4 데모 효과)
  - **(4) "자동 번아웃 감지 + 에버그린 재가공" 조합은 경쟁자 0개.** Buffer Pause = 수동 온/오프. MeetEdgar = 에버그린 재발행만(번아웃 감지 없음). 이 두 기능의 자동화 조합을 제공하는 제품 미존재
  - **(5) 기술 100% 코딩 구현 가능.** H6 완전 PASS. 번아웃 감지(데이터 분석), 콘텐츠 재가공(API 연동), 자동 스케줄링 = 개발자 강점 활용
- **잔존 리스크**:
  - "번아웃 감지"의 독립적 WTP 미검증 — 실질 WTP는 "에버그린 재가공"에서 발생
  - MeetEdgar($30/월)와의 직접 경쟁 — 가격 언더컷이 주요 포지셔닝
  - S3 SOM 불확실 — 30~75명 유료 고객 확보 경로의 편차 큼
  - X API $100/월 비용 — MVP에서 X 제외로 해결 가능하나 가치 감소
- **조건** (CONDITIONAL GO → GO 승격 요건):
  1. **MVP 스코프 제한**: Threads + Bluesky + LinkedIn 3개 플랫폼만 지원. X는 수익 발생 후 추가
  2. **포지셔닝 검증**: ProductHunt 론칭 2주 내 유료 전환 의향 50명+ 미달 시 피벗 검토
  3. **MeetEdgar 대비 가격 언더컷**: $15/월 이하. $10/월 freemium → $15/월 pro 구조 권고
  4. **번아웃 감지 ML 최소화**: MVP에서 규칙 기반(포스팅 빈도 하락 감지)으로 시작. ML은 데이터 축적 후

---

## 5. 토론 중 검색 결과 요약

> 출처: `research/토론-로그.md` — Phase 3 Gate 3 토론 중 Gemini Proxy 검색

### 검색 배치 2 (Adaptive Pace 관련)

Gate 3 토론 중 Agent F(반대파)와 Agent E(찬성파)가 `.tmp-prompts/search-queries.txt`를 통해 Gemini Proxy에 검색을 위임하고, `.tmp-prompts/search-result.md`에서 결과를 읽어 활용한 데이터:

#### 반대파가 활용한 검색 결과
- **Buffer "Pause Queue" 기능**: Buffer가 이미 "mental health toggle"로 포지셔닝 중. 63%의 크리에이터가 번아웃 경험이라는 데이터를 Buffer 자체 마케팅에 활용
- **VC 경쟁자 추격 가능성**: Buffer($20M ARR), Hootsuite(VC-backed), Sprout Social($360M ARR)이 "creator wellness" 트렌드 감지 시 3~6개월 내 유사 기능 출시 가능
- **무료 도구 현황**: Buffer Free(3채널), Later Free(1프로필), Canva Free(소셜 스케줄링 포함)

#### 찬성파가 활용한 검색 결과
- **Buffer Pause vs 자동 감지**: Buffer Pause Queue = 사용자가 수동으로 켜고 끔. 번아웃에 빠진 사람은 자신이 번아웃 상태인지 모른다 → 자동 감지의 가치
- **OneUpApp 상세 데이터**: $83K~$100K MRR, 2인 부트스트랩 팀, 콘텐츠 자동 재활용 특화. "에버그린 콘텐츠 자동 재활용"만으로 수익화 검증
- **VC 역인센티브 구조**: VC 기업의 핵심 KPI(MAU, 사용 시간, 포스트 수)와 "사용자에게 쉬라고 하는 기능"이 구조적으로 충돌. Buffer가 Pause를 적극 push하지 않는 이유
- **크리에이터 번아웃 통계**: 41% (Vibely 2024), 52% (Billion Dollar Boy), 62% (Creators 4 Mental Health). Reddit r/Entrepreneur "Creator burnout is killing my business" 700+ upvotes
- **#CreatorBurnout 트렌드**: Twitter/X에서 해시태그 꾸준한 사용. 마케팅 훅으로 활용 가능

#### 심판이 활용한 검색 결과
- OneUpApp MRR 수치 확인 ($83K~$100K)
- Buffer Pause 기능 상세 (수동 온/오프만, 자동 감지/재가공 없음)
- 크리에이터 번아웃 통계 교차 검증 (41~62% 범위)

---

## 6. Gate 2 소프트 제약 검토 결과

> 출처: `research/토론-로그.md` — Phase 3 Gate 2

| 제약 | 판정 | 사유 |
|------|------|------|
| S1 | **WARNING** | Buffer $6/월, Publer $12/월, Hypefury $19/월 등 저가 대안 다수. "번아웃 감지"는 차별화이나 핵심인 "스케줄링"은 무료/저가로 해결 가능 |
| S2 | **PASS** | 셀프서브 발견 가능 — 크리에이터 커뮤니티(IndieHackers, Reddit r/Entrepreneur), ProductHunt, "creator burnout tool" 검색 유입 |
| S3 | **WARNING** | TAM: 크리에이터 이코노미 $250B+. SAM: 번아웃 경험 크리에이터 41%. **SOM: 5,000~20,000명**. $750 MRR에 30~75명 유료 고객 필요 → 전환율 0.4~1.5% = 도전적이나 불가능하지 않음 |
| S4 | **PASS (강)** | OneUpApp $83K~$100K MRR (2인 팀, 부트스트랩). Hypefury 부트스트랩 수익화 성공. 소셜 스케줄링 인디 도구의 수익화 풍부하게 검증 |
| S5 | **PASS** | 초기 비용: Threads/Bluesky/LinkedIn API 무료. 서버: Vercel 무료~$20/월. 총 $100 이하 가능 (X API 제외 시) |

**결과: WARNING 2개 (S1, S3). 고위험 플래그 미달 (3개 미만). Gate 3 진행.**

---

## 7. Gate 3 쟁점별 최종 승패표

> 출처: `research/토론-로그.md` + `research/최종-판정.md` — 심판 판정

| 쟁점 | 승자 | 근거 |
|------|------|------|
| H2 (무료 대안) | **찬성파** | Buffer Pause = 수동, Adaptive Pace = 자동 감지+자동 재가공. "자동화/데이터 처리" 차별화 = T3 WARNING 정당. 다만 "번아웃 감지" 독립 WTP는 미검증 → 핵심은 "에버그린 재가공" |
| H4 (VC 경쟁) | **찬성파** | "역인센티브 니치" 논거가 강력. VC 메트릭(MAU/사용시간)과 "쉬라고 하는 기능"의 구조적 충돌. 반대파도 수용 |
| LC1 (내부 순환) | **찬성파** | 에버그린 콘텐츠 재가공 → 소비 → 새 배치 필요 = 콘텐츠 소비 순환. OneUpApp $83K MRR로 검증 |
| S3 (SOM) | **무승부** | $750 MRR 달성은 "가능하나 불확실". 30~75명 유료 고객 확보 경로 존재하나 편차 큼 |
| L3 (무료 표준) | **찬성파** | "에버그린 재가공 + 번아웃 감지" 조합은 무료 도구 미제공. L3 비해당 |
| X API 비용 | **찬성파** | MVP에서 X 제외 전략으로 H3 해소 |

**종합: 찬성파 5승, 무승부 1개, 반대파 0승 → CONDITIONAL GO**
