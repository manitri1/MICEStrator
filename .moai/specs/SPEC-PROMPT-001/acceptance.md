# SPEC-PROMPT-001 인수 기준

**연관 SPEC:** [spec.md](./spec.md) · [plan.md](./plan.md)

Given-When-Then 시나리오로 각 요구사항의 관찰 가능한 완료 조건을 정의한다.

---

## 1. 인수 시나리오 (Given-When-Then)

### AC-1 — Phase 5 완료 시 랜딩페이지 프롬프트 버튼 표시 및 클릭 (REQ-PROMPT-001, 002, 003)

- **Given** 현재 행사에 완료된 Phase 5 결과가 존재한다
- **When** 사용자가 Phase 5 페이지를 열고 "Canvas 랜딩페이지 프롬프트" 버튼을 클릭한다
- **Then** 시스템은 Phase 1 결과와 brandMemory를 lazy fetch하고, `buildLandingPagePrompt()`를 실행하여
  생성된 프롬프트를 `CanvasPromptModal`에 표시한다

### AC-2 — Phase 5 미완료 시 버튼 비활성화 (REQ-PROMPT-005)

- **Given** 현재 행사에 완료된 Phase 5 결과가 없다
- **When** 사용자가 Phase 5 페이지를 연다
- **Then** "Canvas 랜딩페이지 프롬프트" 버튼은 disabled 상태로 표시되어 클릭할 수 없다

### AC-3 — 랜딩페이지 프롬프트 5개 필수 섹션 포함 (REQ-PROMPT-010, 012)

- **Given** Phase 1·Phase 5·brandMemory 데이터가 모두 존재한다
- **When** `buildLandingPagePrompt(phase1, phase5, brand)`를 실행한다
- **Then** 반환된 한국어 프롬프트 문자열은 다음 5개 섹션을 모두 포함한다:
  (1) 행사 정보(행사명·슬로건·핵심 키워드), (2) 비주얼 스타일(기본/보조 컬러·디자인 무드·폰트·비주얼
  키워드), (3) 페이지 섹션(`landingPageSections` 전체), (4) 타깃 사용자, (5) 요청 사항

### AC-4 — Phase 6 완료 시 대시보드 프롬프트 버튼 표시 및 클릭 (REQ-PROMPT-006, 007, 008)

- **Given** 현재 행사에 완료된 Phase 6 결과가 존재한다
- **When** 사용자가 Phase 6 페이지를 열고 "Canvas 대시보드 프롬프트" 버튼을 클릭한다
- **Then** 시스템은 Phase 1 결과를 lazy fetch하고, `buildDashboardPrompt()`를 실행하여 생성된 프롬프트를
  복사 버튼이 포함된 `CanvasPromptModal`에 표시한다

### AC-5 — 대시보드 프롬프트 6개 필수 섹션 포함 (REQ-PROMPT-011, 012)

- **Given** Phase 1·Phase 6 데이터가 존재한다
- **When** `buildDashboardPrompt(phase1, phase6)`를 실행한다
- **Then** 반환된 한국어 프롬프트 문자열은 다음 6개 섹션을 모두 포함한다:
  (1) 행사 개요(행사명·총평), (2) 핵심 KPI 지표, (3) 강점/약점 분석, (4) 페르소나별 성과,
  (5) 차기 행사 권고, (6) 요청 사항

### AC-6 — 복사 버튼으로 전체 프롬프트 클립보드 복사 (REQ-PROMPT-004, 008)

- **Given** `CanvasPromptModal`이 프롬프트를 표시하고 있다
- **When** 사용자가 모달 내 복사 버튼을 클릭한다
- **Then** 프롬프트 전체 텍스트가 클립보드에 복사되고, 버튼에 "복사됨!" 피드백이 표시된다

### AC-7 — Phase 1 부재 시 graceful fallback (REQ-PROMPT-015)

