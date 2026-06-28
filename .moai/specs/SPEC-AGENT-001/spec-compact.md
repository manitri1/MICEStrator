---
id: SPEC-AGENT-001
type: spec-compact
version: "1.0.0"
updated: "2026-06-28"
---

# SPEC-AGENT-001 (Compact): Phase 1 Trend & Strategy AI Agent

Phase 1 (Trend & Strategy) 에이전트 — `event_master`(SSoT) 생성. 요구사항(REQ)과 인수 기준 요약본.

---

## 요구사항 (Requirements)

### Ubiquitous
- **REQ-001**: 시스템은 `POST /api/agents/phase-01` 엔드포인트를 제공해야 한다.
- **REQ-002**: 시스템은 Phase 1 출력을 DB 저장 이전에 `Phase01OutputSchema`(Zod)로 검증해야 한다.
- **REQ-003**: 시스템은 `openai('gpt-4o')` + `temperature: 0.7` + `generateObject`를 사용해야 한다.
- **REQ-004**: 출력에 국문/영문 행사명, 슬로건, 부제, 기획 배경, 핵심 키워드, PEST 분석, 타깃 페르소나(1~3명)를 모두 포함해야 한다.

### Event-Driven
- **REQ-010**: 사용자가 분야/준비기간/규모를 입력하면 Phase 1 에이전트가 실행되어 `event_master` JSON을 생성해야 한다.
- **REQ-011**: Phase 1 완료 시 결과를 `phase_results`(phaseNumber=1)에 저장하고 UI에 구조화 카드로 표시해야 한다.
- **REQ-012**: API 성공 시 검증된 `Phase01Output`을 HTTP 200으로 반환해야 한다.

### State-Driven
- **REQ-020**: 에이전트 실행 중 UI는 `loadingState`를 표시해야 한다.
- **REQ-021**: 에이전트 실행 중 입력 폼과 재생성 버튼은 비활성화 상태를 유지해야 한다.

### Optional
- **REQ-030**: 사용자가 재생성을 요청하면 동일 입력으로 새 `generateObject` 호출을 수행해야 한다.
- **REQ-031**: 재생성 시 직전 결과를 새 결과로 대체하여 표시해야 한다.

### Unwanted Behavior
- **REQ-040**: 출력이 `Phase01OutputSchema` 검증에 실패하면 DB 저장 없이 HTTP 500을 반환해야 한다.
- **REQ-041**: 입력이 `Phase01InputSchema` 검증에 실패하면 에이전트 미호출 + HTTP 400을 반환해야 한다.
- **REQ-042**: 타깃 페르소나를 0명 또는 4명 이상 생성해서는 안 된다 (1~3명 강제).

---

## 인수 기준 (Acceptance Criteria)

- **AC-1 (Happy Path)**: 유효 입력 → 검증된 `event_master`(국문/영문 행사명 + 2명 이상 페르소나) 생성 → DB 저장 → 200. [REQ-004, 010, 011, 012]
- **AC-2 (Schema Validation)**: GPT-4o 출력이 스키마 위반 → 검증 실패 → DB 미저장 → 500. [REQ-002, 040]
- **AC-3 (Input Validation)**: 불완전 입력 → 에이전트 미호출 → 400. [REQ-041]
- **AC-4 (DB Save)**: 정상 생성 후 `phase_results`에 phaseNumber=1 행 존재 + outputJson이 `Phase01OutputSchema` 만족. [REQ-011, 002]
- **AC-5 (UI Display)**: API 성공 후 eventNameKr 강조 표시 + 페르소나 카드 + 키워드 배지 + 재생성 버튼. [REQ-011, 031]
- **AC-6 (Loading State)**: 실행 중 `loadingState` 표시 + 폼/버튼 비활성화. [REQ-020, 021]
- **AC-7 (Regeneration)**: 재생성 클릭 → 동일 입력 새 호출 → 결과 대체. [REQ-030, 031]

---

## 제외 범위 (Exclusions)
- Phase 2~6 구현 (별도 SPEC)
- 실시간 스트리밍 (`streamObject`)
- 연사 섭외 로직 (Phase 4)
- 외부 트렌드 데이터 API 연동 (GPT-4o 내장 지식 사용)
- User Authentication (별도 구현)
