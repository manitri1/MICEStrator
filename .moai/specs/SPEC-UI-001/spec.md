---
id: SPEC-UI-001
version: "1.0.0"
status: draft
created: "2026-07-01"
updated: "2026-07-01"
author: manitri
priority: medium
issue_number: 0
---

# SPEC-UI-001: 행사 목록 Phase 1 개요 표시 및 Phase 일관성 알림

## HISTORY

- 2026-07-01 (v1.0.0): 최초 작성. 행사 목록에 Phase 1 개요(슬로건·핵심 키워드) 표시 + Phase 1 재실행 시 하위 Phase 일관성 알림 기능 정의.

---

## 1. Environment (프로젝트 컨텍스트)

### 1.1 제품 배경

MICEstrator는 6단계(Phase 1~6) AI 기반 MICE 행사 기획 플랫폼이다. 제품 핵심 설계 원칙은
**Single Source of Truth** — Phase 1 출력이 전체 프로젝트의 마스터 데이터이며 이후 모든 Phase가
이를 참조한다. 그러나 현재 UI에는 다음 두 가지 일관성 공백이 존재한다.

**공백 A — 행사 목록의 정보 부족:**
홈 화면 행사 카드(`app/page.tsx`)는 `events` 테이블의 `name`, `status`, `createdAt`만 표시하며
Phase 1의 산출물(슬로건, 핵심 키워드 등)이 목록에 드러나지 않는다. 기획자는 카드만 봐서는
각 행사의 개요와 컨셉을 파악할 수 없어 여러 행사를 관리할 때 맥락을 잃는다.

**공백 B — Phase 1 변경이 하위 Phase에 전파되지 않음:**
Phase 1이 재실행되어(POST `/api/agents/phase-01`) 컨셉·슬로건·키워드가 바뀌어도, 이미 생성된
Phase 2~6 페이지에는 어떤 신호도 전달되지 않는다. 하위 Phase는 사용자가 직접 재실행하기 전까지
구버전 Phase 1에 기반한 구식 내용을 계속 표시한다. 이는 제품의 "Phase 간 데이터 일관성" 성공
지표(브랜드 컨셉 자동 상속율 100%)와 직접 충돌한다.

본 SPEC은 위 두 공백을 다음으로 해결한다.

- **Feature A — 행사 목록 Phase 1 개요 표시:** 행사 카드에 최신 Phase 1의 슬로건과 상위 핵심
  키워드를 노출하여 목록 차원에서 컨셉을 즉시 파악할 수 있게 한다.
- **Feature B — Phase 일관성 알림:** Phase 1 재실행 직후 Phase 1 페이지에 하위 영향 범위를 알리고,
  Phase 2~6 페이지 로드 시 상위 Phase(특히 Phase 1)의 최신성을 타임스탬프로 비교하여 구식 상태를
  경고 배너로 안내한다.

### 1.2 기술 스택 (프로젝트 헌법 정합)

| 항목 | 버전/라이브러리 | 비고 |
|------|----------------|------|
| 프레임워크 | Next.js 16 App Router, React 19, TypeScript 5.9 | 기존 |
| DB | Drizzle ORM + PostgreSQL (Supabase) | 기존 |
| UI | shadcn/ui + tailwindcss 4 | 기존 |
| 데이터 접근 | Server Component(`app/page.tsx`) 직접 쿼리 + Route Handler | 기존 패턴 재사용 |

**신규 의존성 없음.** 본 SPEC은 기존 스택과 기존 데이터만으로 구현한다.

### 1.3 영향 받는 기존 자산 (재사용)

