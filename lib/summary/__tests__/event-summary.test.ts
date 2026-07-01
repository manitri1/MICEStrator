import { describe, it, expect, vi, beforeEach, mock } from 'bun:test'

// DB 모킹: 실제 DB 호출 없이 테스트
const mockWhere = vi.fn().mockResolvedValue([])
const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

mock.module('@/lib/db', () => ({
  db: {
    select: mockSelect,
    from: mockFrom,
    where: mockWhere,
  },
}))

mock.module('@/lib/db/schema', () => ({
  phaseResults: {},
}))

mock.module('drizzle-orm', () => ({
  inArray: vi.fn((col: unknown, vals: unknown) => ({ col, vals })),
  eq: vi.fn((col: unknown, val: unknown) => ({ col, val })),
}))

import {
  PREP_PERIOD_LABEL,
  EVENT_SCALE_LABEL,
  getEventSummary,
  getEventSummaryBatch,
} from '../event-summary'

// DB mock 체인 응답 설정 헬퍼
function mockDbRows(rows: unknown[]) {
  mockWhere.mockResolvedValue(rows)
}

describe('PREP_PERIOD_LABEL / EVENT_SCALE_LABEL 상수', () => {
  it('준비 기간 레이블이 올바르게 정의되어 있어야 한다', () => {
    expect(PREP_PERIOD_LABEL['3months']).toBe('3개월')
    expect(PREP_PERIOD_LABEL['6months']).toBe('6개월')
    expect(PREP_PERIOD_LABEL['12months']).toBe('12개월')
  })

  it('행사 규모 레이블이 올바르게 정의되어 있어야 한다', () => {
    expect(EVENT_SCALE_LABEL['small']).toContain('소규모')
    expect(EVENT_SCALE_LABEL['medium']).toContain('중규모')
    expect(EVENT_SCALE_LABEL['large']).toContain('대규모')
  })
})

describe('getEventSummary', () => {
  const eventId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

  beforeEach(() => {
    vi.clearAllMocks()
    mockWhere.mockResolvedValue([])
  })

  it('phaseResults가 없을 때 기본 EventSummary를 반환해야 한다', async () => {
    mockDbRows([])
    const result = await getEventSummary(eventId)
    expect(result.eventId).toBe(eventId)
    expect(result.slogan).toBeUndefined()
    expect(result.preparationPeriod).toBeUndefined()
    expect(result.taskCount).toBeUndefined()
  })

  it('Phase 1 데이터에서 slogan, preparationPeriod, eventScale을 추출해야 한다', async () => {
    mockDbRows([
      {
        eventId,
        phaseNumber: 1,
        completedAt: new Date('2024-01-01'),
        outputJson: {
          slogan: '미래를 함께',
          preparationPeriod: '6months',
          eventScale: 'medium',
        },
      },
    ])
    const result = await getEventSummary(eventId)
    expect(result.slogan).toBe('미래를 함께')
    expect(result.preparationPeriod).toBe('6개월')
    expect(result.eventScale).toBe('중규모 (100~500명)')
  })

  it('알 수 없는 preparationPeriod는 원본 값을 유지해야 한다', async () => {
    mockDbRows([
      {
        eventId,
        phaseNumber: 1,
        completedAt: new Date('2024-01-01'),
        outputJson: {
          slogan: '슬로건',
          preparationPeriod: 'unknown-period',
          eventScale: 'small',
        },
      },
    ])
    const result = await getEventSummary(eventId)
    expect(result.preparationPeriod).toBe('unknown-period')
  })

  it('Phase 2 데이터에서 taskCount, milestoneCount를 추출해야 한다', async () => {
    mockDbRows([
      {
        eventId,
        phaseNumber: 2,
        completedAt: new Date('2024-01-02'),
        outputJson: {
          wbsTasks: [{ id: 'T1' }, { id: 'T2' }, { id: 'T3' }],
          milestones: [{ title: 'M1' }, { title: 'M2' }],
        },
      },
    ])
    const result = await getEventSummary(eventId)
    expect(result.taskCount).toBe(3)
    expect(result.milestoneCount).toBe(2)
  })

  it('Phase 3 데이터에서 tone(designMood)을 추출해야 한다', async () => {
    mockDbRows([
      {
        eventId,
        phaseNumber: 3,
        completedAt: new Date('2024-01-03'),
        outputJson: { designMood: '모던하고 세련된' },
      },
    ])
    const result = await getEventSummary(eventId)
    expect(result.tone).toBe('모던하고 세련된')
  })

  it('Phase 3 designMood 없을 때 brandPersonality로 폴백해야 한다', async () => {
    mockDbRows([
      {
        eventId,
        phaseNumber: 3,
        completedAt: new Date('2024-01-03'),
        outputJson: { brandPersonality: '전문적이고 신뢰감 있는' },
      },
    ])
    const result = await getEventSummary(eventId)
    expect(result.tone).toBe('전문적이고 신뢰감 있는')
  })

  it('Phase 4 데이터에서 speakerNames를 추출해야 한다', async () => {
    mockDbRows([
      {
        eventId,
        phaseNumber: 4,
        completedAt: new Date('2024-01-04'),
        outputJson: {
          outreachList: [
            { speakerName: '김철수' },
            { speakerName: '이영희' },
            { speakerName: '' },
            { otherField: 'no name' },
          ],
        },
      },
    ])
    const result = await getEventSummary(eventId)
    expect(result.speakerNames).toEqual(['김철수', '이영희'])
  })

  it('모든 Phase 데이터를 복합적으로 처리해야 한다', async () => {
    mockDbRows([
      {
        eventId,
        phaseNumber: 1,
        completedAt: new Date('2024-01-01'),
        outputJson: { slogan: '혁신의 현장', preparationPeriod: '3months', eventScale: 'large' },
      },
      {
        eventId,
        phaseNumber: 2,
        completedAt: new Date('2024-01-02'),
        outputJson: { wbsTasks: [1, 2, 3, 4, 5], milestones: [1, 2, 3] },
      },
      {
        eventId,
        phaseNumber: 3,
        completedAt: new Date('2024-01-03'),
        outputJson: { designMood: '다이나믹' },
      },
      {
        eventId,
        phaseNumber: 4,
        completedAt: new Date('2024-01-04'),
        outputJson: { outreachList: [{ speakerName: '홍길동' }] },
      },
    ])
    const result = await getEventSummary(eventId)
    expect(result.slogan).toBe('혁신의 현장')
    expect(result.preparationPeriod).toBe('3개월')
    expect(result.eventScale).toBe('대규모 (500명 이상)')
    expect(result.taskCount).toBe(5)
    expect(result.milestoneCount).toBe(3)
    expect(result.tone).toBe('다이나믹')
    expect(result.speakerNames).toEqual(['홍길동'])
  })

  it('동일 phaseNumber 중복 시 completedAt 최신 행을 사용해야 한다', async () => {
    mockDbRows([
      {
        eventId,
        phaseNumber: 1,
        completedAt: new Date('2024-01-01'),
        outputJson: { slogan: '구버전 슬로건' },
      },
      {
        eventId,
        phaseNumber: 1,
        completedAt: new Date('2024-02-01'),
        outputJson: { slogan: '최신 슬로건' },
      },
    ])
    const result = await getEventSummary(eventId)
    expect(result.slogan).toBe('최신 슬로건')
  })

  it('completedAt이 null인 행도 처리해야 한다', async () => {
    mockDbRows([
      {
        eventId,
        phaseNumber: 1,
        completedAt: null,
        outputJson: { slogan: 'null 타임스탬프 슬로건' },
      },
    ])
    const result = await getEventSummary(eventId)
    expect(result.slogan).toBe('null 타임스탬프 슬로건')
  })
})

