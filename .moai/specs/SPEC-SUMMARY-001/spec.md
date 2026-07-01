---
id: SPEC-SUMMARY-001
version: 1.0.0
status: draft
created: 2026-07-01
updated: 2026-07-01
author: manitri
priority: medium
issue_number: 0
---

# SPEC-SUMMARY-001 — 행사 요약 정보 표시 (Event Summary)

## HISTORY

- 2026-07-01 (v1.0.0): 최초 작성. 행사 목록 페이지 요약 카드 + 각 Phase 페이지 요약 배너 요구사항 정의.

---

## Summary

행사 목록 페이지(`app/page.tsx`)와 각 Phase 페이지(`app/event/[id]/phase-{1-6}/page.tsx`)에서
행사의 핵심 요약 정보(슬로건, 준비기간, 개최규모, 태스크/마일스톤 수, 톤 선호, 섭외 연사 후보)를
표시하여 사용자가 행사 컨텍스트를 일관되게 유지할 수 있도록 한다.

요약 정보는 **기존 `phaseResults.outputJson` 데이터를 최대한 재사용**하며,
DB 스키마 추가는 최소화한다. 단 준비기간(preparationPeriod)과 개최규모(eventScale)는
현재 어디에도 영속화되지 않으므로 `Phase01Output` 스키마에 추가하는 것을 유일한 스키마 변경으로 허용한다.

## Background

### 현재 상태 (연구 결과)

MICEstrator는 6-Phase AI 기획 파이프라인으로, 각 Phase 실행 결과가 `phaseResults` 테이블의
`outputJson`(JSONB) 컬럼에 Phase별로 저장된다. 요약에 필요한 각 필드의 현재 소재는 다음과 같다.

| 요약 필드 | 소재 | phaseResults 영속화 여부 |
|-----------|------|--------------------------|
| 행사명 (행사명) | `events.name` + `Phase01Output.eventNameKr` | 영속화됨 |
| 슬로건 (슬로건) | `Phase01Output.slogan` | 영속화됨 |
| 준비기간 (준비기간) | `Phase01Input.preparationPeriod` (폼 상태) | **미영속화** |
| 개최규모 (개최규모) | `Phase01Input.eventScale` (폼 상태) | **미영속화** |
| 태스크 수 (태스크 수) | `Phase02Output.wbsTasks` 배열 길이 | 영속화됨 |
| 마일스톤 수 (마일스톤 수) | `Phase02Output.milestones` 배열 길이 | 영속화됨 |
| 톤 선호 (톤 선호) | `Phase03Output.designMood` / `Phase03Output.brandPersonality` | 영속화됨 |
| 섭외 연사 후보 (연사명) | `Phase04Output.outreachList[].speakerName` | 영속화됨 |

### 핵심 발견 사항

1. **준비기간·개최규모는 복구 불가**: `app/api/agents/phase-01/route.ts`의 POST 핸들러는
   `Phase01Output`만 `phaseResults`에 저장하고 `Phase01Input`(preparationPeriod, eventScale)은
   버린다. 따라서 이 두 값은 `phaseResults`에서 읽을 수 없으며, 표시하려면 `Phase01Output`
   스키마에 추가해야 한다.

2. **톤 선호는 대체 필드로 표현 가능**: `Phase03Input.tonePreference`(`modern|classic|bold|elegant|playful`)는
   선택적 입력이며 영속화되지 않는다. 그러나 `Phase03Output.designMood`와 `brandPersonality`가
   영속화되어 있으므로 톤 선호를 이 필드들로 표현한다. 스키마 추가 불필요.

3. **연사 후보는 두 경로 존재**: `Phase04SourcingOutput.candidates`(자동 추천)는 DB에 저장되지 않고
   화면에만 표시된다. 반면 `Phase04Output.outreachList[].speakerName`(확정 아웃리치 대상)은
   `phaseResults`에 영속화된다. 요약에는 영속화된 `outreachList[].speakerName`을 사용한다.

