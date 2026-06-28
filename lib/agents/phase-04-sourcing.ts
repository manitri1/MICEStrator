import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { db } from '../db'
import { phaseResults } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import type { Phase01Output } from '../schemas/phase-01.schema'
import { Phase04SourcingOutputSchema, type Phase04SourcingOutput } from '../schemas/phase-04-sourcing.schema'
import { PHASE04_SOURCING_SYSTEM_PROMPT } from '../prompts/phase-04-sourcing.system-prompt'

interface Phase04SourcingInput {
  eventId: string
}

export async function runPhase04Sourcing(input: Phase04SourcingInput): Promise<Phase04SourcingOutput> {
  const rows = await db
    .select()
    .from(phaseResults)
    .where(and(eq(phaseResults.eventId, input.eventId), eq(phaseResults.phaseNumber, 1)))
    .limit(1)

  if (rows.length === 0) {
    throw new Error('Phase 1 결과가 없습니다. Phase 1을 먼저 실행해 주세요.')
  }

  const phase1 = rows[0].outputJson as Phase01Output

  const userPrompt = `다음 MICE 행사의 연사 후보를 발굴해 주세요.

행사명: ${phase1.eventNameKr} (${phase1.eventNameEn})
슬로건: ${phase1.slogan}
핵심 키워드: ${phase1.coreKeywords.join(', ')}

타깃 페르소나:
${phase1.targetPersonas.map(p => `- ${p.name} (${p.role}): Pain Points — ${p.painPoints.join(', ')}`).join('\n')}

기획 배경:
${phase1.planningRationale}

위 정보를 기반으로 행사에 최적화된 연사 후보 3~8명을 발굴하고, 각 후보의 전문성이 타깃 페르소나의 Pain Point를 어떻게 해결할 수 있는지 설명해 주세요.`

  const { object } = await generateObject({
    model: openai('gpt-4o'),
    schema: Phase04SourcingOutputSchema,
    temperature: 0.8,
    system: PHASE04_SOURCING_SYSTEM_PROMPT,
    prompt: userPrompt,
  })

  return object
}
