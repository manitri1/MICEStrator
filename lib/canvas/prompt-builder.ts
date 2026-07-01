// Gemini Canvas용 한국어 프롬프트 생성 순수 함수 모음
// 입력 데이터만 받아 문자열을 반환하는 결정적 함수 — 네트워크/LLM 호출 없음 (REQ-PROMPT-014)
import type { Phase01Output } from '@/lib/schemas/phase-01.schema'
import type { Phase05Output } from '@/lib/schemas/phase-05.schema'
import type { Phase06Output } from '@/lib/schemas/phase-06.schema'

/** brandMemory 조회 응답 타입 — GET /api/brand-memory 반환 형태 */
export interface BrandMemoryData {
  primaryColor: string | null
  secondaryColors: string[] | null
  designMood: string | null
  fontStyle: string | null
  visualKeywords: string[] | null
}

/** 값이 없을 때 사용하는 fallback 상수 (REQ-PROMPT-015) */
const MISSING = '미입력'

/** 값 또는 fallback 문자열 반환 헬퍼 */
function v(value: string | null | undefined): string {
  if (!value || value.trim() === '') return MISSING
  return value
}

/** 배열을 쉼표 구분 문자열로 변환, 빈 배열은 fallback 반환 */
function list(arr: string[] | null | undefined, sep = ', '): string {
  if (!arr || arr.length === 0) return MISSING
  return arr.join(sep)
}

// @MX:ANCHOR: [AUTO] 랜딩페이지 프롬프트 계약 — 5개 섹션 구성 불변 계약.
// @MX:REASON: Gemini Canvas 결과 품질이 이 섹션 구조에 직접 의존하며, Phase 5 페이지·단위 테스트가 이 함수를 참조 (fan_in >= 3). (REQ-PROMPT-010)
/**
 * Phase 1·Phase 5·brandMemory를 조합하여 Gemini Canvas용 랜딩페이지 프롬프트를 생성한다.
 *
 * @param phase1 Phase 1 출력 (행사명·슬로건·키워드·타깃 페르소나) — null 시 "미입력" fallback 적용
 * @param phase5 Phase 5 출력 (landingPageSections 등)
 * @param brand  brandMemory 데이터 — null 시 비주얼 스타일 섹션 "미입력" 처리 (REQ-PROMPT-015)
 * @returns 한국어 랜딩페이지 프롬프트 문자열 (REQ-PROMPT-010, 012)
 */
export function buildLandingPagePrompt(
  phase1: Phase01Output | null,
  phase5: Phase05Output,
  brand: BrandMemoryData | null,
): string {
  // 섹션 1: 행사 정보
  const eventNameKr = v(phase1?.eventNameKr)
  const eventNameEn = v(phase1?.eventNameEn)
  const slogan = v(phase1?.slogan)
  const keywords = list(phase1?.coreKeywords)

  // 섹션 2: 비주얼 스타일
  const primaryColor = v(brand?.primaryColor)
  const secondaryColors = list(brand?.secondaryColors)
  const designMood = v(brand?.designMood)
  const fontStyle = v(brand?.fontStyle)
  const visualKeywords = list(brand?.visualKeywords)

  // 섹션 3: 페이지 섹션
  const sectionsText = phase5.landingPageSections
    .map((sec, idx) => {
      const ctaLine = sec.cta ? `  CTA 버튼: ${sec.cta}` : '  CTA 버튼: 없음'
      return [
        `  [섹션 ${idx + 1}] ${sec.sectionName}`,
        `  헤드라인: ${sec.headline}`,
        `  서브텍스트: ${sec.subtext}`,
        ctaLine,
      ].join('\n')
    })
    .join('\n\n')

  // 섹션 4: 타깃 사용자
  const personasText = phase1?.targetPersonas?.length
    ? phase1.targetPersonas
        .map(p => `  - ${p.name}(${p.role}): ${p.painPoints.join(', ')}`)
        .join('\n')
    : `  ${MISSING}`

  const prompt = `
당신은 Gemini Canvas를 사용하여 MICE 행사 홍보 랜딩페이지 웹 앱을 만드는 전문가입니다.
아래 행사 데이터를 기반으로 완성도 높은 한국어 반응형 랜딩페이지를 즉시 생성해 주세요.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[1] 행사 정보
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
행사명(한국어): ${eventNameKr}
행사명(영어): ${eventNameEn}
슬로건: ${slogan}
핵심 키워드: ${keywords}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[2] 비주얼 스타일 가이드
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
기본 컬러(Primary): ${primaryColor}
보조 컬러(Secondary): ${secondaryColors}
디자인 무드: ${designMood}
폰트 스타일: ${fontStyle}
비주얼 키워드: ${visualKeywords}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[3] 페이지 섹션 구성 (총 ${phase5.landingPageSections.length}개)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
각 섹션을 순서대로 화면에 배치해 주세요:

${sectionsText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[4] 타깃 사용자
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${personasText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[5] 요청 사항
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 언어: 모든 텍스트를 한국어로 작성해 주세요.
- 반응형: 모바일(375px) · 태블릿(768px) · 데스크톱(1280px) 완전 대응
- 등록 CTA: 각 섹션의 CTA 버튼을 눈에 띄게 배치하고, 상단 고정 내비게이션에도 "등록하기" 버튼 포함
- 레이아웃: 풀스크린 히어로 섹션으로 시작, 비주얼 스타일 가이드의 컬러·무드를 일관되게 적용
- 애니메이션: 부드러운 스크롤 전환 및 요소 등장 애니메이션 적용
- 접근성: 적절한 색상 대비와 시맨틱 HTML 사용

완성도 높은 단일 HTML 파일(인라인 CSS+JS 포함)을 생성해 주세요.
`.trim()

  return prompt
}