4. **연사 후보 자동 추천 결과 미영속화**: 자동 추천(sourcing) 결과는 `localStorage` 또는 세션에만
   존재하고 DB에 없으므로, 요약 표시에는 확정 연사(Phase 4 Output)만 신뢰 가능한 소스로 사용한다.

5. **Phase 페이지 레이아웃**: `app/event/[id]/` 하위에 `layout.tsx`가 존재하지 않는다. 각 Phase 페이지는
   `'use client'` 컴포넌트이며 `<main className="max-w-3xl mx-auto ...">` 구조로 독립 렌더링된다.
   요약 배너는 각 페이지 상단(폼 위)에 삽입하는 것이 가장 침습성이 낮다.

## Scope

### In Scope

- 행사 목록 카드에 요약 정보 표시 (`app/page.tsx`)
- 각 Phase 페이지 상단 요약 배너/스트립 표시 (`app/event/[id]/phase-{1-6}/page.tsx`)
- 요약 데이터 집계용 서버 유틸리티 또는 API 엔드포인트
- `Phase01Output` 스키마에 `preparationPeriod`, `eventScale` 추가 (유일한 스키마 변경)
- Phase 1 시스템 프롬프트 및 에이전트에 위 두 필드 반영
- 미완료 Phase에 대한 우아한 성능 저하(graceful degradation): "미완료" 표시 또는 필드 생략

### Out of Scope (see Exclusions)

## Requirements (EARS Format)

### 데이터 집계

- **REQ-SUMMARY-001** (Ubiquitous): 시스템은 하나의 행사에 대해 Phase 1·2·3·4의
  `phaseResults.outputJson`에서 요약 필드를 집계하는 단일 유틸리티를 제공**해야 한다(shall)**.

- **REQ-SUMMARY-002** (Ubiquitous): 요약 유틸리티는 행사당 최대 4회의 `phaseResults` 조회로
  요약 데이터를 구성**해야 한다(shall)** (Phase 5·6은 요약 대상 아님).

- **REQ-SUMMARY-003** (Event-Driven): 요약 데이터가 요청될 때, 시스템은 해당 행사의 슬로건,
  준비기간, 개최규모, 태스크 수, 마일스톤 수, 톤 선호, 확정 연사명 목록을 반환**해야 한다(shall)**.

### 준비기간·개최규모 영속화 (스키마 변경)

- **REQ-SUMMARY-004** (Ubiquitous): `Phase01Output` 스키마는 `preparationPeriod`
  (`'3months' | '6months' | '12months'`)와 `eventScale`(`'small' | 'medium' | 'large'`)
  필드를 포함**해야 한다(shall)**.

- **REQ-SUMMARY-005** (Event-Driven): Phase 1 에이전트가 실행될 때, 시스템은 입력으로 받은
  `preparationPeriod`와 `eventScale` 값을 `Phase01Output`에 그대로 반영하여 저장**해야 한다(shall)**.

- **REQ-SUMMARY-006** (Ubiquitous): Phase 1 시스템 프롬프트는 `preparationPeriod`와 `eventScale`이
  입력값을 그대로 반영하는 필드임을 명시**해야 한다(shall)** (AI가 임의 값을 생성하지 않도록).

### 행사 목록 요약 카드

- **REQ-SUMMARY-007** (Event-Driven): 행사 목록 페이지가 로드될 때, 시스템은 각 행사 카드에
  슬로건, 준비기간, 개최규모, 태스크 수, 마일스톤 수, 톤 선호, 확정 연사 후보명을
  표시**해야 한다(shall)**.

- **REQ-SUMMARY-008** (State-Driven): 특정 Phase가 미완료인 동안, 시스템은 해당 Phase에서
  파생되는 요약 필드에 "미완료"를 표시하거나 해당 필드를 생략**해야 한다(shall)**.

