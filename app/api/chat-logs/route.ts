import { NextRequest, NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { phaseChatLogs } from '@/lib/db/schema'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('eventId')
  const phase = searchParams.get('phase')

  if (!eventId || !phase) {
    return NextResponse.json({ error: 'eventId, phase 파라미터가 필요합니다.' }, { status: 400 })
  }

  const phaseNumber = Number(phase)
  if (!Number.isInteger(phaseNumber) || phaseNumber < 1 || phaseNumber > 6) {
    return NextResponse.json({ error: 'phase는 1~6 사이 정수여야 합니다.' }, { status: 400 })
  }

  const rows = await db
    .select()
    .from(phaseChatLogs)
    .where(and(eq(phaseChatLogs.eventId, eventId), eq(phaseChatLogs.phaseNumber, phaseNumber)))
    .limit(1)

  if (rows.length === 0) {
    return NextResponse.json({ messages: [] }, { status: 200 })
  }

  return NextResponse.json({ messages: rows[0].messages }, { status: 200 })
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '유효하지 않은 요청 형식입니다.' }, { status: 400 })
  }

  const { eventId, phaseNumber: phaseRaw, messages } = body as {
    eventId?: unknown
    phaseNumber?: unknown
    messages?: unknown
  }

  if (typeof eventId !== 'string' || !eventId) {
    return NextResponse.json({ error: 'eventId가 필요합니다.' }, { status: 400 })
  }

  const phaseNumber = Number(phaseRaw)
  if (!Number.isInteger(phaseNumber) || phaseNumber < 1 || phaseNumber > 6) {
    return NextResponse.json({ error: 'phaseNumber는 1~6 사이 정수여야 합니다.' }, { status: 400 })
  }

  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: 'messages는 배열이어야 합니다.' }, { status: 400 })
  }

  // upsert: uniqueIndex(eventId, phaseNumber) 기준 1행 유지
  await db
    .insert(phaseChatLogs)
    .values({ eventId, phaseNumber, messages })
    .onConflictDoUpdate({
      target: [phaseChatLogs.eventId, phaseChatLogs.phaseNumber],
      set: { messages, updatedAt: new Date() },
    })

  return NextResponse.json({ ok: true }, { status: 200 })
}
