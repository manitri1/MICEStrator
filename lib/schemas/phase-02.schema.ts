import { z } from 'zod'

export const Phase02InputSchema = z.object({
  eventId: z.string().uuid(),
  staffCount: z.number().int().min(1).max(50),
})

export type Phase02Input = z.infer<typeof Phase02InputSchema>

const DepartmentSchema = z.object({
  name: z.string().min(1),
  headRole: z.string().min(1),
  teamSize: z.number().int().min(1).max(20),
  responsibilities: z.array(z.string()).min(2).max(6),
})

const WbsTaskSchema = z.object({
  id: z.string().min(1),
  department: z.string().min(1),
  taskName: z.string().min(1),
  startWeek: z.number().int().min(1),
  durationWeeks: z.number().int().min(1),
  dependencies: z.array(z.string()),
  priority: z.enum(['high', 'medium', 'low']),
})

const MilestoneSchema = z.object({
  week: z.number().int().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  responsible: z.string().min(1),
  isCritical: z.boolean(),
})

// @MX:ANCHOR: [AUTO] Phase 2 출력 계약 — Phase 3~6가 역할 분담/일정을 참조.
// @MX:REASON: WBS/마일스톤 구조 변경 시 후속 Phase 전체에 영향.
export const Phase02OutputSchema = z.object({
  departments: z.array(DepartmentSchema).min(2).max(6),
  wbsTasks: z.array(WbsTaskSchema).min(5),
  milestones: z.array(MilestoneSchema).min(3),
  totalWeeks: z.number().int().min(4),
  criticalPath: z.array(z.string()),
})

export type Phase02Output = z.infer<typeof Phase02OutputSchema>
