# SPEC-PROMPT-001 구현 계획

**연관 SPEC:** [spec.md](./spec.md) · [acceptance.md](./acceptance.md)
**상태:** draft · **우선순위:** medium

---

## 1. 개요

Phase 5/6 데이터를 Gemini Canvas용 한국어 프롬프트로 변환하는 클라이언트 사이드 템플릿 조립 기능.
추가 LLM 호출 없이 순수 함수로 프롬프트를 생성하고, 모달에 표시하며, 클립보드 복사로 사용자가
Gemini Canvas에 붙여넣는다.

핵심 설계 결정:

- **순수 함수 분리:** 프롬프트 조립 로직(`prompt-builder.ts`)은 UI/네트워크와 독립된 순수 함수로,
  입력 데이터만 받아 문자열을 반환한다. 테스트 용이성과 결정성을 보장한다.
- **Lazy fetch:** Phase 1(및 brandMemory)은 버튼 클릭 시점에만 조회한다. 페이지 초기 로드 비용
  증가를 피한다.
- **재사용 우선:** 클립보드 복사는 기존 `CopyBtn` 패턴을, 액션 버튼은 기존 상단 영역을 재사용한다.

---

## 2. 기술 접근 방식

### 2.1 프롬프트 빌더 — `lib/canvas/prompt-builder.ts` (NEW)

두 개의 순수 함수를 export한다.

- `buildLandingPagePrompt(phase1, phase5, brand)` → `string`
  - 소스: `phase5.landingPageSections`, `phase1.eventNameKr/eventNameEn/slogan/coreKeywords/targetPersonas`,
    `brand.primaryColor/secondaryColors/designMood/fontStyle/visualKeywords`
  - 출력: 5개 섹션(행사 정보 / 비주얼 스타일 / 페이지 섹션 / 타깃 사용자 / 요청 사항)을 포함한
    한국어 프롬프트 (REQ-PROMPT-010, 012)
- `buildDashboardPrompt(phase1, phase6)` → `string`
  - 소스: `phase6.kpiPerformance/topStrengths/topWeaknesses/personaFeedbackLoop/nextEventRecommendations/executiveSummary`,
    `phase1.eventNameKr`
  - 출력: 6개 섹션(행사 개요 / KPI 지표 / 강점·약점 / 페르소나 성과 / 차기 권고 / 요청 사항)을 포함한
    한국어 프롬프트 (REQ-PROMPT-011, 012)

Graceful fallback: 누락 필드는 "미입력"으로 치환. brandMemory `null` 시 비주얼 스타일 섹션은
"미입력" 또는 생략 (REQ-PROMPT-015).

### 2.2 모달 — `components/CanvasPromptModal.tsx` (NEW)

- props: 표시할 프롬프트 문자열, 열림 상태, 닫기 핸들러
- 내용: 프롬프트 텍스트(읽기 전용 스크롤 영역) + 클립보드 복사 버튼("복사됨!" 피드백) +
  "Gemini Canvas에 붙여넣기" 안내 문구 (REQ-PROMPT-004, 008)
- 복사: 기존 `CopyBtn`의 `navigator.clipboard.writeText` 패턴 재사용

### 2.3 Phase 5 페이지 — `app/event/[id]/phase-5/page.tsx` (MODIFY)

- 상단 액션 영역에 "Canvas 랜딩페이지 프롬프트" 버튼 추가 (REQ-PROMPT-001)
- 클릭 핸들러: Phase 1 + brandMemory lazy fetch → `buildLandingPagePrompt()` → 모달 오픈
  (REQ-PROMPT-002, 003)
- Phase 5 미완료 시 버튼 disabled (REQ-PROMPT-005)

### 2.4 Phase 6 페이지 — `app/event/[id]/phase-6/page.tsx` (MODIFY)

- 상단 액션 영역에 "Canvas 대시보드 프롬프트" 버튼 추가 (REQ-PROMPT-006)
- 클릭 핸들러: Phase 1 lazy fetch → `buildDashboardPrompt()` → 모달 오픈 (REQ-PROMPT-007, 008)
- Phase 6 미완료 시 버튼 disabled (REQ-PROMPT-009)

