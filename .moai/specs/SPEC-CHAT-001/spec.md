---
id: SPEC-CHAT-001
version: 1.0.0
status: completed
created: 2026-06-29
updated: 2026-06-29
author: MoAI
priority: high
issue_number: null
---

# SPEC-CHAT-001: Phase 채팅 편집 + 멀티모달 화면 검토

## HISTORY

- 2026-06-29 (v1.0.0): 최초 작성. PhaseChat 채팅 편집 패널 + ScreenshotCapture 멀티모달 화면 검토 기능 정의.

---

## 1. Environment (프로젝트 컨텍스트)

### 1.1 제품 배경

MICEstrator는 6단계(Phase 1~6) AI 기반 MICE 행사 기획 플랫폼이다. 각 Phase 페이지는
Client Component(`useState`)로 구성되며 다음 패턴을 따른다:

```
폼 입력 → POST /api/agents/phase-0X → 구조화된 JSON 출력 → phaseResults DB 저장 → 읽기 전용 표시
```

현재 한계:
1. Phase 결과의 부분 편집 불가 — 단일 필드 수정에도 Phase 전체를 재생성해야 함
2. 렌더링된 화면에 대한 AI 시각 검토 불가

본 SPEC은 다음 두 컴포넌트로 위 한계를 해결한다:
- **PhaseChat**: 각 Phase 결과 페이지에 접이식 채팅 패널을 추가하여 특정 필드를 자연어로 편집
- **ScreenshotCapture**: html2canvas로 현재 화면을 캡처하여 채팅에 이미지를 첨부, 멀티모달 AI 검토 수행

### 1.2 기술 스택 (프로젝트 헌법 정합)

| 항목 | 버전/라이브러리 | 비고 |
|------|----------------|------|
| 프레임워크 | Next.js 16 App Router, React 19, TypeScript 5.9 | 기존 |
| AI SDK | `@ai-sdk/openai` + `ai` (Vercel AI SDK) | 기존 설치 — `streamText()` + `useChat()` 사용 |
| UI | shadcn/ui + tailwindcss 4 | 기존 |
| 스크린샷 | `html2canvas` (npm) | **신규 의존성** |
| DB | Drizzle ORM + PostgreSQL (Supabase) | 기존 |

### 1.3 영향 받는 기존 자산 (재사용)

| 파일 | 역할 |
|------|------|
| `lib/schemas/phase-0X.schema.ts` | Zod 입출력 스키마 (출력 검증 재사용) |
| `lib/supabase/server.ts` | 서버 DB 접근 패턴 |
| `lib/db/schema.ts` | `phaseResults` + `brandMemory` 테이블 정의 |
| `app/api/phase-result/route.ts` | GET 핸들러 존재 — PUT 메서드 추가 대상 |
| `app/event/[id]/phase-3/route.ts` 외 | Phase 3의 `brandMemory` upsert(`onConflictDoUpdate`) 패턴 참고 |

### 1.4 신규 생성 파일

| 파일 | 역할 |
|------|------|
| `components/PhaseChat.tsx` | 접이식 채팅 편집 패널 (`useChat`) |
| `components/ScreenshotCapture.tsx` | html2canvas 캡처 + 이미지 첨부 UI |
| `lib/screenshot.ts` | html2canvas 래퍼 (캡처/PNG dataURL 변환) |
| `app/api/chat/phase-edit/route.ts` | 스트리밍 멀티모달 편집 API (`streamText`) |

### 1.5 수정 대상 파일

| 파일 | 변경 |
|------|------|
| `app/api/phase-result/route.ts` | PUT 메서드 추가 (patch merge 업데이트) |
| `app/event/[id]/phase-1/page.tsx` ~ `phase-6/page.tsx` | PhaseChat + ScreenshotCapture 삽입 |

---

## 2. Assumptions (가정)

| ID | 가정 | 신뢰도 | 위험(틀릴 경우) |
|----|------|--------|----------------|
| ASM-1 | `phaseResults.outputJson`(jsonb)은 부분 merge 업데이트가 안전하다 (동시 편집 충돌 없음 — 단일 사용자 기획 세션) | High | 동시 편집 시 최종 쓰기 승리(last-write-wins)로 일부 편집 유실 가능 |
| ASM-2 | 각 Phase의 `lib/schemas/phase-0X.schema.ts` `OutputSchema`는 편집 후 재검증의 SSoT로 충분하다 | High | 스키마와 실제 저장 JSON 구조 불일치 시 검증 실패 |
| ASM-3 | `@ai-sdk/openai`의 모델(gpt-4o 계열)은 이미지 입력(멀티모달)을 지원한다 | High | 멀티모달 미지원 모델 선택 시 ScreenshotCapture 검토 불가 |
| ASM-4 | html2canvas는 현재 shadcn/ui + tailwind 4 DOM을 동기 렌더 시점에 캡처 가능하다 (외부 폰트/이미지 CORS 허용) | Medium | oklch 색공간·외부 리소스로 캡처 누락/색 왜곡 발생 가능 |
| ASM-5 | AI가 반환한 편집 결과는 "전체 객체"가 아닌 "변경된 필드의 JSON patch(부분 객체)" 형태로 적용된다 | High | 전체 객체 반환 시 미편집 필드까지 덮어써 데이터 손실 |
| ASM-6 | Phase 3 편집은 `phaseResults`(phaseNumber=3)와 `brandMemory` 양쪽에 동기화되어야 한다 (Phase 4/5가 brandMemory를 자동 주입) | High | 동기화 누락 시 Phase 4/5가 구버전 브랜드 컨셉 참조 |
| ASM-7 | 사용자는 단일 행사(eventId) 컨텍스트 내에서 Phase 페이지를 순회하며 작업한다 | High | 멀티 행사 동시 편집 시 컨텍스트 혼선 |

