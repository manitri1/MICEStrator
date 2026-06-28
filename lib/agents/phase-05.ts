import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { eq, and } from 'drizzle-orm'
import { PHASE05_SYSTEM_PROMPT } from '@/lib/prompts/phase-05.system-prompt'
import {
  Phase05InputSchema,
  Phase05OutputSchema,
  type Phase05Input,
  type Phase05Output,
} from '@/lib/schemas/phase-05.schema'
import type { Phase01Output } from '@/lib/schemas/phase-01.schema'
import type { BrandMemory } from '@/lib/db/schema'
import { db } from '@/lib/db'
import { phaseResults, brandMemory } from '@/lib/db/schema'

// @MX:ANCHOR: [AUTO] Phase 5 에이전트 — 채널별 마케팅 콘텐츠 + D-Day 캠페인 스케줄 생성.
// @MX:REASON: Phase 1·3 데이터를 동시 로드하여 브랜드 일관성을 유지하는 마케팅 원천.
export async function runPhase5(input: Phase05Input): Promise<Phase05Output> {
  const validated = Phase05InputSchema.parse(input)

  const [phase1Rows, brandRows] = await Promise.all([
    db
      .select()
      .from(phaseResults)
      .where(
        and(
          eq(phaseResults.eventId, validated.eventId),
          eq(phaseResults.phaseNumber, 1)
        )
      )
      .limit(1),
    db
      .select()
      .from(brandMemory)
      .where(eq(brandMemory.eventId, validated.eventId))
      .limit(1),
  ])

  if (phase1Rows.length === 0) {
    throw new Error('Phase 1 결과가 없습니다. Phase 1을 먼저 실행해주세요.')
  }

  const phase1 = phase1Rows[0].outputJson as Phase01Output
  const brand: BrandMemory | undefined = brandRows[0]

  const brandSection = brand
    ? [
        `[Phase 3 브랜드 아이덴티티]`,
        `주 색상: ${brand.primaryColor ?? '미설정'}`,
        `보조 색상: ${(brand.secondaryColors as string[] | null)?.join(', ') ?? '미설정'}`,
        `디자인 무드: ${brand.designMood ?? '미설정'}`,
        `추천 서체: ${brand.fontStyle ?? '미설정'}`,
        `비주얼 키워드 (영문): ${(brand.visualKeywords as string[] | null)?.join(', ') ?? '미설정'}`,
      ].join('\n')
    : '[Phase 3 브랜드 아이덴티티: 아직 생성되지 않았습니다. 행사 키워드를 참고하여 직접 스타일을 추론하십시오]'

  const speakerSection =
    validated.confirmedSpeakers && validated.confirmedSpeakers.length > 0
      ? `확정 연사 라인업:\n${validated.confirmedSpeakers.map(s => `  - ${s}`).join('\n')}`
      : '확정 연사: 미입력 (Phase 1 페르소나 기반으로 이상적 연사 유형을 가정하십시오)'

  const eventDateText = validated.eventDate
    ? `행사 예정일: ${validated.eventDate}`
    : '행사 예정일: 미입력 (D-Day 기준 상대적 타임라인으로 작성)'

  const urlText = validated.registrationUrl
    ? `등록 URL: ${validated.registrationUrl}`
    : '등록 URL: [등록 링크] 플레이스홀더 사용'

  const userPrompt = [
    `[Phase 1 행사 기획 결과]`,
    `행사명 (국문): ${phase1.eventNameKr}`,
    `행사명 (영문): ${phase1.eventNameEn}`,
    `슬로건: ${phase1.slogan}`,
    `부제: ${phase1.subtitle}`,
    `핵심 키워드: ${phase1.coreKeywords.join(', ')}`,
    `타깃 페르소나:`,
    ...phase1.targetPersonas.map(
      p =>
        `  - ${p.name}(${p.role}): Pain Points — ${p.painPoints.join('; ')}\n    참석 동기: ${p.motivations.join('; ')}`
    ),
    ``,
    brandSection,
    ``,
    `[행사 운영 정보]`,
    speakerSection,
    eventDateText,
    urlText,
    ``,
    `위 정보를 바탕으로 채널별 마케팅 콘텐츠(인스타그램, 링크드인, 이메일, 랜딩페이지)와 오프닝 음악 생성 프롬프트, D-Day 캠페인 스케줄을 작성해주세요.`,
  ].join('\n')

  const { object } = await generateObject({
    model: openai('gpt-4o'),
    schema: Phase05OutputSchema,
    temperature: 0.7,
    system: PHASE05_SYSTEM_PROMPT,
    prompt: userPrompt,
  })

  return object
}
