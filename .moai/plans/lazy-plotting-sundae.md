# MICEstrator 피치덱 슬라이드 15장

## Context

MICEstrator의 내부 발표 및 프로젝트 소개용 15장짜리 피치덱을 Markdown 파일로 제작한다.

- 청중: 내부 팀원, 경영진, 관심 있는 동료 — 기술과 제품 가치를 균형 있게 전달
- 산출물: `pitch-deck.md` (프로젝트 루트) — 이후 Canva/PPT로 디자인 적용 예정
- 작성자: 솔로 개발자 (1인 프로젝트), 팀원 슬라이드는 창업자 소개로 대체
- Traction 슬라이드: 실제 수치 대신 구현 완료 사실과 데모 가능 상태만 기재

---

## 산출물

신규 파일 1개:

| 파일 | 역할 |
| --- | --- |
| `pitch-deck.md` | 슬라이드 15장 콘텐츠 (프로젝트 루트 위치) |

---

## 슬라이드 구성 (15장)

### Slide 1 — Cover (표지)

- 제목: MICEstrator
- 부제: AI가 기획하는 완벽한 행사 — 아이디어에서 ROI까지 6단계
- 태그라인: "MICE 기획의 수십 시간, 단 1시간으로"
- 배경 콘셉트: 행사장 + AI 파이프라인 아이콘 흐름

---

### Slide 2 — Problem: 기획자의 현실

- 헤드라인: 행사 1건 기획에 평균 200시간 이상
- Pain Point 3가지:
  - 분산된 작업: 기획서·WBS·브랜드·이메일·마케팅을 각기 다른 툴로 작업
  - 일관성 부재: 기획서의 컨셉이 마케팅 카피에 반영되지 않음
  - ROI 검증 불가: 행사 종료 후 성과 분석을 체계적으로 수행하는 기획사 10% 미만

---

### Slide 3 — Solution: 6단계 AI 파이프라인

- 헤드라인: 아이디어 3줄 → 완성된 기획서 1시간
- 6-Phase 흐름: [기획] → [WBS] → [브랜드] → [연사] → [마케팅] → [ROI]
- 핵심: 각 Phase가 이전 결과를 자동 인계, 사용자는 핵심 입력만 제공

---

### Slide 4 — Product Demo: 입력 vs. 출력

- 헤드라인: 입력 3줄 → 산출물 50+
- 입력 예시: 업종 = "디지털 헬스케어", 준비 기간 = 3개월, 규모 = 중규모(150명)
- 출력 예시: 행사명·슬로건·부제, PEST 분석, 페르소나 3명, WBS 30+ 태스크, 색상 팔레트 + AI 이미지 프롬프트, 연사 초청 이메일 3통, 인스타·링크드인·이메일 카피, D-60 캠페인 캘린더, KPI 대시보드

---

### Slide 5 — How It Works: 기술 구조

- 헤드라인: 데이터가 Phase 간 자동으로 흐른다
- 아키텍처: 사용자 입력 → Phase 1 (SSoT) → PostgreSQL → Phase 2~6 순차·병렬 실행
- 차별점: Phase 3 brandMemory가 Phase 4·5 AI 프롬프트에 자동 주입 → 브랜드 일관성

---

### Slide 6 — Phase 1~3 Showcase: 기획 → 브랜드

- 헤드라인: 15분 만에 완성되는 기획 기반
- Phase 1: 행사명 "2026 헬스케어 AI 서밋", 슬로건, 페르소나 3명
- Phase 2: 총 16주 · WBS 28개 태스크 · 임계 경로 7단계
- Phase 3: Primary #1A5276(로열 블루), 무드 "혁신적이면서 신뢰감", Canva 프롬프트

---

### Slide 7 — Phase 4~6 Showcase: 실행 → 성과

- 헤드라인: 기획에서 멈추지 않는다 — 실행과 성과 측정까지
- Phase 4: 연사 3인 초청 이메일 + PPT 아웃라인 (전송 준비 완료)
- Phase 5: 인스타그램 캡션 + D-60 캠페인 스케줄 + 랜딩페이지 구성
- Phase 6: 참석 달성률 94%, 평균 만족도 4.3/5, 페르소나별 Pain Point 해결 상태

---

### Slide 8 — Market Size: 글로벌 MICE 시장

- 헤드라인: $1.5조 규모 시장, AI 도입률 5% 미만
- TAM: $1.5T (글로벌 MICE 시장, 2025)
- SAM: $45B (디지털 기획 솔루션 대상)
- SOM: $500M (한국·아시아 SMB 기획사 첫 3년)
- 성장 드라이버: 포스트-팬데믹 수요 급증, ESG 행사 증가, AI 도입 가속화

