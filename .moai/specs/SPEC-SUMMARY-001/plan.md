# SPEC-SUMMARY-001 — Implementation Plan

## Technical Approach

### 설계 원칙

1. **스키마 추가 최소화**: DB 마이그레이션 없음. 유일한 데이터 모델 변경은 `Phase01Output` JSON 필드
   2개(`preparationPeriod`, `eventScale`) 추가이며, 이는 JSONB 컬럼 내부 변경이므로 마이그레이션 불필요.
2. **하위 호환성 우선**: 기존 Phase 1 결과가 재검증에서 깨지지 않도록 신규 필드는
   `.optional()` 또는 `.default(...)`로 선언한다. 요약 유틸리티는 값 부재 시 "미완료" fallback.
3. **온디맨드 로딩**: 목록 페이지(서버 컴포넌트)는 유틸리티 직접 호출. Phase 페이지(클라이언트
   컴포넌트)는 요약 API를 `useEffect`로 지연 호출하여 초기 렌더 블로킹 방지.
4. **우아한 성능 저하**: 요약 조회 실패는 페이지를 중단시키지 않고 배너만 숨긴다.

### 핵심 데이터 타입

`lib/summary/event-summary.ts`에 정의:

```
EventSummary {
  eventId: string
  slogan?: string            // Phase 1
  preparationPeriod?: string // Phase 1 (신규 필드)
  eventScale?: string        // Phase 1 (신규 필드)
  taskCount?: number         // Phase 2 wbsTasks.length
  milestoneCount?: number    // Phase 2 milestones.length
  tone?: string              // Phase 3 designMood (+ brandPersonality)
  speakerNames?: string[]    // Phase 4 outreachList[].speakerName
}
```

값이 없는 필드는 `undefined`로 두어 UI에서 "미완료" 처리.

### 하위 호환성 결정 (준비기간·개최규모)

`Phase01OutputSchema`에 필수(required)로 추가하면 PUT 핸들러(`app/api/phase-result/route.ts`)의
`OUTPUT_SCHEMAS[1].safeParse(merged)`가 기존 저장 데이터에 대해 실패한다.

**결정**: 두 필드를 `.optional()`로 선언한다. Phase 1 신규 실행 시에는 항상 채워지지만
(REQ-SUMMARY-005), 과거 데이터는 값 부재를 허용하여 재검증 호환성을 유지한다.

---

## File-Level Change List

### 신규 파일

| 파일 | 목적 | REQ |
|------|------|-----|
| `lib/summary/event-summary.ts` | phaseResults 배치/단건 집계 → EventSummary | REQ-001~003 |
| `app/api/event-summary/route.ts` | Phase 페이지용 온디맨드 요약 GET 엔드포인트 | REQ-014 |
| `components/EventSummaryBanner.tsx` | Phase 페이지 상단 컴팩트 요약 배너 | REQ-010~013 |
| `components/EventSummaryCard.tsx` (선택) | 목록 카드 요약 표시 조각 | REQ-007~008 |

### 수정 파일

| 파일 | 변경 내용 | REQ |
|------|-----------|-----|
| `lib/schemas/phase-01.schema.ts` | `Phase01OutputSchema`에 `preparationPeriod`, `eventScale` optional 추가 | REQ-004 |
| `lib/agents/phase-01.ts` | 입력값을 출력 객체에 병합하여 반환 | REQ-005 |
| `lib/prompts/phase-01.system-prompt.ts` | 두 필드가 입력 반영 필드임을 명시 | REQ-006 |
| `app/api/agents/phase-01/route.ts` | (필요 시) 출력 병합 위치 확인 — 에이전트에서 병합 시 변경 불요 | REQ-005 |
| `app/page.tsx` | 각 행사 카드에 요약 표시, 배치 집계 호출 | REQ-007~009 |
| `app/event/[id]/phase-1/page.tsx` | 상단에 `EventSummaryBanner` 삽입 | REQ-010 |
| `app/event/[id]/phase-2/page.tsx` | 상단에 `EventSummaryBanner` 삽입 | REQ-010 |
| `app/event/[id]/phase-3/page.tsx` | 상단에 `EventSummaryBanner` 삽입 | REQ-010 |
| `app/event/[id]/phase-4/page.tsx` | 상단에 `EventSummaryBanner` 삽입 | REQ-010 |
| `app/event/[id]/phase-5/page.tsx` | 상단에 `EventSummaryBanner` 삽입 | REQ-010 |
| `app/event/[id]/phase-6/page.tsx` | 상단에 `EventSummaryBanner` 삽입 | REQ-010 |