- **Given** 현재 행사에 Phase 1 결과가 없거나 lazy fetch가 실패한다
- **When** 사용자가 랜딩페이지 또는 대시보드 프롬프트 버튼을 클릭한다
- **Then** 시스템은 프롬프트 생성을 중단하지 않으며, 누락된 필드(예: 행사명·슬로건)를 빈 문자열이 아닌
  "미입력"으로 표기한 프롬프트를 생성해 모달에 표시한다

### AC-8 — brandMemory 조회 API (REQ-PROMPT-013)

- **Given** 유효한 `eventId`가 주어진다
- **When** `GET /api/brand-memory?eventId=<id>` 요청이 수신된다
- **Then** brandMemory가 존재하면 `{ primaryColor, secondaryColors, designMood, fontStyle, visualKeywords }`를
  반환하고, 존재하지 않으면 `null`을 반환한다

---

## 2. 엣지 케이스

| # | 상황 | 기대 동작 |
|---|------|-----------|
| E1 | brandMemory는 없으나 Phase 1·5는 존재 | 랜딩페이지 프롬프트 정상 생성, 비주얼 스타일 섹션은 "미입력" 표기 또는 생략 (REQ-PROMPT-015) |
| E2 | `landingPageSections`가 최소치(3개)만 존재 | 3개 섹션이 프롬프트 페이지 섹션 블록에 모두 포함됨 |
| E3 | `landingPageSections`의 `cta`가 `null` | 해당 섹션 CTA는 "없음"으로 표기 |
| E4 | `kpiPerformance.businessRoiNote`가 `null` | 대시보드 프롬프트에서 비즈니스 ROI 줄 생략 |
| E5 | `personaFeedbackLoop`의 `painPointResolved`가 false | 해당 페르소나는 "목표 미달"로 표기 |
| E6 | 클립보드 API 사용 불가(권한 거부 등) | 복사 실패를 사용자에게 알리되 모달은 유지(프롬프트는 여전히 수동 선택·복사 가능) |
| E7 | Phase 5는 완료되었으나 Phase 1이 없음 | AC-7 fallback 적용 — "미입력" 표기로 랜딩페이지 프롬프트 생성 |

---

## 3. 품질 게이트 (TRUST 5)

- **Tested:** `prompt-builder.ts` 순수 함수 단위 테스트 — AC-3, AC-5, AC-7 및 엣지 케이스 E2~E5 커버.
  브라우저 API 의존 없이 결정적 검증. 커버리지 85% 이상.
- **Readable:** 함수/변수 영어 네이밍, 프롬프트 템플릿의 섹션 경계 명확화. 코드 주석은 한국어
  (프로젝트 `code_comments: ko`).
- **Unified:** 기존 `CopyBtn`/`ContentBlock` 패턴 및 상단 액션 버튼 영역과 일관. eslint 통과.
- **Secured:** `GET /api/brand-memory`는 `eventId` 입력 검증. 추가 LLM 호출·외부 전송 없음(REQ-PROMPT-014).
- **Trackable:** 커밋 메시지에 SPEC-PROMPT-001 참조. `prompt-builder.ts`에 @MX:ANCHOR 부여.

---

## 4. Definition of Done

- [ ] `lib/canvas/prompt-builder.ts` — 두 순수 함수 구현, 필수 섹션(5개/6개) 및 "미입력" fallback 반영
- [ ] `components/CanvasPromptModal.tsx` — 프롬프트 표시 + 복사 버튼("복사됨!") + Canvas 안내
- [ ] `app/api/brand-memory/route.ts` — `GET` 핸들러, 부재 시 `null` 반환
- [ ] `app/event/[id]/phase-5/page.tsx` — 버튼(disabled 로직 포함) + lazy fetch + 모달 연동
- [ ] `app/event/[id]/phase-6/page.tsx` — 버튼(disabled 로직 포함) + lazy fetch + 모달 연동
- [ ] AC-1 ~ AC-8 모든 인수 시나리오 통과
- [ ] 엣지 케이스 E1 ~ E7 처리 확인
- [ ] TRUST 5 품질 게이트 통과 (커버리지 85% 이상, lint 0 오류)
- [ ] 추가 LLM 호출·프롬프트 저장·Canvas 직접 연동 없음(Exclusions 준수) 확인
