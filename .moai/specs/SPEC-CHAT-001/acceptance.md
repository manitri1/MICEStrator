---
id: SPEC-CHAT-001
type: acceptance
version: 1.0.0
updated: 2026-06-29
---

# SPEC-CHAT-001 수용 기준

Given-When-Then 시나리오. 각 시나리오는 본문 REQ ID에 매핑된다.

## 1. PhaseChat 패널 토글 (REQ-001, REQ-002, REQ-003)

### AC-1: 패널 펼치기/접기
- **Given** Phase 1 결과가 표시된 페이지에서
- **When** 사용자가 PhaseChat 토글 버튼을 클릭하면
- **Then** 채팅 패널이 펼쳐지고 메시지 목록과 입력창이 표시된다
- **And** 다시 클릭하면 패널이 접힌다

### AC-2: 결과 미존재 시 비표시
- **Given** Phase 결과가 아직 생성되지 않은 페이지에서
- **When** 페이지가 렌더링되면
- **Then** PhaseChat 패널이 표시되지 않는다 (편집 대상 부재)

## 2. 스트리밍 편집 응답 (REQ-004, REQ-005, REQ-006, REQ-007)

### AC-3: 편집 요청 스트리밍
- **Given** Phase 1 결과(slogan="기존 슬로건")가 로드된 상태에서
- **When** 사용자가 "슬로건을 더 임팩트 있게 바꿔줘"를 전송하면
- **Then** 요청 바디에 phase=1, eventId, 현재 결과 JSON이 포함된다
- **And** 응답이 `streamText()`로 스트리밍되며 변경 필드만 포함한 JSON patch를 반환한다

### AC-4: 첫 토큰 스트리밍 성능
- **Given** 편집 요청을 전송한 상태에서
- **When** 서버가 응답을 시작하면
- **Then** 첫 토큰이 2초 이내에 스트리밍되기 시작한다

## 3. Diff 표시 및 적용 (REQ-008, REQ-009, REQ-010, REQ-011)

### AC-5: diff 표시
- **Given** AI가 `{ "slogan": "세상을 바꾸는 한 걸음" }` patch를 반환했을 때
- **When** 응답이 완료되면
- **Then** "기존 슬로건" → "세상을 바꾸는 한 걸음" 변경이 diff로 표시된다
- **And** 사용자가 적용하기 전까지 화면의 기존 slogan 값은 변경되지 않는다 (REQ-011)

### AC-6: 스키마 위반 patch 비적용
- **Given** AI가 `OutputSchema` 부분 검증을 통과하지 못하는 patch를 반환했을 때
- **When** 응답이 완료되면
- **Then** 해당 patch는 "적용 가능" 상태로 표시되지 않는다 (REQ-008)

### AC-7: diff 적용 → PUT 호출
- **Given** 적용 가능한 diff가 표시된 상태에서
- **When** 사용자가 "적용"을 클릭하면
- **Then** PUT `/api/phase-result`가 변경 필드 patch와 함께 호출된다

## 4. PUT patch merge 엔드포인트 (REQ-012, REQ-013, REQ-014, REQ-015)

### AC-8: deep merge 저장
- **Given** `outputJson`에 slogan, subtitle, coreKeywords가 존재할 때
- **When** PUT가 `{ "slogan": "새 슬로건" }` patch로 호출되면
- **Then** slogan만 갱신되고 subtitle·coreKeywords는 보존된다
- **And** 갱신된 전체 `outputJson`이 반환된다 (REQ-015)

### AC-9: 재검증 실패 거부
- **Given** merge 결과가 대상 Phase `OutputSchema` 검증에 실패하는 patch가 주어졌을 때
- **When** PUT가 호출되면
- **Then** 저장이 거부되고 HTTP 400과 검증 오류가 반환된다 (REQ-014)
- **And** DB의 기존 `outputJson`은 변경되지 않는다

## 5. ScreenshotCapture + 멀티모달 (REQ-016, REQ-017, REQ-018)

### AC-10: 화면 캡처
- **Given** Phase 3 결과 화면이 렌더링된 상태에서
- **When** 사용자가 "화면 캡처"를 클릭하면
- **Then** html2canvas가 결과 영역을 PNG dataURL로 캡처한다
- **And** 캡처 후 화면 DOM은 원상 복귀된다 (비기능 제약)

