import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

// @MX:NOTE: [AUTO] Phase별 편집 가능 필드 계약 — REQ-023 (AI 편집 범위 한정).
const PHASE_EDITABLE_FIELDS: Record<number, string> = {
  1: 'eventNameKr, eventNameEn, slogan, subtitle, coreKeywords[], planningRationale, pestAnalysis.{political,economic,social,technological}, targetPersonas[N].{painPoints[], motivations[]}',
  2: 'wbsTasks[N].{taskName, durationWeeks, priority}, milestones[N].{title, description}, departments[N].responsibilities[], criticalPath[]',
  3: 'primaryColor, secondaryColors[], accentColor (hex), designMood, fontStyle, brandPersonality, canvaPrompt, midjourneyPrompt, visualKeywords[]',
  4: 'speakers[N].{emailSubject, emailBody, proposalSlides[].content}, campaignNotes',
  5: 'Instagram: {caption, hashtags[], storyTextOverlay, imagePrompt}, LinkedIn: {headline, body, callToAction, hashtags[]}, emailSubjectLines[], landingPageSections[N].{headline, subtext, cta}, openingMusicPrompt, ddaySchedule[N].{action, keyMessage}',
  6: 'kpiDashboard.{budgetEfficiencyNote, businessRoiNote}, sentimentAnalysis.strengths[N].{finding, evidence}, sentimentAnalysis.weaknesses[N].finding, nextEventRecommendations[N].{actionItem, strategy}, personaValidation[N].evidence',
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: '유효하지 않은 요청 형식입니다.' }), { status: 400 })
  }

  const { phaseNumber, currentOutput, messages, context } = body as {
    phaseNumber?: number
    currentOutput?: unknown
    messages?: { role: string; content: string | Array<{ type: string; text?: string; image?: string }> }[]
    context?: string
  }

  if (!phaseNumber || phaseNumber < 1 || phaseNumber > 6) {
    return new Response(JSON.stringify({ error: 'phaseNumber는 1~6이어야 합니다.' }), { status: 400 })
  }

  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'messages 배열이 필요합니다.' }), { status: 400 })
  }

  const editableFields = PHASE_EDITABLE_FIELDS[phaseNumber]
  const contextNote = context ? `\n현재 컨텍스트: ${context}` : ''

  const systemPrompt = `당신은 MICE 행사 기획 플랫폼의 Phase ${phaseNumber} 결과 편집 어시스턴트입니다.

현재 Phase ${phaseNumber} 결과 JSON:
${JSON.stringify(currentOutput, null, 2)}

편집 가능한 필드:
${editableFields}
${contextNote}

규칙:
1. 사용자의 수정 요청을 분석하여 변경이 필요한 필드만 포함한 JSON patch를 반환하세요.
2. 변경하지 않는 필드는 절대 포함하지 마세요 (데이터 손실 방지).
3. 응답은 반드시 다음 형식으로 작성하세요:

변경 이유: (한두 문장으로 변경 내용 설명)

\`\`\`json
{
  "변경된_필드명": "새로운 값"
}
\`\`\`

4. 편집 불가능한 필드 수정 요청은 정중히 거절하세요.
5. 색상 필드(Phase 3)는 반드시 #RRGGBB 형식의 hex 코드를 사용하세요.
6. 화면 검토 요청(이미지 첨부)의 경우에는 JSON patch 없이 시각적 분석 의견과 개선 제안을 자유롭게 제공하세요.`

  const result = streamText({
    model: openai('gpt-4o'),
    system: systemPrompt,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: messages as any,
  })

  return result.toTextStreamResponse()
}
