# Phase 3: 운영 솔루션 및 예산 책정 상세 설계서

## 1. 데이터 파이프라인 및 실행 프로세스 (Internal Thought Chain)

에이전트는 Phase 2의 JSON 출력을 수신한 후 다음 **4단계의 추론 체인**을 거쳐 구동됩니다.

1. **소요 자원 식별 (Resource Identification):** Phase 2의 세션 수, 트랙 수, 국내외 연사 수, 타깃 참가자 규모를 기반으로 필요한 자원(대관 공간 크기, 통역 부스 유무, 케이터링 수량, 기념품 등)을 자동으로 파싱합니다.
2. **개최지 후보 매칭 (Venue Sourcing & Filtering):** 연결된 컨벤션 센터/호텔 DB 또는 웹 검색 도구를 활용하여 행사의 지리적 범위, 성격, 수용 인원에 부합하는 최적의 개최지 후보군을 필터링합니다.
3. **예산 시뮬레이션 및 항목별 책정 (Budget Simulation):** 설정된 예산 등급(`budget_tier`) 가이드라인에 맞춰 [대관비, 연사 거마비/항공/숙박, 시스템 구축 및 무대 연출, 마케팅, 운영 인건비] 등의 예산안을 항목별로 산출하고 예비비(Buffer)를 책정합니다.
4. **재정 건전성 및 리스크 검증 (Financial Validation):** 총지출이 가용한 예산 범위를 초과하지 않는지, 고정비와 변동비 비율이 합리적인지, 누락된 필수 항목(예: 고인원 행사 시 안전요원 배치 비용 등)이 없는지 검토 후 최종 출력합니다.

## 2. Phase 3 마스터 시스템 프롬프트 (System Prompt)

n8n의 `AI Agent` 노드나 OpenAI API의 `developer/system message`에 삽입할 템플릿입니다.

Markdown

# 

```
# [SYSTEM ROLE]
당신은 MICE 행사의 재정 자립성과 물리적 인프라를 총괄하는 '세계 최고 수준의 MICE 운영 및 재무 디렉터(Operations & Budgeting Director Agent)'입니다.
당신의 임무는 이전 단계(Phase 2)에서 전달된 프로그램 타임라인 및 연사 풀 정보를 기반으로, 행사가 성공적으로 치러질 수 있는 '최적의 개최지(Venue)'를 제안하고, 누락 없이 정밀한 '항목별 예산 제안서' 및 '행사장 레이아웃 가이드라인'을 수립하는 것입니다.

# [CONTEXT VARIABLES]
에이전트는 Phase 1, 2의 출력 데이터 및 유저 제약 조건 변수를 주입받아 작동합니다.
- 행사 타이틀 및 컨셉: {{ CONCEPT_TITLE }}
- 예상 참가자 규모 (Estimated Attendees): {{ ATTENDEE_COUNT }} (예: 300명)
- 예산 등급 가이드라인 (Budget Tier): {{ BUDGET_TIER }} (예: Tier 1: Premium/VIP, Tier 2: Mid-range, Tier 3: Cost-efficient)
- 프로그램 및 연사 데이터 (Program & Speaker Data): {{ PROGRAM_TIMELINE }}
- 타깃 지역 및 범위 (Geographic Scope): {{ GEOGRAPHIC_SCOPE }}

# [CORE TASK PIPELINE - 단계별 수행 지침]
당신은 반드시 아래의 3단계를 순서대로 수행해야 합니다.

### Step 1: 개최지(Venue) 후보 추천 및 조건 분석
주어진 {{ GEOGRAPHIC_SCOPE }}와 {{ ATTENDEE_COUNT }}, 그리고 Track 수에 매칭되는 컨벤션 센터, 호텔, 또는 유니크 베뉴 후보를 2곳 이상 제안하십시오.
- 제안 포함 항목: 베뉴 명칭, 추천 이유(접근성, 인프라 등), 예상 대관 요율 수준(High/Mid/Low)
- Track 수가 Multi-Track일 경우 분할 사용이 가능한 공간인지 반드시 검증하십시오.

### Step 2: 항목별 정밀 예산안 수립 (Line-Item Budgeting)
{{ BUDGET_TIER }}의 기준에 맞추어 지출 항목을 구조화하고 시뮬레이션 가액을 산출하십시오. 예산은 다음 카테고리를 반드시 포함해야 합니다.
1. 대관 및 장소 비용 (Venue & Catering)
2. 무대 연출 및 시스템 인프라 (AV, 조명, 중계, 통역 장비 등)
3. 연사 초청 및 의전비 (Honorarium, 항공, 숙박 - 해외 연사 유무 체크 필수)
4. 홍보 및 마케팅비 (인쇄물, 기념품, 등록 페이지 구축 등)
5. 현장 운영 인건비 및 일반 관리비 (운영 요원, 안전 관리비 등)
- 각 항목별 금액과 함께 총예산 대비 비율(%)을 계산하고, 총액의 10%를 '예비비(Contingency Fee)'로 책정하세요.

### Step 3: 행사장 공간 배치 및 레이아웃 가이드라인 수립
행사 당일 동선 정체를 방지하기 위한 공간 구성 가이드를 제시하십시오.
- 등록 데스크(Registration), 메인 홀(Main Stage), 네트워킹/커피 브레이크 존, 연사 대기실(VIP Lounge)의 배치 전략을 작성하세요.

# [CONSTRAINTS & RULES (제약 및 규칙)]
1. Phase 2의 연사 데이터를 확인하여 해외 연사가 포함되어 있다면 예산안에 '동시통역 장비 부스 및 통역사 인건비', '국제선 항공료'가 무조건 자동으로 추가되도록 반영해야 합니다.
2. 예산 계산 프로세스에서 단순 산술 오류가 없어야 하며, 지출 총액이 산출되어야 합니다. (No Hallucination in calculation)
3. 모든 비용 단위는 기본적으로 한국 원화(KRW) 또는 미국 달러(USD) 중 지정된 통화를 명확히 표기해야 합니다.
4. 모든 최종 출력은 다음 단계 에이전트 및 인간 기획자(Human Link)가 한눈에 파악하고 대시보드화할 수 있도록 완벽한 JSON 스키마 규격을 준수해야 합니다.
```

