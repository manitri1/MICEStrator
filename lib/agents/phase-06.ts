import { generateObject, jsonSchema } from 'ai'
import { openai } from '@ai-sdk/openai'
import { eq, and, desc } from 'drizzle-orm'
import { PHASE06_SYSTEM_PROMPT } from '@/lib/prompts/phase-06.system-prompt'
import {
  Phase06InputSchema,
  Phase06OutputSchema,
  type Phase06Input,
  type Phase06Output,
} from '@/lib/schemas/phase-06.schema'
import type { Phase01Output } from '@/lib/schemas/phase-01.schema'
import { db } from '@/lib/db'
import { phaseResults } from '@/lib/db/schema'

// @MX:ANCHOR: [AUTO] Phase 6 에이전트 — 사후 ROI 분석 + 페르소나 피드백 루프.
// @MX:REASON: Phase 1 타깃 페르소나를 역추적하여 행사 성과의 기획 대비 달성률을 검증.
export async function runPhase6(input: Phase06Input): Promise<Phase06Output> {
  const validated = Phase06InputSchema.parse(input)

  const phase1Rows = await db
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

  if (phase1Rows.length === 0) {
    throw new Error('Phase 1 결과가 없습니다. Phase 1을 먼저 실행해주세요.')
  }

  const phase1 = phase1Rows[0].outputJson as Phase01Output

  const budgetLines =
    validated.totalBudgetKrw !== undefined && validated.totalSpentKrw !== undefined
      ? [
          `총 예산: ${validated.totalBudgetKrw.toLocaleString('ko-KR')}원`,
          `실 집행액: ${validated.totalSpentKrw.toLocaleString('ko-KR')}원`,
          `예산 소진율: ${((validated.totalSpentKrw / validated.totalBudgetKrw) * 100).toFixed(1)}%`,
        ]
      : ['예산 데이터: 미입력']

  const businessLines =
    validated.businessMeetings !== undefined
      ? [
          `비즈니스 미팅 건수: ${validated.businessMeetings}건`,
          ...(validated.estimatedContractValueKrw !== undefined
            ? [
                `예상 계약 총액: ${validated.estimatedContractValueKrw.toLocaleString('ko-KR')}원`,
                ...(validated.totalBudgetKrw && validated.totalBudgetKrw > 0
                  ? [
                      `ROI 배수 (잠재): ${(validated.estimatedContractValueKrw / validated.totalBudgetKrw).toFixed(1)}x`,
                    ]
                  : []),
              ]
            : []),
        ]
      : ['비즈니스 성과 데이터: 미입력']

  const surveyLines = validated.surveyResponses.map(
    (r, i) => `  [${i + 1}] 평점 ${r.rating}/5 — ${r.comment}`
  )
  const avgRating =
    validated.surveyResponses.reduce((sum, r) => sum + r.rating, 0) /
    validated.surveyResponses.length

  const userPrompt = [
    `[Phase 1 기획 목표 및 페르소나]`,
    `행사명: ${phase1.eventNameKr} (${phase1.eventNameEn})`,
    `슬로건: ${phase1.slogan}`,
    `핵심 키워드: ${phase1.coreKeywords.join(', ')}`,
    `타깃 페르소나:`,
    ...phase1.targetPersonas.map(
      p =>
        `  - ${p.name}(${p.role}): Pain Points — ${p.painPoints.join('; ')}\n    참석 동기: ${p.motivations.join('; ')}`
    ),
    ``,
    `[행사 실적 데이터]`,
    `목표 참가자: ${validated.targetAttendees}명`,
    `실제 등록: ${validated.totalRegistered}명`,
    `실제 출석: ${validated.actualAttended}명`,
    `출석 달성률: ${((validated.actualAttended / validated.targetAttendees) * 100).toFixed(1)}%`,
    ``,
    `[예산 현황]`,
    ...budgetLines,
    ``,
    `[비즈니스 성과]`,
    ...businessLines,
    ``,
    `[참가자 만족도 설문 (${validated.surveyResponses.length}건, 평균 ${avgRating.toFixed(1)}/5)]`,
    ...surveyLines,
    ``,
    `위 데이터를 기반으로 Phase 6 ROI 성과 보고서를 작성해주세요. 수치 계산은 반드시 위에 제공된 숫자를 사용하십시오.`,
  ].join('\n')

  const { object } = await generateObject({
    model: openai('gpt-4o'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    schema: jsonSchema((Phase06OutputSchema as any).toJSONSchema()),
    temperature: 0.2,
    system: PHASE06_SYSTEM_PROMPT,
    prompt: userPrompt,
  }) as { object: Phase06Output }

  return object
}
