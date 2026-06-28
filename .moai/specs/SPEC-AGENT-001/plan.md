---
id: SPEC-AGENT-001
type: plan
version: "1.0.0"
updated: "2026-06-28"
---

# SPEC-AGENT-001 구현 계획 (Implementation Plan)

Phase 1 (Trend & Strategy) AI 에이전트 구현 계획. WHAT/WHY는 `spec.md`, HOW의 절차·기술 제약·리스크는 본 문서에서 다룬다. 함수 시그니처·세부 코드는 Run 단계로 위임한다.

---

## 1. 작업 분해 (Task Decomposition)

5개 작업으로 분해한다. 작업 간 의존성에 따라 순차/병렬 실행 가능 여부를 표기한다.

### Task 1 — Zod Schema 정의

- **파일**: `lib/schemas/phase-01.schema.ts`
- **의존성**: 없음 (최우선 작업, 다른 모든 작업의 계약 기반)
- **내용**:
  - `Phase01InputSchema`: `{ eventId, industry, preparationPeriod, eventScale }`
  - `Phase01OutputSchema`:
    - `eventNameKr` (국문 행사명)
    - `eventNameEn` (영문 행사명)
    - `slogan` (슬로건)
    - `subtitle` (부제)
    - `planningRationale` (기획 배경)
    - `coreKeywords[]` (핵심 키워드 배열)
    - `pestAnalysis { P, E, S, T }` (PEST 4축 요약)
    - `targetPersonas[]` (1~3명): 각 항목 `{ name, role, painPoints[], motivations[], expectedValue }`
  - `targetPersonas`는 길이 제약(min 1, max 3) 적용 — `spec.md` REQ-042 대응
- **MX Tag**: `Phase01OutputSchema` → `@MX:ANCHOR` (SSoT 계약)

### Task 2 — System Prompt 작성

- **파일**: `lib/prompts/phase-01.system-prompt.ts`
- **의존성**: 없음 (Task 1과 병렬 가능)
- **내용**:
  - Export: `PHASE01_SYSTEM_PROMPT` 상수
  - 역할(Role): 세계 최고 수준의 MICE 전략 기획자 (15년 경력)
  - Chain of Thought 지시:
    1. PEST 분석 수행
    2. 메가트렌드 도출
    3. 컨셉 아이디에이션 (행사명·슬로건·부제)
    4. 타깃 페르소나 정의 (1~3명, 다양성 확보)
  - 제약 규칙(Constraints): 할루시네이션 방지, 한국어 출력(기술 용어 영문 허용), JSON 스키마 준수, 페르소나 다양성 강제

### Task 3 — Agent 로직

- **파일**: `lib/agents/phase-01.ts`
- **의존성**: Task 1(스키마), Task 2(프롬프트) 완료 후
- **내용**:
  - Export: `runPhase1(input: Phase01Input): Promise<Phase01Output>`
  - `generateObject` 사용 — `model: openai('gpt-4o')`, `schema: Phase01OutputSchema`, `temperature: 0.7`, `system: PHASE01_SYSTEM_PROMPT`
  - 검증 실패 시 타입드 에러(typed error) throw
- **MX Tag**: `runPhase1()` → `@MX:ANCHOR` (고-fan_in)

### Task 4 — API Route

- **파일**: `app/api/agents/phase-01/route.ts`
- **의존성**: Task 1(입력 스키마), Task 3(에이전트) 완료 후
- **내용**:
  - POST 핸들러: 입력 검증(`Phase01InputSchema`) → `runPhase1` 호출 → DB 저장 → 출력 반환
  - 에러 처리: 입력 검증 실패 시 400, AI/검증 에러 시 500
  - DB 저장: `phaseResults` 테이블 (`phaseNumber: 1`, `outputJson`)
- **MX Tag**: 라우트 → `@MX:NOTE` (SSoT 생성 엔드포인트)

### Task 5 — UI Page

- **파일**: `app/event/[id]/phase-1/page.tsx`
- **의존성**: Task 4(API) 완료 후 (E2E 연동)
- **내용**:
  - 입력 폼:
    - `industry` (text input)
    - `preparationPeriod` (select: 3개월 / 6개월 / 12개월)
    - `eventScale` (radio: 소규모 / 중규모 / 대규모)
  - 결과 표시:
    - 국문/영문 행사명 카드
    - 슬로건 하이라이트
    - 페르소나 아코디언(accordion)
    - 핵심 키워드 배지(badge)
  - 상태 처리: API 호출 중 `loadingState` 표시, 폼·버튼 비활성화 (REQ-020, REQ-021)
  - 재생성 버튼 (REQ-030, REQ-031)

