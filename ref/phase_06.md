# Phase 6: 사후 관리 및 효과 측정 상세 설계서

## 1. 데이터 파이프라인 및 실행 프로세스 (Internal Thought Chain)

에이전트는 행사가 종료된 후 축적된 원시 데이터(Raw Data)를 받아 다음 **4단계의 추론 체인**을 거쳐 구동됩니다.

1. **데이터 전처리 및 정량화 (Data Aggregation):** 현장 등록 시스템, 설문조사 플랫폼(구글 폼 등), 세션별 입장 스캐너 등에서 유입된 수치 데이터를 취합하고 파싱합니다.
2. **성과 요인 및 ROI 분석 (ROI Calculation & Evaluation):** Phase 1에서 설정했던 목표(가치 제안) 및 Phase 3의 예산 대비 실질적인 성과(등록률, 만족도, 비즈니스 매칭 계약 전환율 등)를 비교 분석합니다.
3. **페르소나 역추적 검증 (Persona Feedback Loop):** Phase 1에서 설정한 '타깃 페르소나'들이 실제로 행사에서 갈증을 해소했는지 설문 텍스트 마이닝을 통해 역으로 분석합니다.
4. **차기 리포트 및 인사이트 생성 (Report Generation):** 종합 성과 평가 리포트를 시각화 구조로 작성하고, 발견된 문제점을 기반으로 차기 행사 기획 시 반영해야 할 개선점을 도출합니다.

## 2. Phase 6 마스터 시스템 프롬프트 (System Prompt)

n8n의 `AI Agent` 노드나 OpenAI API의 `developer/system message`에 삽입할 템플릿입니다.

Markdown

# 

```
# [SYSTEM ROLE]
당신은 MICE 행사의 정량적/정성적 성과를 분석하고 차기 행사의 흥행 방정식을 설계하는 '세계 최고 수준의 MICE 데이터 분석 및 효과 측정 전문가(Data ROI Evaluator Agent)'입니다.
당신의 임무는 행사 종료 후 취합된 원시 데이터를 바탕으로 호스트와 투자자들이 신뢰할 수 있는 'MICE 성과 보고서(ROI Report)'를 자동 생성하고 차기 행사를 위한 구체적인 액션 플랜을 도출하는 것입니다.

# [CONTEXT VARIABLES]
에이전트는 기획 단계의 마스터 데이터와 사후 수집된 결과 데이터를 주입받아 작동합니다.
- 기획 단계 목표 및 예산 (Phase 1, 3 데이터): {{ BUDGET_AND_TARGETS }}
- 최종 참가자 등록 및 출석 데이터: {{ ATTENDANCE_DATA }}
- 참가자 사후 만족도 설문 데이터 (Raw Survey): {{ SURVEY_RAW_TEXT }}
- 비즈니스 상담/계약 성과 데이터: {{ BUSINESS_MATCHING_DATA }}

# [CORE TASK PIPELINE - 단계별 수행 지침]
당신은 반드시 아래의 3단계를 순서대로 수행해야 합니다.

### Step 1: 정량적 주요 성과 지표 (KPI) 분석
주어진 데이터를 기반으로 행사의 흥행 여부를 보여주는 핵심 지표를 도출하고 평가하십시오.
- 목표 대비 달성률(%) 계산: 목표 참가자 수 대비 실 출석률, 예산 집행 효율성 등
- 비즈니스 매칭 성과 점산: 상담 건수, 예상 계약 추진 액수 등 정량 수치 요약

### Step 2: 설문 데이터 기반의 정성적 페인 포인트 분석
{{ SURVEY_RAW_TEXT }}의 주관식 답변 및 평점 데이터를 텍스트 마이닝 기법으로 분석하십시오.
- 긍정 요인 Top 3 및 부정 요인 Top 3를 명확한 카테고리(콘텐츠, 베뉴, 운영, 마케팅)별로 분류하세요.
- Phase 1의 타깃 페르소나가 제기했던 실무적 갈증(Pain Point)이 이번 행사를 통해 해소되었는지 추적하여 결론을 도출하세요.

### Step 3: 차기 행사(Next Event) 제안 및 개선 전략 수립
분석 결과를 바탕으로 내년도 또는 차기 행사 기획 시 무조건 반영해야 할 고도화 전략 3가지를 제안하십시오.
- 예: "특정 세션의 만족도가 낮았으므로 차기에는 해당 키워드 비중 축소 요망", "대관 공간 동선 정체 빈발로 인한 레이아웃 수정 제안" 등

# [CONSTRAINTS & RULES (제약 및 규칙)]
1. 데이터를 과장하거나 왜곡하여 호스트에게 유리하게짜맞추는 보고를 하지 마십시오. 부정적인 피드백(부정 요인)을 가감 없이 날카롭게 짚어내야 합니다.
2. 모든 수치적 연산은 정확해야 하며, 계산 오류로 인한 데이터 왜곡이 없어야 합니다.
3. 모든 최종 출력은 대시보드 시각화 컴포넌트(차트, 스코어보드 등)나 PDF 리포트 자동 생성 노드로 즉시 빌드될 수 있도록 정해진 JSON 스키마 규격을 완벽히 준수해야 합니다.
```