describe('getEventSummaryBatch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockWhere.mockResolvedValue([])
  })

  it('빈 배열 입력 시 DB 쿼리 없이 빈 Map을 반환해야 한다', async () => {
    const result = await getEventSummaryBatch([])
    expect(result.size).toBe(0)
    expect(mockSelect).not.toHaveBeenCalled()
  })

  it('여러 eventId에 대한 요약을 Map으로 반환해야 한다', async () => {
    const id1 = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    const id2 = 'b1ffcd00-ad1c-5000-cc7e-7ccace491b22'

    mockDbRows([
      {
        eventId: id1,
        phaseNumber: 1,
        completedAt: new Date('2024-01-01'),
        outputJson: { slogan: '이벤트1 슬로건', preparationPeriod: '6months', eventScale: 'small' },
      },
      {
        eventId: id2,
        phaseNumber: 1,
        completedAt: new Date('2024-01-01'),
        outputJson: { slogan: '이벤트2 슬로건', preparationPeriod: '12months', eventScale: 'large' },
      },
    ])

    const result = await getEventSummaryBatch([id1, id2])
    expect(result.size).toBe(2)
    expect(result.get(id1)?.slogan).toBe('이벤트1 슬로건')
    expect(result.get(id2)?.slogan).toBe('이벤트2 슬로건')
  })

  it('phaseResults가 없는 eventId도 기본 요약을 포함해야 한다', async () => {
    const id1 = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    const id2 = 'b1ffcd00-ad1c-5000-cc7e-7ccace491b22'

    mockDbRows([
      {
        eventId: id1,
        phaseNumber: 1,
        completedAt: new Date('2024-01-01'),
        outputJson: { slogan: '슬로건' },
      },
    ])

    const result = await getEventSummaryBatch([id1, id2])
    expect(result.size).toBe(2)
    expect(result.get(id1)?.slogan).toBe('슬로건')
    expect(result.get(id2)?.eventId).toBe(id2)
    expect(result.get(id2)?.slogan).toBeUndefined()
  })

  it('eventId가 null인 행은 무시해야 한다', async () => {
    const id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    mockDbRows([
      {
        eventId: null,
        phaseNumber: 1,
        completedAt: new Date('2024-01-01'),
        outputJson: { slogan: '무시되어야 할 데이터' },
      },
      {
        eventId: id,
        phaseNumber: 1,
        completedAt: new Date('2024-01-01'),
        outputJson: { slogan: '유효한 슬로건' },
      },
    ])

    const result = await getEventSummaryBatch([id])
    expect(result.get(id)?.slogan).toBe('유효한 슬로건')
  })
})
