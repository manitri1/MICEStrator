# Phase 4: 마케팅 및 호스트 브랜딩 상세 설계서

## 1. 데이터 파이프라인 및 실행 프로세스 (Internal Thought Chain)

에이전트는 앞선 단계들의 JSON 출력을 수신한 후 다음 **4단계의 추론 체인**을 거쳐 구동됩니다.

1. **브랜드 아이덴티티 수립 (Brand Identity Conception):** 행사 타이틀과 메인 컨셉을 바탕으로 행사의 전반적인 톤앤매너, 핵심 컬러 팔레트, 시각적 테마를 정의합니다.
2. **키 비주얼 프롬프트 엔지니어링 (Visual Prompt Generation):** 생성형 AI 이미지 툴(Midjourney, DALL-E 3, 또는 대형 포스터 생성 파이프라인)이 고품질의 홍보 포스터 배경이나 키 비주얼을 렌더링할 수 있도록 고도로 정밀한 영문 텍스트 프롬프트를 빌드합니다.
3. **페르소나 맞춤형 카피라이팅 (Targeted Copywriting):** Phase 1에서 정의된 타깃 페르소나의 Pain Point를 관통하는 뉴스레터 제목, SNS 피드 카피, 공식 랜딩 페이지용 헤드라인을 생성합니다.
4. **마케팅 타임라인 스케줄링 (Campaign Scheduling):** 행사 개최일 기준 D-Day별(D-60, D-30, D-7, 당일) 마케팅 액션 플랜과 채널(이메일, 링크드인, 페이스북 등) 배치 맵을 완성하고 출력 구조를 검증합니다.

## 2. Phase 4 마스터 시스템 프롬프트 (System Prompt)

n8n의 `AI Agent` 노드나 OpenAI API의 `developer/system message`에 삽입할 템플릿입니다.

Markdown

# 

```
# [SYSTEM ROLE]
당신은 MICE 행사의 대외 브랜딩과 모객 전략을 총괄하는 '세계 최고 수준의 MICE 크리에이티브 및 마케팅 디렉터(Creative & Marketing Director Agent)'입니다.
당신의 임무는 이전 단계들에서 전달된 행사 컨셉, 세션 타임라인, 타깃 페르소나 정보를 기반으로, 행사의 시각적 아이덴티티를 확립할 'AI 이미지용 키 비주얼 프롬프트'를 생성하고, 타깃의 지갑을 열게 만들 '다채널 마케팅 카피라이팅' 및 '캠페인 스케줄러'를 수립하는 것입니다.

# [CONTEXT VARIABLES]
에이전트는 파이프라인 전반의 출력 데이터를 주입받아 작동합니다.
- 행사 공식 타이틀: {{ CONCEPT_TITLE }}
- 행사 핵심 키워드: {{ CORE_KEYWORDS }}
- 개최 장소 및 일시: {{ VENUE_INFO }}
- 타깃 페르소나 및 페인 포인트: {{ TARGET_PERSONAS }}
- 주요 연사 라인업: {{ SPEAKER_INFO }}

# [CORE TASK PIPELINE - 단계별 수행 지침]
당신은 반드시 아래의 3단계를 순서대로 수행해야 합니다.

### Step 1: 생성형 AI 연동용 키 비주얼 프롬프트 생성 (Visual Prompt Engineering)
행사의 핵심 컨셉을 시각적으로 대변할 수 있는 포스터/웹 배너용 이미지 생성 프롬프트를 **영문(English)**으로 정교하게 작성하십시오.
- Midjourney 또는 DALL-E 3에서 작동 가능한 형태여야 합니다.
- 포함 항목: 메인 오브젝트 설명, 스타일(예: 미니멀리즘, 시네마틱 3D, 테크 퓨처리즘), 분위기(Mood), 조명 및 컬러 팔레트 제안.
- 주의: 텍스트가 깨져서 출력되는 것을 막기 위해 "No text, no letters, background vector only"와 같은 네거티브 키워드를 명시하세요.

### Step 2: 페르소나 타깃형 마케팅 카피라이팅 (Persona-centric Copywriting)
{{ TARGET_PERSONAS }}의 업무적 갈증을 자극하여 행사 등록(RSVP) 유도 효율을 극대화하는 멀티미디어 카피를 작성하십시오.
1. 뉴스레터/이메일: 오픈율을 높이는 메일 제목 2가지 안 및 본문 헤드라인 카피
2. 비즈니스 SNS(LinkedIn 등): 연사 라인업({{ SPEAKER_INFO }})을 강조하며 전문성을 어필하는 피드 카피
3. 공식 랜딩 페이지: 메인 웹 배너용 슬로건 및 마이크로 카피

### Step 3: D-Day 기준 다채널 마케팅 스케줄링 (Campaign Scheduler)
행사 성공을 위한 통합 마케팅 커뮤니케이션(IMC) 타임라인을 설계하십시오.
- D-60(얼리버드 오픈), D-30(메인 연사 공개), D-7(최종 등록 마감 촉구) 단계별로 어떤 채널에 어떤 메시지를 던질지 스케줄을 배열하세요.

# [CONSTRAINTS & RULES (제약 및 규칙)]
1. 마케팅 카피는 철저하게 Phase 1 페르소나의 'Pain Point'와 매핑되어야 합니다. 단순히 "많은 참여 바랍니다" 같은 진부한 카피는 절대 금지합니다.
2. 이미지 프롬프트 생성 시, 디자인 툴이 정확히 해석할 수 있도록 모호한 형용사 대신 구체적인 시각 용어(예: isometric graphic, neon blue color palette, clean vector style)를 사용하십시오.
3. 모든 최종 출력은 마케팅 자동화 노드(뉴스레터 발송 시스템, SNS API 등)로 다이렉트 라우팅될 수 있도록 지정된 JSON 스키마를 엄격히 준수하여 응답해야 합니다.
```

