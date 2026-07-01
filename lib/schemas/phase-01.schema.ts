import { z } from 'zod'

// @MX:ANCHOR: [AUTO] SSoT 계약 — Phase 2~6 에이전트가 모두 이 스키마를 참조.
// @MX:REASON: 스키마 변경 시 후속 Phase 전체가 영향을 받으므로 ANCHOR로 관리.
export const Phase01InputSchema = z.object({
  eventId: z.string().uuid(),
  industry: z.string().min(1, '희망 분야를 입력하세요'),
  preparationPeriod: z.enum(['3months', '6months', '12months']),
  eventScale: z.enum(['small', 'medium', 'large']),
})

export type Phase01Input = z.infer<typeof Phase01InputSchema>

const TargetPersonaSchema = z.object({
  name: z.string(),
  role: z.string(),
  painPoints: z.array(z.string()).min(1),
  motivations: z.array(z.string()).min(1),
  expectedValue: z.string(),
})

const PestAnalysisSchema = z.object({
  political: z.string(),
  economic: z.string(),
  social: z.string(),
  technological: z.string(),
})

export const Phase01OutputSchema = z.object({
  eventNameKr: z.string().min(1),
  eventNameEn: z.string().min(1),
  slogan: z.string().min(1),
  subtitle: z.string().min(1),
  planningRationale: z.string().min(1),
  coreKeywords: z.array(z.string()).min(3).max(8),
  pestAnalysis: PestAnalysisSchema,
  // REQ-042: 타깃 페르소나 1~3명 강제
  targetPersonas: z.array(TargetPersonaSchema).min(1).max(3),
  // REQ-SUMMARY-001: 입력값 패스스루 — LLM이 생성하는 값이 아님. optional()은 하위 호환성 보장.
  preparationPeriod: z.enum(['3months', '6months', '12months']).optional(),
  eventScale: z.enum(['small', 'medium', 'large']).optional(),
  // 희망 분야 입력값 — 폼 복원용 패스스루. optional()은 하위 호환성 보장.
  industry: z.string().optional(),
})

export type Phase01Output = z.infer<typeof Phase01OutputSchema>