---

## 2. 실행 순서 (Execution Order)

```
Task 1 (Schema) ─┐
                 ├─→ Task 3 (Agent) ─→ Task 4 (API Route) ─→ Task 5 (UI Page)
Task 2 (Prompt) ─┘
```

- **병렬 가능**: Task 1, Task 2 (서로 독립)
- **순차 필수**: Task 3 → Task 4 → Task 5 (데이터 계약 의존)
- 다중 파일(5개) 작업이므로 논리 단위별 분할 실행하며 각 단위 완료 후 진행 상황을 보고한다.

---

## 3. 기술 제약 (Technology Constraints)

| 패키지 | 버전 | 용도 |
| --- | --- | --- |
| `ai` | 7.0.4 | `generateObject` (Phase 1은 `streamObject` 사용 금지) |
| `@ai-sdk/openai` | 4.0.2 | `openai('gpt-4o')` 모델 프로바이더 |
| `zod` | 4.4.3 | 입력/출력 스키마 검증 |
| `drizzle-orm` | 0.45.2 | DB 작업 (`db.insert` / `db.select`) |
| `next` | 16.2.9 | App Router, Server Components, API Routes |

추가 제약:
- TypeScript strict mode 유지 (`.moai/project/tech.md` 품질 설정)
- 에이전트 출력은 Zod 스키마 자동 검증 — 위반 시 저장 차단(재생성 또는 오류 반환)
- Phase 1 Temperature는 0.7로 고정 (창의적 컨셉 도출)

---

## 4. 마일스톤 (Milestones — 우선순위 기반)

시간 추정 없이 우선순위·순서로 표기한다.

| 마일스톤 | 포함 작업 | 우선순위 | 완료 기준 |
| --- | --- | --- | --- |
| M1 — 데이터 계약 확립 | Task 1, Task 2 | High | `Phase01InputSchema`·`Phase01OutputSchema`·`PHASE01_SYSTEM_PROMPT` 정의 완료 |
| M2 — 에이전트 코어 | Task 3 | High | `runPhase1()` 가 유효 입력으로 검증된 출력 반환 |
| M3 — API 통합 | Task 4 | High | POST 엔드포인트가 검증·생성·DB 저장·응답 전 과정 처리 |
| M4 — UI 완성 | Task 5 | Medium | 입력 폼·결과 카드·로딩·재생성 동작 |

순서: M1 완료 → M2 시작 → M3 시작 → M4 시작.

---

## 5. 리스크 분석 (Risk Analysis)

| ID | 리스크 | 영향 | 완화 방안 |
| --- | --- | --- | --- |
| Risk-1 | GPT-4o 출력이 Zod 스키마를 따르지 않을 수 있음 | 생성 실패, 파이프라인 중단 | `generateObject`가 OpenAI structured outputs로 스키마 강제. 검증 실패 시 명확한 500 응답(REQ-040) |
| Risk-2 | 한국어 페르소나 이름·역할이 지나치게 일반적일 수 있음 | 결과 품질 저하 | 시스템 프롬프트에 다양성·구체성 지시 포함(Task 2). 페르소나별 painPoints·motivations 필수화 |
| Risk-3 | Phase 1 출력이 SSoT이므로 스키마 변경 시 후속 Phase 전체가 깨짐 | 파급 장애 | 스키마에 version 필드 도입, `Phase01OutputSchema`를 단일 소스에서만 export(`@MX:ANCHOR`). 변경 시 영향 분석 의무화 |
| Risk-4 | 입력 검증 누락 시 잘못된 데이터가 에이전트로 전달 | 비용 낭비·오류 | API Route에서 `Phase01InputSchema` 사전 검증, 실패 시 400(REQ-041) |

---

## 6. 품질 게이트 (Quality Gates)

- [ ] `Phase01OutputSchema` 검증을 통과한 출력만 DB에 저장 (REQ-002, REQ-040)
- [ ] 입력 검증 실패 시 에이전트 미호출 + 400 반환 (REQ-041)
- [ ] 페르소나 1~3명 범위 강제 (REQ-042)
- [ ] TypeScript strict mode 통과, 타입 에러 0
- [ ] `acceptance.md`의 Given/When/Then 시나리오 전부 충족
