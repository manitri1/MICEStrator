import { generateObject, jsonSchema } from 'ai'
import { openai } from '@ai-sdk/openai'
import { eq, and, desc } from 'drizzle-orm'
import { PHASE02_SYSTEM_PROMPT } from '@/lib/prompts/phase-02.system-prompt'
import {
  Phase02InputSchema,
  Phase02OutputSchema,
  type Phase02Input,
  type Phase02Output,
} from '@/lib/schemas/phase-02.schema'
import type { Phase01Output } from '@/lib/schemas/phase-01.schema'
import { db } from '@/lib/db'
import { phaseResults } from '@/lib/db/schema'

// @MX:ANCHOR: [AUTO] Phase 2 에이전트 진입점 — Phase 1 DB 결과를 읽어 WBS를 생성.
// @MX:REASON: Phase 1 outputJson 타입 캐스팅 및 DB 쿼리 로직이 집중되는 단일 진입점.
export async function runPhase2(input: Phase02Input): Promise<Phase02Output> {
  const validated = Phase02InputSchema.parse(input)

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

  const prepWeeks = phase1.coreKeywords.length > 0
    ? (phase1.targetPersonas.length >= 3 ? 24 : 12)
    : 12

  const userPrompt = [
    `[Phase 1 행사 기획 결과]`,
    `행사명 (국문): ${phase1.eventNameKr}`,
    `행사명 (영문): ${phase1.eventNameEn}`,
    `슬로건: ${phase1.slogan}`,
    `핵심 키워드: ${phase1.coreKeywords.join(', ')}`,
    `타깃 페르소나 수: ${phase1.targetPersonas.length}명`,
    ``,
    `[프로젝트 제약 조건]`,
    `총 가용 인력: ${validated.staffCount}명`,
    `총 준비 기간: 약 ${prepWeeks}주`,
    ``,
    `위 정보를 바탕으로 MICE 행사 준비를 위한 WBS(역할 분담표)와 주차별 마일스톤을 작성해주세요.`,
    `totalWeeks 값은 ${prepWeeks}으로 설정하십시오.`,
  ].join('\n')

  const { object } = await generateObject({
    model: openai('gpt-4o'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    schema: jsonSchema((Phase02OutputSchema as any).toJSONSchema()),
    temperature: 0.3,
    system: PHASE02_SYSTEM_PROMPT,
    prompt: userPrompt,
  }) as { object: Phase02Output }

  return object
}