---

### Slide 9 — Business Model: 수익 구조

- 헤드라인: Phase당 과금 → 연간 구독 전환
- Freemium: Phase 1 무료 (리드 확보)
- Pay-per-Phase: Phase 2~6 개별 과금 (₩5,000~₩15,000/Phase)
- Pro 구독: 월 ₩99,000 (무제한 실행 + 팀 협업 + 우선 지원)
- LTV 추정: 기획사 1곳 = 월 10~30건 → ₩3,600,000+/년

---

### Slide 10 — Competitive Landscape: 경쟁 분석

- 헤드라인: "AI MICE 기획" 전문 솔루션은 없다
- 비교: MICEstrator vs ChatGPT/Claude vs Cvent 등 이벤트 SaaS vs 수작업
- 포지셔닝: MICE 도메인 깊이 × AI 자동화 × End-to-End 파이프라인의 교차점 단독 점유

---

### Slide 11 — Technology Moat: 기술적 해자

- 헤드라인: 5가지 기술 경쟁 우위
  1. Phase-to-Phase 데이터 연속성: DB SSoT로 다음 Phase 자동 주입
  2. 도메인 특화 프롬프트: MICE 15~20년 경력 페르소나 + CoT 추론
  3. brandMemory 자동 주입: Phase 3 브랜드가 Phase 4·5까지 일관성 보장
  4. 타입 세이프 AI 출력: Zod + GPT-4o Structured Output → 신뢰 가능한 JSON
  5. 멀티채널 동시 생성: 1회 실행으로 인스타·링크드인·이메일·랜딩페이지 동시 산출

---

### Slide 12 — Go-to-Market Strategy

- 헤드라인: 이벤트사 PM → 대기업 행사팀 → 플랫폼 API
- 1단계(0~6개월): 소규모 이벤트 기획사 직접 영업, PMF 검증
- 2단계(6~18개월): 대기업 행사 부서 B2B, 협회·학회 파트너십
- 3단계(18개월+): API 개방, 글로벌 확장(일본·동남아)

---

### Slide 13 — Traction & Validation

- 헤드라인: 6-Phase 풀스택 구현 완료, 데모 즉시 가능
- 구현 완료: Next.js 16 + GPT-4o + Drizzle ORM + Supabase 전체 스택
- Phase 1→6 완전 실행 가능 (입력 3필드 → 산출물 50+)
- 통합 보고서 발행 (웹 뷰 + PDF 인쇄 + Markdown 다운로드)
- 연사 AI 추천 기능 (Phase 4 sourcing agent, 브랜드 컨텍스트 반영)
- 다음 단계: 베타 기획사 5곳 PoC 진행 예정

---

### Slide 14 — Builder: 만든 사람

- 헤드라인: 1인 개발자가 만든 엔드투엔드 MICE AI 시스템
- 역할: 기획·설계·프론트엔드·백엔드·AI 프롬프트 엔지니어링 전담
- 기술 스택: Next.js 16, TypeScript, OpenAI GPT-4o, Vercel AI SDK, Drizzle ORM, Supabase
- 특기: MICE 도메인 이해 + AI 파이프라인 설계 + 제품 UX 구현 원스톱

---

### Slide 15 — Next Steps

- 헤드라인: 함께 MICE 산업을 바꿔갑시다
- 내부 제안:
  - 베타 파트너 기획사 5곳 PoC 예산 확보
  - 실사용 피드백 수집 후 Phase 1~3 UI 고도화
  - 다국어(영어) 지원 추가
- 외부 제안(선택):
  - MICE 업계 커뮤니티 공개 데모
  - 이벤트 SaaS 플랫폼 통합 파트너십 협의
- CTA: 데모 바로 실행 가능 — localhost 또는 Vercel 배포 URL

---

## 구현 방법

`manager-docs` subagent를 사용해 `pitch-deck.md` 생성:

- 각 슬라이드를 `## Slide N — 제목` 헤더로 구분
- 슬라이드 내용을 bullet 리스트 + 표 + 코드 블록 조합으로 작성
- 슬라이드 상단에 `> 헤드라인` blockquote로 핵심 메시지 강조
- 파일 상단에 슬라이드 목차(링크) 포함

---

## 검증 방법

- `pitch-deck.md` 파일 직접 확인 (VS Code Preview 또는 GitHub Markdown 렌더)
- 슬라이드 번호 15개 확인
- 각 슬라이드 헤드라인·핵심 내용 포함 여부 검토
- Canva/PPT 붙여넣기 테스트

---

Version: 2.0.0
Target: 내부 발표 / 프로젝트 소개
Format: Markdown 문서 (pitch-deck.md)
