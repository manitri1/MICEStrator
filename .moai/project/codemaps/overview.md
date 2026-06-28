# MICEstrator — 아키텍처 개요 (플레이스홀더)

> 신규 프로젝트: 소스 코드가 아직 없습니다. 에이전트 구현 후 `/moai codemaps` 를 실행하면 이 파일이 실제 코드 기반으로 갱신됩니다.

## 설계 목표

MICEstrator는 **6-Phase 순차 멀티 에이전트 파이프라인**입니다.

각 Phase 에이전트는:
- 명확한 입력 스키마(JSON)를 받고
- 정해진 출력 스키마(JSON)를 반환하며
- 이전 Phase의 `event_master.json`을 항상 참조합니다

## 예상 모듈 경계

```
micestrator/
├── agents/phase_01_trend/      → 트렌드 분석 + 행사 컨셉 도출
├── agents/phase_02_wbs/        → WBS + 마일스톤 생성
├── agents/phase_03_design/     → 브랜드 아이덴티티 + 컨셉 메모리
├── agents/phase_04_speaker/    → 연사 소싱 + 이메일 생성
├── agents/phase_05_marketing/  → 마케팅 에셋 생성
├── agents/phase_06_roi/        → ROI 분석 + 차기 제언
├── schemas/                    → 공유 JSON 스키마 계약
└── memory/                     → 브랜드 컨셉 영속 저장소
```

## 핵심 데이터 흐름

```
사용자 초기 입력
    → Phase 1 → event_master.json (SSoT 생성)
    → Phase 2 → wbs_timeline.json
    → Phase 3 → brand_identity.json (memory/ 저장)
    → Phase 4 → speaker_results.json
    → Phase 5 → marketing_assets.json
    → Phase 6 → roi_report.json
```

## 구현 후 갱신 대상

`/moai codemaps` 실행 시 다음 파일들이 자동 생성됩니다:
- `modules.md` — 모듈별 책임 및 공개 인터페이스
- `dependencies.md` — 의존성 그래프
- `entry-points.md` — 진입점 및 CLI 명령
- `data-flow.md` — 데이터 흐름 상세
