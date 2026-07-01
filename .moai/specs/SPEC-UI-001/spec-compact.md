# SPEC-UI-001 (Compact) — 행사 목록 Phase 1 개요 표시 및 Phase 일관성 알림

> 자동 생성 요약. 원본: spec.md / plan.md / acceptance.md

**id:** SPEC-UI-001 | **version:** 1.0.0 | **status:** draft | **priority:** medium
**created:** 2026-07-01 | **updated:** 2026-07-01 | **author:** manitri

## 요구사항 (REQ)

### Module 1 — 행사 목록 Phase 1 개요 표시
- REQ-UI-001 (WHEN 목록 렌더링 + Phase 1 존재) → 카드에 `slogan` + 상위 3개 `coreKeywords` 태그 표시
- REQ-UI-002 (WHEN 목록 렌더링 + Phase 1 부재) → "Phase 1 미완료" 표시
- REQ-UI-003 (Ubiquitous) → 항상 `events.name` 표시, Phase 1 부재가 렌더링 중단 금지 (graceful fallback)

### Module 2 — Phase 1 재실행 즉각 알림
- REQ-UI-004 (WHEN POST /api/agents/phase-01 완료) → Phase 1 페이지에 하위 Phase 2~6 영향 배너 표시
- REQ-UI-005 (Ubiquitous) → 재실행 배너는 기존 `PhaseStaleBanner` 재사용

### Module 3 — Phase 2~6 로드 시 일관성 체크
- REQ-UI-006 (WHEN Phase 2~6 최초 로드) → Phase 1 최신 `completedAt` vs 현재 Phase `completedAt` 비교
- REQ-UI-007 (IF Phase 1 completedAt > 현재 Phase completedAt) → 일관성 경고 배너 표시
- REQ-UI-008 (WHEN "재생성" 버튼 클릭) → 현재 Phase 실행 폼으로 포커스 이동
- REQ-UI-009 (WHERE 배너 표시됨) → 세션 내 사용자 dismiss 가능

### Module 4 — API 지원
- REQ-UI-010 (WHEN POST /api/agents/phase-01 반환) → 응답에 `affectedDownstream: [2,3,4,5,6]` 포함
- REQ-UI-011 (Ubiquitous) → `GET /api/phase-staleness?eventId=&phase=` 제공, `{ isStale, staleSince, outdatedByPhases }` 반환

### 금지 (Unwanted)
- REQ-UI-012 → Phase 1 변경으로 Phase 2~6 자동 재생성 금지 (알림만)
- REQ-UI-013 → 신규 DB 테이블/컬럼 추가 금지, `completedAt` 타임스탬프 비교만 사용

## Exclusions (비범위)
- DB 스키마 변경 / 자동 재생성 / 실시간(WebSocket·SSE) 알림 / 외부(Push·이메일) 알림 / 변경 이력 UI / 영속 dismiss / 내용 기반 diff 판별

## 인수 기준 (Acceptance)
- AC-01: Phase 1 실행 후 목록에 슬로건+키워드 표시 (REQ-UI-001)
- AC-02: Phase 1 미실행 시 미완료 표시 + name 폴백 (REQ-UI-002, 003)
- AC-03: Phase 1 재실행 후 Phase 1 페이지 배너 + 응답 affectedDownstream (REQ-UI-004, 005, 010)
- AC-04: Phase 2 로드 시 Phase 1이 최신 아님 → 배너 없음, isStale=false (REQ-UI-006, 011, 013)
- AC-05: Phase 2 로드 시 Phase 1이 더 최신 → 배너 표시, isStale=true, 자동 재생성 없음 (REQ-UI-006, 007, 011, 012)
- AC-06: Phase 2 배너 재생성 클릭 → 폼 포커스 이동 + 세션 dismiss (REQ-UI-008, 009)
- AC-07: Phase 6 로드 시 Phase 1 갱신 → 배너 표시, 자동 재생성 없음 (REQ-UI-006, 007, 012)

Edge: 키워드<3개 / slogan 공백 / completedAt 동일 / 대상 Phase 결과 부재 / staleness API 실패 / dismiss 후 새로고침

## 대상 파일
- MODIFY: `app/page.tsx`, `app/event/[id]/phase-1~6/page.tsx`, `app/api/agents/phase-01/route.ts`, `components/PhaseStaleBanner.tsx`
- NEW: `app/api/phase-staleness/route.ts`
