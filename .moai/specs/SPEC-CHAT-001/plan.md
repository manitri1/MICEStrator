---
id: SPEC-CHAT-001
type: plan
version: 1.0.0
updated: 2026-06-29
---

# SPEC-CHAT-001 구현 계획

## 1. 구현 철학

- **인프라 우선**: 공용 유틸·API·스키마 검증을 먼저 안정화한 뒤 Phase 페이지에 주입한다.
- **patch merge 원칙**: AI와 UI는 항상 "변경 필드만" 주고받는다 (ASM-5). 전체 객체 교체를 금지한다.
- **단일 검증 기준**: 모든 저장 경로는 기존 `OutputSchema`로 재검증한다 (ASM-2, REQ-013).
- **brandMemory 일관성**: Phase 3 편집은 `phaseResults`와 `brandMemory`를 동일 트랜잭션 경로에서 동기화한다 (ASM-6, REQ-019/020).

## 2. Phase 분해 (Infrastructure → Phase pages → Testing)

### Stage A — 인프라 (우선순위 High)

선행 의존성 없는 공용 자산을 먼저 구축한다. 이 단계가 모든 Phase 페이지의 토대다.

| 순서 | 파일 | 작업 | 근거 |
|------|------|------|------|
| A-1 | `package.json` | `html2canvas` npm 설치 | REQ-016 캡처의 신규 의존성. 모든 후속 캡처 작업의 전제 |
| A-2 | `lib/screenshot.ts` | html2canvas 래퍼: DOM ref → PNG dataURL 변환, 캡처 후 원상 복귀 | REQ-016. ScreenshotCapture가 의존하는 순수 유틸 — UI보다 먼저 |
| A-3 | `app/api/phase-result/route.ts` | PUT 메서드 추가 (deep merge + OutputSchema 재검증 + Phase 3 brandMemory upsert) | REQ-012~015, REQ-019/020. 저장 경로 단일화 — 채팅 API보다 먼저 안정화 |
| A-4 | `app/api/chat/phase-edit/route.ts` | `streamText()` 멀티모달 스트리밍 API, Phase별 시스템 프롬프트 + 편집 필드 한정 | REQ-005~008, REQ-018, REQ-023. PhaseChat이 호출하는 백엔드 |

### Stage B — 클라이언트 컴포넌트 (우선순위 High)

인프라 위에 재사용 가능한 컴포넌트를 만든다.

| 순서 | 파일 | 작업 | 근거 |
|------|------|------|------|
| B-1 | `components/ScreenshotCapture.tsx` | 캡처 버튼 + 미리보기 + 첨부 콜백 (`lib/screenshot.ts` 사용) | REQ-016/017. PhaseChat 내부에서 합성됨 — 먼저 구현 |
| B-2 | `components/PhaseChat.tsx` | 접이식 패널, `useChat`, diff 표시, 적용→PUT 호출, ScreenshotCapture 합성, Phase별 컨텍스트 prop 수용 | REQ-001~004, REQ-009~011, REQ-021/022, REQ-024/025 |

### Stage C — Phase 페이지 주입 (우선순위 Medium, 다중 파일 분해)

[HARD] 6개 파일 수정 — Multi-File Decomposition 적용. Phase별 컨텍스트 prop이 다르므로 개별 처리.

| 순서 | 파일 | 주입 컨텍스트 prop | 근거 |
|------|------|-------------------|------|
| C-1 | `app/event/[id]/phase-1/page.tsx` | phase=1, eventId, 현재 결과 JSON | 컨텍스트 단순 — 패턴 검증용 첫 적용 |
| C-2 | `app/event/[id]/phase-2/page.tsx` | phase=2 | C-1 패턴 재사용 |
| C-3 | `app/event/[id]/phase-3/page.tsx` | phase=3 (brandMemory 동기 대상 — PUT가 처리, 페이지는 prop만 전달) | REQ-019 경로 검증 |
| C-4 | `app/event/[id]/phase-4/page.tsx` | phase=4 + 활성 아코디언 인덱스 + 활성 탭(email/slides) | REQ-021 |
| C-5 | `app/event/[id]/phase-5/page.tsx` | phase=5 + 활성 탭 | REQ-022 |
| C-6 | `app/event/[id]/phase-6/page.tsx` | phase=6 | 컨텍스트 단순 |

### Stage D — 테스트/검증 (우선순위 High)

