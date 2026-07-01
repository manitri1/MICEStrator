import { generateObject, jsonSchema } from 'ai'
import { openai } from '@ai-sdk/openai'
import { eq, and, desc } from 'drizzle-orm'
import { PHASE04_SYSTEM_PROMPT } from '@/lib/prompts/phase-04.system-prompt'
import {
  Phase04InputSchema,
  Phase04OutputSchema,
  type Phase04Input,
  type Phase04Output,
} from '@/lib/schemas/phase-04.schema'
import type { Phase01Output } from '@/lib/schemas/phase-01.schema'
import type { BrandMemory } from '@/lib/db/schema'
import { db } from '@/lib/db'
import { phaseResults, brandMemory } from '@/lib/db/schema'

const BUDGET_LABEL: Record<string, string> = {
  premium: '프리미엄 (해외 연사 항공·5성급 호텔 전액 지원)',
  standard: '스탠다드 (국내선 또는 근거리 해외 연사 지원)',
  economy: '이코노미 (거마비 중심, 교통비 실비 정산)',
}

// @MX:ANCHOR: [AUTO] Phase 4 에이전트 — 연사별 맞춤 초청 이메일 + PPT 아웃라인 생성.
// @MX:REASON: Phase 1 + brandMemory를 동시에 로드하는 유일한 진입점. 아웃리치 자동화 원천.
export async function runPhase4(input: Phase04Input): Promise<Phase04Output> {
  const validated = Phase04InputSchema.parse(input)

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
      .orderBy(desc(phaseResults.completedAt))
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
        `디자인 무드: ${brand.designMood ?? '미설정'}`,
        `서체: ${brand.fontStyle ?? '미설정'}`,
        `비주얼 키워드: ${(brand.visualKeywords as string[] | null)?.join(', ') ?? '미설정'}`,
      ].join('\n')
    : '[Phase 3 브랜드 아이덴티티: 아직 생성되지 않았습니다]'

  const speakerList = validated.speakers
    .map(
      (s, i) =>
        `연사 ${i + 1}: ${s.name} (${s.affiliation})\n` +
        `  전문 분야: ${s.expertise}\n` +
        `  제안 세션: ${s.proposedSession}\n` +
        `  해외 연사 여부: ${s.isOverseas ? '예 (항공·숙박 지원 필요)' : '아니오'}`
    )
    .join('\n\n')

  const budgetText = validated.budgetTier
    ? `예산 등급: ${BUDGET_LABEL[validated.budgetTier]}`
    : '예산 등급: 미지정'

  const userPrompt = [
    `[Phase 1 행사 기획 결과]`,
    `행사명 (국문): ${phase1.eventNameKr}`,
    `행사명 (영문): ${phase1.eventNameEn}`,
    `슬로건: ${phase1.slogan}`,
    `부제: ${phase1.subtitle}`,
    `기획 배경 요약: ${phase1.planningRationale.slice(0, 300)}...`,
    `핵심 키워드: ${phase1.coreKeywords.join(', ')}`,
    `타깃 페르소나:`,
    ...phase1.targetPersonas.map(
      p => `  - ${p.name}(${p.role}): Pain Points — ${p.painPoints.join('; ')}`
    ),
    ``,
    brandSection,
    ``,
    `[초청 연사 목록]`,
    speakerList,
    ``,
    budgetText,
    ``,
    `위 정보를 바탕으로 각 연사에게 보낼 맞춤형 초청 이메일과 제안서 PPT 아웃라인을 작성해주세요.`,
  ].join('\n')

  const { object } = await generateObject({
    model: openai('gpt-4o'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    schema: jsonSchema((Phase04OutputSchema as any).toJSONSchema()),
    temperature: 0.7,
    system: PHASE04_SYSTEM_PROMPT,
    prompt: userPrompt,
  }) as { object: Phase04Output }

  return object
}