### 2.5 brandMemory API — `app/api/brand-memory/route.ts` (NEW)

- `GET /api/brand-memory?eventId=` → `{ primaryColor, secondaryColors, designMood, fontStyle, visualKeywords } | null`
  (REQ-PROMPT-013)

---

## 3. 마일스톤 (우선순위 순서)

| 순서 | 마일스톤 | 산출물 | 커버 REQ |
|------|----------|--------|----------|
| M1 | 프롬프트 빌더 순수 함수 | `lib/canvas/prompt-builder.ts` | 010, 011, 012, 014, 015 |
| M2 | brandMemory 조회 API | `app/api/brand-memory/route.ts` | 013 |
| M3 | 공용 모달 컴포넌트 | `components/CanvasPromptModal.tsx` | 004, 008 |
| M4 | Phase 5 페이지 연결 | `app/event/[id]/phase-5/page.tsx` | 001, 002, 003, 005 |
| M5 | Phase 6 페이지 연결 | `app/event/[id]/phase-6/page.tsx` | 006, 007, 008, 009 |

의존성: M1은 독립. M2는 독립. M3은 M1 이후 통합 검증 유리. M4는 M1·M2·M3 완료 필요.
M5는 M1·M3 완료 필요(brandMemory 불필요).

---

## 4. 변경/생성 파일 목록

| 파일 | 유형 | 내용 |
|------|------|------|
| `lib/canvas/prompt-builder.ts` | NEW | `buildLandingPagePrompt()` + `buildDashboardPrompt()` 순수 함수 |
| `components/CanvasPromptModal.tsx` | NEW | 프롬프트 표시 모달 + 복사 버튼 + Canvas 안내 |
| `app/api/brand-memory/route.ts` | NEW | `GET /api/brand-memory?eventId=` 단건 조회 |
| `app/event/[id]/phase-5/page.tsx` | MODIFY | 랜딩페이지 프롬프트 버튼 + lazy fetch + 모달 연동 |
| `app/event/[id]/phase-6/page.tsx` | MODIFY | 대시보드 프롬프트 버튼 + lazy fetch + 모달 연동 |

---

## 5. 리스크 및 완화

| 리스크 | 영향 | 완화 |
|--------|------|------|
| brandMemory 저장 위치/형태가 예상과 다름 | M2 지연 | 구현 착수 전 실제 저장 위치(brandMemory 소스) 확인. 미확정 시 M2 우선 검증 |
| Phase 1 lazy fetch 실패 시 UX 저하 | 프롬프트 품질 저하 | REQ-PROMPT-015 "미입력" fallback으로 생성 지속 |
| 프롬프트가 지나치게 길어 모달 가독성 저하 | 사용성 | 모달 스크롤 영역 + 전체 복사 버튼으로 완화(요약 없이 원문 유지) |
| Gemini Canvas가 특정 포맷을 더 선호할 수 있음 | 결과 품질 편차 | 요청 사항 섹션에 명시적 지시(반응형·색상 규칙·한국어) 포함 |

---

## 6. MX 태그 대상

| 위치 | 태그 | 사유 |
|------|------|------|
| `prompt-builder.ts` `buildLandingPagePrompt`/`buildDashboardPrompt` | `@MX:ANCHOR` | 프롬프트 출력 계약 — 섹션 구성(5개/6개)이 Canvas 결과 품질을 좌우하는 불변 계약 |
| `app/api/brand-memory/route.ts` | `@MX:NOTE` | brandMemory 조회 소스와 null 반환 규칙 컨텍스트 |

---

## 7. 검증 방법

- **단위:** `prompt-builder.ts` 순수 함수 — 정상 입력 시 필수 섹션 포함, 누락 입력 시 "미입력" 표기
  검증 (결정적, 네트워크 불필요)
- **통합:** Phase 5/6 페이지에서 버튼 클릭 → 모달 표시 → 복사 동작 확인
- **API:** `GET /api/brand-memory?eventId=` 정상/부재(null) 응답 검증
- 상세 시나리오는 [acceptance.md](./acceptance.md) 참조.
