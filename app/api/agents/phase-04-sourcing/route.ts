import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { runPhase04Sourcing } from '@/lib/agents/phase-04-sourcing'

const InputSchema = z.object({
  eventId: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = InputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: '잘못된 요청 형식입니다.', details: parsed.error.flatten() }, { status: 400 })
    }

    const output = await runPhase04Sourcing(parsed.data)
    return NextResponse.json(output, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
