---
id: SPEC-AGENT-001
version: "1.0.0"
status: draft
created: "2026-06-28"
updated: "2026-06-28"
author: MoAI
priority: P1
issue_number: 0
---

# SPEC-AGENT-001: Phase 1 Trend & Strategy AI Agent 구현

## HISTORY

<!-- 신규 SPEC: 변경 이력 없음 -->

---

## 1. 개요 (Overview)

MICEstrator 6단계 MICE 행사 기획 파이프라인의 **첫 번째 단계인 Phase 1 (Trend & Strategy Analysis)** 을 구현한다.

Phase 1은 파이프라인의 **시작점**이자, 후속 모든 Phase(2~6)가 참조하는 **단일 진실 공급원(Single Source of Truth, SSoT)** 인 `event_master` JSON을 생성한다. 따라서 Phase 1의 출력 스키마는 전체 시스템의 데이터 계약(data contract) 역할을 수행하며, 출력 품질과 스키마 안정성이 파이프라인 전체의 신뢰성을 좌우한다.

### 1.1 입력 (Input)

사용자는 행사 기획에 필요한 최소 정보를 제공한다.

| 항목 | 설명 | 예시 |
| --- | --- | --- |
| 희망 분야/산업 (industry) | 행사를 개최하려는 산업·분야 | "친환경 모빌리티", "디지털 헬스케어" |
| 준비 기간 (preparationPeriod) | 행사 준비에 사용할 기간 | 3개월 / 6개월 / 12개월 |
| 개최 규모 (eventScale) | 행사 규모 | 소규모 / 중규모 / 대규모 |

### 1.2 출력 (Output) — `event_master`

Phase 1 에이전트는 다음 구조화 데이터를 생성한다.

- 국문 행사명 / 영문 행사명
- 슬로건 / 부제(subtitle)
- 기획 배경 (planning rationale)
- 타깃 페르소나 (1~3명)
- 핵심 키워드 (core keywords)
- PEST 분석 요약 (Political / Economic / Social / Technological)

### 1.3 범위 위치

이 SPEC은 **Phase 1 구현에만** 집중한다. Phase 2~6은 별도 SPEC으로 정의되며, 본 SPEC은 후속 Phase가 안전하게 소비할 수 있는 `event_master` SSoT 계약을 확립하는 것을 목표로 한다.

---

## 2. 용어 정의 (Glossary)

| 용어 | 정의 |
| --- | --- |
| **SSoT (Single Source of Truth)** | Phase 1이 생성하는 `event_master` 데이터. Phase 2~6이 모두 참조하는 마스터 데이터 |
| **PEST 분석** | Political(정치), Economic(경제), Social(사회), Technological(기술) 4개 축의 거시 환경 분석 |
| **타깃 페르소나** | 행사 핵심 참가자를 대표하는 가상의 인물 프로필 |
| **generateObject** | Vercel AI SDK의 구조화 출력 함수. Zod 스키마에 따라 검증된 JSON 객체를 1회 응답으로 반환 |
| **phase_results 테이블** | Phase별 실행 결과를 영속하는 Drizzle ORM 테이블 (`phaseNumber: 1` 행이 Phase 1 결과) |

---

## 3. 요구사항 (Requirements — EARS)

EARS(Easy Approach to Requirements Syntax) 형식으로 작성한다. 각 요구사항은 검증 가능(testable)해야 한다.

### 3.1 Ubiquitous (상시 적용)

- **REQ-001 (Ubiquitous):** 시스템은 `POST /api/agents/phase-01` 엔드포인트를 제공해야 한다.
- **REQ-002 (Ubiquitous):** 시스템은 Phase 1 에이전트의 모든 출력을 DB 저장 이전에 `Phase01OutputSchema`(Zod)로 검증해야 한다.
- **REQ-003 (Ubiquitous):** 시스템은 Phase 1 에이전트 호출 시 `openai('gpt-4o')` 모델과 `temperature: 0.7` 설정을 사용해야 한다.
- **REQ-004 (Ubiquitous):** 시스템은 Phase 1 출력에 국문 행사명, 영문 행사명, 슬로건, 부제, 기획 배경, 핵심 키워드, PEST 분석, 타깃 페르소나(1~3명)를 모두 포함해야 한다.

### 3.2 Event-Driven (When ~ Then)

- **REQ-010 (Event-Driven):** 사용자가 분야(industry), 준비기간(preparationPeriod), 규모(eventScale)를 입력하면, Phase 1 에이전트가 실행되어 `event_master` JSON을 생성해야 한다.
- **REQ-011 (Event-Driven):** Phase 1 생성이 완료되면, 시스템은 결과를 `phase_results` 테이블에 `phaseNumber: 1`로 저장하고, UI에 구조화된 카드 형태로 표시해야 한다.
- **REQ-012 (Event-Driven):** Phase 1 API 호출이 성공하면, 시스템은 검증된 `Phase01Output` 객체를 HTTP 200 응답으로 반환해야 한다.

### 3.3 State-Driven (While ~)

- **REQ-020 (State-Driven):** Phase 1 에이전트가 실행 중인 동안, UI는 `loadingState`(진행 표시)를 사용자에게 표시해야 한다.
- **REQ-021 (State-Driven):** Phase 1 에이전트가 실행 중인 동안, 재생성 버튼과 입력 폼은 비활성화 상태를 유지해야 한다.

### 3.4 Optional (Where ~)

- **REQ-030 (Optional):** 사용자가 결과 재생성을 요청하는 경우, 시스템은 동일 입력으로 새로운 `generateObject` 호출을 수행하여 새 결과를 생성해야 한다.
- **REQ-031 (Optional):** 재생성 기능이 제공되는 경우, 시스템은 직전 결과를 새 결과로 대체하여 화면에 표시해야 한다.

