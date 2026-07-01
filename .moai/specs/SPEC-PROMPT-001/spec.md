---
id: SPEC-PROMPT-001
version: "1.0.0"
status: draft
created: "2026-07-01"
updated: "2026-07-01"
author: manitri
priority: medium
issue_number: 0
---

# SPEC-PROMPT-001: Phase 5/6 Gemini Canvas 프롬프트 자동 생성

## HISTORY

- 2026-07-01 (v1.0.0): 최초 작성. Phase 5(랜딩페이지)·Phase 6(대시보드) 데이터를 클라이언트 사이드
  템플릿 조립으로 Gemini Canvas용 한국어 프롬프트로 변환하는 기능 정의. 추가 LLM 호출 없이
  DB 기저장 데이터만으로 구조화 텍스트를 즉시 생성하고 모달에 표시, 복사 후 붙여넣기 방식으로 사용.

---

## 1. Environment (프로젝트 컨텍스트)

### 1.1 제품 배경

MICEstrator는 6단계(Phase 1~6) AI 기반 MICE 행사 기획 플랫폼이다. Phase 5는 마케팅/프로모션
산출물(SNS 포스트, 랜딩페이지 섹션, 캠페인 스케줄)을, Phase 6은 사후 분석(KPI, 강약점, 페르소나
성과, 차기 행사 권고)을 생성한다. 두 Phase의 산출물은 이미 구조화된 JSON으로 DB에 저장되어 있으나,
현재는 텍스트/카드 형태로만 열람 가능하다.

기획자는 이 데이터를 실제 웹 결과물(랜딩페이지·대시보드)로 빠르게 옮기고 싶어 한다. Google Gemini의
**Canvas** 기능은 자연어 설명을 입력받아 반응형 웹 앱을 즉석 생성해 주는 도구이며, 섹션 구조·색상·
타입·타깃 사용자를 명시적으로 기술할수록 결과 품질이 높아진다. 그러나 사용자가 Phase 5/6 데이터를
직접 Canvas용 프롬프트로 재작성하는 것은 번거롭고 누락·불일치가 발생하기 쉽다.

본 SPEC은 이 공백을 다음으로 해결한다.

- **Feature A — 랜딩페이지 프롬프트 생성(Phase 5 기반):** Phase 5의 랜딩페이지 섹션과 Phase 1의
  행사 정체성(행사명·슬로건·키워드), brandMemory의 시각 가이드를 조합해 Gemini Canvas용 한국어
  랜딩페이지 프롬프트를 생성한다.
- **Feature B — 대시보드 프롬프트 생성(Phase 6 기반):** Phase 6의 KPI·강약점·페르소나 성과·권고사항과
  Phase 1의 행사명을 조합해 Gemini Canvas용 한국어 사후 분석 대시보드 프롬프트를 생성한다.

생성 방식은 **클라이언트 사이드 템플릿 조립**이다. 추가 LLM API 호출 없이 순수 함수로 구조화 텍스트를
즉시 생성하고, 모달에 표시하며, 사용자가 복사해 Gemini Canvas에 붙여넣는다.

### 1.2 기술 스택 (프로젝트 헌법 정합)

| 항목 | 버전/라이브러리 | 비고 |
|------|----------------|------|
| 프레임워크 | Next.js 16 App Router, React 19, TypeScript 5.9 | 기존 |
| DB | Drizzle ORM + PostgreSQL (Supabase) | 기존 |
| UI | shadcn/ui + tailwindcss 4 | 기존 |
| 데이터 접근 | Route Handler(`/api/*`) + 클라이언트 lazy fetch | 기존 패턴 재사용 |
| 클립보드 | `navigator.clipboard.writeText` (기존 `CopyBtn` 패턴) | 기존 |

**신규 LLM 의존성 없음.** 본 SPEC은 기존 스택과 기존 DB 데이터만으로 구현하며, 프롬프트 생성은
순수 함수 템플릿 조립으로 처리한다.

### 1.3 영향 받는 기존 자산 (재사용)

| 파일 | 역할 |
|------|------|
| `lib/schemas/phase-05.schema.ts` | Phase 5 출력 Zod 스키마 (`landingPageSections`, `instagramPost`, `emailSubjectLines` 등) |
| `lib/schemas/phase-06.schema.ts` | Phase 6 출력 Zod 스키마 (`kpiPerformance`, `topStrengths`, `topWeaknesses`, `nextEventRecommendations`, `executiveSummary`) |
| `lib/schemas/phase-01.schema.ts` | Phase 1 출력 Zod 스키마 (SSoT: `eventNameKr`, `eventNameEn`, `slogan`, `coreKeywords[]`, `targetPersonas[]`) |
| `app/api/phase-result/route.ts` | Phase 결과 단건 조회 GET 핸들러 (Phase 1 lazy fetch에 재사용) |
| `app/event/[id]/phase-5/page.tsx` | Phase 5 페이지 — `CopyBtn`/`ContentBlock` 컴포넌트, 상단 액션 버튼 영역 보유 |
| `app/event/[id]/phase-6/page.tsx` | Phase 6 페이지 — 상단 액션 버튼 영역 보유 |