### AC-11: 멀티모달 검토 응답
- **Given** 캡처 이미지가 채팅 메시지에 첨부된 상태에서
- **When** "이 디자인 색 조합이 어때?" 메시지를 전송하면
- **Then** 이미지가 멀티모달 입력으로 API에 전달된다
- **And** AI가 이미지를 분석한 시각 검토 의견을 스트리밍 응답한다 (REQ-018)

## 6. Phase 3 brandMemory 동기화 (REQ-019, REQ-020)

### AC-12: brandMemory upsert
- **Given** Phase 3 결과(primaryColor="#1A2B3C")가 저장된 상태에서
- **When** 사용자가 primaryColor를 "#FF5733"으로 편집·적용하면
- **Then** `phaseResults`(phaseNumber=3)의 primaryColor가 갱신된다
- **And** `brandMemory` 테이블의 해당 eventId primaryColor도 "#FF5733"으로 upsert 동기화된다 (동일 요청 내 — REQ-020)

### AC-13: 비brandMemory 필드 편집은 동기화 미발생
- **Given** Phase 3 결과가 저장된 상태에서
- **When** 사용자가 canvaPrompt(brandMemory 비대상 필드)만 편집·적용하면
- **Then** `phaseResults`만 갱신되고 `brandMemory`는 불필요하게 변경되지 않는다

## 7. Phase별 컨텍스트 주입 (REQ-021, REQ-022, REQ-023)

### AC-14: Phase 4 컨텍스트
- **Given** Phase 4에서 speakers[1] 아코디언이 열려 있고 "slides" 탭이 활성인 상태에서
- **When** 편집 메시지를 전송하면
- **Then** 시스템 프롬프트에 아코디언 인덱스(1)와 활성 탭(slides)이 주입된다 (REQ-021)

### AC-15: Phase 5 컨텍스트
- **Given** Phase 5에서 "LinkedIn" 탭이 활성인 상태에서
- **When** 편집 메시지를 전송하면
- **Then** 시스템 프롬프트에 활성 탭(LinkedIn)이 주입된다 (REQ-022)

### AC-16: 편집 필드 범위 한정
- **Given** Phase 6 편집 요청에서
- **When** 시스템 프롬프트가 구성되면
- **Then** Phase 6 편집 가능 필드 목록(kpiDashboard, sentimentAnalysis 등)이 명시되어 AI 편집 범위가 한정된다 (REQ-023)

## 8. 영속성 및 로딩 상태 (REQ-024, REQ-025)

### AC-17: 새로고침 영속성
- **Given** Phase 2 결과의 milestones[0].title을 편집·적용한 직후
- **When** 페이지를 새로고침하면
- **Then** GET `/api/phase-result`가 갱신된 결과를 로드하고 편집된 title이 유지된다 (REQ-024)

### AC-18: 진행 중 로딩 상태
- **Given** 편집 요청 또는 저장이 진행 중일 때
- **When** API 호출이 완료되기 전이면
- **Then** 로딩 상태가 표시되고 입력창이 비활성화된다 (REQ-025)

## 9. 품질 게이트 (Quality Gate Criteria)

| 게이트 | 기준 |
|--------|------|
| 타입 검사 | `tsc --noEmit` 0 오류 |
| 스트리밍 성능 | 첫 토큰 2초 이내 (AC-4) |
| 검증 일관성 | 모든 저장 경로가 `OutputSchema` 단일 기준 사용 |
| brandMemory 일관성 | Phase 3 brandMemory 필드 편집 시 양쪽 테이블 동기화 (AC-12) |
| 데이터 보존 | patch merge가 미편집 필드를 보존 (AC-8) |
| DOM 비파괴 | 캡처 후 화면 DOM 원상 복귀 (AC-10) |

## 10. Definition of Done

- [ ] REQ-001~025 전 요구사항이 대응 AC로 검증됨
- [ ] `components/PhaseChat.tsx`, `components/ScreenshotCapture.tsx`, `lib/screenshot.ts`, `app/api/chat/phase-edit/route.ts` 신규 생성
- [ ] `app/api/phase-result/route.ts`에 PUT 메서드 추가 (deep merge + 재검증 + Phase 3 brandMemory upsert)
- [ ] Phase 1~6 페이지에 PhaseChat + ScreenshotCapture 주입 완료
- [ ] `html2canvas` 의존성 설치 및 `package.json` 반영
- [ ] PUT merge/재검증 단위 테스트, brandMemory 동기화 통합 테스트, 멀티모달 스트리밍 테스트, 영속성 E2E 통과
- [ ] `tsc --noEmit` 0 오류
- [ ] DB 마이그레이션 없음 확인 (기존 스키마 사용)
