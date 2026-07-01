import { describe, it, expect } from 'vitest'
import { Phase01InputSchema, Phase01OutputSchema } from '../phase-01.schema'
import { ZodError } from 'zod'

// Phase01InputSchema 테스트
describe('Phase01InputSchema', () => {
  it('유효한 입력을 파싱해야 한다', () => {
    const valid = {
      eventId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      industry: 'IT',
      preparationPeriod: '6months',
      eventScale: 'medium',
    }
    const result = Phase01InputSchema.parse(valid)
    expect(result.eventId).toBe(valid.eventId)
    expect(result.industry).toBe('IT')
    expect(result.preparationPeriod).toBe('6months')
    expect(result.eventScale).toBe('medium')
  })

  it('UUID 형식이 아닌 eventId는 거부해야 한다', () => {
    const invalid = {
      eventId: 'not-a-uuid',
      industry: 'IT',
      preparationPeriod: '6months',
      eventScale: 'medium',
    }
    expect(() => Phase01InputSchema.parse(invalid)).toThrow(ZodError)
  })

  it('빈 industry를 거부해야 한다', () => {
    const invalid = {
      eventId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      industry: '',
      preparationPeriod: '6months',
      eventScale: 'medium',
    }
    expect(() => Phase01InputSchema.parse(invalid)).toThrow(ZodError)
  })

  it('유효하지 않은 preparationPeriod enum을 거부해야 한다', () => {
    const invalid = {
      eventId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      industry: 'IT',
      preparationPeriod: '1month',
      eventScale: 'medium',
    }
    expect(() => Phase01InputSchema.parse(invalid)).toThrow(ZodError)
  })

  it('유효하지 않은 eventScale enum을 거부해야 한다', () => {
    const invalid = {
      eventId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      industry: 'IT',
      preparationPeriod: '3months',
      eventScale: 'huge',
    }
    expect(() => Phase01InputSchema.parse(invalid)).toThrow(ZodError)
  })

  it('모든 preparationPeriod enum 값을 수용해야 한다', () => {
    const periods = ['3months', '6months', '12months'] as const
    for (const period of periods) {
      const result = Phase01InputSchema.parse({
        eventId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        industry: 'IT',
        preparationPeriod: period,
        eventScale: 'small',
      })
      expect(result.preparationPeriod).toBe(period)
    }
  })
})

// Phase01OutputSchema 테스트
describe('Phase01OutputSchema', () => {
  const validOutput = {
    eventNameKr: '미래 기술 컨퍼런스',
    eventNameEn: 'Future Tech Conference',
    slogan: '미래를 함께 만들어가다',
    subtitle: '혁신의 현장에서 만나다',
    planningRationale: '국내 IT 산업 성장을 위한 행사',
    coreKeywords: ['AI', '빅데이터', '클라우드', '혁신'],
    pestAnalysis: {
      political: '정부의 디지털 전환 정책',
      economic: 'IT 투자 증가 추세',
      social: 'MZ세대의 기술 관심',
      technological: 'AI/ML 기술 발전',
    },
    targetPersonas: [
      {
        name: '김개발',
        role: '시니어 개발자',
        painPoints: ['최신 기술 습득 부족', '네트워킹 기회 부재'],
        motivations: ['기술 트렌드 파악', '커리어 성장'],
        expectedValue: '실무 적용 가능한 지식 습득',
      },
    ],
  }

  it('필수 필드를 모두 포함한 유효한 출력을 파싱해야 한다', () => {
    const result = Phase01OutputSchema.parse(validOutput)
    expect(result.eventNameKr).toBe('미래 기술 컨퍼런스')
    expect(result.eventNameEn).toBe('Future Tech Conference')
    expect(result.coreKeywords).toHaveLength(4)
    expect(result.targetPersonas).toHaveLength(1)
  })

  it('preparationPeriod, eventScale, industry는 optional이어야 한다', () => {
    // optional 필드 없이 파싱 가능해야 한다
    const result = Phase01OutputSchema.parse(validOutput)
    expect(result.preparationPeriod).toBeUndefined()
    expect(result.eventScale).toBeUndefined()
    expect(result.industry).toBeUndefined()
  })

  it('optional 패스스루 필드를 포함한 출력을 파싱해야 한다', () => {
    const withPassthrough = {
      ...validOutput,
      preparationPeriod: '12months',
      eventScale: 'large',
      industry: 'AI/ML',
    }
    const result = Phase01OutputSchema.parse(withPassthrough)
    expect(result.preparationPeriod).toBe('12months')
    expect(result.eventScale).toBe('large')
    expect(result.industry).toBe('AI/ML')
  })

  it('coreKeywords는 3개 이상 8개 이하여야 한다', () => {
    // 2개 → 실패
    expect(() =>
      Phase01OutputSchema.parse({ ...validOutput, coreKeywords: ['A', 'B'] }),
    ).toThrow(ZodError)

    // 9개 → 실패
    expect(() =>
      Phase01OutputSchema.parse({
        ...validOutput,
        coreKeywords: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
      }),
    ).toThrow(ZodError)

    // 3개 → 성공
    const result = Phase01OutputSchema.parse({
      ...validOutput,
      coreKeywords: ['A', 'B', 'C'],
    })
    expect(result.coreKeywords).toHaveLength(3)
  })

  it('targetPersonas는 1~3명 사이여야 한다', () => {
    // 0명 → 실패
    expect(() =>
      Phase01OutputSchema.parse({ ...validOutput, targetPersonas: [] }),
    ).toThrow(ZodError)

    // 4명 → 실패
    const persona = validOutput.targetPersonas[0]
    expect(() =>
      Phase01OutputSchema.parse({
        ...validOutput,
        targetPersonas: [persona, persona, persona, persona],
      }),
    ).toThrow(ZodError)

    // 3명 → 성공
    const result = Phase01OutputSchema.parse({
      ...validOutput,
      targetPersonas: [persona, persona, persona],
    })
    expect(result.targetPersonas).toHaveLength(3)
  })

  it('targetPersona의 painPoints와 motivations는 각각 1개 이상이어야 한다', () => {
    const invalidPersona = {
      name: '김개발',
      role: '개발자',
      painPoints: [],
      motivations: ['기술 습득'],
      expectedValue: '지식',
    }
    expect(() =>
      Phase01OutputSchema.parse({ ...validOutput, targetPersonas: [invalidPersona] }),
    ).toThrow(ZodError)
  })

  it('필수 필드가 없으면 ZodError를 던져야 한다', () => {
    expect(() => Phase01OutputSchema.parse({})).toThrow(ZodError)
  })

  it('빈 문자열 필드를 거부해야 한다', () => {
    expect(() =>
      Phase01OutputSchema.parse({ ...validOutput, eventNameKr: '' }),
    ).toThrow(ZodError)
  })

  it('유효하지 않은 preparationPeriod enum을 거부해야 한다', () => {
    expect(() =>
      Phase01OutputSchema.parse({ ...validOutput, preparationPeriod: 'invalid' }),
    ).toThrow(ZodError)
  })
})
