import { NextRequest, NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { phaseResults } from '@/lib/db/schema'

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
    .from(phaseResults)
    .where(and(eq(phaseResults.eventId, eventId), eq(phaseResults.phaseNumber, phaseNumber)))
    .orderBy(phaseResults.completedAt)
    .limit(1)

  if (rows.length === 0) {
    return NextResponse.json(null, { status: 200 })
  }

  return NextResponse.json(rows[0].outputJson, { status: 200 })
}
