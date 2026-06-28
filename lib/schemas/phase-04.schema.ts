import { z } from 'zod'

const SpeakerInputSchema = z.object({
  name: z.string().min(1, '연사 이름을 입력하세요'),
  affiliation: z.string().min(1, '소속/직책을 입력하세요'),
  expertise: z.string().min(1, '전문 분야를 입력하세요'),
  proposedSession: z.string().min(1, '제안 세션명을 입력하세요'),
  isOverseas: z.boolean().default(false),
})

export type SpeakerInput = z.infer<typeof SpeakerInputSchema>

export const Phase04InputSchema = z.object({
  eventId: z.string().uuid(),
  speakers: z.array(SpeakerInputSchema).min(1).max(5),
  budgetTier: z.enum(['premium', 'standard', 'economy']).optional(),
})

export type Phase04Input = z.infer<typeof Phase04InputSchema>

const ProposalSlideSchema = z.object({
  slideNumber: z.number().int().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
})

const SpeakerOutreachSchema = z.object({
  speakerName: z.string().min(1),
  selectionRationale: z.string().min(1),
  emailSubject: z.string().min(1),
  emailBody: z.string().min(1),
  proposalSlides: z.array(ProposalSlideSchema).min(4).max(6),
})

// @MX:ANCHOR: [AUTO] Phase 4 출력 계약 — 연사별 초청 이메일 + 제안서 구조.
// @MX:REASON: 아웃리치 자동화 하류 모듈이 이 스키마를 파싱하여 발송 큐에 진입.
export const Phase04OutputSchema = z.object({
  outreachList: z.array(SpeakerOutreachSchema).min(1),
  campaignNotes: z.string().min(1),
})

export type Phase04Output = z.infer<typeof Phase04OutputSchema>
