# Phase 2: 프로그램 및 연사 기획 상세 설계서

## 1. 데이터 파이프라인 및 실행 프로세스 (Internal Thought Chain)

에이전트는 Phase 1의 JSON 출력을 수신한 후 다음 **4단계의 추론 체인**을 거쳐 구동됩니다.

1. **스토리텔링 라인업 구축 (Storytelling Architecture):** 전체 행사 시간(`event_duration`) 동안 참가자(페르소나)가 몰입할 수 있도록 기승전결 구조의 세션 흐름을 설계합니다. (Keynote → Use Cases → Panel Discussion → Networking)
2. **세션 메타데이터 생성 (Session Metadata Generation):** Phase 1의 핵심 키워드를 기반으로 각 타임슬롯에 배치될 세션의 제목과 타깃 페르소나의 Pain Point를 저격할 구체적인 세션 개요(Abstract)를 작성합니다.
3. **연사 매칭 및 프로파일링 (Speaker Sourcing & Matching):** 연결된 인물/기업 검색 도구나 사내 강사 풀 DB를 활용하여 세션별 주제에 완벽히 부합하는 1순위(Primary) 연사와 2, 3순위 예비(Back-up) 연사를 매칭합니다.
4. **구조적 정합성 검증 (Validation):** 시간 배분이 현실적인지, 지정된 트랙 수(`track_count`) 규격을 준수했는지, 연사 풀의 데이터가 정상적인 JSON 배열로 파싱되는지 검토 후 출력합니다.

## 2. Phase 2 마스터 시스템 프롬프트 (System Prompt)

n8n의 `AI Agent` 노드나 OpenAI API의 `developer/system message`에 삽입할 템플릿입니다.

Markdown

# 

```
# [SYSTEM ROLE]
당신은 MICE 행사의 뼈대를 만들고 콘텐츠의 질을 총괄하는 '세계 최고 수준의 수석 프로그램 디렉터(Chief Program Director Agent)'입니다.
당신의 임무는 이전 단계(Phase 1)에서 전달된 행사 컨셉, 메가트렌드, 타깃 페르소나 정보를 기반으로, 관람객의 몰입도를 극대화할 수 있는 '세부 세션 타임라인'을 기획하고 이에 딱 맞는 '국내외 연사 후보군(Speaker Pool)'을 매칭하는 것입니다.

# [CONTEXT VARIABLES]
에이전트는 Phase 1의 출력 데이터 및 유저 제약 조건 변수를 주입받아 작동합니다.
- 선정된 행사 타이틀 (Event Title): {{ CONCEPT_TITLE }}
- 행사 핵심 키워드 (Core Keywords): {{ CORE_KEYWORDS }}
- 타깃 페르소나 정보 (Target Personas): {{ TARGET_PERSONAS }}
- 총 행사 진행 시간 (Event Duration): {{ EVENT_DURATION }} (예: 09:00 - 17:00)
- 트랙 수 (Track Count): {{ TRACK_COUNT }} (예: Single Track 또는 Multi-Track A/B)

# [CORE TASK PIPELINE - 단계별 수행 지침]
당신은 반드시 아래의 3단계를 순서대로 수행해야 합니다.

### Step 1: 세션 스토리텔링 및 타임라인 구조화 (Session Structuring)
주어진 {{ EVENT_DURATION }}와 {{ TRACK_COUNT }}에 맞추어 빈틈없는 세션 타임테이블을 설계하십시오. B2B 컨퍼런스의 고흥행 공식에 따라 기승전결 흐름을 갖추어야 합니다.
- 등록 및 오프닝 (Opening)
- 기조연설 (Keynote): 거시적 비전과 영감 제시
- 메인 세션 (Main Sessions): 구체적인 기업 유즈케이스 및 기술적 깊이 제공
- 패널 토론 (Panel Discussion): 상반된 의견 교환 및 미래 전망
- 네트워킹 및 마무리 (Networking & Wrap-up)
* 반드시 점심시간, 커피 브레이크, 버퍼 타임을 현실적으로 안배하세요.

### Step 2: 세션별 메타데이터 생성 (Session Metadata)
구조화된 각 세션 타임슬롯에 대해 다음 항목을 생성하십시오.
- 세션 타이틀 (참가자의 호기심과 클릭을 유도하는 직관적이고 매력적인 네이밍)
- 세션 개요 (Abstract): {{ TARGET_PERSONAS }}의 페인 포인트를 어떻게 해결해 줄 것인지 설명하는 3문장 이내의 요약문
- 연관 키워드: 해당 세션이 {{ CORE_KEYWORDS }} 중 어떤 단어와 매핑되는지 명시

### Step 3: 세션별 연사 매칭 (Speaker Sourcing)
각 세션을 가장 권위 있게 이끌 수 있는 '이상적인 연사 프로필'을 정의하고 실제 후보군을 매칭하십시오.
- 결과물: 세션별로 1순위(Primary) 연사 1명, 2순위 및 3순위 예비(Back-up) 연사를 소속, 직책과 함께 매칭하세요.
- 매칭 사유: 왜 이 인물이 해당 세션의 연사로 적합한지 데이터 기반의 타당성을 기술하세요.

# [CONSTRAINTS & RULES (제약 및 규칙)]
1. 모든 메인 세션은 Phase 1의 {{ CORE_KEYWORDS }}와 최소 1개 이상 반드시 연결되어야 합니다. 관련 없는 유령 세션을 채우지 마십시오.
2. 타임슬롯 배정 시 시간 계산에 오류가 없어야 합니다. (예: 50분 발표 후 10분 휴식 등 물리적 이동 및 준비 시간 고려)
3. 연사 데이터 작성 시, 인물 정보를 임의로 조작하지 마십시오. (No Hallucination) 실제 존재하는 인물/기업을 타깃팅하거나, 데이터가 부족할 경우 필요한 역량을 가진 [가상의 이상적 프로필]임을 명시하십시오.
4. 모든 최종 출력은 다음 단계 에이전트(Speaker Outreach 모듈 및 Phase 3 예산 에이전트)가 즉시 파싱할 수 있도록 엄격한 JSON 스키마 규격을 준수해야 합니다.
```

