import { describe, it, expect } from 'vitest'
import { buildLandingPagePrompt, buildDashboardPrompt, type BrandMemoryData } from '../prompt-builder'
import type { Phase01Output } from '@/lib/schemas/phase-01.schema'
import type { Phase05Output } from '@/lib/schemas/phase-05.schema'
import type { Phase06Output } from '@/lib/schemas/phase-06.schema'

// 테스트 픽스처
const phase1Mock: Phase01Output = {
  eventNameKr: '미래 기술 컨퍼런스',
  eventNameEn: 'Future Tech Conference',
  slogan: '혁신을 함께 만들다',
  subtitle: '기술의 미래를 탐구하는 현장',
  planningRationale: 'AI·빅데이터 융합 분야 선도 인재 네트워킹',
  coreKeywords: ['AI', '빅데이터', '클라우드', '혁신', '미래'],
  pestAnalysis: {
    political: '정부 디지털 전환 정책',
    economic: 'IT 투자 증가',
    social: 'MZ세대 기술 관심',
    technological: 'AI 발전',
  },
  targetPersonas: [
    {
      name: '김개발',
      role: '시니어 개발자',
      painPoints: ['최신 기술 습득 어려움'],
      motivations: ['기술 트렌드 파악'],
      expectedValue: '실무 지식 습득',
    },
  ],
}

const phase5Mock: Phase05Output = {
  instagramPost: {
    caption: '미래 기술의 현장에서 만나요!',
    hashtags: ['#AI', '#컨퍼런스', '#혁신'],
    imagePrompt: '미래적인 컨퍼런스 홀',
    storyTextOverlay: '2024 Future Tech',
  },
  linkedinPost: {
    headline: '미래 기술의 혁신을 경험하세요',
    body: '국내 최대 IT 컨퍼런스에 참석하세요.',
    callToAction: '지금 등록하기',
    hashtags: ['#Tech', '#Innovation'],
  },
  emailSubjectLines: ['미래 기술 컨퍼런스 얼리버드 등록', '혁신의 현장으로 초대합니다'],
  landingPageSections: [
    {
      sectionName: '히어로',
      headline: '미래를 바꾸는 기술',
      subtext: '업계 최고 전문가들과 함께하세요',
      cta: '지금 등록하기',
    },
    {
      sectionName: '행사 소개',
      headline: '왜 참가해야 하나요?',
      subtext: '최신 트렌드와 인사이트를 얻어가세요',
      cta: null,
    },
    {
      sectionName: '연사 소개',
      headline: '업계 최고 전문가',
      subtext: '다양한 분야의 전문가들이 함께합니다',
      cta: '연사 더 보기',
    },
  ],
  openingMusicPrompt: '활기차고 미래지향적인 음악',
  campaignSchedule: [
    { dDay: 'D-60', channel: 'SNS', action: '얼리버드 홍보', keyMessage: '선착순 할인' },
    { dDay: 'D-30', channel: '이메일', action: '초대장 발송', keyMessage: '참가 안내' },
    { dDay: 'D-7', channel: '전체', action: '리마인더', keyMessage: '곧 개최됩니다' },
  ],
}

const brandMock: BrandMemoryData = {
  primaryColor: '#1A73E8',
  secondaryColors: ['#34A853', '#EA4335'],
  designMood: '모던하고 혁신적인',
  fontStyle: '산세리프 계열',
  visualKeywords: ['미래적', '기술적', '역동적'],
}

const phase6Mock: Phase06Output = {
  kpiPerformance: {
    attendanceAchievementRate: 92.5,
    avgSatisfactionScore: 4.3,
    budgetEfficiencyNote: '예산 대비 105% 효율 달성',
    businessRoiNote: '비즈니스 ROI 220%',
  },
  topStrengths: [
    { category: '콘텐츠', finding: '세션 구성 우수', evidence: '만족도 4.5점' },
  ],
  topWeaknesses: [
    { category: '운영', finding: '등록 대기 시간 과다', evidence: '평균 20분 대기' },
  ],
  personaFeedbackLoop: [
    {
      personaName: '김개발',
      personaRole: '시니어 개발자',
      painPointResolved: true,
      evidence: '기술 세션 높은 평가',
    },
  ],
  nextEventRecommendations: [
    {
      priority: 'HIGH',
      actionItem: '사전 등록 시스템 개선',
      strategy: '온라인 등록 전용 채널 구축',
    },
    {
      priority: 'MID',
      actionItem: '네트워킹 시간 확대',
      strategy: '행사 전후 30분 네트워킹 세션 추가',
    },
  ],
  executiveSummary: '전반적으로 성공적인 행사였으며, 참가자 만족도가 높았습니다.',
}