- **REQ-SUMMARY-009** (Unwanted): 요약 데이터 집계로 인해 행사 목록 페이지의 초기 로딩이
  현저히 느려져서는 **안 된다(shall not)** — 목록 조회는 N+1 쿼리를 유발하지 않도록
  일괄(batch) 조회 또는 단일 조인 쿼리로 수행**해야 한다(shall)**.

### Phase 페이지 요약 배너

- **REQ-SUMMARY-010** (Event-Driven): 각 Phase 페이지(phase-1~6)가 로드될 때, 시스템은
  페이지 상단에 해당 행사의 요약 정보를 컴팩트한 배너/스트립 형태로 표시**해야 한다(shall)**.

- **REQ-SUMMARY-011** (Ubiquitous): Phase 페이지 요약 배너는 페이지 주 콘텐츠(입력 폼·결과)를
  가리지 않는 최소 UI 풋프린트를 유지**해야 한다(shall)**.

- **REQ-SUMMARY-012** (State-Driven): 요약 배너가 표시되는 동안, 데이터가 없는 필드는
  숨기거나 "미완료"로 표시**해야 한다(shall)**.

- **REQ-SUMMARY-013** (Optional): 가능한 경우, Phase 페이지 요약 배너는 접기/펼치기(collapsible)
  또는 스티키(sticky) 형태로 제공**할 수 있다(may)**.

### 데이터 로딩 정책

- **REQ-SUMMARY-014** (Ubiquitous): Phase 페이지 요약 배너 데이터는 온디맨드(on-demand)로
  로드**해야 한다(shall)** — 요약이 페이지의 핵심 기능이 아닌 경우 초기 렌더링을 블로킹하지
  않도록 지연 로딩(lazy loading)한다.

- **REQ-SUMMARY-015** (Unwanted): 요약 데이터 조회 실패 시, 시스템은 페이지 전체를 중단시켜서는
  **안 되며(shall not)**, 요약 영역만 우아하게 생략**해야 한다(shall)**.

## Technical Approach

### 데이터 소스 매핑 (스키마 추가 최소화 원칙)

| 요약 필드 | 데이터 소스 | 비고 |
|-----------|-------------|------|
| 슬로건 | `phaseResults[phase=1].outputJson.slogan` | 기존 |
| 준비기간 | `phaseResults[phase=1].outputJson.preparationPeriod` | **REQ-004로 신규 추가** |
| 개최규모 | `phaseResults[phase=1].outputJson.eventScale` | **REQ-004로 신규 추가** |
| 태스크 수 | `phaseResults[phase=2].outputJson.wbsTasks.length` | 기존 |
| 마일스톤 수 | `phaseResults[phase=2].outputJson.milestones.length` | 기존 |
| 톤 선호 | `phaseResults[phase=3].outputJson.designMood` (+ `brandPersonality`) | 기존, 대체 표현 |
| 확정 연사 | `phaseResults[phase=4].outputJson.outreachList[].speakerName` | 기존 |

### 제안 구조

1. **공용 요약 유틸리티** (`lib/summary/event-summary.ts` 신규): `eventId` 목록을 받아
   `phaseResults`를 일괄 조회하고 `EventSummary` 타입으로 매핑. 목록 페이지는 배치 조회,
   개별 Phase 페이지는 단일 행사 조회.
2. **요약 API 엔드포인트** (`app/api/event-summary/route.ts` 신규, 선택적): 클라이언트 컴포넌트인
   Phase 페이지가 온디맨드로 호출. 목록 페이지는 서버 컴포넌트이므로 유틸리티 직접 호출 가능.
3. **요약 배너 컴포넌트** (`components/EventSummaryBanner.tsx` 신규): Phase 페이지 상단에 삽입되는
   컴팩트 스트립. 미완료 필드는 숨김/미완료 처리.
