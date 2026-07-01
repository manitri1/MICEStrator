# SPEC-UI-001 구현 계획 (Implementation Plan)

## 개요

행사 목록에 Phase 1 개요(슬로건·핵심 키워드)를 표시하고, Phase 1 재실행 시 하위 Phase 일관성을
알리는 UI/API 변경. **신규 의존성 없음, DB 스키마 변경 없음.** 기존 `phaseResults.completedAt`
타임스탬프 비교와 기존 컴포넌트 재사용으로 구현한다.

## 기술 접근 (Technical Approach)

### 접근 1 — 행사 목록 Phase 1 개요 (Feature A)

- `app/page.tsx`(서버 컴포넌트)에서 각 행사의 최신 Phase 1 결과를 조회한다.
- `phaseResults`에는 `(eventId, phaseNumber)` 유니크 제약이 없으므로 행사별 최신 행을
  `phaseNumber = 1` + `orderBy(desc(completedAt))` 기준으로 가져온다.
- 조회 전략: LEFT JOIN + DISTINCT ON 서브쿼리 또는 행사별 상관 서브쿼리 중 Drizzle 지원 범위에서
  선택한다. 목록 규모가 크지 않으므로 최신 Phase 1 행만 반환하는 서브쿼리로 충분하다.
- `outputJson`에서 `slogan`, `coreKeywords[]`를 파싱하여 카드에 슬로건 + 상위 3개 키워드 태그를
  렌더링한다. Phase 1 결과 부재 시 "Phase 1 미완료" 라벨로 폴백한다.

### 접근 2 — Phase 1 재실행 즉각 알림 (Feature B, Phase 1 측)

- `app/api/agents/phase-01/route.ts`가 재실행 결과 반환 시 응답 본문에
  `affectedDownstream: [2,3,4,5,6]`를 추가한다.
- `app/event/[id]/phase-1/page.tsx`는 재실행(`handleSubmit`) 성공 후 응답의 `affectedDownstream`을
  기존 `staledPhases` 상태에 반영하고, `PhaseStaleBanner`를 재사용해 하위 영향 배너를 표시한다.

### 접근 3 — Phase 2~6 로드 시 일관성 체크 (Feature B, downstream 측)

- 신규 경량 엔드포인트 `GET /api/phase-staleness?eventId=&phase={N}`를 추가한다.
  - Phase 1 최신 `completedAt`와 해당 Phase 최신 `completedAt`를 각각 단건 조회한다.
  - `{ isStale, staleSince, outdatedByPhases }`를 반환한다. `outdatedByPhases`는 최소 Phase 1과의
    비교를 담고, 필요 시 `PHASE_DOWNSTREAM` 역방향(상위 Phase 전체)으로 확장 가능하다.
- Phase 2~6 페이지는 로드 시 이 엔드포인트를 호출하여 `isStale`이면 `PhaseStaleBanner`를 표시한다.
- 배너의 "재생성" 버튼은 현재 Phase 실행 폼으로 포커스를 이동한다(scrollIntoView + focus).
- 배너는 세션 내 useState dismiss를 지원한다.

### 접근 4 — PhaseStaleBanner 구식 유형 구분

- `PhaseStaleBanner`에 구식 유형 props(예: `reason: 'chat-edit' | 'phase-rerun'`)를 추가하여
  메시지를 분기한다.
  - `phase-rerun`: "Phase 1이 갱신되어 이 Phase의 내용이 구버전에 기반합니다. 재생성을 권장합니다."
  - `chat-edit`: 기존 채팅 편집 유래 메시지 유지.

## 파일별 변경 목록 (File-Level Change List)

