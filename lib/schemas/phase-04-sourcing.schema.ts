import { z } from 'zod'

export const SpeakerCandidateSchema = z.object({
  name: z.string().min(1),
  affiliation: z.string().min(1),
  expertise: z.string().min(1),
  proposedSession: z.string().min(1),
  isOverseas: z.boolean(),
  rationale: z.string().min(1),
  profileSummary: z.string().min(1),
  speakerTier: z.enum(['keynote', 'session', 'panel']),
})

export const Phase04SourcingOutputSchema = z.object({
  candidates: z.array(SpeakerCandidateSchema).min(3).max(8),
  strategySummary: z.string().min(1),
})

export type SpeakerCandidate = z.infer<typeof SpeakerCandidateSchema>
export type Phase04SourcingOutput = z.infer<typeof Phase04SourcingOutputSchema>
