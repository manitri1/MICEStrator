// GET /api/brand-memory?eventId=<uuid>
// @MX:NOTE: [AUTO] brandMemory 조회 전용 엔드포인트 — brand_memory 테이블 단건 조회, 부재 시 null 반환.
// brandMemory는 Phase 3 완료 후 upsert 되므로 Phase 3 미실행 시 null이 정상 응답임. (REQ-PROMPT-013)
import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { brandMemory } from '@/lib/db/schema'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('eventId')

  // eventId 입력 검증 (TRUST 5 Secured)
  if (!eventId || typeof eventId !== 'string' || eventId.trim() === '') {
    return NextResponse.json({ error: 'eventId 파라미터가 필요합니다.' }, { status: 400 })
  }

  // UUID 형식 간단 검증
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_RE.test(eventId)) {
    return NextResponse.json({ error: 'eventId는 UUID 형식이어야 합니다.' }, { status: 400 })
  }

  const rows = await db
    .select()
    .from(brandMemory)
    .where(eq(brandMemory.eventId, eventId))
    .limit(1)

  if (rows.length === 0) {
    // brandMemory 미존재 — Phase 3 미실행 상태. null 반환으로 graceful 처리 (REQ-PROMPT-015)
    return NextResponse.json(null, { status: 200 })
  }

  const row = rows[0]
  return NextResponse.json(
    {
      primaryColor: row.primaryColor,
      secondaryColors: row.secondaryColors,
      designMood: row.designMood,
      fontStyle: row.fontStyle,
      visualKeywords: row.visualKeywords,
    },
    { status: 200 },
  )
}