| 파일 | 유형 | 변경 내용 | 관련 REQ |
|------|------|-----------|----------|
| `app/page.tsx` | MODIFY | 서버 컴포넌트에 최신 Phase 1 결과 조회(LEFT JOIN/서브쿼리) 추가, 카드에 `slogan` + 상위 3개 `coreKeywords` 태그 표시, 미완료 폴백 라벨 | REQ-UI-001, 002, 003 |
| `app/event/[id]/phase-1/page.tsx` | MODIFY | `handleSubmit` 재실행 성공 후 응답의 `affectedDownstream`을 `staledPhases`에 반영, 하위 영향 배너 표시 | REQ-UI-004, 005 |
| `app/event/[id]/phase-2/page.tsx` | MODIFY | 로드 시 `GET /api/phase-staleness` 호출, `isStale`이면 배너 표시, 재생성 포커스·dismiss 연동 | REQ-UI-006, 007, 008, 009 |
| `app/event/[id]/phase-3/page.tsx` | MODIFY | (phase-2와 동일 패턴) | REQ-UI-006, 007, 008, 009 |
| `app/event/[id]/phase-4/page.tsx` | MODIFY | (phase-2와 동일 패턴) | REQ-UI-006, 007, 008, 009 |
| `app/event/[id]/phase-5/page.tsx` | MODIFY | (phase-2와 동일 패턴) | REQ-UI-006, 007, 008, 009 |
| `app/event/[id]/phase-6/page.tsx` | MODIFY | (phase-2와 동일 패턴, 최소 Phase 1과의 비교) | REQ-UI-006, 007, 008, 009 |
| `app/api/agents/phase-01/route.ts` | MODIFY | 재실행 응답에 `affectedDownstream: [2,3,4,5,6]` 추가 | REQ-UI-010 |
| `app/api/phase-staleness/route.ts` | NEW | 경량 staleness 체크 엔드포인트. Phase 1과 대상 Phase의 최신 `completedAt` 비교, `{ isStale, staleSince, outdatedByPhases }` 반환 | REQ-UI-011 |
| `components/PhaseStaleBanner.tsx` | MODIFY | props 확장: 구식 유형(`chat-edit` vs `phase-rerun`) 구분 메시지, dismiss 콜백, 재생성 콜백 지원 | REQ-UI-005, 007, 008, 009 |

## 마일스톤 (우선순위 기반, 시간 추정 없음)

### Milestone 1 (Priority High) — 백엔드 지원

- `app/api/phase-staleness/route.ts` [NEW] 구현 (REQ-UI-011)
- `app/api/agents/phase-01/route.ts`에 `affectedDownstream` 추가 (REQ-UI-010)
- 산출물: 두 API가 명세된 응답 형태를 반환. 이후 프론트 작업의 전제.

### Milestone 2 (Priority High) — 행사 목록 개요 표시

- `app/page.tsx` 최신 Phase 1 조회 + 슬로건·키워드 표시 + 미완료 폴백 (REQ-UI-001, 002, 003)
- 산출물: 목록 카드에서 컨셉 즉시 파악 가능.

### Milestone 3 (Priority Medium) — PhaseStaleBanner 확장

- `components/PhaseStaleBanner.tsx` props 확장(구식 유형, dismiss, 재생성 콜백) (REQ-UI-005, 007~009)
- 산출물: 두 소비처(Phase 1 재실행 / Phase 2~6 로드)에서 재사용 가능한 배너.

### Milestone 4 (Priority Medium) — Phase 페이지 통합

- `app/event/[id]/phase-1/page.tsx` 재실행 후 하위 영향 배너 (REQ-UI-004)
- `app/event/[id]/phase-2~6/page.tsx` 로드 시 일관성 체크 + 배너 + 재생성 포커스 (REQ-UI-006~009)
- 산출물: Phase 1 변경이 하위 Phase에 시각적으로 전파.

## 리스크 및 완화 (Risks & Mitigation)

| 리스크 | 영향 | 완화 |
|--------|------|------|
| `app/page.tsx`에 Phase 1 JOIN 추가 시 N+1 또는 목록 쿼리 지연 | 목록 로드 성능 저하 | 행사별 최신 Phase 1 단건만 반환하는 서브쿼리 사용, 목록 규모 작음 |
| 타임스탬프 비교가 실제 내용 변경과 무관하게 구식 경고 유발 (A2) | 불필요한 경고 피로 | 세션 내 dismiss 제공(REQ-UI-009), 자동 재생성 금지(REQ-UI-012) |
| `PhaseStaleBanner`가 이미 chat-edit 유래로 사용 중 — 회귀 위험 | 기존 배너 동작 파손 | props 기본값을 기존 동작으로 유지, 유형 분기는 신규 props로만 활성 |
| Phase 2~6 페이지 6곳 동일 패턴 반복 — 일관성 붕괴 위험 | 유지보수 부담 | 공통 훅/유틸(예: `usePhaseStaleness`)로 추출 후 각 페이지에서 호출 |
| `slogan`/`coreKeywords` 길이 초과로 카드 레이아웃 깨짐 (A1) | 목록 UI 붕괴 | CSS truncate + 키워드 상위 3개 제한 |

## 방법론 참고

- `quality.yaml`의 `development_mode`에 따라 Run Phase에서 DDD 또는 TDD 사이클 적용.
- `app/page.tsx`, `phase-01/route.ts`, `PhaseStaleBanner.tsx`는 기존 자산 수정이므로 변경 전
  현재 동작을 보존하는 특성화(characterization) 테스트 또는 회귀 테스트를 우선한다.

## 비범위 확인

`spec.md`의 Exclusions 섹션을 준수한다. 특히 DB 스키마 변경, 자동 재생성, 실시간/외부 알림,
변경 이력 UI, 영속 dismiss는 본 계획에 포함하지 않는다.
