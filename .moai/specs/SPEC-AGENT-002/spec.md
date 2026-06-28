---
id: SPEC-AGENT-002
version: 1.0.0
status: in_progress
created: 2026-06-28
updated: 2026-06-28
author: MoAI
priority: high
---

# SPEC-AGENT-002: Phase 2 WBS & 역할 분담 에이전트

## 1. 개요

Phase 1(인텔리전스 토대 구축)의 출력(event_master)을 자동으로 로드하여
WBS(Work Breakdown Structure) 기반 역할 분담표와 주차별 마일스톤을 생성하는 AI 에이전트를 구현한다.

## 2. 요구사항 (EARS 형식)

| ID | 형식 | 요구사항 |
|----|------|---------|
| REQ-001 | WHEN | Phase 2 API가 호출될 때, Phase 1 결과를 DB에서 자동으로 로드해야 한다 |
| REQ-002 | WHEN | Phase 1 결과가 없을 때, HTTP 500과 명확한 에러 메시지를 반환해야 한다 |
| REQ-003 | SHALL | 에이전트는 gpt-4o + generateObject + temperature 0.3을 사용해야 한다 |
| REQ-004 | SHALL | 출력은 departments, wbsTasks, milestones, totalWeeks, criticalPath를 포함해야 한다 |
| REQ-005 | SHALL | departments는 최소 2개, wbsTasks는 최소 5개, milestones는 최소 3개여야 한다 |
| REQ-006 | SHALL | 결과를 phase_results 테이블(phaseNumber=2)에 저장해야 한다 |
| REQ-007 | WHEN | 입력 검증 실패 시, 에이전트를 호출하지 않고 HTTP 400을 반환해야 한다 |
| REQ-008 | SHALL | UI는 staffCount 슬라이더 입력, 부서/WBS/마일스톤 탭 출력을 제공해야 한다 |
| REQ-009 | SHALL | 임계 경로(criticalPath) 태스크는 WBS 테이블에서 시각적으로 구분되어야 한다 |
| REQ-010 | WHILE | 에이전트 실행 중, 로딩 스피너와 폼 비활성화 상태를 유지해야 한다 |

## 3. 구현 파일

| 파일 | 역할 |
|------|------|
| `lib/schemas/phase-02.schema.ts` | Zod 입출력 스키마 |
| `lib/prompts/phase-02.system-prompt.ts` | PMO 전문가 시스템 프롬프트 |
| `lib/agents/phase-02.ts` | 에이전트 로직 (Phase 1 DB 로드 포함) |
| `app/api/agents/phase-02/route.ts` | POST 엔드포인트 |
| `app/event/[id]/phase-2/page.tsx` | UI 페이지 (탭 기반 결과 표시) |

## 4. 아키텍처 결정

| 항목 | 결정 | 이유 |
|------|------|------|
| Temperature | 0.3 | WBS는 논리적 스케줄링 — 창의성보다 정확성 우선 |
| 역산 스케줄링 | 총 주차 기준 | 행사일 역산이 표준 PM 방법론 |
| Phase 1 로드 방식 | DB 쿼리 (phaseResults) | SSoT 유지, 프런트엔드로 전달 불필요 |
| staffCount 범위 | 1~50명 | 소규모 스타트업~대형 행사 커버 |

## 5. MX 태그 계획

- `Phase02OutputSchema` → @MX:ANCHOR (Phase 3~6 의존)
- `runPhase2()` → @MX:ANCHOR (DB 쿼리 + AI 호출 집중)
- `route.ts` → @MX:NOTE (Phase 1 선행 조건)

## 6. 수용 기준

- AC-1: staffCount=5 입력 시 departments 2개 이상 생성
- AC-2: Phase 1 없이 호출 시 500 + "Phase 1 결과가 없습니다" 메시지 반환
- AC-3: criticalPath 항목이 WBS 테이블에 빨간 배경으로 표시
- AC-4: milestones가 week 기준 오름차순 정렬
- AC-5: tsc --noEmit 0 오류