| 파일 | 역할 |
|------|------|
| `app/page.tsx` | 홈 화면 서버 컴포넌트 — 행사 목록 카드 렌더링 (Phase 1 JOIN 추가 대상) |
| `lib/schemas/phase-01.schema.ts` | Phase 1 출력 Zod 스키마 (`eventNameKr`, `slogan`, `coreKeywords[]` 등) |
| `lib/db/schema.ts` | `events`, `phaseResults` 테이블 정의 |
| `app/api/agents/phase-01/route.ts` | Phase 1 실행/재실행 핸들러 (응답에 하위 영향 정보 추가 대상) |
| `app/api/phase-result/route.ts` | Phase 의존성 그래프(`PHASE_DOWNSTREAM`) 및 GET 핸들러 보유 |
| `components/PhaseStaleBanner.tsx` | 클라이언트 사이드 구식 경고 배너 (재사용·확장 대상) |
| `app/event/[id]/phase-1/page.tsx` | Phase 1 페이지 — `staledPhases` 상태 이미 보유 |
| `app/event/[id]/phase-2/page.tsx` ~ `phase-6/page.tsx` | 하위 Phase 페이지 (로드 시 일관성 체크 추가 대상) |

### 1.4 핵심 데이터 제약

- **`phaseResults` 다중 행:** `(eventId, phaseNumber)` 유니크 제약이 없어 Phase당 여러 행(히스토리)이
  존재한다. "최신 결과"는 `.orderBy(desc(completedAt)).limit(1)`로 조회한다.
- **Phase 1 입력 필드 비영속:** `preparationPeriod`, `eventScale`는 Phase 1 입력값으로 컴포넌트
  상태에만 존재하며 `Phase01Output` 스키마 및 DB에 저장되지 않는다. 따라서 목록 표시에는 출력에서
  파생된 `slogan`, `coreKeywords[]`만 사용한다.
- **Phase 의존성 그래프** (`app/api/phase-result/route.ts`):
  - Phase 1 → [2, 3, 4, 5, 6]
  - Phase 2 → [6]
  - Phase 3 → [4, 5]
  - Phase 4 → [5, 6]
  - Phase 5 → [6]
  - Phase 6 → []

---

## 2. Assumptions (가정)

| # | 가정 | 신뢰도 | 틀렸을 때 영향 |
|---|------|--------|----------------|
| A1 | Phase 1 출력의 `slogan`, `coreKeywords[]`는 목록 카드에 표시하기에 충분히 짧다 | 높음 | 카드 레이아웃 깨짐 — CSS truncate로 방어 |
| A2 | `completedAt` 타임스탬프 비교만으로 구식 판별이 충분하다 (내용 diff 불필요) | 중간 | 실제로는 무관한 재실행도 구식 경고 — 사용자 dismiss로 완화 |
| A3 | Phase 2~6 페이지에 Phase 1 `completedAt` 단건 조회를 추가해도 로드 성능에 영향 없다 | 높음 | 단일 인덱스 조회로 무시 가능 수준 |
| A4 | `PhaseStaleBanner`는 두 가지 구식 유형(chat-edit vs phase-rerun)을 props로 구분 표시 가능하다 | 높음 | 컴포넌트 분기 추가 필요 |
| A5 | 기존 세션 내 dismiss(useState)만으로 충분하며 영속 dismiss는 불필요하다 | 중간 | 새로고침 시 배너 재표시 — 범위 밖으로 명시 |

---

## 3. Requirements (EARS 요구사항)

### Module 1 — 행사 목록 Phase 1 개요 표시 (Feature A)

- **REQ-UI-001** (Event-Driven):
  **WHEN** 행사 목록 화면(`app/page.tsx`)이 렌더링되고 해당 행사에 완료된 Phase 1 결과가 존재할 때,
  **THEN** 시스템은 행사 카드에 최신 Phase 1의 `slogan`과 상위 3개 `coreKeywords`를 태그 형태로
  표시**해야 한다(shall)**.

- **REQ-UI-002** (Event-Driven):
  **WHEN** 행사 목록 화면이 렌더링되고 해당 행사에 완료된 Phase 1 결과가 없을 때,
  **THEN** 시스템은 카드에 "Phase 1 미완료"에 해당하는 명확한 미완료 표시를 노출**해야 한다(shall)**.

- **REQ-UI-003** (Ubiquitous / Graceful Fallback):
  Phase 1 결과 유무와 무관하게 시스템은 카드에 기존 `events.name`을 항상 표시**해야 하며(shall)**,
  Phase 1 조회 실패 또는 데이터 부재가 목록 렌더링을 중단시켜서는 **안 된다(shall not)**.