### 1.4 핵심 데이터 제약

- **Phase 1 데이터 비영속(클라이언트):** Phase 5/6 페이지는 현재 Phase 1 데이터를 클라이언트 상태에
  보유하지 않는다. 프롬프트 생성 버튼 클릭 시점에 `GET /api/phase-result?eventId=&phase=1`로
  **lazy fetch**한다.
- **brandMemory 전용 조회 필요:** 랜딩페이지 프롬프트의 시각 가이드(`primaryColor`, `secondaryColors[]`,
  `designMood`, `fontStyle`, `visualKeywords[]`)는 brandMemory에 있으며, 이를 단건 조회할 전용
  엔드포인트 `GET /api/brand-memory?eventId=`가 신규 필요하다. Phase 6 대시보드 프롬프트는
  brandMemory가 불필요하다(데이터 시각화 중심).
- **Phase 5 랜딩페이지 프롬프트 소스:** `landingPageSections`(3~6개), `instagramPost.caption`,
  `emailSubjectLines`(2~3개) + Phase 1 정체성 + brandMemory 시각 가이드.
- **Phase 6 대시보드 프롬프트 소스:** `kpiPerformance`, `topStrengths`(1~3), `topWeaknesses`(1~3),
  `personaFeedbackLoop`, `nextEventRecommendations`(2~5), `executiveSummary` + Phase 1 행사명.
- **선행 SPEC:** SPEC-AGENT-001, SPEC-AGENT-002, SPEC-CHAT-001, SPEC-UI-001 이후.

---

## 2. Assumptions (가정)

| # | 가정 | 신뢰도 | 틀렸을 때 영향 |
|---|------|--------|----------------|
| A1 | Gemini Canvas는 명시적 섹션 구조·색상·타깃을 포함한 한국어 프롬프트로 양질의 결과를 생성한다 | 높음 | 결과 품질 저하 — 프롬프트 요청사항 섹션 보강으로 완화 |
| A2 | Phase 5/6 산출물은 프롬프트에 그대로 삽입해도 충분히 짧다(모달 표시 및 붙여넣기 가능) | 중간 | 매우 긴 텍스트 시 모달 스크롤 필요 — 범위 밖 요약 없이 원문 유지 |
| A3 | brandMemory는 Phase 1 이후 시점에 이미 존재하며 조회 가능하다 | 중간 | 미존재 시 시각 가이드 생략, 프롬프트는 여전히 생성됨(graceful) |
| A4 | 기존 `CopyBtn`의 클립보드 복사 패턴을 모달 내에서 재사용 가능하다 | 높음 | 컴포넌트 분리 필요 — 경미 |
| A5 | Phase 1 lazy fetch 실패/부재 시 프롬프트를 "미입력" 표기로 생성해도 사용자가 수용 가능하다 | 중간 | 사용자가 값 수동 보완 필요 — graceful fallback으로 안내 |

---

## 3. Requirements (EARS 요구사항)

### Module 1 — Phase 5 랜딩페이지 프롬프트 생성 (Feature A)

- **REQ-PROMPT-001** (State-Driven):
  **IF** 현재 행사에 완료된 Phase 5 결과가 존재하면,
  **THEN** Phase 5 페이지는 상단 액션 버튼 영역에 "Canvas 랜딩페이지 프롬프트" 버튼을
  표시**해야 한다(shall)**.

- **REQ-PROMPT-002** (Event-Driven):
  **WHEN** 사용자가 "Canvas 랜딩페이지 프롬프트" 버튼을 클릭할 때,
  **THEN** 시스템은 Phase 1 결과와 brandMemory를 lazy fetch하여 `buildLandingPagePrompt(phase1, phase5, brand)`
  순수 함수를 실행**해야 한다(shall)**.

- **REQ-PROMPT-003** (Event-Driven):
  **WHEN** `buildLandingPagePrompt()` 실행이 완료될 때,
  **THEN** 시스템은 생성된 프롬프트 텍스트를 `CanvasPromptModal`에 표시**해야 한다(shall)**.

- **REQ-PROMPT-004** (Ubiquitous):
  `CanvasPromptModal`은 프롬프트 전체 텍스트를 클립보드로 복사하는 버튼을 제공**해야 하며(shall)**,
  복사 성공 시 "복사됨!" 피드백을 노출**해야 한다(shall)**.

- **REQ-PROMPT-005** (State-Driven):
  **IF** 현재 행사에 완료된 Phase 5 결과가 없으면,
  **THEN** "Canvas 랜딩페이지 프롬프트" 버튼은 비활성화(disabled) 상태로 표시**해야 한다(shall)**.

### Module 2 — Phase 6 대시보드 프롬프트 생성 (Feature B)

- **REQ-PROMPT-006** (State-Driven):
  **IF** 현재 행사에 완료된 Phase 6 결과가 존재하면,
  **THEN** Phase 6 페이지는 상단 액션 버튼 영역에 "Canvas 대시보드 프롬프트" 버튼을
  표시**해야 한다(shall)**.

