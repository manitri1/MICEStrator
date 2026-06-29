# 사용성 개선 계획: 페이즈 채팅 편집 + 멀티모달 리뷰

## Context

MICEstrator는 현재 **폼 입력 → AI 실행 → 읽기 전용 결과 표시** 패턴으로 동작한다. 각 페이즈 결과는 정적 텍스트 카드로 표시되며, 내용을 수정하려면 폼을 다시 제출해야 한다. 이는 두 가지 UX 문제를 만든다:

1. 결과의 일부분만 수정하고 싶어도 전체 페이즈를 재실행해야 함
2. 화면에 렌더링된 결과를 AI가 직접 보고 피드백을 줄 수 없음

모든 6개 페이즈 페이지는 `'use client'` Client Component이며 `useState`로 결과를 관리한다.
현재 PUT/PATCH API 엔드포인트가 없어 결과를 저장한 후 수정 불가능하다.

---

## 구현 범위

### 1. 공통 인프라 (신규)

**`components/PhaseChat.tsx`** — 모든 페이즈에서 재사용하는 채팅 패널
- Vercel AI SDK `useChat()` hook 사용
- Props: `phaseNumber`, `eventId`, `currentOutput` (현재 페이즈 JSON)
- 스트리밍 응답 → diff 카드 표시 → "적용" / "취소"

**`components/ScreenshotCapture.tsx`** — 화면 캡처 + 채팅 연동
- `html2canvas`로 DOM → base64 PNG
- 캡처 후 자동으로 PhaseChat에 이미지 첨부

**`lib/screenshot.ts`** — html2canvas 래퍼

**`app/api/chat/phase-edit/route.ts`** — 멀티모달 스트리밍 편집 API
- 입력: `{ eventId, phaseNumber, currentOutput, messages[], imageBase64? }`
- 시스템 프롬프트에 현재 `outputJson` 주입
- `streamText()` (Vercel AI SDK) — 이미지 첨부 시 멀티모달 메시지
- 응답 형식: "변경할 필드명과 새 값" JSON patch + 설명 텍스트

**`app/api/phase-result/route.ts`** — PUT 메서드 추가
- 기존 GET 엔드포인트에 PUT 추가
- `phaseResults.outputJson` 병합 업데이트 (전체 교체 아닌 patch)

**의존성 추가**: `html2canvas` (npm)

---

### 2. 페이즈별 적용 항목

#### Phase 1 — 행사 컨셉 기획

**편집 가능 항목 (채팅으로 수정 가능)**:
- `eventNameKr` / `eventNameEn` — 행사명 수정
- `slogan` / `subtitle` — 슬로건 변경
- `coreKeywords[]` — 키워드 추가/제거
- `planningRationale` — 기획 배경 보완
- `pestAnalysis.political/economic/social/technological` — 개별 분석 수정
- `targetPersonas[].painPoints[]` / `.motivations[]` — 페르소나 세부 수정

**멀티모달 리뷰 포인트**: PEST 분석 4개 카드 배치 / 페르소나 아코디언 내용 검토

---

#### Phase 2 — WBS & 역할 분담

**편집 가능 항목**:
- `wbsTasks[].taskName` — 개별 업무명 변경
- `wbsTasks[].durationWeeks` — 기간 조정
- `wbsTasks[].priority` — 우선순위 변경 (high/medium/low)
- `milestones[].title` / `.description` — 마일스톤 설명 수정
- `departments[].responsibilities[]` — 부서 책임 사항 추가/수정
- `criticalPath[]` — 임계 경로 재정의

**멀티모달 리뷰 포인트**: WBS 테이블 전체 흐름 시각적 검토, 임계 경로(빨간 행) 적절성 확인

---

#### Phase 3 — 비주얼 아이덴티티 & 브랜드

**편집 가능 항목**:
- `primaryColor` / `secondaryColors[]` / `accentColor` — 색상 HEX 수정
- `designMood` / `fontStyle` — 디자인 톤 변경
- `brandPersonality` — 브랜드 개성 텍스트 수정
- `canvaPrompt` / `midjourneyPrompt` — AI 이미지 프롬프트 개선
- `visualKeywords[]` — 시각 키워드 교체

