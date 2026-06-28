import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { runPhase5 } from '@/lib/agents/phase-05'
import { Phase05InputSchema } from '@/lib/schemas/phase-05.schema'
import { db } from '@/lib/db'
import { phaseResults } from '@/lib/db/schema'

// @MX:NOTE: [AUTO] Phase 5 엔드포인트 — 채널별 마케팅 콘텐츠 생성. Phase 1 필수, Phase 3 권장.
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '유효하지 않은 요청 형식입니다.' }, { status: 400 })
  }

  const parsed = Phase05InputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: '입력 값이 유효하지 않습니다.', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const output = await runPhase5(parsed.data)

    await db.insert(phaseResults).values({
      eventId: parsed.data.eventId,
      phaseNumber: 5,
      outputJson: output,
    })

    return NextResponse.json(output, { status: 200 })
  } catch (err) {
    const message =
      err instanceof z.ZodError
        ? 'AI 출력이 스키마를 만족하지 않습니다.'
        : err instanceof Error
          ? err.message
          : 'Phase 5 에이전트 실행 중 오류가 발생했습니다.'

    console.error('[phase-05] error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
