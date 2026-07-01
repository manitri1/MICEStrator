# SPEC-SUMMARY-001 — Acceptance Criteria

## Given-When-Then Scenarios

### Scenario 1: 모든 Phase 완료된 행사의 목록 카드 (핵심 정상 경로)

**Given** Phase 1·2·3·4가 모두 실행되어 `phaseResults`에 저장된 행사가 존재하고
- Phase 1 output에 `slogan`, `preparationPeriod='6months'`, `eventScale='medium'`이 있고
- Phase 2 output에 `wbsTasks` 8개, `milestones` 4개가 있고
- Phase 3 output에 `designMood`가 있고
- Phase 4 output에 `outreachList` 3명의 `speakerName`이 있을 때

**When** 사용자가 행사 목록 페이지(`app/page.tsx`)를 연다

**Then** 해당 행사 카드에 다음이 표시된다:
- 슬로건 텍스트
- 준비기간 "6개월"
- 개최규모 "중규모"
- 태스크 수 "8개"
- 마일스톤 수 "4개"
- 톤 선호 (designMood 값)
- 확정 연사 3명의 이름

**And** 목록 페이지 DB 쿼리는 총 2회(`events` 1회 + `phaseResults` 1회)를 초과하지 않는다.

---

### Scenario 2: Phase 1만 완료된 행사 (우아한 성능 저하)

**Given** Phase 1만 실행되고 Phase 2·3·4는 미실행인 행사가 존재할 때

**When** 사용자가 행사 목록 페이지를 연다

**Then** 카드에 슬로건·준비기간·개최규모는 표시되고

**And** 태스크 수·마일스톤 수·톤 선호·연사명 필드는 "미완료"로 표시되거나 생략된다

**And** 페이지는 오류 없이 정상 렌더링된다.

---

### Scenario 3: Phase 페이지 요약 배너 표시 (온디맨드 로딩)

**Given** Phase 1·2가 완료된 행사가 존재할 때

**When** 사용자가 `app/event/[id]/phase-3/page.tsx`를 연다

**Then** 페이지 상단에 컴팩트한 요약 배너가 표시되고
- 슬로건, 준비기간, 개최규모, 태스크 수, 마일스톤 수가 나타난다

**And** 요약 배너는 지연 로딩되어 페이지의 입력 폼 초기 렌더링을 블로킹하지 않는다

**And** 요약 배너는 폼·결과 영역을 가리지 않는다.

---

### Scenario 4: 준비기간·개최규모 영속화 (스키마 변경 검증)

**Given** 사용자가 Phase 1 폼에서 준비기간 "3개월", 개최규모 "대규모"를 선택하고 실행할 때

**When** Phase 1 에이전트가 완료되고 `phaseResults`에 저장된다

**Then** 저장된 `Phase01Output.preparationPeriod === '3months'`이고
**And** 저장된 `Phase01Output.eventScale === 'large'`이다

**And** 저장된 값은 AI 생성값이 아니라 입력값을 그대로 반영한 것이다.

---

### Scenario 5: 요약 조회 실패 시 우아한 처리 (Unwanted Behavior)

**Given** 요약 API 또는 유틸리티가 DB 오류를 반환할 때

**When** 사용자가 Phase 페이지를 연다

**Then** 요약 배너 영역만 생략되고

**And** 페이지의 나머지 기능(입력 폼, 결과)은 정상 동작한다

**And** 전체 페이지가 오류 화면으로 전환되지 않는다.

---

### Scenario 6: 하위 호환성 — 신규 필드 없는 기존 Phase 1 데이터 (Edge Case)

**Given** 스키마 변경 이전에 저장되어 `preparationPeriod`/`eventScale`이 없는 Phase 1 데이터가 존재할 때

**When** 요약 유틸리티가 해당 데이터를 읽거나, PhaseChat이 Phase 1을 편집 저장(PUT 재검증)한다

**Then** 요약에서 준비기간·개최규모는 "미완료"로 표시되고
**And** PUT 재검증(`OUTPUT_SCHEMAS[1].safeParse`)이 신규 optional 필드 부재로 인해 실패하지 않는다.

---

## Edge Cases

| 케이스 | 기대 동작 |
|--------|-----------|
| 행사가 0건 | 기존 빈 상태 UI 유지, 요약 로직 미실행 |
| Phase 4 `outreachList` 비어있음 | 연사명 "미완료"/생략 |
| Phase 2 `wbsTasks` 존재하나 `milestones` 없음 | 태스크 수 표시, 마일스톤 "미완료" |
| Phase 3 `designMood`는 있으나 `brandPersonality` 없음 | designMood만 톤으로 표시 |
| `preparationPeriod`가 예상 enum 밖 값 | 원문 문자열 그대로 또는 "미완료" fallback |
| 목록 100건 행사 각각 부분 완료 | 쿼리 2회 유지, 각 카드 독립적으로 우아 처리 |

## Quality Gate Criteria

- [ ] `Phase01OutputSchema`의 신규 필드가 `.optional()`로 선언되어 기존 데이터 재검증 통과
- [ ] `lib/summary/event-summary.ts`가 Phase 1~4 데이터를 정확히 매핑
- [ ] 목록 페이지 DB 쿼리 2회 이내 (REQ-009)
- [ ] Phase 페이지 요약 배너 지연 로딩, 폼 렌더 비블로킹 (REQ-014)
- [ ] 요약 조회 실패가 페이지를 중단시키지 않음 (REQ-015)
- [ ] 미완료 Phase 필드에 대한 "미완료"/생략 처리 일관성 (REQ-008, REQ-012)
- [ ] TypeScript 타입 오류 0, ESLint 오류 0
- [ ] `npm run build` 성공

## Definition of Done

- [ ] REQ-SUMMARY-001 ~ REQ-SUMMARY-015 모두 구현 또는 명시적 처리
- [ ] spec.md의 Exclusions 항목이 구현 범위에서 제외됨을 확인
- [ ] 6개 Phase 페이지 모두에 요약 배너 삽입 완료
- [ ] 행사 목록 카드 요약 표시 완료
- [ ] 준비기간·개최규모 신규 저장 검증(Scenario 4) 통과
- [ ] 하위 호환성 검증(Scenario 6) 통과
- [ ] 모든 Given-When-Then 시나리오 통과
- [ ] Quality Gate 전 항목 충족
