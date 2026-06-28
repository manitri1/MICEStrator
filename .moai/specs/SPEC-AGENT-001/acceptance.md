---
id: SPEC-AGENT-001
type: acceptance
version: "1.0.0"
updated: "2026-06-28"
---

# SPEC-AGENT-001 인수 기준 (Acceptance Criteria)

Phase 1 (Trend & Strategy) 에이전트의 인수 기준을 Given/When/Then 형식으로 정의한다. 모든 시나리오가 충족되어야 SPEC이 완료(Done)로 간주된다.

---

## 1. 인수 시나리오 (Given / When / Then)

### Scenario 1 — Happy Path (정상 생성)

```
GIVEN 사용자가 유효한 입력을 제공한다
      - industry: "친환경 모빌리티"
      - preparationPeriod: "6개월"
      - eventScale: "중규모"
      - eventId: 유효한 행사 ID
WHEN  Phase 1 에이전트가 실행된다 (POST /api/agents/phase-01)
THEN  검증된 event_master JSON이 생성된다
      - eventNameKr (국문 행사명)이 비어있지 않다
      - eventNameEn (영문 행사명)이 비어있지 않다
      - targetPersonas가 2명 이상 1~3명 범위 내로 포함된다
      - pestAnalysis가 P/E/S/T 4축 모두 채워진다
AND   결과가 phase_results 테이블에 phaseNumber=1로 저장된다
AND   HTTP 200 응답으로 검증된 Phase01Output 객체가 반환된다
```
연관 요구사항: REQ-004, REQ-010, REQ-011, REQ-012

### Scenario 2 — Schema Validation Failure (출력 검증 실패)

```
GIVEN Phase 1 에이전트가 호출되었으나
      GPT-4o가 Phase01OutputSchema를 위반하는 출력을 반환한다
      (예: targetPersonas 누락, pestAnalysis 필드 결손)
WHEN  시스템이 출력을 Zod 스키마로 검증한다
THEN  검증이 실패로 처리된다
AND   결과가 DB에 저장되지 않는다
AND   명확한 오류 메시지와 함께 HTTP 500 응답이 반환된다
```
연관 요구사항: REQ-002, REQ-040

### Scenario 3 — Input Validation Failure (입력 검증 실패)

```
GIVEN 사용자가 불완전한 입력을 제공한다
      (예: industry 누락, eventScale가 허용 값이 아님)
WHEN  POST /api/agents/phase-01 이 호출된다
THEN  시스템은 Phase01InputSchema 검증을 먼저 수행한다
AND   에이전트(runPhase1)를 호출하지 않는다
AND   HTTP 400 응답이 반환된다
```
연관 요구사항: REQ-041

### Scenario 4 — DB Save Verification (DB 저장 검증)

```
GIVEN Scenario 1의 정상 생성이 성공적으로 완료되었다
WHEN  phase_results 테이블을 조회한다 (해당 eventId 기준)
THEN  phaseNumber=1 인 행이 존재한다
AND   outputJson 컬럼의 값이 Phase01OutputSchema를 만족한다
AND   completedAt 타임스탬프가 기록되어 있다
```
연관 요구사항: REQ-011, REQ-002

### Scenario 5 — UI Display (UI 표시)

```
GIVEN Phase 1 API 호출이 성공적으로 완료되었다
WHEN  app/event/[id]/phase-1 페이지가 결과를 렌더링한다
THEN  eventNameKr 가 화면에 눈에 띄게(prominently) 표시된다
AND   targetPersonas 가 카드 형태로 표시된다
AND   coreKeywords 가 배지(badge) 형태로 표시된다
AND   재생성(regenerate) 버튼이 표시된다
```
연관 요구사항: REQ-011, REQ-031

### Scenario 6 — Loading State (실행 중 상태)

```
GIVEN 사용자가 입력을 제출하여 Phase 1 에이전트가 실행 중이다
WHEN  에이전트가 응답을 반환하기 전 상태이다
THEN  UI에 loadingState(진행 표시)가 표시된다
AND   입력 폼과 재생성 버튼이 비활성화 상태이다
```
연관 요구사항: REQ-020, REQ-021

### Scenario 7 — Regeneration (재생성)

```
GIVEN 이미 Phase 1 결과가 화면에 표시되어 있다
WHEN  사용자가 재생성 버튼을 클릭한다
THEN  동일 입력으로 새로운 generateObject 호출이 수행된다
AND   직전 결과가 새 결과로 대체되어 화면에 표시된다
```
연관 요구사항: REQ-030, REQ-031

---

## 2. 엣지 케이스 (Edge Cases)

| 케이스 | 기대 동작 |
| --- | --- |
| GPT-4o가 페르소나를 4명 이상 생성 | Zod max(3) 제약으로 검증 실패 → 500 또는 재생성 (REQ-042) |
| GPT-4o가 페르소나를 0명 생성 | Zod min(1) 제약으로 검증 실패 → 500 또는 재생성 (REQ-042) |
| coreKeywords가 빈 배열 | 스키마 정책에 따라 검증 실패 처리 |
| eventScale가 허용 enum 밖 값 | 입력 검증 단계에서 400 (REQ-041) |
| OpenAI API 타임아웃/오류 | 500 응답 + DB 미저장 (REQ-040) |
| 존재하지 않는 eventId | DB 저장 단계에서 외래키 무결성 오류 → 500 처리 |

---

## 3. 품질 게이트 기준 (Quality Gate Criteria)

- [ ] 모든 Given/When/Then 시나리오(Scenario 1~7) 충족
- [ ] 모든 엣지 케이스가 의도된 동작으로 처리됨
- [ ] DB 저장 전 100% Zod 검증 통과 보장 (REQ-002)
- [ ] 입력 검증 실패 시 에이전트 미호출 (REQ-041)
- [ ] 페르소나 1~3명 범위 강제 (REQ-042)
- [ ] TypeScript strict mode 타입 에러 0
- [ ] `temperature: 0.7`, `openai('gpt-4o')`, `generateObject` 사용 확인 (REQ-003)

---

## 4. 완료 정의 (Definition of Done)

Phase 1 구현이 완료(Done)되려면 다음을 모두 만족해야 한다.

1. `spec.md`의 모든 EARS 요구사항(REQ-001 ~ REQ-042)이 구현됨
2. 본 문서의 Scenario 1~7이 검증 가능하게 충족됨
3. 5개 구현 파일이 모두 생성되고 통합 동작함
   - `lib/schemas/phase-01.schema.ts`
   - `lib/prompts/phase-01.system-prompt.ts`
   - `lib/agents/phase-01.ts`
   - `app/api/agents/phase-01/route.ts`
   - `app/event/[id]/phase-1/page.tsx`
4. `event_master`(SSoT) 출력이 `Phase01OutputSchema`를 만족하여 후속 Phase가 안전하게 소비 가능
5. MX Tag 계획대로 `@MX:ANCHOR`(2건), `@MX:NOTE`(1건)가 부여됨
6. 모든 품질 게이트 기준이 통과됨