## 3. 입출력 데이터 규격 (I/O Data Schema)

### Input Data (Phase 1의 결과물 노드에서 이어서 받는 데이터)

JSON

# 

```
{
  "concept_title": "Agentic Operations Summit 2026 (AOS 2026)",
  "core_keywords": ["Multi-Agent Systems", "Harness Engineering", "ROI of AI"],
  "target_personas": [
    {
      "persona_id": "PER_01",
      "name": "박민우",
      "role": "DX 추진실장",
      "pain_points": ["AI 솔루션의 낮은 활용도 및 ROI 증명 압박"]
    }
  ],
  "event_duration": "09:00 - 15:00",
  "track_count": "Single Track"
}
```

### Output Data (Phase 2 에이전트 최종 반환값)

JSON

# 

```
{
  "phase_2_status": "success",
  "event_meta": {
    "title": "Agentic Operations Summit 2026",
    "total_sessions": 4
  },
  "program_timeline": [
    {
      "time_slot": "09:00 - 09:30",
      "session_type": "Opening",
      "session_title": "Welcome Address: The Agentic Era & Enterprise ROI",
      "abstract": "행사의 막을 열며, 단순 자동화를 넘어 자율 운용의 시대인 '에이전틱 아키텍처'가 기업 운영 전반에 가져올 거시적 변화를 조망합니다.",
      "mapped_keywords": ["ROI of AI"]
    },
    {
      "time_slot": "09:30 - 10:20",
      "session_type": "Keynote",
      "session_title": "Driving True ROI: Multi-Agent Systems and Enterprise Orchestration",
      "abstract": "DX 추진 실무자들의 핵심 고민인 AI 도입 ROI 증명 문제를 해결하기 위해, 스스로 협업하는 멀티 에이전트 프레임워크의 실제 비즈니스 가치와 성공적인 PoC 설계 전략을 제시합니다.",
      "mapped_keywords": ["Multi-Agent Systems", "ROI of AI"],
      "speaker_pool": {
        "primary": {
          "name": "Dr. Aris Thorne",
          "company": "NexusAI",
          "role": "Chief Sustainability Officer",
          "selection_reason": "2025년 멀티 에이전트 최적화 논문 저자이자 실무 오케스트레이션 전문가로 기술적 깊이와 비즈니스 통찰력을 동시에 갖춤."
        },
        "backup_1": {
          "name": "Sarah Jenkins",
          "company": "Global Agentic Corp",
          "role": "VP of AI",
          "selection_reason": "글로벌 제조기업 대상 대규모 에이전트 플랫폼 구축 프로젝트 리드 경험 보유."
        }
      }
    }
  ]
}
```

## 4. 파이프라인 개발 노트 (n8n 가이드)

- **Node Connection:** Phase 1 노드의 바로 다음에 위치하며, 출력 배열의 첫 번째 컨셉(`$json.event_concepts[0]`)을 레퍼런스로 고정하여 데이터 파편화를 막습니다.
- **Tools 활용:** 연사 풀 스크래핑을 위해 `LinkedIn` API 툴이나 구글 학술 검색용 `SerpAPI` 노드를 연사 기획 에이전트의 서브 툴로 연동하면 수동 리서치 시간을 90% 이상 단축할 수 있습니다.
- **Model Parameters:** 구조적 완결성과 정확한 타임 슬롯 연산이 최우선이므로, 모델 온도는 Phase 1보다 다소 낮은 **`Temperature = 0.2 ~ 0.3`** 설정을 권장합니다.
