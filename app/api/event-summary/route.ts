// GET /api/event-summary?eventId=<uuid>
// @MX:NOTE: [AUTO] 단건 이벤트 요약 조회 엔드포인트 — Phase 페이지에서 on-demand 호출.
// 오류 발생 시 빈 요약 또는 error 필드 반환으로 graceful 처리 (REQ-SUMMARY-015).
import { NextRequest, NextResponse } from 'next/server'
import { getEventSummary } from '@/lib/summary/event-summary'

// UUID 형식 검증 정규식
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('eventId')

  // eventId 입력 검증 (TRUST 5 Secured)
  if (!eventId || typeof eventId !== 'string' || eventId.trim() === '') {
    return NextResponse.json({ error: 'eventId 파라미터가 필요합니다.' }, { status: 400 })
  }

  // UUID 형식 간단 검증
  if (!UUID_RE.test(eventId)) {
    return NextResponse.json({ error: 'eventId는 UUID 형식이어야 합니다.' }, { status: 400 })
  }

  try {
    const summary = await getEventSummary(eventId)
    return NextResponse.json(summary, { status: 200 })
  } catch (err) {
    // 오류 발생 시 500 반환 — 프론트엔드는 graceful 처리 (REQ-SUMMARY-015)
    const message = err instanceof Error ? err.message : '알 수 없는 오류'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