---

## 3. Requirements (EARS 형식)

### 3.1 PhaseChat UI

| ID | 형식 | 요구사항 |
|----|------|---------|
| REQ-001 | WHERE | Phase 결과가 존재하는 각 Phase 페이지(1~6)에는 접이식 PhaseChat 패널이 존재해야 한다 |
| REQ-002 | WHEN | 사용자가 패널 토글 버튼을 클릭하면, 시스템은 채팅 패널을 펼치거나 접어야 한다 |
| REQ-003 | WHILE | 채팅 패널이 펼쳐진 동안, 시스템은 대화 메시지 목록과 입력창을 표시해야 한다 |
| REQ-004 | WHEN | 사용자가 편집 메시지를 전송하면, 시스템은 현재 Phase 번호, eventId, 현재 결과 JSON을 API 요청에 포함해야 한다 |

### 3.2 스트리밍 편집 API

| ID | 형식 | 요구사항 |
|----|------|---------|
| REQ-005 | WHEN | `/api/chat/phase-edit`가 호출되면, 시스템은 `streamText()`를 사용해 응답을 스트리밍해야 한다 |
| REQ-006 | SHALL | API는 멀티모달 입력(텍스트 + 선택적 이미지)을 수용해야 한다 |
| REQ-007 | SHALL | API는 AI에게 "변경된 필드만 포함한 JSON patch"를 반환하도록 지시해야 한다 |
| REQ-008 | IF | AI 응답이 대상 Phase의 `OutputSchema` 부분 검증을 통과하지 못하면, THEN 시스템은 해당 patch를 적용 가능 상태로 표시하지 않아야 한다 |

### 3.3 Diff 표시 및 적용

| ID | 형식 | 요구사항 |
|----|------|---------|
| REQ-009 | WHEN | AI가 편집 patch를 반환하면, 시스템은 변경 전/후 값을 diff 형태로 표시해야 한다 |
| REQ-010 | WHEN | 사용자가 diff를 "적용"하면, 시스템은 PUT `/api/phase-result`를 호출해 변경 필드를 merge 저장해야 한다 |
| REQ-011 | WHERE | 사용자가 diff를 적용하지 않은 상태에서는, 기존 화면 데이터가 변경되지 않아야 한다 |

### 3.4 PUT 엔드포인트 (patch merge)

| ID | 형식 | 요구사항 |
|----|------|---------|
| REQ-012 | WHEN | PUT `/api/phase-result`가 호출되면, 시스템은 기존 `outputJson`에 patch를 deep merge하여 갱신해야 한다 |
| REQ-013 | SHALL | PUT은 merge 결과를 대상 Phase의 `OutputSchema`로 재검증해야 한다 |
| REQ-014 | IF | 재검증이 실패하면, THEN 시스템은 저장을 거부하고 HTTP 400과 검증 오류를 반환해야 한다 |
| REQ-015 | WHEN | merge 저장이 성공하면, 시스템은 갱신된 전체 `outputJson`을 반환해야 한다 |

### 3.5 ScreenshotCapture + html2canvas

| ID | 형식 | 요구사항 |
|----|------|---------|
| REQ-016 | WHEN | 사용자가 "화면 캡처"를 클릭하면, 시스템은 html2canvas로 현재 Phase 결과 영역을 PNG dataURL로 캡처해야 한다 |
| REQ-017 | WHEN | 캡처가 완료되면, 시스템은 이미지를 다음 채팅 메시지에 첨부하여 멀티모달 검토 요청을 전송할 수 있어야 한다 |
| REQ-018 | WHEN | 이미지가 첨부된 메시지가 전송되면, AI는 이미지를 분석한 시각 검토 의견을 스트리밍 응답해야 한다 |

### 3.6 Phase 3 brandMemory 동기화

| ID | 형식 | 요구사항 |
|----|------|---------|
| REQ-019 | IF | 편집 대상이 Phase 3이고 patch가 brandMemory 필드(primaryColor, secondaryColors, designMood, fontStyle, visualKeywords)를 변경하면, THEN 시스템은 `brandMemory` 테이블에도 upsert 동기화해야 한다 |
| REQ-020 | SHALL | brandMemory 동기화는 `phaseResults` 갱신과 동일 요청 내에서 일관되게 수행되어야 한다 |