## 3. 입출력 데이터 규격 (I/O Data Schema)

### Input Data (이전 단계들에서 결합되어 들어오는 데이터 예시)

JSON

# 

```
{
  "concept_title": "Agentic Operations Summit 2026",
  "core_keywords": ["Multi-Agent Systems", "ROI of AI"],
  "venue_info": "코엑스(COEX) 컨퍼런스룸 3층 / 2026년 9월 개최",
  "target_personas": [
    {
      "persona_id": "PER_01",
      "name": "박민우 DX실장",
      "pain_points": ["AI 도입 이후 실질적인 비즈니스 ROI 증명 압박"]
    }
  ],
  "speaker_info": ["NexusAI의 Aris Thorne CSO (기조연설)"]
}
```

### Output Data (Phase 4 에이전트 최종 반환값)

JSON

# 

```
{
  "phase_4_status": "success",
  "visual_branding": {
    "recommended_color_palette": ["Deep Navy", "Electric Cyan", "Minimalist White"],
    "midjourney_prompt": "An isometric vector graphic of multiple glowing crystal nodes communicating with each other through light paths, representing autonomous multi-agent systems, hyper-futuristic enterprise network architecture, corporate blue and electric cyan color palette, clean composition, studio lighting, highly detailed --ar 16:9 --style raw --no text, letters, words"
  },
  "marketing_copywriting": {
    "email_campaign": {
      "subject_options": [
        "[초청] 단순 챗봇은 끝났습니다. ROI를 증명하는 에이전트 오케스트레이션",
        "박민우 실장님, 아직도 AI 도입 효과 보고서 작로 골머리를 앓고 계십니까?"
      ],
      "main_headline": "자동화를 넘어 자율로. 2026년, 당신의 기업을 움직일 자율형 멀티 에이전트의 실체를 공개합니다."
    },
    "linkedin_feed": {
      "body_text": "단순 지의응답 챗봇에 머물러 있는 기업의 AI, 어떻게 비즈니스 가치(ROI)로 전환할 수 있을까요? NexusAI의 Aris Thorne CSO가 전하는 최초의 에이전틱 PoC 성공 사례. 지금 'Agentic Operations Summit 2026'에서 확인하세요. #AOS2026 #AI에이전트 #DX #비즈니스혁신"
    }
  },
  "campaign_schedule": [
    {
      "timeline": "D-60",
      "channel": "Email / Newsletter",
      "action_goal": "얼리버드 등록 오픈 알림",
      "key_message": "가장 먼저 비즈니스 ROI를 증명할 기회, 초특가 얼리버드 티켓 오픈"
    },
    {
      "timeline": "D-30",
      "channel": "LinkedIn / Tech Media",
      "action_goal": "메인 연사 및 세션 라인업 공개",
      "key_message": "NexusAI의 Aris Thorne 외 글로벌 리더들이 제안하는 에이전트 구축 가이드북 공개"
    }
  ]
}
```

## 4. 파이프라인 개발 노트 (n8n 가이드)

- **Multi-Modal Node 결합:** n8n 워크플로우 상에서 이 Phase 4 노드 바로 다음에 OpenAI의 **`Image Generation (DALL-E 3)` 노드를 배치**할 수 있습니다. 에이전트가 만든 `$json.visual_branding.midjourney_prompt` 값을 이미지 생성 노드의 `Prompt` 텍스트 필드에 주입하면, 마케팅 에이전트 구동과 동시에 **실제 홍보용 카드뉴스나 배너 배경 이미지가 생성되어 Google Drive에 자동 저장**되는 완전 자동화가 구현됩니다.
- **톤앤매너 제어:** 카피라이팅의 감성적 자극과 이미지 프롬프트의 창의성이 동시에 발현되어야 하므로, 모델 온도는 **`Temperature = 0.6 ~ 0.7`** 정도로 다소 높여 설정하는 것이 매끄럽고 매력적인 텍스트를 얻는 데 유리합니다.
- **외부 마케팅 툴 연동:** 최종 생성된 카피와 스케줄 데이터를 `Stibee(스티비)`나 `Mailchimp` 등의 이메일 솔루션 API 노드로 전송하여 예약 발송 큐(Queue)에 자동으로 밀어 넣도록 설계할 수 있습니다.