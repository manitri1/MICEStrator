# Phase 수정 워크플로우 개선 계획

## Context

PhaseChat(부분 편집)으로 결과를 수정하는 흐름이 사용자에게 모호하게 느껴짐.
구체적으로 4가지 UX 문제가 식별됨:

1. 상위 Phase 수정 후 하위 Phase에 반영 여부가 불명확
2. 배열 항목(페르소나·WBS 태스크·연사 등) 추가/삭제 불가
3. 오류 발생 시 기술적 메시지만 표시 (사용자 이해 불가)
4. 채팅 히스토리가 새로고침 시 사라짐

→ 이 4가지를 구현하여 워크플로우 명확성을 높인다.

> **현재 구현 완료 상태**: PhaseChat, ScreenshotCapture, PUT API, Phase 1~6 통합 모두 완료.
> 이 플랜은 그 위에 UX 개선 레이어를 추가하는 것.

---

## 개선 항목 및 구현 접근

### P1 — 하위 Phase 재실행 권장 배너

**목표**: Phase N을 편집하면 영향받는 하위 Phase 목록을 배너로 표시.

**Phase 영향 관계**:
```typescript
// app/api/phase-result/route.ts 에 추가
const PHASE_DOWNSTREAM: Record<number, number[]> = {
  1: [2, 3, 4, 5, 6],  // 기획 변경 → 모든 하위 영향
  2: [6],               // WBS 변경 → ROI 분석 영향
  3: [4, 5],            // 브랜드 변경 → 연사이메일·마케팅 영향
  4: [5, 6],            // 연사 변경 → 마케팅·ROI 영향
  5: [6],               // 마케팅 변경 → ROI 영향
  6: [],                // 마지막 Phase
}
```

**PUT 응답 구조 변경**:
```typescript
// 기존: { updated: PhaseOutput }
// 변경: { updated: PhaseOutput, affectedDownstream: number[] }
```

**신규 파일**: `components/PhaseStaleBanner.tsx`
```tsx
// props: affectedPhases: number[], onDismiss: () => void
// 표시: "Phase 1 수정이 Phase 3·4·5에 영향을 줍니다. 재실행을 권장합니다."
// 링크: 각 Phase 페이지로 이동 버튼
```

**수정 파일**:
- `app/api/phase-result/route.ts` — PUT 응답에 `affectedDownstream` 추가
- `components/PhaseChat.tsx` — `onApply(updated, affectedDownstream)` 시그니처 확장
- `app/event/[id]/phase-{1~6}/page.tsx` — `PhaseStaleBanner` 렌더링 (6개 모두)

---

### P2 — 배열 추가·삭제 지원 (deepMerge 확장)

**목표**: `$append`, `$remove` 연산자로 배열 항목을 추가·삭제.

**연산자 스펙**:
```typescript
// 추가: 배열 끝에 항목 삽입
{ "targetPersonas": { "$append": [{ name: "신규 페르소나", ... }] } }

// 삭제: 인덱스 기준 항목 제거
{ "wbsTasks": { "$remove": [2] } }  // 2번 인덱스 삭제
```

**deepMerge 확장** (`app/api/phase-result/route.ts` 내부):
```typescript
function deepMerge(existing: unknown, patch: unknown): unknown {
  // 기존 로직 유지
  // 추가: patch가 { $append: [...] } 형태면 배열 concat
  // 추가: patch가 { $remove: [n] } 형태면 해당 인덱스 filter out
}
```

**AI 시스템 프롬프트 업데이트** (`app/api/chat/phase-edit/route.ts`):
- `$append`, `$remove` 연산자 설명 추가
- "페르소나 추가" 요청 감지 시 `$append` 패치 생성 지시

**수정 파일**:
- `app/api/phase-result/route.ts` — deepMerge 함수 확장
- `app/api/chat/phase-edit/route.ts` — 시스템 프롬프트에 연산자 설명 추가

---

### P3 — 사용자 친화적 오류 메시지

**목표**: Zod 검증 오류, 배열 조작 불가 등을 한국어 친화적으로 표시.

**오류 변환 맵** (신규 `lib/phase-errors.ts`):
```typescript
const FRIENDLY_ERRORS: Record<string, string> = {
  'Invalid hex color': 'hex 색상 형식(#RRGGBB)으로 입력해주세요. 예: #1A5276',
  'Array length': '항목 수는 {min}~{max}개 사이여야 합니다',
  'Required': '필수 항목이 비어 있습니다',
}
```