| 순서 | 작업 | 근거 |
|------|------|------|
| D-1 | PUT merge + 재검증 단위 테스트 (정상 patch, 스키마 위반 patch) | REQ-012~015 |
| D-2 | Phase 3 brandMemory 동기화 통합 테스트 | REQ-019/020, ASM-6 |
| D-3 | 스트리밍 API 멀티모달 입력 테스트 (텍스트 / 텍스트+이미지) | REQ-005/006/018 |
| D-4 | 새로고침 영속성 E2E (편집 적용 → reload → 유지) | REQ-024 |
| D-5 | `tsc --noEmit` 0 오류 확인 | 비기능 제약 |

## 3. 파일별 구현 순서 근거 요약

```
A-1 html2canvas 설치
  └─ A-2 lib/screenshot.ts ──────────┐
A-3 PUT /api/phase-result ───────┐   │
A-4 POST /api/chat/phase-edit ───┤   │
                                 ▼   ▼
                       B-1 ScreenshotCapture
                                 ▼
                       B-2 PhaseChat ──────► C-1..C-6 Phase 페이지 주입 ──► D 테스트
```

- 인프라(A)는 컴포넌트(B)의 의존성이므로 선행한다.
- 컴포넌트(B)는 페이지(C)의 의존성이므로 선행한다.
- ScreenshotCapture(B-1)는 PhaseChat(B-2)에 합성되므로 먼저 만든다.

## 4. 기술적 접근

### 4.1 PUT patch merge
- 기존 `outputJson`을 DB에서 로드 → 입력 patch와 deep merge → 대상 Phase `OutputSchema.safeParse` 재검증 → 성공 시 갱신.
- Phase 3인 경우 merge 결과에서 brandMemory 필드를 추출해 `onConflictDoUpdate` upsert (기존 phase-03 route 패턴 재사용).

### 4.2 스트리밍 멀티모달 API
- Vercel AI SDK `streamText()` + 메시지 parts(텍스트 + image)로 멀티모달 구성.
- 시스템 프롬프트에 Phase별 편집 가능 필드 목록 + Phase별 런타임 컨텍스트(아코디언/탭) 주입.
- AI에게 "변경 필드만 포함한 JSON patch" 반환을 지시.

### 4.3 PhaseChat diff/적용
- `useChat`로 스트리밍 수신 → patch 파싱 → 변경 전(현재 결과)/후(patch) diff 렌더 → "적용" 시 PUT 호출 → 성공 응답으로 화면 상태 갱신.

## 5. 위험 요인 및 완화

| 위험 | 영향 | 완화 |
|------|------|------|
| **brandMemory 동기화 누락/불일치** (ASM-6) | Phase 4/5가 구버전 브랜드 컨셉 참조 | PUT 내부에서 phaseResults 갱신과 brandMemory upsert를 동일 경로에서 수행; D-2 통합 테스트로 검증 |
| **html2canvas DOM 복잡도** (ASM-4) | tailwind 4 oklch 색공간·외부 폰트/이미지 CORS로 캡처 누락/색 왜곡 | 캡처 대상을 결과 영역 ref로 한정; `useCORS`/`allowTaint` 옵션 검토; 캡처 실패 시 graceful 에러 메시지 |
| **AI가 전체 객체 반환** (ASM-5) | 미편집 필드 덮어쓰기 → 데이터 손실 | 시스템 프롬프트로 patch-only 강제 + PUT의 deep merge로 누락 필드 보존 |
| **부분 patch 스키마 검증 실패** (ASM-2) | 유효하지 않은 편집 저장 | merge 후 전체 객체를 `OutputSchema`로 재검증, 실패 시 400 거부 (REQ-014) |
| **동시 편집 last-write-wins** (ASM-1) | 일부 편집 유실 | 범위 외(Exclusions)로 명시; 단일 세션 가정 문서화 |

## 6. 의존성

- **신규 npm 패키지**: `html2canvas` (A-1에서 설치)
- **기존 설치 활용**: `@ai-sdk/openai`, `ai`, Drizzle ORM, shadcn/ui (추가 설치 불필요)
- **DB 마이그레이션**: 없음 (기존 `phaseResults`, `brandMemory` 스키마 그대로 사용)

## 7. MX 태그 계획

- `lib/screenshot.ts` 캡처 함수 → `@MX:NOTE` (html2canvas CORS·DOM 복귀 주의)
- PUT 핸들러(deep merge + 재검증) → `@MX:ANCHOR` (모든 편집 저장의 단일 진입점, fan_in 높음) + `@MX:REASON`
- Phase 3 brandMemory upsert 분기 → `@MX:WARN` (동기화 누락 시 Phase 4/5 영향) + `@MX:REASON`
- `streamText` 멀티모달 라우트 → `@MX:NOTE` (Phase별 컨텍스트 주입 계약)