4. **스키마·에이전트 변경**: `lib/schemas/phase-01.schema.ts`에 두 enum 필드 추가,
   `lib/agents/phase-01.ts`가 입력값을 출력에 병합, `lib/prompts/phase-01.system-prompt.ts`에
   설명 추가.

### 하위 호환성 주의

`Phase01Output`에 필수 필드를 추가하면 기존에 저장된 Phase 1 결과가 스키마 재검증(PUT 핸들러의
`OUTPUT_SCHEMAS[1].safeParse`)에서 실패할 수 있다. 따라서 두 필드는 **optional 또는 default를
가진 형태로 추가**하거나, 요약 유틸리티에서 안전하게 fallback 처리해야 한다.
(구체 방안은 plan.md에서 결정)

## Exclusions (What NOT to Build)

- **연사 후보 자동 추천 결과의 영속화**: `Phase04SourcingOutput`(자동 추천 후보)을 DB에 저장하는
  기능은 이 SPEC 범위 밖이다. 요약에는 확정 연사(Phase 4 Output)만 사용한다.
- **`brandMemory` 테이블·`events` 테이블 신규 컬럼 추가**: 준비기간·개최규모 외 어떠한 DB 스키마
  변경도 하지 않는다. `Phase01Output` JSON 필드 추가만 허용한다.
- **`tonePreference` 입력값 영속화**: `Phase03Input.tonePreference`를 별도로 저장하지 않는다.
  톤 선호는 `Phase03Output.designMood`/`brandPersonality`로 표현한다.
- **Phase 5·6 요약 필드**: 마케팅 에셋·ROI 데이터는 요약 대상이 아니다.
- **요약 정보 편집 기능**: 요약은 읽기 전용 표시이며, 요약 배너에서 값을 수정하는 기능은 제공하지 않는다.
- **Phase 페이지 공용 `layout.tsx` 도입**: 각 Phase 페이지에 배너를 개별 삽입하며, 대규모 레이아웃
  리팩터링(공용 layout 도입)은 하지 않는다.
- **실시간 갱신(WebSocket/polling)**: 요약은 페이지 로드 시점 스냅샷이며 실시간 동기화는 범위 밖이다.

## Implementation Notes

### 구현 상태: 완료 (2026-07-01)

본 SPEC은 다음 파일들로 구현되었습니다:

- `lib/summary/event-summary.ts` — EventSummary 타입과 집계 유틸리티 함수
- `app/api/event-summary/route.ts` — GET 엔드포인트 (Phase 1~4 phaseResults 집계)
- `components/EventSummaryBanner.tsx` — 홈 대시보드 요약 배너 컴포넌트
- `app/page.tsx` — EventSummaryBanner 통합 (홈 페이지)
- `lib/schemas/phase-01.schema.ts` — `preparationPeriod`, `eventScale` 필드 추가
- `lib/agents/phase-01.ts` — 입력값을 출력에 반영 (passthrough)
- `lib/prompts/phase-01.system-prompt.ts` — 시스템 프롬프트 업데이트

### 완료 기준 충족

- REQ-SUMMARY-001: 단일 유틸리티로 Phase 1·2·3·4 phaseResults 집계 ✓
- REQ-SUMMARY-002: 행사당 최대 4회 조회로 요약 데이터 구성 ✓
- REQ-SUMMARY-003: 슬로건, 준비기간, 개최규모, 태스크 수, 마일스톤 수, 톤 선호, 연사명 반환 ✓
- REQ-SUMMARY-004~006: preparationPeriod, eventScale 스키마 추가 및 영속화 ✓
- REQ-SUMMARY-007~009: 행사 목록 카드에 요약 정보 표시 + 미완료 상태 처리 ✓
- REQ-SUMMARY-010~013: Phase 페이지 요약 배너 표시 + 우아한 성능 저하 구현 ✓
- REQ-SUMMARY-014~015: 온디맨드 로딩 + 조회 실패 우아한 처리 ✓
