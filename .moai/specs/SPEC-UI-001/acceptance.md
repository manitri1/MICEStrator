# SPEC-UI-001 인수 기준 (Acceptance Criteria)

Given-When-Then 형식의 인수 시나리오. 모든 시나리오는 관찰 가능한 증거(화면 표시, API 응답, 포커스
이동)로 검증한다.

---

## AC-01 — Phase 1 실행 완료 후 행사 목록에 개요 표시

**관련 REQ:** REQ-UI-001

- **Given** 어떤 행사에 대해 Phase 1이 실행되어 `slogan`과 `coreKeywords[]`(3개 이상)를 포함한
  `phaseResults` 행이 존재하고,
- **When** 사용자가 홈 화면(행사 목록)에 진입하면,
- **Then** 해당 행사 카드에 Phase 1의 `slogan`이 표시되고 상위 3개 `coreKeywords`가 태그 형태로
  노출된다.
- **And** 표시되는 슬로건·키워드는 최신 `completedAt` 기준 Phase 1 행에서 파생된 값이다.

---

## AC-02 — Phase 1 미실행 상태 행사 목록 확인 (Graceful Fallback)

**관련 REQ:** REQ-UI-002, REQ-UI-003

- **Given** 어떤 행사에 대해 Phase 1이 아직 실행되지 않아 `phaseNumber = 1`인 `phaseResults` 행이
  존재하지 않고,
- **When** 사용자가 홈 화면(행사 목록)에 진입하면,
- **Then** 해당 행사 카드에 "Phase 1 미완료" 표시가 노출되고 슬로건·키워드 태그는 표시되지 않는다.
- **And** 카드에는 기존 `events.name`이 정상적으로 표시되며 목록 렌더링이 중단되지 않는다.

---

## AC-03 — Phase 1 재실행 후 Phase 1 페이지 배너 확인

**관련 REQ:** REQ-UI-004, REQ-UI-005, REQ-UI-010

- **Given** 사용자가 Phase 1 페이지에서 기존 결과가 있는 상태로 Phase 1을 재실행하고,
- **When** POST `/api/agents/phase-01` 재실행이 성공적으로 완료되면,
- **Then** API 응답 본문에 `affectedDownstream: [2,3,4,5,6]`이 포함된다.
- **And** Phase 1 페이지에 하위 Phase(2~6) 영향을 안내하는 `PhaseStaleBanner`가 표시된다.
- **And** 표시되는 배너는 별도 신규 컴포넌트가 아니라 기존 `PhaseStaleBanner` 컴포넌트이다.

---

## AC-04 — Phase 2 로드 시 Phase 1이 최신인 경우 (배너 없음)

**관련 REQ:** REQ-UI-006, REQ-UI-011, REQ-UI-013

- **Given** Phase 1의 최신 `completedAt`가 Phase 2의 최신 `completedAt`보다 이전(즉 Phase 2가 더
  최신)이고,
- **When** 사용자가 Phase 2 페이지를 로드하면,
- **Then** 페이지는 `GET /api/phase-staleness?eventId=&phase=2`를 호출하고 응답의 `isStale`이
  `false`이다.
- **And** 일관성 경고 배너가 표시되지 않는다.
- **And** 이 판별은 신규 테이블/컬럼 없이 `completedAt` 타임스탬프 비교만으로 이루어진다.

---

## AC-05 — Phase 2 로드 시 Phase 1이 Phase 2보다 최신인 경우 (배너 표시)

**관련 REQ:** REQ-UI-006, REQ-UI-007, REQ-UI-011, REQ-UI-012

- **Given** Phase 1의 최신 `completedAt`가 Phase 2의 최신 `completedAt`보다 나중(즉 Phase 1이 나중에
  재실행됨)이고,
- **When** 사용자가 Phase 2 페이지를 로드하면,
- **Then** `GET /api/phase-staleness?eventId=&phase=2` 응답의 `isStale`이 `true`이고
  `outdatedByPhases`에 `1`이 포함된다.
- **And** "Phase 1이 갱신되어 이 Phase의 내용이 구버전에 기반합니다. 재생성을 권장합니다."에 해당하는
  일관성 경고 배너가 표시된다.