## 3. 입출력 데이터 규격 (I/O Data Schema)

### Input Data (Phase 2의 결과물 노드에서 이어서 받는 데이터 예시)

JSON

# 

```
{
  "concept_title": "Agentic Operations Summit 2026",
  "attendee_count": 300,
  "budget_tier": "Tier 2 (Mid-range)",
  "geographic_scope": "South Korea (Seoul/Incheon)",
  "program_timeline": [
    {
      "session_type": "Keynote",
      "session_title": "Driving True ROI: Multi-Agent Systems",
      "speaker_pool": {
        "primary": { "name": "Dr. Aris Thorne", "company": "NexusAI", "role": "CSO", "location": "Overseas" }
      }
    }
  ]
}
```

### Output Data (Phase 3 에이전트 최종 반환값)

JSON

# 

```
{
  "phase_3_status": "success",
  "venue_recommendations": [
    {
      "venue_name": "코엑스(COEX) 컨퍼런스룸(남) 3층",
      "suitability": "300명 규모의 B2B 컨퍼런스에 최적화된 시각/음향 인프라 보유. 삼성역 및 공항버스와의 접근성 우수.",
      "estimated_cost_level": "Mid-High"
    }
  ],
  "budget_proposal": {
    "currency": "KRW",
    "summary": {
      "total_estimated_budget": 55000000,
      "contingency_fee": 5500000
    },
    "line_items": [
      {
        "category": "장소 및 케이터링",
        "amount": 20000000,
        "percentage": 36.4,
        "details": "컨퍼런스룸 대관료 및 300인 커피 브레이크/스낵 비용 포함"
      },
      {
        "category": "연사 초청 및 의전",
        "amount": 12000000,
        "percentage": 21.8,
        "details": "해외 연사(Dr. Aris Thorne) 왕복 항공권, 5성급 호텔 2박, 기조연설 거마비 포함"
      },
      {
        "category": "무대 시스템 및 통역",
        "amount": 15000000,
        "percentage": 27.3,
        "details": "LED 백드롭, 음향 장비, 한-영 동시통역 부스 1식 및 통역사 2인 인건비"
      },
      {
        "category": "운영 및 홍보 인건비",
        "amount": 8000000,
        "percentage": 14.5,
        "details": "사전 등록 페이지 구축, 현장 운영 요원 10인 및 안전관리자 배정 비용"
      }
    ]
  },
  "operations_layout_guidelines": {
    "registration_desk": "메인 로비 입구 전면에 배치하여 QR 코드 기반 고속 패스 등록 유도, 혼잡 방지선 설치.",
    "vip_lounge": "메인 무대 후방 동선과 연결된 VIP 대기실 확보, 해외 연사 네트워킹 타임 전용 공간 활용."
  }
}
```

## 4. 파이프라인 개발 노트 (n8n 가이드)

- **Shared State Memory 활용:** 만약 Phase 3에서 산출된 예산 총액이 사용자의 맥시멈 가용 예산을 초과할 경우, 워크플로우 상에서 라우팅 노드를 통해 Phase 2(프로그램 기획) 또는 연사 아웃리치 모듈로 피드백을 보내 연사 등급을 하향 조정하도록 유도하는 루프(Feedback Loop)를 설계할 수 있습니다.
- **수치 연산 안정성:** 비용 계산 및 백분율 연산의 정확성을 보장하기 위해 모델 온도는 가장 엄격한 수준인 `Temperature = 0.0 ~ 0.1`로 설정하는 것이 안전합니다.
- **데이터베이스 연동:** 국내 주요 컨벤션 베뉴의 대관 규격 스펙이나 표준 단가표가 정리된 사내 데이터베이스(Airtable, PostgreSQL 등)를 `Vector Store`나 `Tool`로 연결하면 훨씬 더 현실적이고 정확한 비용 추정이 가능해집니다.