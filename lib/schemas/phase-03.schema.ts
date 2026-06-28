import { z } from 'zod'

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Hex 색상 코드 형식이 아닙니다 (#RRGGBB)')

export const Phase03InputSchema = z.object({
  eventId: z.string().uuid(),
  tonePreference: z.enum(['modern', 'classic', 'bold', 'elegant', 'playful']).optional(),
})

export type Phase03Input = z.infer<typeof Phase03InputSchema>

// @MX:ANCHOR: [AUTO] Phase 3 출력 계약 — brandMemory 테이블 + Phase 4·5 시스템 프롬프트에 자동 주입.
// @MX:REASON: 브랜드 아이덴티티는 전체 파이프라인의 시각적 일관성 SSoT.
export const Phase03OutputSchema = z.object({
  primaryColor: hexColor,
  secondaryColors: z.array(hexColor).min(1).max(3),
  accentColor: hexColor,
  designMood: z.string().min(1),
  fontStyle: z.string().min(1),
  visualKeywords: z.array(z.string()).min(3).max(6),
  colorRationale: z.string().min(1),
  brandPersonality: z.string().min(1),
  canvaPrompt: z.string().min(1),
  midjourneyPrompt: z.string().min(1),
})

export type Phase03Output = z.infer<typeof Phase03OutputSchema>
