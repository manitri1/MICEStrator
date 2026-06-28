# MICEstrator — 피치덱

> AI가 기획하는 완벽한 행사 — 아이디어에서 ROI까지 6단계

---

## 목차

1. [Cover — 표지](#slide-1--cover-표지)
2. [Problem — 기획자의 현실](#slide-2--problem-기획자의-현실)
3. [Solution — 6단계 AI 파이프라인](#slide-3--solution-6단계-ai-파이프라인)
4. [Product Demo — 입력 vs. 출력](#slide-4--product-demo-입력-vs-출력)
5. [How It Works — 기술 구조](#slide-5--how-it-works-기술-구조)
6. [Phase 1~3 Showcase — 기획 → 브랜드](#slide-6--phase-13-showcase-기획--브랜드)
7. [Phase 4~6 Showcase — 실행 → 성과](#slide-7--phase-46-showcase-실행--성과)
8. [Market Size — 글로벌 MICE 시장](#slide-8--market-size-글로벌-mice-시장)
9. [Business Model — 수익 구조](#slide-9--business-model-수익-구조)
10. [Competitive Landscape — 경쟁 분석](#slide-10--competitive-landscape-경쟁-분석)
11. [Technology Moat — 기술적 해자](#slide-11--technology-moat-기술적-해자)
12. [Go-to-Market Strategy](#slide-12--go-to-market-strategy)
13. [Traction & Validation](#slide-13--traction--validation)
14. [Builder — 만든 사람](#slide-14--builder-만든-사람)
15. [Next Steps](#slide-15--next-steps)

---

## Slide 1 — Cover: 표지

> **MICE 기획의 수십 시간, 단 1시간으로**

### MICEstrator

**AI가 기획하는 완벽한 행사**
아이디어에서 ROI까지 6단계 자동화

---

비주얼 콘셉트:
- 행사장 무대 배경 + 6개 Phase 아이콘 흐름 (왼쪽 → 오른쪽)
- 서브타이틀: "기획 · WBS · 브랜드 · 연사 · 마케팅 · ROI"
- 색상: 딥 네이비 배경 + 골드 액센트

---

## Slide 2 — Problem: 기획자의 현실

> **행사 1건 기획에 평균 200시간 이상**

### 3가지 핵심 문제

| # | 문제 | 현실 |
|---|------|------|
| 1 | **분산된 작업** | 기획서·WBS·브랜드·이메일·마케팅을 각기 다른 툴로 따로 작업 |
| 2 | **일관성 부재** | 기획서의 컨셉이 마케팅 카피에 반영되지 않음 |
| 3 | **ROI 검증 불가** | 행사 종료 후 성과 분석을 체계적으로 수행하는 기획사 10% 미만 |

---

### 기획자의 하루

```
오전: 기획서 초안 작성 (Word)
오후: 엑셀로 WBS 수동 입력
저녁: 연사 섭외 이메일 개별 작성
다음날: 디자이너에게 브리프 전달 → 수정 → 수정 → 수정...
```

"연사 섭외 이메일 하나 쓰는 데 하루 종일 걸렸습니다." — 이벤트사 PM

---

## Slide 3 — Solution: 6단계 AI 파이프라인

> **아이디어 3줄 → 완성된 기획서 1시간**

### 6-Phase 자동화 흐름

```
입력 (업종 · 기간 · 규모)
        ↓
┌─────────────────────────────────────────────────┐
│  Phase 1    Phase 2    Phase 3                  │
│  전략·기획  WBS·역할    비주얼 아이덴티티        │
│  (GPT-4o)  (GPT-4o)   (GPT-4o)                 │
└─────────────────────────────────────────────────┘
        ↓ brandMemory 자동 주입
┌─────────────────────────────────────────────────┐
│  Phase 4    Phase 5    Phase 6                  │
│  연사 소싱  디지털 에셋  ROI 분석               │
│  (GPT-4o)  (GPT-4o)   (GPT-4o)                 │
└─────────────────────────────────────────────────┘
        ↓
통합 보고서 (웹 뷰 · PDF · Markdown)
```

**핵심**: 각 Phase가 이전 결과를 자동 인계 — 사용자는 핵심 입력만 제공

---

## Slide 4 — Product Demo: 입력 vs. 출력

> **입력 3줄 → 산출물 50+**

### 입력 (30초)

```
업종:      디지털 헬스케어
준비 기간: 3개월
규모:      중규모 (150명)
```

### 출력 (1시간 이내)

| 카테고리 | 산출물 |
|----------|--------|
| **기획** | 행사명 · 슬로건 · 부제 · PEST 분석 · 페르소나 3명 |
| **일정** | WBS 30+ 태스크 · 부서별 역할 · 임계 경로 |
| **브랜드** | 색상 팔레트 · 디자인 무드 · Canva 프롬프트 · Midjourney 프롬프트 |
| **연사** | 후보 추천 3~8인 · 초청 이메일 3통 · PPT 아웃라인 |
| **마케팅** | 인스타·링크드인·이메일 카피 · D-60 캠페인 캘린더 · 랜딩페이지 구성 |
| **성과** | KPI 대시보드 · 페르소나 피드백 루프 · 개선 권고안 |

---

## Slide 5 — How It Works: 기술 구조

> **데이터가 Phase 간 자동으로 흐른다**

### 아키텍처

```
사용자 입력
    ↓
Phase 1 (전략·페르소나) ──────→ PostgreSQL (SSoT)
    ↓                                    ↓
Phase 2 (WBS)              Phase 3 (브랜드) ──→ brandMemory
                                           ↓              ↓
                              Phase 4 (연사)    Phase 5 (마케팅)
                                           ↓
                              Phase 6 (ROI 분석)
                                           ↓
                              통합 보고서 (PDF / Markdown)
```

### 기술 스택

| 레이어 | 기술 |
|--------|------|
| **프론트엔드** | Next.js 16 App Router · Tailwind CSS |
| **AI** | OpenAI GPT-4o · Vercel AI SDK (`generateObject`) |
| **스키마** | Zod v4 · GPT-4o Structured Output |
| **DB** | Drizzle ORM · Supabase (PostgreSQL) |
| **보고서** | `@media print` CSS · Markdown API |

### 핵심 차별점

- **brandMemory 자동 주입**: Phase 3에서 확정된 색상·무드·서체가 Phase 4·5 AI 프롬프트에 자동 반영 → 수동 작업 없이 브랜드 일관성 보장
- **타입 세이프 AI 출력**: Zod 스키마 + GPT-4o Strict Mode → 신뢰 가능한 JSON 보장

---

## Slide 6 — Phase 1~3 Showcase: 기획 → 브랜드

> **15분 만에 완성되는 기획 기반**

### Phase 1 — 이벤트 전략

```
행사명:   2026 헬스케어 AI 서밋
슬로건:   데이터가 살리는 생명
부제:     디지털 혁신이 만드는 미래 의료
키워드:   혁신 · 신뢰 · 데이터 · 협력 · 미래
```

**페르소나 3명** 자동 생성:
- 의료 AI 스타트업 CTO (35세, 기술 중심)
- 대학병원 원장 (52세, 정책·규제 관심)
- 디지털 헬스케어 투자자 (43세, ROI 중심)

**PEST 분석** + 각 페르소나 Pain Point × 해결 제안 포함

---

### Phase 2 — WBS & 역할 분담

| 지표 | 결과 |
|------|------|
| 총 준비 기간 | 16주 |
| WBS 태스크 | 28개 |
| 임계 경로 단계 | 7단계 |
| 부서 구성 | 5개 팀 (기획·콘텐츠·마케팅·운영·기술) |

---

### Phase 3 — 비주얼 아이덴티티

| 항목 | 결과 |
|------|------|
| Primary Color | `#1A5276` (로열 블루) |
| Secondary | `#2E86C1`, `#85C1E9` |
| Accent | `#F39C12` (골드) |
| 디자인 무드 | "혁신적이면서 신뢰감, 미래지향적" |
| 추천 서체 | Pretendard (본문) + Montserrat (헤드라인) |

**자동 생성**: Canva 한국어 프롬프트 + Midjourney 영문 프롬프트

---

## Slide 7 — Phase 4~6 Showcase: 실행 → 성과

> **기획에서 멈추지 않는다 — 실행과 성과 측정까지**

### Phase 4 — 연사 소싱

**AI 추천 연사 후보** (브랜드 컨텍스트 자동 반영):

| 등급 | 연사 예시 | 특징 |
|------|-----------|------|
| Keynote | 의료 AI 분야 석학 | 기조연설, 비전 제시 |
| Session | 스타트업 CTO | 실전 사례 공유 |
| Panel | 투자자 · 정책 전문가 | 토론 리더십 |

**자동 생성**: 초청 이메일 (제목 + 본문) + PPT 아웃라인 + 선택 시 Phase 4 폼 자동 채우기

---

### Phase 5 — 디지털 마케팅

- **인스타그램**: 캡션 + 해시태그 20개 + 스토리 텍스트 오버레이 + Midjourney 이미지 프롬프트
- **링크드인**: 헤드라인 + 본문 + CTA + 해시태그
- **이메일**: 오픈율 최적화 제목 5개 후보
- **랜딩페이지**: Hero · Features · Speakers · Registration 섹션 구성
- **D-Day 캠페인**: D-60 ~ D-Day · 채널별 액션 · 핵심 메시지 스케줄

---

### Phase 6 — ROI 분석

| KPI | 결과 예시 |
|-----|-----------|
| 참석 달성률 | 94% |
| 평균 만족도 | 4.3 / 5.0 |
| 페르소나 Pain Point 해결 | CTO ✓ / 원장 ✓ / 투자자 △ |

**자동 분석**: 강점 · 약점 분류 + 우선순위별 개선 권고안 (HIGH / MID / LOW)

---

## Slide 8 — Market Size: 글로벌 MICE 시장

> **$1.5조 규모 시장, AI 도입률 5% 미만**

### 시장 규모 (2025)

| 구분 | 규모 | 설명 |
|------|------|------|
| **TAM** | $1.5T | 글로벌 MICE 전체 시장 |
| **SAM** | $45B | 디지털 MICE 기획 솔루션 대상 시장 |
| **SOM** | $500M | 한국·아시아 SMB 기획사 첫 3년 목표 |

### 성장 드라이버

- 포스트-팬데믹 이벤트 수요 급증 (연 12% CAGR 전망)
- ESG · 지속가능 행사 의무화 확대
- 기업 행사 예산 복구 + AI 도입 가속화
- 한국 MICE 산업 정부 육성 정책 (K-MICE 전략 2030)

---

## Slide 9 — Business Model: 수익 구조

> **Phase당 과금 → 연간 구독 전환**

### 3단계 수익 모델

```
┌─────────────────────────────────────────────────┐
│  FREEMIUM        Phase 1 무료                   │
│                  리드 확보 · 제품 체험           │
├─────────────────────────────────────────────────┤
│  PAY-PER-PHASE   Phase 2~6 개별 과금            │
│                  ₩5,000 ~ ₩15,000 / Phase       │
│                  필요한 Phase만 선택 사용        │
├─────────────────────────────────────────────────┤
│  PRO 구독        월 ₩99,000                     │
│                  무제한 실행 + 팀 협업 + 우선 지원│
└─────────────────────────────────────────────────┘
```

### 단위 경제

| 지표 | 수치 |
|------|------|
| 기획사 1곳 월 행사 | 10~30건 |
| Phase당 평균 과금 | ₩10,000 |
| 월 ARR (Pay-per-Phase) | ₩1,500,000~ |
| 연 LTV (Pro 전환) | ₩3,600,000+ |

---

## Slide 10 — Competitive Landscape: 경쟁 분석

> **"AI MICE 기획" 전문 솔루션은 없다**

### 포지셔닝 맵

| | MICE 전문성 | AI 생성 | 6-Phase 연결 | 한국어 최적화 | 가격 |
|---|:---:|:---:|:---:|:---:|---|
| **MICEstrator** | ✓ | ✓ | ✓ | ✓ | 합리적 |
| ChatGPT / Claude | ✗ | ✓ | ✗ | △ | 일반 구독 |
| 기존 이벤트 SaaS (Cvent 등) | ✓ | ✗ | ✗ | ✗ | 고가 |
| 기획사 수작업 | ✓ | ✗ | ✗ | ✓ | 시간 비용 |

### 핵심 포지셔닝

**"MICE 도메인 깊이 × AI 자동화 × End-to-End 파이프라인"**

이 세 가지 교차점을 동시에 제공하는 솔루션은 현재 존재하지 않는다.

---

## Slide 11 — Technology Moat: 기술적 해자

> **5가지 기술 경쟁 우위**

### 1. Phase-to-Phase 데이터 연속성

각 Phase 결과가 PostgreSQL SSoT에 저장 → 다음 Phase AI 프롬프트에 자동 주입.
사용자가 정보를 재입력할 필요 없음.

### 2. 도메인 특화 프롬프트 엔지니어링

MICE 15~20년 경력 전문가 페르소나 × 단계별 Chain-of-Thought 추론 체계.
범용 AI와 달리 MICE 도메인 지식이 프롬프트에 내재화됨.

### 3. brandMemory 자동 주입

Phase 3에서 확정된 색상·무드·서체·키워드가 Phase 4·5 AI 프롬프트에 자동 반영.
연사 이메일과 마케팅 카피가 브랜드 가이드라인을 따름 — 수동 입력 없이.

### 4. 타입 세이프 AI 출력

Zod 스키마 + GPT-4o Strict JSON Mode → 구조화된 JSON 보장.
AI 환각(hallucination)으로 인한 파싱 오류 원천 차단.

### 5. 멀티채널 동시 생성

Phase 5 1회 실행 → 인스타·링크드인·이메일·랜딩페이지·음악 프롬프트 동시 산출.
채널별 개별 작업 대비 90% 시간 절감.

---

## Slide 12 — Go-to-Market Strategy

> **이벤트사 PM → 대기업 행사팀 → 플랫폼 API**

### 3단계 GTM

**1단계 (0~6개월) — PMF 검증**

- 소규모 이벤트 기획사 직접 영업 (20~50인 규모)
- 사용자 인터뷰 + 사용 패턴 분석
- Phase별 과금 최적화 및 온보딩 개선

**2단계 (6~18개월) — 시장 확장**

- 대기업 행사 담당 부서 B2B 계약 (연간 구독)
- 협회 · 학회 파트너십 (공식 기획 도구 지정)
- 성공 사례 기반 레퍼런스 마케팅

**3단계 (18개월+) — 플랫폼화**

- API 개방 → 이벤트 SaaS 플랫폼 임베드
- 글로벌 확장: 일본 · 동남아시아 진출 (다국어 지원)
- 화이트라벨 라이선스 모델

### 채널

- 이벤트 업계 커뮤니티 (MICE Korea, 한국이벤트학회)
- 유튜브 데모 영상 (Phase별 실행 화면)
- MICE 전시회 부스 (KTO, COEX MICE 박람회)

---

## Slide 13 — Traction & Validation

> **6-Phase 풀스택 구현 완료, 데모 즉시 가능**

### 현재 상태 (2026년 6월 기준)

| 항목 | 상태 |
|------|------|
| 전체 기술 스택 구현 | ✅ 완료 |
| Phase 1~6 완전 실행 | ✅ 완료 |
| 통합 보고서 발행 | ✅ 웹 뷰 + PDF + Markdown |
| 연사 AI 추천 기능 | ✅ Phase 4 sourcing agent |
| brandMemory 파이프라인 | ✅ Phase 3→4·5 자동 주입 |
| 라이브 데모 | ✅ 즉시 가능 |

### 기술 검증 지표

- 입력 3필드 → 산출물 50+ 자동 생성
- Phase 1→6 완주: GPT-4o API 호출 6회
- 통합 보고서: 6개 Phase 결과 단일 문서로 발행
- Zod 스키마 검증: AI 출력 구조 오류 0건 (Structured Output 활용)

### 다음 마일스톤

- 베타 파트너 기획사 5곳 PoC 진행
- 실사용 피드백 기반 UX 개선
- Vercel 프로덕션 배포

---

## Slide 14 — Builder: 만든 사람

> **1인 개발자가 만든 엔드투엔드 MICE AI 시스템**

### 역할 및 기여

| 영역 | 기여 |
|------|------|
| 제품 기획 | MICE 도메인 분석 · 6-Phase 아키텍처 설계 |
| 프론트엔드 | Next.js 16 App Router · Tailwind UI · 통합 보고서 |
| 백엔드 | Drizzle ORM · Supabase · API Route 설계 |
| AI 엔지니어링 | GPT-4o Structured Output · 6개 도메인 프롬프트 · CoT 체계 |
| DevOps | Vercel 배포 · 환경 변수 보안 관리 |

### 기술 스택

```
Next.js 16  ·  TypeScript  ·  Tailwind CSS
OpenAI GPT-4o  ·  Vercel AI SDK  ·  Zod v4
Drizzle ORM  ·  Supabase (PostgreSQL)
Vercel (배포)
```

### 철학

"MICE 기획자의 반복 작업을 제거하고,
창의적 의사결정에만 집중할 수 있도록."

---

## Slide 15 — Next Steps

> **함께 MICE 산업을 바꿔갑시다**

### 내부 제안

**즉시 실행 가능 (Phase 1)**

- [ ] 베타 파트너 기획사 5곳 PoC 예산 확보
- [ ] 실사용 피드백 수집 채널 구축 (설문 + 인터뷰)
- [ ] Vercel 프로덕션 배포 및 도메인 연결

**단기 개선 (Phase 2)**

- [ ] Phase 1~3 UI/UX 고도화 (온보딩 플로우 추가)
- [ ] 다국어 지원 (영어 우선)
- [ ] 사용자 계정 및 행사 히스토리 관리

**중기 목표 (Phase 3)**

- [ ] API 공개 및 외부 연동 문서화
- [ ] 이벤트 SaaS 플랫폼 파트너십 협의
- [ ] 구독 결제 시스템 연동 (Stripe / 토스페이먼츠)

### 지금 바로 데모를

```bash
npm run dev
# → localhost:3000
```

또는 Vercel 배포 URL에서 Phase 1 무료 체험

---

*MICEstrator v1.0 — 2026*
*Built with Next.js 16 · GPT-4o · Drizzle ORM · Supabase*