> **중요**: Phase 3 결과는 `brandMemory` 테이블에도 저장됨 → 채팅 편집 후 적용 시 `brandMemory`도 동기 업데이트 필요

**멀티모달 리뷰 포인트**: 그라디언트 컬러 팔레트 막대 시각적 조화 검토, 전체 브랜드 카드 레이아웃

---

#### Phase 4 — 연사 소싱 & 초청

**편집 가능 항목** (연사별 탭 구조에 맞춰):
- `speakers[N].emailSubject` / `.emailBody` — 초청 이메일 전문 수정
- `speakers[N].proposalSlides[].content` — PPT 슬라이드 내용 개선
- `speakers[N].selectionRationale` — 선정 근거 보완
- `campaignNotes` — 캠페인 전략 노트 수정

**채팅 컨텍스트 핵심**: 어느 연사(N번째)의 어느 탭(email/slides)을 열고 있는지를 컨텍스트로 주입 → "이 이메일을 더 격식 있게 고쳐줘" 자연스럽게 동작

**멀티모달 리뷰 포인트**: 현재 열린 연사의 이메일/슬라이드 전체 내용 시각 검토

---

#### Phase 5 — 디지털 에셋 & 마케팅

**편집 가능 항목** (6탭 구조에 맞춰):
- **Instagram**: `caption`, `hashtags[]`, `storyTextOverlay`, `imagePrompt`
- **LinkedIn**: `headline`, `body`, `callToAction`, `hashtags[]`
- **Email**: `emailSubjectLines[]` (개별 추가/수정)
- **Landing Page**: `sections[N].headline` / `.subtext` / `.cta` — 섹션별 카피 수정
- **Music**: `openingMusicPrompt` — Suno/Udio 프롬프트 개선
- **D-Day Schedule**: `ddaySchedule[N].action` / `.keyMessage` — 일정별 액션 수정

**채팅 컨텍스트 핵심**: 현재 열린 탭 정보를 PhaseChat에 props로 전달 → "인스타그램 캡션을 더 감성적으로" 동작

**멀티모달 리뷰 포인트**: 랜딩페이지 섹션 전체 카피 흐름 시각 검토, 인스타그램/링크드인 카드 느낌 비교

---

#### Phase 6 — 사후 관리 & ROI 측정

**편집 가능 항목**:
- `kpiDashboard.budgetEfficiencyNote` / `.businessRoiNote` — KPI 코멘트 수정
- `sentimentAnalysis.strengths[].finding` / `.evidence` — 강점 근거 보완
- `sentimentAnalysis.weaknesses[].finding` — 약점 설명 개선
- `nextEventRecommendations[].actionItem` / `.strategy` — 추천 전략 수정
- `personaValidation[].evidence` — 검증 근거 텍스트 수정

**멀티모달 리뷰 포인트**: 4탭 KPI/감정분석/페르소나/추천 전체 레이아웃, 데이터 시각화 적절성

---

### 3. UI 배치 계획

```
[페이즈 결과 페이지]
┌──────────────────────────────────────────────────┐
│ 기존 결과 카드들 (Phase 1 Output, Phase 2 WBS…) │
│                                 [📷 화면 리뷰]   │ ← 우측 하단 플로팅 버튼
└──────────────────────────────────────────────────┘
                    ↕ [💬 결과 수정하기] 버튼 토글
┌──────────────────────────────────────────────────┐
│ PhaseChat Panel                                   │
│ ┌────────────────────────────────────────────┐   │
│ │ 🤖 결과를 수정하고 싶은 내용을 말씀해주세요 │   │
│ │ 👤 슬로건을 영어로도 추가해줘               │   │
│ │ 🤖 ─── 변경 제안 ──────────────────────── │   │
│ │    slogan_en: "Leading the AI Era"          │   │
│ │    [✅ 적용] [❌ 취소]                      │   │
│ └────────────────────────────────────────────┘   │
│ [입력창________________] [📷 화면 첨부] [전송]    │
└──────────────────────────────────────────────────┘
```

