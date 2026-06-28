import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { runPhase3 } from '@/lib/agents/phase-03'
import { Phase03InputSchema } from '@/lib/schemas/phase-03.schema'
import { db } from '@/lib/db'
import { phaseResults, brandMemory } from '@/lib/db/schema'

// @MX:NOTE: [AUTO] Phase 3 엔드포인트 — phaseResults(3)와 brandMemory 양쪽에 저장.
// @MX:REASON: brandMemory는 Phase 4·5가 자동 로드하는 브랜드 컨셉 메모리.
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '유효하지 않은 요청 형식입니다.' }, { status: 400 })
  }

  const parsed = Phase03InputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: '입력 값이 유효하지 않습니다.', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const output = await runPhase3(parsed.data)

    // phaseResults에 전체 출력 저장
    await db.insert(phaseResults).values({
      eventId: parsed.data.eventId,
      phaseNumber: 3,
      outputJson: output,
    })

    // brandMemory에 upsert — Phase 4·5 자동 주입용
    await db
      .insert(brandMemory)
      .values({
        eventId: parsed.data.eventId,
        primaryColor: output.primaryColor,
        secondaryColors: output.secondaryColors,
        designMood: output.designMood,
        fontStyle: output.fontStyle,
        visualKeywords: output.visualKeywords,
      })
      .onConflictDoUpdate({
        target: brandMemory.eventId,
        set: {
          primaryColor: output.primaryColor,
          secondaryColors: output.secondaryColors,
          designMood: output.designMood,
          fontStyle: output.fontStyle,
          visualKeywords: output.visualKeywords,
          updatedAt: new Date(),
        },
      })

    return NextResponse.json(output, { status: 200 })
  } catch (err) {
    const message =
      err instanceof z.ZodError
        ? 'AI 출력이 스키마를 만족하지 않습니다.'
        : err instanceof Error
          ? err.message
          : 'Phase 3 에이전트 실행 중 오류가 발생했습니다.'

    console.error('[phase-03] error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
