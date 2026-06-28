import { z } from 'zod'

export const Phase05InputSchema = z.object({
  eventId: z.string().uuid(),
  confirmedSpeakers: z.array(z.string()).max(10).optional(),
  eventDate: z.string().optional(),
  registrationUrl: z.string().optional(),
})

export type Phase05Input = z.infer<typeof Phase05InputSchema>

const InstagramPostSchema = z.object({
  caption: z.string().min(1),
  hashtags: z.array(z.string()).min(3).max(10),
  imagePrompt: z.string().min(1),
  storyTextOverlay: z.string().min(1),
})

const LinkedInPostSchema = z.object({
  headline: z.string().min(1),
  body: z.string().min(1),
  callToAction: z.string().min(1),
  hashtags: z.array(z.string()).min(2).max(5),
})

const LandingPageSectionSchema = z.object({
  sectionName: z.string().min(1),
  headline: z.string().min(1),
  subtext: z.string().min(1),
  cta: z.string().nullable(),
})

const CampaignScheduleItemSchema = z.object({
  dDay: z.string().min(1),
  channel: z.string().min(1),
  action: z.string().min(1),
  keyMessage: z.string().min(1),
})

// @MX:ANCHOR: [AUTO] Phase 5 출력 계약 — SNS/랜딩페이지/캠페인 스케줄 구조.
// @MX:REASON: 마케팅 자동화 모듈(뉴스레터·SNS API)이 이 스키마를 파싱하여 발송 큐 진입.
export const Phase05OutputSchema = z.object({
  instagramPost: InstagramPostSchema,
  linkedinPost: LinkedInPostSchema,
  emailSubjectLines: z.array(z.string()).min(2).max(3),
  landingPageSections: z.array(LandingPageSectionSchema).min(3).max(6),
  openingMusicPrompt: z.string().min(1),
  campaignSchedule: z.array(CampaignScheduleItemSchema).min(3),
})

export type Phase05Output = z.infer<typeof Phase05OutputSchema>