### 3.7 Phase별 컨텍스트 주입

| ID | 형식 | 요구사항 |
|----|------|---------|
| REQ-021 | WHERE | Phase 4 편집 요청 시, 시스템은 현재 열린 아코디언 인덱스와 활성 탭(email/slides)을 채팅 시스템 프롬프트에 주입해야 한다 |
| REQ-022 | WHERE | Phase 5 편집 요청 시, 시스템은 현재 활성 탭을 채팅 시스템 프롬프트에 주입해야 한다 |
| REQ-023 | SHALL | 각 Phase의 시스템 프롬프트는 해당 Phase의 편집 가능 필드 목록(아래 4절)을 명시하여 AI 편집 범위를 한정해야 한다 |

### 3.8 영속성

| ID | 형식 | 요구사항 |
|----|------|---------|
| REQ-024 | WHEN | 편집 적용 후 페이지를 새로고침하면, 시스템은 GET `/api/phase-result`로 갱신된 결과를 로드하여 편집 내용이 유지되어야 한다 |
| REQ-025 | WHILE | API 호출(스트리밍/저장)이 진행되는 동안, 시스템은 로딩 상태와 입력 비활성화를 유지해야 한다 |

---

## 4. Phase별 편집 가능 필드 (AI 편집 범위 한정 — REQ-023)

| Phase | 편집 가능 필드 |
|-------|---------------|
| **1 (Event Concept)** | eventNameKr, eventNameEn, slogan, subtitle, coreKeywords[], planningRationale, pestAnalysis.{political/economic/social/technological}, targetPersonas[N].{painPoints[], motivations[]} |
| **2 (WBS & Timeline)** | wbsTasks[N].{taskName, durationWeeks, priority}, milestones[N].{title, description}, departments[N].responsibilities[], criticalPath[] |
| **3 (Visual Identity)** | primaryColor, secondaryColors[], accentColor (hex), designMood, fontStyle, brandPersonality, canvaPrompt, midjourneyPrompt, visualKeywords[] — **brandMemory 동기화 필수** |
| **4 (Speaker Outreach)** | speakers[N].{emailSubject, emailBody, proposalSlides[].content}, campaignNotes — **컨텍스트: 아코디언 인덱스 + 활성 탭(email/slides)** |
| **5 (Marketing Assets)** | Instagram(caption, hashtags[], storyTextOverlay, imagePrompt), LinkedIn(headline, body, callToAction, hashtags[]), Email(emailSubjectLines[]), LandingPage(sections[N].{headline, subtext, cta}), Music(openingMusicPrompt), D-Day(ddaySchedule[N].{action, keyMessage}) — **컨텍스트: 활성 탭** |
| **6 (ROI & Post-Event)** | kpiDashboard.{budgetEfficiencyNote, businessRoiNote}, sentimentAnalysis.strengths[N].{finding, evidence}, sentimentAnalysis.weaknesses[N].finding, nextEventRecommendations[N].{actionItem, strategy}, personaValidation[N].evidence |

---

## 5. Exclusions (What NOT to Build)

- **신규 Phase 추가**: 기존 6 Phase 구조를 변경하거나 새 Phase를 만들지 않는다.
- **Phase 결과 전체 재생성**: PhaseChat은 부분 필드 편집만 수행하며, `/api/agents/phase-0X` 재호출(전체 재생성)을 대체하거나 호출하지 않는다.
- **편집 이력/버전 관리**: outputJson의 변경 이력 저장, 되돌리기(undo) 스택, 감사 로그는 범위 외다.
- **다중 사용자 실시간 협업**: 동시 편집 잠금, 실시간 동기화(WebSocket), 충돌 해결은 범위 외다 (단일 기획 세션 가정 — ASM-1).
- **인증/인가**: 편집 권한 검사, 사용자 역할 기반 접근 제어는 범위 외다.
- **이미지 영구 저장**: 캡처한 스크린샷을 Supabase Storage 등에 영구 저장하지 않는다 (요청-응답 1회성 멀티모달 입력으로만 사용).
- **html2canvas 외 캡처 엔진**: Puppeteer/서버사이드 렌더링 캡처, dom-to-image 등 대안 라이브러리는 범위 외다.
- **새 DB 테이블/컬럼**: 기존 `phaseResults`, `brandMemory` 스키마를 그대로 사용하며 마이그레이션을 추가하지 않는다.

---

## 6. Non-Functional Constraints (비기능 제약)

- **스트리밍 지연**: 편집 요청 전송 후 첫 토큰 스트리밍이 2초 이내 시작되어야 한다.
- **타입 안정성**: `tsc --noEmit` 0 오류를 유지해야 한다.
- **스키마 검증 일관성**: 모든 편집 적용은 기존 `lib/schemas/phase-0X.schema.ts`의 `OutputSchema`를 단일 검증 기준으로 사용해야 한다.
- **DOM 비파괴**: ScreenshotCapture는 캡처를 위해 화면 DOM을 변형하지 않아야 한다 (캡처 후 원상 복귀 보장).
