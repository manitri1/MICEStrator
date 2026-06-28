# Project Interview
<!-- Auto-generated from ref/ folder documentation — interview skipped (technical_keywords >= 5) -->

## Round 1: Vision
Question: What does this project do and who is it for?
Answer: MICEstrator는 MICE(Meetings, Incentives, Conventions, Exhibitions) 행사 기획 전 과정을 AI 에이전트로 자동화하는 시스템입니다. 트렌드 조사부터 행사 종료 후 ROI 분석까지 6개 Phase를 파이프라인으로 연결하여, MICE 전문 기획자와 컨벤션 운영팀이 반복적인 문서화·분석 작업을 자동화할 수 있게 합니다.

## Round 2: Technology
Question: What is the primary technology stack?
Answer: moai-adk (Claude Code 에이전트 프레임워크) 기반의 멀티 에이전트 시스템. 각 Phase가 독립된 Claude 에이전트로 구현되며, 이전 Phase의 JSON 출력이 다음 Phase의 입력으로 자동 상속되는 파이프라인 구조입니다. 외부 통합: n8n 워크플로우, Google Forms/Docs, Canva, 이미지 생성 AI(Midjourney), 음악 생성 AI(Suno/Udio).

## Round 3: Scope
Question: What are the key features and explicit boundaries?
Answer: |
  Phase 1 - 트렌드 & 방향성: 시장 인텔리전스 기반 행사 컨셉/슬로건/타깃 페르소나 도출
  Phase 2 - WBS & 일정: 업무분해구조(WBS) + 역산 마일스톤 자동 생성
  Phase 3 - 비주얼 아이덴티티: 브랜드 컬러(Hex), 디자인 무드, AI 이미지 생성 프롬프트 발급
  Phase 4 - 연사 소싱: 연사 추천 리스트 + 커스텀 초청 이메일 자동 생성
  Phase 5 - 마케팅 엔진: SNS 콘텐츠, 홈페이지 레이아웃, 오프닝 음악 생성 프롬프트
  Phase 6 - ROI 분석: 설문 텍스트 마이닝 + KPI 대시보드 + 차기 행사 제언

  비범위(Out of Scope): 실제 행사 현장 운영 시스템, 결제/티켓 판매 플랫폼, 실시간 라이브 스트리밍.

  핵심 설계 원칙:
  - Single Source of Truth: Phase 1 출력이 전체 프로젝트의 마스터 데이터
  - 컨셉 메모리 자동 주입: 확정된 디자인 컨셉이 이후 모든 Phase에 강제 연동
  - JSON 스키마 준수: 모든 에이전트 출력이 정해진 스키마로 구조화
