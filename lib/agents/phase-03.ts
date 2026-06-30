import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { eq, and, desc } from 'drizzle-orm'
import { PHASE03_SYSTEM_PROMPT } from '@/lib/prompts/phase-03.system-prompt'
import {
  Phase03InputSchema,
  Phase03OutputSchema,
  type Phase03Input,
  type Phase03Output,
} from '@/lib/schemas/phase-03.schema'
import type { Phase01Output } from '@/lib/schemas/phase-01.schema'
import { db } from '@/lib/db'
import { phaseResults } from '@/lib/db/schema'

const TONE_LABEL: Record<string, string> = {
  modern: '모던 & 혁신적',
  classic: '클래식 & 격식',
  bold: '대담 & 강렬',
  elegant: '우아 & 세련',
  playful: '활기 & 친근',
}

// @MX:ANCHOR: [AUTO] Phase 3 에이전트 — Visual Identity 생성 및 brandMemory 저장 트리거.
// @MX:REASON: 이 함수가 생성한 컬러/무드가 Phase 4·5 시스템 프롬프트에 자동 주입되는 원천.
export async function runPhase3(input: Phase03Input): Promise<Phase03Output> {
  const validated = Phase03InputSchema.parse(input)

  const rows = await db
    .select()
    .from(phaseResults)
    .where(
      and(
        eq(phaseResults.eventId, validated.eventId),
        eq(phaseResults.phaseNumber, 1)
      )
    )
    .orderBy(desc(phaseResults.completedAt))
    .limit(1)

  if (rows.length === 0) {
    throw new Error('Phase 1 결과가 없습니다. Phase 1을 먼저 실행해주세요.')
  }

  const phase1 = rows[0].outputJson as Phase01Output

  const toneText = validated.tonePreference
    ? `\n선호 톤: ${TONE_LABEL[validated.tonePreference]}`
    : ''

  const userPrompt = [
    `[Phase 1 행사 기획 결과]`,
    `행사명 (국문): ${phase1.eventNameKr}`,
    `행사명 (영문): ${phase1.eventNameEn}`,
    `슬로건: ${phase1.slogan}`,
    `부제: ${phase1.subtitle}`,
    `기획 배경 요약: ${phase1.planningRationale.slice(0, 200)}...`,
    `핵심 키워드: ${phase1.coreKeywords.join(', ')}`,
    `타깃 페르소나: ${phase1.targetPersonas.map(p => `${p.name}(${p.role})`).join(', ')}`,
    toneText,
    ``,
    `위 행사 컨셉에 최적화된 비주얼 아이덴티티(컬러 팔레트, 디자인 무드, 생성 AI 프롬프트)를 설계해주세요.`,
  ].join('\n')

  const { object } = await generateObject({
    model: openai('gpt-4o'),
    schema: Phase03OutputSchema,
    temperature: 0.7,
    system: PHASE03_SYSTEM_PROMPT,
    prompt: userPrompt,
  })

  return object
}