**PUT 400 응답 개선** (`app/api/phase-result/route.ts`):
```typescript
// 기존: { error: zodError.message }
// 변경: { error: friendlyMessage, details: zodError.issues }
```

**채팅 AI 프롬프트 가이드 추가** (`app/api/chat/phase-edit/route.ts`):
```
배열 추가/삭제 요청 감지 시:
→ "$append/$remove 연산자 패치 생성" (P2 연동)
→ 또는 "Phase 재실행이 필요합니다" 안내 메시지 반환
```

**수정 파일**:
- 신규 `lib/phase-errors.ts` — 오류 변환 유틸
- `app/api/phase-result/route.ts` — 친화적 오류 응답
- `app/api/chat/phase-edit/route.ts` — 배열 조작 안내 프롬프트

---

### P4 — 채팅 히스토리 DB 저장

**목표**: PhaseChat 대화 기록을 DB에 저장해 새로고침 후에도 복원.

**신규 테이블** (`lib/db/schema.ts` 추가):
```typescript
export const phaseChatLogs = pgTable('phase_chat_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  phaseNumber: integer('phase_number').notNull(),
  messages: jsonb('messages').notNull(), // ChatMessage[]
  updatedAt: timestamp('updated_at').defaultNow(),
})
```

**신규 API** (`app/api/chat-logs/route.ts`):
- `GET ?eventId=&phase=` — 히스토리 로드
- `POST { eventId, phaseNumber, messages }` — 히스토리 저장 (전체 교체)

**PhaseChat 수정** (`components/PhaseChat.tsx`):
- mount 시 `GET /api/chat-logs` 호출 → 기존 메시지 복원
- 메시지 전송/수신 후 debounce(1s) → `POST /api/chat-logs` 저장

**수정 파일**:
- `lib/db/schema.ts` — `phaseChatLogs` 테이블 추가
- 신규 `app/api/chat-logs/route.ts` — GET/POST 핸들러
- `components/PhaseChat.tsx` — 히스토리 로드·저장 로직

---

## 수정 파일 목록

| 파일 | 변경 유형 | 개선 항목 |
|------|-----------|-----------|
| `app/api/phase-result/route.ts` | 수정 | P1 (downstream), P2 (deepMerge), P3 (오류) |
| `app/api/chat/phase-edit/route.ts` | 수정 | P2 (프롬프트), P3 (안내) |
| `components/PhaseChat.tsx` | 수정 | P1 (onApply 시그니처), P4 (히스토리) |
| `components/PhaseStaleBanner.tsx` | 신규 | P1 |
| `lib/phase-errors.ts` | 신규 | P3 |
| `lib/db/schema.ts` | 수정 | P4 |
| `app/api/chat-logs/route.ts` | 신규 | P4 |
| `app/event/[id]/phase-1/page.tsx` | 수정 | P1 (배너) |
| `app/event/[id]/phase-2/page.tsx` | 수정 | P1 (배너) |
| `app/event/[id]/phase-3/page.tsx` | 수정 | P1 (배너) |
| `app/event/[id]/phase-4/page.tsx` | 수정 | P1 (배너) |
| `app/event/[id]/phase-5/page.tsx` | 수정 | P1 (배너) |
| `app/event/[id]/phase-6/page.tsx` | 수정 | P1 (배너) |

---

## 검증 방법

```bash
npm run dev
```

**P1 검증**:
1. Phase 1 슬로건 수정 → 적용 → "Phase 2·3·4·5·6 재실행 권장" 배너 표시 확인
2. 배너의 Phase 링크 클릭 → 해당 Phase 페이지 이동 확인

**P2 검증**:
1. "페르소나 4번째 추가해줘" 입력 → `$append` 패치 생성 → 적용 후 페르소나 4개 확인
2. "첫 번째 WBS 태스크 삭제해줘" → `$remove: [0]` 패치 → 적용 후 태스크 감소 확인

**P3 검증**:
1. Phase 3에서 "색상을 파란색으로 변경해줘" → hex 패치 제안 확인
2. 수동으로 잘못된 hex 전송 시 한국어 오류 메시지 확인

**P4 검증**:
1. Phase 1 채팅에서 대화 후 새로고침 → 대화 기록 복원 확인
2. 다른 Phase로 이동 후 돌아왔을 때 기록 유지 확인