- **REQ-PROMPT-007** (Event-Driven):
  **WHEN** 사용자가 "Canvas 대시보드 프롬프트" 버튼을 클릭할 때,
  **THEN** 시스템은 Phase 1 결과를 lazy fetch하여 `buildDashboardPrompt(phase1, phase6)`
  순수 함수를 실행**해야 한다(shall)**.

- **REQ-PROMPT-008** (Event-Driven):
  **WHEN** `buildDashboardPrompt()` 실행이 완료될 때,
  **THEN** 시스템은 생성된 프롬프트 텍스트를 복사 버튼을 포함한 `CanvasPromptModal`에
  표시**해야 한다(shall)**.

- **REQ-PROMPT-009** (State-Driven):
  **IF** 현재 행사에 완료된 Phase 6 결과가 없으면,
  **THEN** "Canvas 대시보드 프롬프트" 버튼은 비활성화(disabled) 상태로 표시**해야 한다(shall)**.

### Module 3 — 프롬프트 구조 품질

- **REQ-PROMPT-010** (Ubiquitous):
  랜딩페이지 프롬프트는 다음 5개 섹션을 모두 포함**해야 한다(shall)**:
  (1) 행사 정보(행사명·슬로건·핵심 키워드), (2) 비주얼 스타일(기본/보조 컬러·디자인 무드·폰트·비주얼
  키워드), (3) 페이지 섹션(`landingPageSections` 전체 — 각 섹션의 이름·헤드라인·서브텍스트·CTA),
  (4) 타깃 사용자(`targetPersonas` 요약), (5) 요청 사항(반응형·한국어·등록 CTA·풀스크린 레이아웃).

- **REQ-PROMPT-011** (Ubiquitous):
  대시보드 프롬프트는 다음 6개 섹션을 모두 포함**해야 한다(shall)**:
  (1) 행사 개요(행사명·총평 `executiveSummary`), (2) 핵심 KPI 지표(참석 달성률·평균 만족도·예산 효율·
  비즈니스 ROI), (3) 강점/약점 분석(`topStrengths`/`topWeaknesses` — 카테고리·발견·근거),
  (4) 페르소나별 성과(`personaFeedbackLoop` — 목표 달성 여부·근거), (5) 차기 행사 권고
  (`nextEventRecommendations` — 우선순위·액션·전략), (6) 요청 사항(인터랙티브 차트·KPI 카드·색상
  규칙·한국어 인터페이스).

- **REQ-PROMPT-012** (Ubiquitous):
  두 프롬프트 모두 한국어로 출력**해야 한다(shall)**.

### Module 4 — API 지원 (Backend)

- **REQ-PROMPT-013** (Event-Driven):
  **WHEN** `GET /api/brand-memory?eventId=` 요청이 수신될 때,
  **THEN** 시스템은 해당 행사의 brandMemory를 `{ primaryColor, secondaryColors, designMood, fontStyle, visualKeywords }`
  형태로 반환**해야 하며(shall)**, brandMemory가 존재하지 않으면 `null`을 반환**해야 한다(shall)**.

### 금지 사항 / Graceful Fallback (Unwanted / Ubiquitous)

- **REQ-PROMPT-014** (Unwanted):
  프롬프트 생성 과정에서 시스템은 **추가 LLM API를 호출해서는 안 되며(shall not)**, 프롬프트는
  순수 함수 템플릿 조립으로만 구성**해야 한다(shall)**.

- **REQ-PROMPT-015** (Ubiquitous / Graceful Fallback):
  Phase 1 결과가 부재하거나 lazy fetch가 실패하는 경우, 시스템은 프롬프트 생성을 중단하지 않고
  누락 필드를 빈 문자열이 아닌 "미입력"으로 표기**해야 한다(shall)**. brandMemory가 부재하면 비주얼
  스타일 섹션은 "미입력" 표기 또는 생략으로 처리**해야 한다(shall)**.

---

## 4. Exclusions (What NOT to Build)

본 SPEC의 명시적 비범위. 아래 항목은 구현하지 않는다.

- **추가 LLM API 호출 없음** — 프롬프트는 순수 함수 템플릿 조립으로만 생성한다. Gemini/OpenAI 등
  어떤 생성 모델도 호출하지 않는다.
- **Gemini Canvas 직접 연동/API 없음** — Canvas로의 자동 전송이나 API 통합은 범위 밖. 사용자가
  복사 후 수동으로 붙여넣는 방식만 지원한다.
- **프롬프트 저장·버전 관리 없음** — 생성된 프롬프트는 DB에 저장하지 않으며 히스토리/버전 추적도
  하지 않는다. 모달 표시 후 휘발된다.
- **Phase 1~4 프롬프트 생성 없음** — 오직 Phase 5(랜딩페이지)·Phase 6(대시보드) 프롬프트만 다룬다.
- **타 AI 도구 맞춤 포맷 없음** — ChatGPT Canvas, v0, Bolt 등 다른 도구용 프롬프트 포맷은 제공하지
  않는다. Gemini Canvas 한국어 포맷만 지원한다.
- **신규 DB 테이블/컬럼 없음** — brandMemory는 기존 저장 위치에서 조회하며 새 스키마를 추가하지
  않는다.