## 3. 입출력 데이터 규격 (I/O Data Schema)

### Input Data (행사 종료 후 각종 솔루션에서 취합되어 들어오는 데이터 예시)

JSON

# 

```
{
  "budget_and_targets": { "target_attendees": 300, "total_spent": 55000000 },
  "attendance_data": { "total_registered": 340, "actual_attended": 285 },
  "business_matching_data": { "total_meetings": 42, "estimated_contract_value_usd": 150000 },
  "survey_raw_text": [
    { "rating": 5, "comment": "Dr. Aris Thorne의 기조연설이 멀티 에이전트 PoC 구축에 큰 도움이 되었습니다." },
    { "rating": 2, "comment": "갑작스러운 순서 변경으로 당황스러웠고, 점심시간과 커피 브레이크 동선이 겹쳐 등록 데스크 앞이 너무 혼잡했습니다." }
  ]
}
```

### Output Data (Phase 6 에이전트 최종 성과 리포트 객체)

JSON

# 

```
{
  "phase_6_status": "completed",
  "kpi_performance": {
    "attendance_achievement_rate": 95.0,
    "budget_efficiency": "정상 집행 (예비비 15% 남김)",
    "business_roi": {
      "total_meetings": 42,
      "estimated_roi_impact": "투자 비용 대비 약 3.6배의 잠재 비즈니스 파이프라인 확보"
    }
  },
  "sentiment_analysis": {
    "top_strengths": [
      "Phase 1 키워드 타깃팅 성공: '멀티 에이전트 실무 ROI' 중심의 기조연설 및 메인 세션 콘텐츠 만족도 극상 (4.8/5.0)"
    ],
    "top_weaknesses": [
      "현장 운영 리스크 감지: 오전 돌발 상황으로 인한 세션 스왑 시 등록 데스크 및 로비 동선 병목 현상 발생 (2.3/5.0)"
    ]
  },
  "next_event_recommendations": [
    {
      "priority": "HIGH",
      "action_item": "차기 행사장 레이아웃 고도화",
      "strategy": "커피 브레이크 존과 등록 데스크의 물리적 거리를 최소 15m 이상 이격하거나 바리케이드 동선을 이원화하여 병목 현상 원천 차단 필요."
    },
    {
      "priority": "MID",
      "action_item": "에이전틱 오퍼레이션 심화 트랙 신설",
      "strategy": "실무자 페르소나의 만족도가 가장 높았던 'Harness Engineering' 및 '로컬 LLM 보안' 주제를 차기 행사에는 별도 분리된 심화 트랙(Track B)으로 확장 구성할 것을 제안."
    }
  ]
}
```

## 4. 파이프라인 개발 노트 (n8n 가이드)

- **Multi-Data Sourcing:** 구글 폼, 타입폼(Typeform) 또는 자체 등록 DB 노드를 트리거로 설정하여, 새로운 데이터가 적재되거나 행사 종료일 지정 시간에 **자동으로 이 모든 원시 데이터를 취합해 에이전트에 인입**시키도록 스케줄러 노드를 배치합니다.
- **자동 문서화 노드 결합:** n8n 워크플로우 하위에 **`Google Docs`** 또는 사내 보고서 템플릿 전송용 **`PDF Generator` 노드**를 연동합니다. 본 에이전트의 출력을 텍스트 마킹 아웃풋으로 치환해 주입하면, **행사가 끝난 다음 날 아침 9시에 'MICE 결과 보고서 1차 초안' 문서가 드라이브에 자동으로 생성**되어 있는 혁신적인 업무 자동화를 달성할 수 있습니다.
- **분석 정밀도:** 주관식 텍스트의 분류 및 성과 지표 산출의 객관성이 생명이므로 모델 온도는 **`Temperature = 0.2`** 정도로 낮게 유지하는 것이 좋습니다.