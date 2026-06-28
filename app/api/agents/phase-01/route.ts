import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { runPhase1 } from '@/lib/agents/phase-01'
import { Phase01InputSchema } from '@/lib/schemas/phase-01.schema'
import { db } from '@/lib/db'
import { phaseResults } from '@/lib/db/schema'

// @MX:NOTE: [AUTO] SSoT(event_master) 생성 엔드포인트. Phase 1 완료 시 phase_results에 저장.
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '유효하지 않은 요청 형식입니다.' }, { status: 400 })
  }

  // REQ-041: 입력 검증 실패 시 에이전트 미호출 + 400
  const parsed = Phase01InputSchema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    const FIELD_LABELS: Record<string, string> = {
      eventId: '이벤트 ID',
      industry: '희망 분야',
      preparationPeriod: '준비 기간',
      eventScale: '행사 규모',
    }
    const messages = Object.entries(fieldErrors)
      .flatMap(([field, errs]) =>
        (errs ?? []).map(e => `[${FIELD_LABELS[field] ?? field}] ${e}`)
      )
    return NextResponse.json(
      { error: messages.length ? messages.join(' / ') : '입력 값이 유효하지 않습니다.', details: fieldErrors },
      { status: 400 }
    )
  }

  try {
    // Phase 1 에이전트 실행 (generateObject — REQ-003)
    const output = await runPhase1(parsed.data)

    // REQ-011: 결과를 phase_results 테이블에 저장
    await db.insert(phaseResults).values({
      eventId: parsed.data.eventId,
      phaseNumber: 1,
      outputJson: output,
    })

    return NextResponse.json(output, { status: 200 })
  } catch (err) {
    // REQ-040: 스키마 검증 실패 또는 AI 오류 시 DB 저장 없이 500
    const message = err instanceof z.ZodError
      ? 'AI 출력이 스키마를 만족하지 않습니다.'
      : 'Phase 1 에이전트 실행 중 오류가 발생했습니다.'

    console.error('[phase-01] error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