### 성능 주의 (REQ-009)

`app/page.tsx`는 현재 `events`만 조회한다(최대 100건). 요약을 위해 각 행사별로 `phaseResults`를
개별 조회하면 N+1이 발생한다. **일괄 조회 전략**: `phaseResults`를 `eventId IN (...)`로 한 번에
가져와 메모리에서 `eventId` 기준으로 그룹핑한다. 목록 페이지 쿼리는 총 2회
(`events` 1회 + `phaseResults` 1회)로 제한한다.

---

## Milestones (Priority-Based, No Time Estimates)

### Milestone 1 (Priority High) — 데이터 계층
- `lib/schemas/phase-01.schema.ts`에 optional 필드 2개 추가
- `lib/agents/phase-01.ts`에서 입력값 출력 병합
- `lib/prompts/phase-01.system-prompt.ts` 문구 추가
- `lib/summary/event-summary.ts` 집계 유틸리티 (배치 + 단건)
- 완료 기준: 유틸리티가 Phase 1~4 데이터를 EventSummary로 정확히 매핑, 미완료 필드는 undefined

### Milestone 2 (Priority High) — 행사 목록 요약 카드
- `app/page.tsx`에서 배치 집계 호출 (쿼리 2회 이내)
- 카드에 슬로건·준비기간·개최규모·태스크수·마일스톤수·톤·연사명 표시
- 미완료 필드 "미완료"/생략 처리
- 완료 기준: 목록 로딩 쿼리 2회 유지(REQ-009), 미완료 Phase 우아 처리(REQ-008)

### Milestone 3 (Priority Medium) — Phase 페이지 요약 배너
- `components/EventSummaryBanner.tsx` 작성 (컴팩트, 최소 풋프린트)
- `app/api/event-summary/route.ts` 온디맨드 GET 엔드포인트
- phase-1~6 페이지 상단에 배너 삽입 (파일 6개, 논리 단위 분할 처리)
- 완료 기준: 배너가 폼을 가리지 않음(REQ-011), 지연 로딩(REQ-014), 조회 실패 시 배너만 생략(REQ-015)

### Milestone 4 (Priority Low) — 마감 처리
- 접기/펼치기 또는 스티키 배너 (REQ-013, 선택)
- 시각 다듬기 및 반응형 확인

---

## Technical Approach — Risks

| 리스크 | 영향 | 완화책 |
|--------|------|--------|
| `Phase01Output` 필수 필드 추가 시 기존 데이터 재검증 실패 | 높음 | 신규 필드를 `.optional()`로 선언 (plan 결정) |
| 목록 페이지 N+1 쿼리로 성능 저하 | 중간 | `phaseResults`를 `eventId IN (...)` 일괄 조회 후 그룹핑 |
| Phase 페이지가 6개 파일로 분산 → 반복 삽입 | 중간 | 공용 `EventSummaryBanner` 컴포넌트로 중복 최소화, 파일별 순차 편집 |
| 연사 자동 추천(sourcing)과 확정 연사 혼동 | 중간 | 요약은 영속화된 `Phase04Output.outreachList`만 사용 (Exclusion 명시) |
| 톤 선호가 `tonePreference` 입력과 불일치 | 낮음 | `designMood`/`brandPersonality`를 표준 소스로 고정 |

## Delegation Notes

- 데이터 계층·스키마 변경: expert-backend 상담 권장 (Drizzle/JSONB, Zod 스키마 하위 호환)
- 요약 배너·카드 UI: expert-frontend 상담 권장 (Next.js 16 서버/클라이언트 컴포넌트 경계, 지연 로딩)