### Module 2 — Phase 1 재실행 시 즉각 알림 (Feature B, Phase 1 측)

- **REQ-UI-004** (Event-Driven):
  **WHEN** Phase 1 재실행(POST `/api/agents/phase-01`)이 성공적으로 완료된 후,
  **THEN** Phase 1 페이지는 하위 영향 범위(Phase 2~6)를 안내하는 배너를 표시**해야 한다(shall)**.

- **REQ-UI-005** (Ubiquitous):
  재실행 직후 표시하는 하위 영향 배너는 기존 `PhaseStaleBanner` 컴포넌트를 재사용**해야 한다(shall)**.

### Module 3 — Phase 2~6 페이지 로드 시 일관성 체크 (Feature B, downstream 측)

- **REQ-UI-006** (Event-Driven):
  **WHEN** Phase 2~6 중 임의의 페이지가 최초 로드될 때,
  **THEN** 시스템은 상위 Phase(최소한 Phase 1)의 최신 `completedAt`와 현재 Phase의 최신
  `completedAt`를 비교**해야 한다(shall)**.

- **REQ-UI-007** (State-Driven):
  **IF** Phase 1의 최신 `completedAt`가 현재 Phase의 최신 `completedAt`보다 나중이면,
  **THEN** 시스템은 현재 Phase가 구버전 Phase 1에 기반함을 알리는 일관성 경고 배너를
  표시**해야 한다(shall)**.

- **REQ-UI-008** (Event-Driven):
  **WHEN** 사용자가 일관성 경고 배너의 "재생성" 버튼을 클릭할 때,
  **THEN** 시스템은 현재 Phase의 실행 폼으로 포커스를 이동**해야 한다(shall)**.

- **REQ-UI-009** (Optional / State-Driven):
  **WHERE** 일관성 경고 배너가 표시된 경우, 시스템은 사용자가 현재 세션 내에서 배너를 직접 닫을 수
  있게 **해야 한다(shall)**.

### Module 4 — API 지원 (Backend)

- **REQ-UI-010** (Event-Driven):
  **WHEN** Phase 1 재실행 API(POST `/api/agents/phase-01`)가 결과를 반환할 때,
  **THEN** 응답 본문에 하위 영향 Phase 목록 `affectedDownstream: number[]`(값 `[2,3,4,5,6]`)를
  포함**해야 한다(shall)**.

- **REQ-UI-011** (Ubiquitous):
  시스템은 경량 일관성 체크 엔드포인트 `GET /api/phase-staleness?eventId=&phase=`를
  제공**하거나(shall)**, 기존 `GET /api/phase-result` 응답을 staleness 정보로 확장**해야 한다(shall)**.
  응답은 `{ isStale: boolean, staleSince: timestamp | null, outdatedByPhases: number[] }` 형태로
  반환**해야 한다(shall)**.

### 금지 사항 (Unwanted Behavior)

- **REQ-UI-012** (Unwanted):
  시스템은 Phase 1 변경을 근거로 Phase 2~6을 **자동으로 재생성해서는 안 된다(shall not)**.
  일관성 알림만 제공하며 재생성 실행 여부는 항상 사용자 결정에 맡긴다.

- **REQ-UI-013** (Unwanted):
  일관성 체크를 위해 시스템은 **새 DB 테이블이나 신규 컬럼을 추가해서는 안 되며(shall not)**,
  기존 `phaseResults.completedAt` 타임스탬프 비교만 사용**해야 한다(shall)**.

---

## 4. Exclusions (What NOT to Build)

본 SPEC의 명시적 비범위. 아래 항목은 구현하지 않는다.

- **DB 스키마 변경 없음** — 새 테이블·신규 컬럼 추가 금지. 일관성 판별은 `completedAt` 타임스탬프
  비교만으로 구현한다.
- **자동 재생성 없음** — Phase 1 변경 시 Phase 2~6을 자동 실행하지 않는다. 알림만 제공하고 실행은
  사용자가 수동으로 트리거한다.