// @MX:ANCHOR: [AUTO] 대시보드 프롬프트 계약 — 6개 섹션 구성 불변 계약.
// @MX:REASON: Gemini Canvas 결과 품질이 이 섹션 구조에 직접 의존하며, Phase 6 페이지·단위 테스트가 이 함수를 참조 (fan_in >= 3). (REQ-PROMPT-011)
/**
 * Phase 1·Phase 6을 조합하여 Gemini Canvas용 사후 분석 대시보드 프롬프트를 생성한다.
 *
 * @param phase1 Phase 1 출력 (행사명) — null 시 "미입력" fallback 적용 (REQ-PROMPT-015)
 * @param phase6 Phase 6 출력 (KPI·강약점·페르소나·권고·총평)
 * @returns 한국어 대시보드 프롬프트 문자열 (REQ-PROMPT-011, 012)
 */
export function buildDashboardPrompt(
  phase1: Phase01Output | null,
  phase6: Phase06Output,
): string {
  // 섹션 1: 행사 개요
  const eventNameKr = v(phase1?.eventNameKr)

  // 섹션 2: KPI
  const kpi = phase6.kpiPerformance
  const attendanceRate = `${kpi.attendanceAchievementRate.toFixed(1)}%`
  const satisfaction = `${kpi.avgSatisfactionScore.toFixed(1)} / 5.0`
  const budgetNote = v(kpi.budgetEfficiencyNote)
  const roiLine = kpi.businessRoiNote ? `  비즈니스 ROI: ${kpi.businessRoiNote}` : null

  // 섹션 3: 강점 / 약점
  const strengthsText = phase6.topStrengths
    .map(s => `  - [${s.category}] ${s.finding} (근거: ${s.evidence})`)
    .join('\n')

  const weaknessesText = phase6.topWeaknesses
    .map(w => `  - [${w.category}] ${w.finding} (근거: ${w.evidence})`)
    .join('\n')

  // 섹션 4: 페르소나별 성과
  const personasText = phase6.personaFeedbackLoop
    .map(p => {
      const status = p.painPointResolved ? '목표 달성' : '목표 미달'
      return `  - ${p.personaName}(${p.personaRole}): ${status} — ${p.evidence}`
    })
    .join('\n')

  // 섹션 5: 차기 행사 권고
  const PRIORITY_KR: Record<string, string> = { HIGH: '필수', MID: '권장', LOW: '검토' }
  const recommendationsText = phase6.nextEventRecommendations
    .map(r => {
      const p = PRIORITY_KR[r.priority] ?? r.priority
      return `  - [${p}] ${r.actionItem}\n    전략: ${r.strategy}`
    })
    .join('\n\n')

  const kpiBlock = [
    `  출석 달성률: ${attendanceRate}`,
    `  평균 만족도: ${satisfaction}`,
    `  예산 효율: ${budgetNote}`,
    ...(roiLine ? [roiLine] : []),
  ].join('\n')

  const prompt = `
당신은 Gemini Canvas를 사용하여 MICE 행사 사후 분석 대시보드 웹 앱을 만드는 전문가입니다.
아래 행사 성과 데이터를 기반으로 경영진을 위한 인터랙티브 대시보드를 즉시 생성해 주세요.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[1] 행사 개요
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
행사명: ${eventNameKr}
종합 총평: ${phase6.executiveSummary}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[2] 핵심 KPI 지표
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${kpiBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[3] 강점 / 약점 분석
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
강점 (Top Strengths):
${strengthsText}

약점 (Top Weaknesses):
${weaknessesText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[4] 페르소나별 성과
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${personasText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[5] 차기 행사 권고사항
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${recommendationsText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[6] 요청 사항
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 언어: 모든 인터페이스 텍스트를 한국어로 작성해 주세요.
- KPI 카드: 출석 달성률·평균 만족도·예산 효율·ROI를 시각적 KPI 카드로 표시
- 차트: 강점/약점을 가로 막대 차트로, 페르소나 달성률을 도넛 차트로 시각화
- 색상 규칙: 달성(초록) / 미달(빨강) / 중립(파랑) 색상 코딩 일관 적용
- 우선순위 뱃지: 권고사항에 필수(빨강) / 권장(노랑) / 검토(초록) 뱃지 표시
- 레이아웃: 경영진용 요약 배너를 최상단에 배치, 이하 섹션별 카드 레이아웃
- 인터랙션: 탭 전환, 툴팁, 호버 효과로 데이터 탐색 편의성 제공
- 반응형: 모바일·태블릿·데스크톱 완전 대응

완성도 높은 단일 HTML 파일(인라인 CSS+JS+차트 라이브러리 CDN 포함)을 생성해 주세요.
`.trim()

  return prompt
}
