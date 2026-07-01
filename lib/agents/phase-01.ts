import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { PHASE01_SYSTEM_PROMPT } from '@/lib/prompts/phase-01.system-prompt'
import {
  Phase01InputSchema,
  Phase01OutputSchema,
  type Phase01Input,
  type Phase01Output,
} from '@/lib/schemas/phase-01.schema'

// LLM이 생성하는 필드만 포함한 스키마.
// preparationPeriod·eventScale·industry는 패스스루 필드이므로 제외한다.
// 포함하면 LLM이 enum 값을 잘못 생성("6 months" 등)하여 Zod 검증이 실패한다.
const Phase01LLMSchema = Phase01OutputSchema.omit({
  preparationPeriod: true,
  eventScale: true,
  industry: true,
})

// @MX:ANCHOR: [AUTO] Phase 1 에이전트 진입점 — API Route와 직접 호출 등 다수 호출 지점.
// @MX:REASON: SSoT(event_master) 생성 함수. 스키마·프롬프트 변경은 이 함수를 통해서만.
export async function runPhase1(input: Phase01Input): Promise<Phase01Output> {
  const validated = Phase01InputSchema.parse(input)

  const scaleLabel: Record<Phase01Input['eventScale'], string> = {
    small: '소규모 (100명 이하)',
    medium: '중규모 (100~500명)',
    large: '대규모 (500명 이상)',
  }

  const periodLabel: Record<Phase01Input['preparationPeriod'], string> = {
    '3months': '3개월',
    '6months': '6개월',
    '12months': '12개월',
  }

  const userPrompt = [
    `[행사 기획 요청]`,
    `희망 분야/산업: ${validated.industry}`,
    `준비 기간: ${periodLabel[validated.preparationPeriod]}`,
    `개최 규모: ${scaleLabel[validated.eventScale]}`,
    ``,
    `위 정보를 바탕으로 MICE 행사 기획 전략을 수립하고 event_master 데이터를 생성해주세요.`,
  ].join('\n')

  const { object } = await generateObject({
    model: openai('gpt-4o'),
    schema: Phase01LLMSchema, // 패스스루 필드 제외한 스키마
    temperature: 0.7,
    system: PHASE01_SYSTEM_PROMPT,
    prompt: userPrompt,
  })

  // 패스스루 필드는 LLM 생성 없이 입력값을 그대로 병합 (REQ-SUMMARY-001)
  return {
    ...object,
    preparationPeriod: validated.preparationPeriod,
    eventScale: validated.eventScale,
    industry: validated.industry,
  }
}
