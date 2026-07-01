import { describe, it, expect } from 'vitest'
import { Phase02InputSchema, Phase02OutputSchema } from '../phase-02.schema'
import { ZodError } from 'zod'

// 유효한 Phase02Output 픽스처
const validDepartment = {
  name: '기획팀',
  headRole: '기획팀장',
  teamSize: 5,
  responsibilities: ['전체 일정 관리', '예산 기획', '운영 매뉴얼 작성'],
}

const validWbsTask = {
  id: 'TASK-001',
  department: '기획팀',
  taskName: '행사 기획서 작성',
  startWeek: 1,
  durationWeeks: 2,
  dependencies: [],
  priority: 'high',
}

const validMilestone = {
  week: 4,
  title: '기획 완료',
  description: '전체 행사 기획서 완성 및 승인',
  responsible: '기획팀장',
  isCritical: true,
}

const validOutput = {
  departments: [validDepartment, { ...validDepartment, name: '마케팅팀', headRole: '마케팅팀장' }],
  wbsTasks: [
    validWbsTask,
    { ...validWbsTask, id: 'TASK-002', taskName: '장소 섭외' },
    { ...validWbsTask, id: 'TASK-003', taskName: '연사 섭외' },
    { ...validWbsTask, id: 'TASK-004', taskName: '홍보 계획' },
    { ...validWbsTask, id: 'TASK-005', taskName: '등록 시스템 구축' },
  ],
  milestones: [
    validMilestone,
    { ...validMilestone, week: 8, title: '홍보 시작', isCritical: false },
    { ...validMilestone, week: 12, title: '행사 완료', isCritical: true },
  ],
  totalWeeks: 12,
  criticalPath: ['TASK-001', 'TASK-003'],
}

describe('Phase02InputSchema', () => {
  it('유효한 입력을 파싱해야 한다', () => {
    const valid = {
      eventId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      staffCount: 10,
    }
    const result = Phase02InputSchema.parse(valid)
    expect(result.staffCount).toBe(10)
  })

  it('staffCount는 1~50 사이여야 한다', () => {
    const base = { eventId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' }
    expect(() => Phase02InputSchema.parse({ ...base, staffCount: 0 })).toThrow(ZodError)
    expect(() => Phase02InputSchema.parse({ ...base, staffCount: 51 })).toThrow(ZodError)
    expect(Phase02InputSchema.parse({ ...base, staffCount: 1 }).staffCount).toBe(1)
    expect(Phase02InputSchema.parse({ ...base, staffCount: 50 }).staffCount).toBe(50)
  })

  it('UUID 형식이 아닌 eventId를 거부해야 한다', () => {
    expect(() =>
      Phase02InputSchema.parse({ eventId: 'bad-id', staffCount: 5 }),
    ).toThrow(ZodError)
  })
})

describe('Phase02OutputSchema', () => {
  it('유효한 출력을 파싱해야 한다', () => {
    const result = Phase02OutputSchema.parse(validOutput)
    expect(result.departments).toHaveLength(2)
    expect(result.wbsTasks).toHaveLength(5)
    expect(result.milestones).toHaveLength(3)
    expect(result.totalWeeks).toBe(12)
  })

  it('departments는 2~6개 사이여야 한다', () => {
    // 1개 → 실패
    expect(() =>
      Phase02OutputSchema.parse({ ...validOutput, departments: [validDepartment] }),
    ).toThrow(ZodError)

    // 7개 → 실패
    const tooMany = Array(7).fill(validDepartment)
    expect(() =>
      Phase02OutputSchema.parse({ ...validOutput, departments: tooMany }),
    ).toThrow(ZodError)
  })

  it('wbsTasks는 5개 이상이어야 한다', () => {
    expect(() =>
      Phase02OutputSchema.parse({
        ...validOutput,
        wbsTasks: validOutput.wbsTasks.slice(0, 4),
      }),
    ).toThrow(ZodError)
  })

  it('milestones는 3개 이상이어야 한다', () => {
    expect(() =>
      Phase02OutputSchema.parse({
        ...validOutput,
        milestones: validOutput.milestones.slice(0, 2),
      }),
    ).toThrow(ZodError)
  })

  it('totalWeeks는 4 이상이어야 한다', () => {
    expect(() =>
      Phase02OutputSchema.parse({ ...validOutput, totalWeeks: 3 }),
    ).toThrow(ZodError)
    expect(Phase02OutputSchema.parse({ ...validOutput, totalWeeks: 4 }).totalWeeks).toBe(4)
  })

  it('WbsTask의 priority는 high/medium/low 중 하나여야 한다', () => {
    const invalidTask = { ...validWbsTask, priority: 'urgent' }
    const tasks = Array(5).fill(invalidTask)
    expect(() =>
      Phase02OutputSchema.parse({ ...validOutput, wbsTasks: tasks }),
    ).toThrow(ZodError)
  })

  it('department의 responsibilities는 2~6개 사이여야 한다', () => {
    const tooFew = { ...validDepartment, responsibilities: ['하나만'] }
    expect(() =>
      Phase02OutputSchema.parse({
        ...validOutput,
        departments: [tooFew, validDepartment],
      }),
    ).toThrow(ZodError)
  })

  it('milestone의 isCritical 필드는 boolean이어야 한다', () => {
    const invalidMilestone = { ...validMilestone, isCritical: 'yes' }
    expect(() =>
      Phase02OutputSchema.parse({
        ...validOutput,
        milestones: [invalidMilestone, validMilestone, validMilestone],
      }),
    ).toThrow(ZodError)
  })
})