describe('buildLandingPagePrompt', () => {
  it('비어 있지 않은 문자열을 반환해야 한다', () => {
    const result = buildLandingPagePrompt(phase1Mock, phase5Mock, brandMock)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('행사 이름을 포함해야 한다', () => {
    const result = buildLandingPagePrompt(phase1Mock, phase5Mock, brandMock)
    expect(result).toContain('미래 기술 컨퍼런스')
    expect(result).toContain('Future Tech Conference')
  })

  it('슬로건을 포함해야 한다', () => {
    const result = buildLandingPagePrompt(phase1Mock, phase5Mock, brandMock)
    expect(result).toContain('혁신을 함께 만들다')
  })

  it('핵심 키워드를 포함해야 한다', () => {
    const result = buildLandingPagePrompt(phase1Mock, phase5Mock, brandMock)
    expect(result).toContain('AI')
    expect(result).toContain('빅데이터')
  })

  it('비주얼 스타일 가이드 섹션을 포함해야 한다', () => {
    const result = buildLandingPagePrompt(phase1Mock, phase5Mock, brandMock)
    expect(result).toContain('#1A73E8')
    expect(result).toContain('모던하고 혁신적인')
    expect(result).toContain('산세리프 계열')
  })

  it('페이지 섹션 수를 포함해야 한다', () => {
    const result = buildLandingPagePrompt(phase1Mock, phase5Mock, brandMock)
    expect(result).toContain('3개')
  })

  it('각 랜딩페이지 섹션의 헤드라인을 포함해야 한다', () => {
    const result = buildLandingPagePrompt(phase1Mock, phase5Mock, brandMock)
    expect(result).toContain('미래를 바꾸는 기술')
    expect(result).toContain('왜 참가해야 하나요?')
  })

  it('CTA가 null인 섹션은 "없음"으로 표시해야 한다', () => {
    const result = buildLandingPagePrompt(phase1Mock, phase5Mock, brandMock)
    expect(result).toContain('CTA 버튼: 없음')
  })

  it('CTA가 있는 섹션은 CTA 텍스트를 포함해야 한다', () => {
    const result = buildLandingPagePrompt(phase1Mock, phase5Mock, brandMock)
    expect(result).toContain('지금 등록하기')
  })

  it('타깃 사용자(페르소나) 정보를 포함해야 한다', () => {
    const result = buildLandingPagePrompt(phase1Mock, phase5Mock, brandMock)
    expect(result).toContain('김개발')
    expect(result).toContain('시니어 개발자')
  })

  it('5개 섹션 구분자를 포함해야 한다', () => {
    const result = buildLandingPagePrompt(phase1Mock, phase5Mock, brandMock)
    expect(result).toContain('[1] 행사 정보')
    expect(result).toContain('[2] 비주얼 스타일 가이드')
    expect(result).toContain('[3] 페이지 섹션 구성')
    expect(result).toContain('[4] 타깃 사용자')
    expect(result).toContain('[5] 요청 사항')
  })

  it('phase1이 null일 때 fallback "미입력"을 사용해야 한다', () => {
    const result = buildLandingPagePrompt(null, phase5Mock, brandMock)
    expect(result).toContain('미입력')
  })

  it('brand가 null일 때 비주얼 스타일 섹션에 "미입력"을 사용해야 한다', () => {
    const result = buildLandingPagePrompt(phase1Mock, phase5Mock, null)
    expect(result).toContain('미입력')
    // 행사 정보는 여전히 포함되어야 함
    expect(result).toContain('미래 기술 컨퍼런스')
  })

  it('targetPersonas가 없을 때 "미입력"을 사용해야 한다', () => {
    const noPersonasPhase1 = { ...phase1Mock, targetPersonas: [] }
    // targetPersonas가 빈 배열이면 "미입력" 처리
    const result = buildLandingPagePrompt(noPersonasPhase1 as Phase01Output, phase5Mock, brandMock)
    expect(result).toContain('미입력')
  })
})

describe('buildDashboardPrompt', () => {
  it('비어 있지 않은 문자열을 반환해야 한다', () => {
    const result = buildDashboardPrompt(phase1Mock, phase6Mock)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('행사명을 포함해야 한다', () => {
    const result = buildDashboardPrompt(phase1Mock, phase6Mock)
    expect(result).toContain('미래 기술 컨퍼런스')
  })

  it('종합 총평을 포함해야 한다', () => {
    const result = buildDashboardPrompt(phase1Mock, phase6Mock)
    expect(result).toContain('전반적으로 성공적인 행사였으며')
  })

  it('KPI 지표(출석률, 만족도)를 포함해야 한다', () => {
    const result = buildDashboardPrompt(phase1Mock, phase6Mock)
    expect(result).toContain('92.5%')
    expect(result).toContain('4.3 / 5.0')
  })

  it('강점/약점을 포함해야 한다', () => {
    const result = buildDashboardPrompt(phase1Mock, phase6Mock)
    expect(result).toContain('세션 구성 우수')
    expect(result).toContain('등록 대기 시간 과다')
  })

  it('페르소나별 성과를 포함해야 한다', () => {
    const result = buildDashboardPrompt(phase1Mock, phase6Mock)
    expect(result).toContain('김개발')
    expect(result).toContain('목표 달성')
  })

  it('painPointResolved가 false일 때 "목표 미달"을 표시해야 한다', () => {
    const phase6WithUnresolved: Phase06Output = {
      ...phase6Mock,
      personaFeedbackLoop: [
        {
          personaName: '이영희',
          personaRole: '마케터',
          painPointResolved: false,
          evidence: '네트워킹 기회 부족',
        },
      ],
    }
    const result = buildDashboardPrompt(phase1Mock, phase6WithUnresolved)
    expect(result).toContain('목표 미달')
  })

  it('권고사항 우선순위 한국어 변환을 포함해야 한다', () => {
    const result = buildDashboardPrompt(phase1Mock, phase6Mock)
    expect(result).toContain('[필수]')
    expect(result).toContain('[권장]')
  })

  it('LOW 우선순위는 "[검토]"로 변환해야 한다', () => {
    const phase6WithLow: Phase06Output = {
      ...phase6Mock,
      nextEventRecommendations: [
        { priority: 'HIGH', actionItem: '아이템1', strategy: '전략1' },
        { priority: 'LOW', actionItem: '검토 아이템', strategy: '검토 전략' },
      ],
    }
    const result = buildDashboardPrompt(phase1Mock, phase6WithLow)
    expect(result).toContain('[검토]')
  })

  it('businessRoiNote가 있을 때 ROI 줄을 포함해야 한다', () => {
    const result = buildDashboardPrompt(phase1Mock, phase6Mock)
    expect(result).toContain('비즈니스 ROI')
    expect(result).toContain('비즈니스 ROI 220%')
  })

  it('businessRoiNote가 null일 때 ROI 줄을 포함하지 않아야 한다', () => {
    const phase6NoRoi: Phase06Output = {
      ...phase6Mock,
      kpiPerformance: { ...phase6Mock.kpiPerformance, businessRoiNote: null },
    }
    const result = buildDashboardPrompt(phase1Mock, phase6NoRoi)
    // ROI 줄이 없어야 함
    expect(result).not.toContain('비즈니스 ROI:')
  })

  it('6개 섹션 구분자를 포함해야 한다', () => {
    const result = buildDashboardPrompt(phase1Mock, phase6Mock)
    expect(result).toContain('[1] 행사 개요')
    expect(result).toContain('[2] 핵심 KPI 지표')
    expect(result).toContain('[3] 강점 / 약점 분석')
    expect(result).toContain('[4] 페르소나별 성과')
    expect(result).toContain('[5] 차기 행사 권고사항')
    expect(result).toContain('[6] 요청 사항')
  })

  it('phase1이 null일 때 행사명에 "미입력"을 사용해야 한다', () => {
    const result = buildDashboardPrompt(null, phase6Mock)
    expect(result).toContain('미입력')
    // KPI 데이터는 여전히 포함되어야 함
    expect(result).toContain('92.5%')
  })
})