- **실시간 알림 없음** — WebSocket/SSE 기반 실시간 push는 범위 밖. 일관성 체크는 페이지 로드 시점
  및 재실행 완료 시점에만 동작한다.
- **외부 알림 없음** — Push 알림, 이메일 알림 등 앱 외부 채널 알림은 구현하지 않는다.
- **변경 이력 UI 없음** — Phase별 변경 히스토리 뷰어(diff 타임라인 등)는 범위 밖.
- **영속 dismiss 없음** — 배너 닫기는 현재 세션 내 상태(useState)로만 유지하며 새로고침/재방문 후
  dismiss 상태를 저장하지 않는다.
- **내용 기반 diff 판별 없음** — 구식 여부는 타임스탬프만으로 판단하며 실제 필드 값 변경 여부를
  비교하지 않는다.

---

## 5. Traceability (요구사항 ↔ 기능 매핑)

| REQ | 모듈 | 대상 파일 | 검증 시나리오 |
|-----|------|-----------|---------------|
| REQ-UI-001 | 목록 개요 | `app/page.tsx` | AC-01 |
| REQ-UI-002 | 목록 개요 | `app/page.tsx` | AC-02 |
| REQ-UI-003 | 목록 개요 | `app/page.tsx` | AC-02 |
| REQ-UI-004 | 재실행 알림 | `app/event/[id]/phase-1/page.tsx` | AC-03 |
| REQ-UI-005 | 재실행 알림 | `components/PhaseStaleBanner.tsx` | AC-03 |
| REQ-UI-006 | 일관성 체크 | `phase-2~6/page.tsx`, `phase-staleness` API | AC-04, AC-05, AC-07 |
| REQ-UI-007 | 일관성 체크 | `phase-2~6/page.tsx` | AC-05, AC-07 |
| REQ-UI-008 | 일관성 체크 | `phase-2~6/page.tsx` | AC-06 |
| REQ-UI-009 | 일관성 체크 | `components/PhaseStaleBanner.tsx` | AC-06 |
| REQ-UI-010 | API | `app/api/agents/phase-01/route.ts` | AC-03 |
| REQ-UI-011 | API | `app/api/phase-staleness/route.ts` | AC-04, AC-05 |
| REQ-UI-012 | 금지 | (전 범위) | AC-05, AC-07 |
| REQ-UI-013 | 금지 | (전 범위) | AC-04 |

## Implementation Notes

### 구현 상태: 완료 (2026-07-01)

본 SPEC은 다음 파일들로 구현되었습니다:

- `components/PhaseStaleBanner.tsx` — `reason: 'chat-edit' | 'phase-rerun'` prop 추가로 구식 유형 구분
- `app/api/phase-staleness/route.ts` — GET 엔드포인트 (Phase 일관성 체크)
- `app/api/agents/phase-01/route.ts` — affectedDownstream 응답 추가
- `app/event/[id]/phase-2/page.tsx` ~ `phase-6/page.tsx` — Phase 페이지 상단에 스테일 배너 + 재생성 성공 메시지 추가
- `lib/schemas/phase-01.schema.ts` — passthrough 필드 추가 (preparationPeriod, eventScale)
- `lib/agents/phase-01.ts` — Phase01LLMSchema 분리 (generateObject에는 passthrough 필드 제외)
- `lib/prompts/phase-01.system-prompt.ts` — 시스템 프롬프트 업데이트

### 완료 기준 충족

- REQ-UI-001~003: 행사 목록 Phase 1 개요 표시 + 미완료 상태 처리 ✓
- REQ-UI-004~005: Phase 1 재실행 시 하위 영향 배너 표시 (PhaseStaleBanner 재사용) ✓
- REQ-UI-006~009: Phase 2~6 페이지 로드 시 일관성 체크 + 경고 배너 표시 ✓
- REQ-UI-010: Phase 1 API 응답에 affectedDownstream 포함 ✓
- REQ-UI-011: GET /api/phase-staleness 엔드포인트 구현 ✓
- REQ-UI-012~013: 자동 재생성 금지 + DB 스키마 변경 금지 ✓
