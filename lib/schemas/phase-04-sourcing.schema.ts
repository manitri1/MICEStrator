import { z } from 'zod'

// 강연 링크 스키마 (YouTube, TED, 네이버TV 등 실제 URL)
export const LectureLinkSchema = z.object({
  title: z.string().min(1),
  url: z.string().min(1), // OpenAI structured output은 format:"uri" 미지원
  platform: z.string().min(1), // 예: "YouTube", "TED", "네이버TV"
})

export const SpeakerCandidateSchema = z.object({
  name: z.string().min(1),
  affiliation: z.string().min(1),
  expertise: z.string().min(1),
  proposedSession: z.string().min(1),
  isOverseas: z.boolean(),
  rationale: z.string().min(1),
  profileSummary: z.string().min(1),
  speakerTier: z.enum(['keynote', 'session', 'panel']),
  // 웹 검색으로 발굴한 실제 인물 여부 (OpenAI structured output: required 필수)
  isRealPerson: z.boolean(),
  // 검색 결과에서 추출한 강연/발표 링크 목록 (없으면 빈 배열)
  lectureLinks: z.array(LectureLinkSchema),
  // LinkedIn 또는 개인 홈페이지 URL — 없으면 null (optional 대신 nullable 사용)
  profileUrl: z.string().nullable(),
})

export const Phase04SourcingOutputSchema = z.object({
  candidates: z.array(SpeakerCandidateSchema).min(3).max(8),
  strategySummary: z.string().min(1),
})

// Stage 1: 검색 기준 생성 스키마 (실명이 아닌 유형 + 검색 쿼리)
export const SpeakerCriterionSchema = z.object({
  speakerTier: z.enum(['keynote', 'session', 'panel']),
  expertise: z.string().min(1),        // 예: "AI 디지털전환 전략"
  searchQuery: z.string().min(1),      // 예: "AI 디지털전환 한국 전문가 기조연설"
  proposedSession: z.string().min(1),  // 세션 제목 제안
  isOverseas: z.boolean(),
  rationale: z.string().min(1),
})

export const Phase04SourcingCriteriaSchema = z.object({
  criteria: z.array(SpeakerCriterionSchema).min(3).max(8),
  strategySummary: z.string().min(1),
})

export type LectureLink = z.infer<typeof LectureLinkSchema>
export type SpeakerCandidate = z.infer<typeof SpeakerCandidateSchema>
export type Phase04SourcingOutput = z.infer<typeof Phase04SourcingOutputSchema>
export type SpeakerCriterion = z.infer<typeof SpeakerCriterionSchema>
export type Phase04SourcingCriteria = z.infer<typeof Phase04SourcingCriteriaSchema>
