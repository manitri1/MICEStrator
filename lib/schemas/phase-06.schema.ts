import { z } from 'zod'

export const SurveyResponseSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string(),
})

export const Phase06InputSchema = z.object({
  eventId: z.string().uuid(),

  // 참가자 현황
  targetAttendees: z.number().int().min(1),
  totalRegistered: z.number().int().min(0),
  actualAttended: z.number().int().min(0),

  // 예산 집행 (선택)
  totalBudgetKrw: z.number().int().min(0).optional(),
  totalSpentKrw: z.number().int().min(0).optional(),

  // 비즈니스 성과 (선택)
  businessMeetings: z.number().int().min(0).optional(),
  estimatedContractValueKrw: z.number().int().min(0).optional(),

  // 설문 응답
  surveyResponses: z.array(SurveyResponseSchema).min(1),
})

export type Phase06Input = z.infer<typeof Phase06InputSchema>
export type SurveyResponse = z.infer<typeof SurveyResponseSchema>

const FeedbackCategorySchema = z.enum(['콘텐츠', '베뉴', '운영', '마케팅', '연사', '네트워킹'])

const StrengthWeaknessItemSchema = z.object({
  category: FeedbackCategorySchema,
  finding: z.string().min(1),
  evidence: z.string().min(1),
})

const PersonaFeedbackSchema = z.object({
  personaName: z.string().min(1),
  personaRole: z.string().min(1),
  painPointResolved: z.boolean(),
  evidence: z.string().min(1),
})

const NextEventRecommendationSchema = z.object({
  priority: z.enum(['HIGH', 'MID', 'LOW']),
  actionItem: z.string().min(1),
  strategy: z.string().min(1),
})

const KpiPerformanceSchema = z.object({
  attendanceAchievementRate: z.number().min(0).max(200),
  avgSatisfactionScore: z.number().min(1).max(5),
  budgetEfficiencyNote: z.string().min(1),
  businessRoiNote: z.string().nullable(),
})

// @MX:ANCHOR: [AUTO] Phase 6 출력 계약 — ROI 리포트 + 차기 행사 제언 구조.
// @MX:REASON: 대시보드 시각화 및 PDF 보고서 자동 생성 노드가 이 스키마를 파싱.
export const Phase06OutputSchema = z.object({
  kpiPerformance: KpiPerformanceSchema,
  topStrengths: z.array(StrengthWeaknessItemSchema).min(1).max(3),
  topWeaknesses: z.array(StrengthWeaknessItemSchema).min(1).max(3),
  personaFeedbackLoop: z.array(PersonaFeedbackSchema).min(1),
  nextEventRecommendations: z.array(NextEventRecommendationSchema).min(2).max(5),
  executiveSummary: z.string().min(1),
})

export type Phase06Output = z.infer<typeof Phase06OutputSchema>
