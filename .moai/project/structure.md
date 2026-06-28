# MICEstrator — 프로젝트 구조

## 아키텍처 패턴

**멀티 에이전트 파이프라인 (Sequential Multi-Agent Pipeline)**

6개의 전문 에이전트가 순차적으로 연결된 파이프라인 구조입니다. 각 Phase 에이전트는 독립적으로 실행되며, 이전 Phase의 JSON 출력이 다음 Phase의 입력으로 자동 전달됩니다.

```
사용자 입력
    ↓
[Phase 1: Trend Agent] → 기획 문서 (SSoT)
    ↓
[Phase 2: WBS Agent] → WBS + 마일스톤
    ↓
[Phase 3: Design Agent] → 브랜드 가이드 (컨셉 메모리)
    ↓
[Phase 4: Speaker Agent] → 연사 리스트 + 초청 이메일
    ↓
[Phase 5: Marketing Agent] → 마케팅 에셋
    ↓
[Phase 6: ROI Agent] → 성과 분석 리포트
```

## 디렉토리 구조 (목표 구조)

```
micestrator/
├── ref/                          # 설계 레퍼런스 문서 (현재 존재)
│   ├── micestrator propose overview.md
│   ├── phase_01.md               # Phase 1 상세 설계서
│   ├── phase_02.md               # Phase 2 상세 설계서
│   ├── phase_03.md               # Phase 3 상세 설계서
│   ├── phase_04.md               # Phase 4 상세 설계서
│   ├── phase_05.md               # Phase 5 상세 설계서
│   └── phase_06.md               # Phase 6 상세 설계서
│
├── agents/                       # Phase별 AI 에이전트 정의
│   ├── phase_01_trend/           # 트렌드 & 방향성 에이전트
│   │   ├── system_prompt.md      # 시스템 프롬프트
│   │   ├── input_schema.json     # 입력 스키마
│   │   └── output_schema.json    # 출력 스키마
│   ├── phase_02_wbs/             # WBS & 일정 에이전트
│   ├── phase_03_design/          # 비주얼 아이덴티티 에이전트
│   ├── phase_04_speaker/         # 연사 소싱 에이전트
│   ├── phase_05_marketing/       # 마케팅 엔진 에이전트
│   └── phase_06_roi/             # ROI 분석 에이전트
│
├── schemas/                      # 공유 JSON 스키마 정의
│   ├── event_master.schema.json  # 행사 마스터 데이터 스키마 (SSoT)
│   ├── phase_01_output.schema.json
│   ├── phase_02_output.schema.json
│   ├── phase_03_output.schema.json
│   ├── phase_04_output.schema.json
│   ├── phase_05_output.schema.json
│   └── phase_06_output.schema.json
│
├── memory/                       # 컨셉 메모리 저장소
│   ├── event_context.json        # 현재 진행 중인 행사 컨텍스트
│   └── brand_identity.json       # 확정된 브랜드 아이덴티티 (Phase 3 → 이후 자동 주입)
│
├── workflows/                    # n8n 워크플로우 내보내기 (JSON)
│   ├── pipeline_full.json        # 전체 파이프라인 워크플로우
│   └── phase_*.json              # Phase별 단독 워크플로우
│
├── prompts/                      # 시스템 프롬프트 템플릿 (버전 관리)
│   ├── base_template.md          # 공통 베이스 템플릿
│   └── phase_*/                  # Phase별 프롬프트 변형
│
├── outputs/                      # 에이전트 실행 결과물
│   ├── {event_id}/               # 행사별 디렉토리
│   │   ├── phase_01_result.json
│   │   ├── phase_02_result.json
│   │   ├── phase_03_result.json
│   │   ├── phase_04_result.json
│   │   ├── phase_05_result.json
│   │   └── phase_06_report.json
│
├── reports/                      # 최종 리포트 (Phase 6 출력)
│
├── .moai/                        # MoAI-ADK 설정 (현재 존재)
│   ├── config/                   # MoAI 설정 파일
│   └── project/                  # 프로젝트 문서 (이 파일들)
│
└── CLAUDE.md                     # Claude 에이전트 실행 컨텍스트
```

## 핵심 모듈 설명

### agents/ — Phase 에이전트 모듈
각 Phase는 독립된 디렉토리로 구성됩니다:
- `system_prompt.md`: 해당 Phase 에이전트의 역할, 사고 체인, 제약 규칙
- `input_schema.json`: 이전 Phase에서 받는 데이터 스키마
- `output_schema.json`: 다음 Phase로 전달하는 데이터 스키마

### schemas/ — 공유 스키마
- `event_master.schema.json`: Phase 1이 생성하는 마스터 데이터. 모든 Phase가 이를 참조
- Phase별 출력 스키마: JSON 스키마 표준 (Draft-07) 준수

### memory/ — 컨셉 메모리
- `brand_identity.json`: Phase 3 완료 시 확정되는 브랜드 데이터
  - `primary_color`: Hex 코드 (예: `#1A2B3C`)
  - `secondary_colors`: 보조 색상 배열
  - `design_mood`: 디자인 무드 키워드
  - `font_style`: 폰트 방향성
- Phase 4, 5가 실행될 때 이 파일을 자동으로 읽어 시스템 프롬프트에 주입

### outputs/ — 실행 결과물
- 행사 ID 기반 디렉토리 분리로 복수 행사 동시 관리 가능
- 각 Phase 결과 JSON이 순차적으로 누적

## 데이터 흐름

```
사용자 초기 입력 (분야, 규모, 기간)
          ↓
   Phase 1 에이전트
          ↓ 출력: event_master.json (SSoT)
   Phase 2 에이전트 ← event_master.json 읽기
          ↓ 출력: wbs_timeline.json
   Phase 3 에이전트 ← event_master.json 읽기
          ↓ 출력: brand_identity.json → memory/에 저장
   Phase 4 에이전트 ← event_master.json + brand_identity.json
          ↓ 출력: speaker_list.json + invitation_emails.json
   Phase 5 에이전트 ← event_master.json + brand_identity.json + speaker_list.json
          ↓ 출력: marketing_assets.json
   Phase 6 에이전트 ← 모든 이전 출력 + 행사 후 수집 데이터
          ↓ 출력: roi_report.json
```

## 현재 구현 현황

| 디렉토리/파일 | 상태 | 설명 |
|-------------|------|------|
| `ref/` | 완료 | 6개 Phase 상세 설계서 및 개요 문서 |
| `.moai/` | 완료 | MoAI-ADK 기본 설정 |
| `agents/` | 미구현 | Phase별 에이전트 구현 필요 |
| `schemas/` | 미구현 | JSON 스키마 정의 필요 |
| `memory/` | 미구현 | 컨셉 메모리 저장소 구현 필요 |
| `workflows/` | 미구현 | n8n 워크플로우 구성 필요 |