---

### 4. 데이터 흐름 (신규)

```
[채팅 편집 흐름]
사용자 메시지
  → POST /api/chat/phase-edit
       currentOutput: phaseResults.outputJson (현재 데이터)
       messages: 채팅 히스토리
       imageBase64?: 스크린샷 첨부 시
  → streamText() — 변경 필드 + 새 값 JSON 응답
  → 클라이언트: 변경 diff 파싱 → 카드 표시
  → "적용" 클릭
       → PUT /api/phase-result { eventId, phaseNumber, patch: {...} }
       → DB: phaseResults.outputJson 병합 업데이트
       → Phase 3 인 경우: brandMemory도 동기 업데이트
  → 로컬 state 업데이트 → 결과 카드 즉시 반영

[멀티모달 리뷰 흐름]
"📷 화면 리뷰" 버튼 클릭
  → html2canvas(document.body) → base64 PNG
  → PhaseChat 자동 메시지: "이 화면을 검토해줘" + imageBase64
  → POST /api/chat/phase-edit (imageBase64 포함)
  → GPT-4o vision: 시각적 레이아웃 + 내용 분석
  → 채팅창에 피드백 표시 (일반 텍스트 + 필요시 diff 제안)
```

---

## 수정 대상 파일 목록

| 파일 | 변경 유형 | 내용 |
|------|-----------|------|
| `components/PhaseChat.tsx` | 신규 | 채팅 UI, useChat, diff 표시, 적용 버튼 |
| `components/ScreenshotCapture.tsx` | 신규 | html2canvas 캡처, PhaseChat 연동 |
| `lib/screenshot.ts` | 신규 | html2canvas 래퍼 유틸 |
| `app/api/chat/phase-edit/route.ts` | 신규 | 스트리밍 편집 API (멀티모달 지원) |
| `app/api/phase-result/route.ts` | 수정 | PUT 메서드 추가 (outputJson patch 업데이트) |
| `app/event/[id]/phase-1/page.tsx` | 수정 | PhaseChat + ScreenshotCapture 삽입, activeTab props 전달 |
| `app/event/[id]/phase-2/page.tsx` | 수정 | 동일 |
| `app/event/[id]/phase-3/page.tsx` | 수정 | 동일 + brandMemory 동기화 처리 |
| `app/event/[id]/phase-4/page.tsx` | 수정 | 동일 + openIndex/activeTab[i] 컨텍스트 전달 |
| `app/event/[id]/phase-5/page.tsx` | 수정 | 동일 + activeTab 컨텍스트 전달 |
| `app/event/[id]/phase-6/page.tsx` | 수정 | 동일 |
| `package.json` | 수정 | html2canvas 의존성 추가 |

---

## 재사용할 기존 코드

- `@ai-sdk/openai` + `ai` — 이미 설치됨 → `streamText()` / `useChat()` 활용
- `lib/schemas/phase-0X.ts` — 각 페이즈 Zod 스키마 → 편집 결과 검증에 재사용
- `app/api/phase-result/route.ts` — 기존 GET 패턴 참조해 PUT 추가
- `lib/supabase/` — DB 접근 패턴 동일하게 사용
- `lib/db/schema.ts` — `phaseResults` 테이블 구조 + `brandMemory` 구조

---

## 검증 방법

1. `npm run dev` 실행
2. Phase 1 결과 생성 후 "결과 수정하기" 버튼으로 채팅 패널 열기
3. "슬로건을 더 간결하게 수정해줘" 입력 → 스트리밍 응답 + diff 카드 확인
4. "적용" 클릭 → 결과 카드 즉시 반영 + 새로고침 후 유지 확인 (DB 저장)
5. "📷 화면 리뷰" 클릭 → 스크린샷 캡처 후 채팅 이미지 첨부 확인
6. AI 시각적 피드백 응답 내용 확인
7. Phase 3 수정 후 brandMemory 동기화 확인 (Phase 4/5 페이지에서 반영 여부)
8. Phase 4 특정 연사 이메일 탭 열린 상태에서 수정 요청 → 해당 연사만 업데이트 확인