### 3.5 Unwanted Behavior (If ~ Then)

- **REQ-040 (Unwanted):** GPT-4o 출력이 `Phase01OutputSchema` 검증을 통과하지 못하는 경우, 시스템은 결과를 DB에 저장하지 않고 명확한 오류 메시지와 함께 HTTP 500 응답을 반환해야 한다.
- **REQ-041 (Unwanted):** 요청 본문(body)이 `Phase01InputSchema` 검증을 통과하지 못하는 경우, 시스템은 에이전트를 호출하지 않고 HTTP 400 응답을 반환해야 한다.
- **REQ-042 (Unwanted):** 시스템은 타깃 페르소나를 0명 또는 4명 이상 생성해서는 안 된다(1~3명 범위 강제).

---

## 4. 아키텍처 결정 (Architecture Decisions)

| 결정 항목 | 선택 | 근거 |
| --- | --- | --- |
| AI 출력 방식 | `generateObject` (`ai` SDK v7) | Phase 1은 단일 구조화 JSON 생성. 스트리밍 불필요 |
| AI 모델 | `openai('gpt-4o')` (`@ai-sdk/openai`) | 구조화 출력 + 한국어 품질 우수 |
| Temperature | 0.7 | 창의적 컨셉·페르소나 도출에 적합한 균형값 |
| 시스템 프롬프트 역할 | "세계 최고 수준의 MICE 전략 기획자" + PEST 분석 전문가 | 도메인 전문성·일관성 확보 |
| 출력 검증 | Zod 스키마 (`Phase01OutputSchema`) | DB 저장 이전 타입·구조 무결성 보장 |
| 영속 계층 | Drizzle ORM → `phase_results` 테이블 (`phaseNumber: 1`) | Phase 결과 추적성·후속 Phase 참조 |
| API 계약 | POST `/api/agents/phase-01`, body `{ eventId, industry, preparationPeriod, eventScale }` | 후속 Phase가 동일 패턴으로 확장 |

---

## 5. 구현 대상 파일 (Files to Create)

| 파일 | 책임 |
| --- | --- |
| `lib/schemas/phase-01.schema.ts` | Zod 입력/출력 스키마 정의 (`Phase01InputSchema`, `Phase01OutputSchema`) |
| `lib/prompts/phase-01.system-prompt.ts` | AI 시스템 프롬프트 (한국어 MICE 전문가 역할) |
| `lib/agents/phase-01.ts` | 에이전트 로직 (`generateObject`, temperature 0.7) |
| `app/api/agents/phase-01/route.ts` | Next.js App Router POST 엔드포인트 |
| `app/event/[id]/phase-1/page.tsx` | 입력 폼 + 구조화 결과 표시 UI 페이지 |

> 상세 구현 절차는 `plan.md`를 참조한다. 함수 시그니처·클래스 구조 등 구현 세부는 Run 단계로 위임한다.

---

## 6. 제외 범위 (Exclusions — What NOT to Build)

[HARD] 본 SPEC은 다음을 **구현하지 않는다**. 이는 의도적 경계 설정이며, 별도 SPEC 또는 후속 작업으로 분리된다.

- **Phase 2~6 구현** — WBS, 디자인, 연사, 마케팅, ROI 단계는 각각 별도 SPEC으로 정의한다.
- **실시간 스트리밍 (streamObject)** — Phase 1은 `generateObject`(단일 응답)만 사용한다. `streamObject` 기반 스트리밍은 본 SPEC 범위 밖이다.
- **연사 섭외 로직** — 연사 리스트·초청 이메일 생성은 Phase 4 범위이다.
- **외부 트렌드 데이터 API 연동** — 실시간 트렌드 크롤링·외부 데이터 소스 연결은 하지 않는다. GPT-4o 내장 지식만 사용한다.
- **User Authentication** — 로그인·세션·권한 관리는 별도로 구현하며 본 SPEC에서 다루지 않는다.

---

## 7. MX Tag 계획 (MX Tag Plan)

| 대상 | MX Tag | 사유 |
| --- | --- | --- |
| `lib/agents/phase-01.ts` → `runPhase1()` | `@MX:ANCHOR` | fan_in 예상: API Route + 직접 호출 등 다수 호출 지점 |
| `lib/schemas/phase-01.schema.ts` → `Phase01OutputSchema` | `@MX:ANCHOR` | SSoT 계약. Phase 2~6 에이전트가 모두 참조하는 불변 계약 |
| `app/api/agents/phase-01/route.ts` | `@MX:NOTE` | SSoT(`event_master`) 생성 엔드포인트임을 명시 |

> `@MX:ANCHOR`는 불변 계약(invariant contract)을 가진 고-fan_in 함수에 부여한다. 스키마 변경은 후속 Phase에 파급되므로, `Phase01OutputSchema`는 변경 시 영향 분석이 필수임을 ANCHOR로 표시한다.

---

## 8. 의존성 및 참조 (Dependencies)

- **선행 SPEC**: 없음 (파이프라인 첫 단계)
- **후속 SPEC (예정)**: SPEC-AGENT-002 (Phase 2 WBS), SPEC-AGENT-003 (Phase 3 Design) 등 — 본 SPEC이 생성하는 `event_master` SSoT를 소비
- **DB 스키마 의존**: `events`, `phase_results` 테이블 (Drizzle ORM, `lib/db/schema.ts`)
- **프로젝트 컨텍스트**: `.moai/project/tech.md`(기술 스택), `.moai/project/structure.md`(구조), `ref/phase_01.md`(상세 설계서)