- **And** 시스템은 Phase 2를 자동으로 재생성하지 않는다(알림만 제공).

---

## AC-06 — Phase 2 배너 재생성 버튼 클릭 시 폼 포커스 이동

**관련 REQ:** REQ-UI-008, REQ-UI-009

- **Given** Phase 2 페이지에 일관성 경고 배너가 표시된 상태이고,
- **When** 사용자가 배너의 "재생성" 버튼을 클릭하면,
- **Then** 화면이 현재 Phase(Phase 2)의 실행 폼으로 포커스를 이동한다(폼으로 스크롤 및 입력 포커스).
- **And** 별도로 사용자가 배너의 닫기 컨트롤을 클릭하면 현재 세션 내에서 배너가 사라진다.
- **And** 배너를 닫아도 자동 재생성은 발생하지 않는다.

---

## AC-07 — Phase 6 로드 시 Phase 1이 갱신된 경우 배너 표시

**관련 REQ:** REQ-UI-006, REQ-UI-007, REQ-UI-012

- **Given** Phase 1의 최신 `completedAt`가 Phase 6의 최신 `completedAt`보다 나중이고,
- **When** 사용자가 Phase 6 페이지를 로드하면,
- **Then** `GET /api/phase-staleness?eventId=&phase=6` 응답의 `isStale`이 `true`이다.
- **And** Phase 6 페이지에 Phase 1 갱신에 따른 일관성 경고 배너가 표시된다(최소 Phase 1과의 비교
  기준).
- **And** 시스템은 Phase 6을 자동으로 재생성하지 않는다.

---

## Edge Cases (경계 조건)

| # | 조건 | 기대 동작 |
|---|------|-----------|
| E1 | Phase 1 `outputJson`에 `coreKeywords`가 3개 미만 | 존재하는 개수만큼만 태그 표시, 오류 없음 |
| E2 | Phase 1 `slogan`이 비어 있음 | 슬로건 영역 생략, 키워드는 표시 (렌더링 중단 없음) |
| E3 | 특정 행사에 Phase 1과 Phase 2 `completedAt`가 동일 시각 | `isStale = false` (Phase 1이 "나중"일 때만 구식) |
| E4 | Phase 2~6 페이지에 해당 Phase 결과 자체가 없음 | 비교 대상 부재 — 구식 판별 불가로 배너 미표시(또는 미완료 처리) |
| E5 | `GET /api/phase-staleness` 호출 실패 | 배너 미표시로 폴백, 페이지 정상 렌더링 |
| E6 | 배너 dismiss 후 페이지 새로고침 | 배너 재표시 (영속 dismiss 없음 — 명시적 비범위) |

---

## Definition of Done

- [ ] REQ-UI-001~013 모두 구현 및 검증
- [ ] AC-01~AC-07 전 시나리오 통과
- [ ] Edge Case E1~E6 처리 확인
- [ ] 신규 DB 테이블/컬럼 추가 없음 (REQ-UI-013 준수)
- [ ] 자동 재생성 코드 없음 (REQ-UI-012 준수)
- [ ] `app/page.tsx`, `phase-01/route.ts`, `PhaseStaleBanner.tsx` 기존 동작 회귀 없음
- [ ] `GET /api/phase-staleness` 응답이 `{ isStale, staleSince, outdatedByPhases }` 형태 준수
- [ ] POST `/api/agents/phase-01` 응답에 `affectedDownstream` 포함
- [ ] TRUST 5 품질 게이트 통과 (lint/type/test)
- [ ] Exclusions 섹션의 비범위 항목이 구현에 포함되지 않았음을 확인

## Quality Gate 기준

| 게이트 | 기준 |
|--------|------|
| Tested | 신규 API 및 목록 조회 로직에 대한 테스트 존재, 기존 자산 회귀 테스트 |
| Readable | 명확한 네이밍, `usePhaseStaleness` 등 공통 로직 추출 |
| Unified | 기존 Next.js/Drizzle/shadcn 패턴 준수, 6개 Phase 페이지 동일 패턴 |
| Secured | `eventId`/`phase` 쿼리 파라미터 검증, SQL 인젝션 방지(Drizzle 파라미터 바인딩) |
| Trackable | SPEC-UI-001 참조 커밋, REQ 매핑 유지 |
