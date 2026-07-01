import { NextRequest, NextResponse } from 'next/server'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { phaseResults } from '@/lib/db/schema'

// UUID v4 형식 검증 정규식
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// @MX:ANCHOR: [AUTO] Phase 신선도(staleness) 조회 엔드포인트 — Phase 1 재실행 여부를 하위 Phase UI에 노출
// @MX:REASON: GET /api/phase-staleness는 대시보드·PhaseCard 등 다수 컴포넌트에서 호출됨 (fan_in >= 3)
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const eventId = searchParams.get('eventId')
  const phaseParam = searchParams.get('phase')

  // 입력값 검증: eventId는 UUID, phase는 1~6 정수
  if (!eventId || !UUID_REGEX.test(eventId)) {
    return NextResponse.json(
      { error: 'eventId는 유효한 UUID 형식이어야 합니다.' },
      { status: 400 }
    )
  }

  const phaseNumber = Number(phaseParam)
  if (!phaseParam || !Number.isInteger(phaseNumber) || phaseNumber < 1 || phaseNumber > 6) {
    return NextResponse.json(
      { error: 'phase는 1~6 사이의 정수여야 합니다.' },
      { status: 400 }
    )
  }

  try {
    // Phase 1의 가장 최근 completedAt 조회
    const [phase1Row] = await db
      .select({ completedAt: phaseResults.completedAt })
      .from(phaseResults)
      .where(and(eq(phaseResults.eventId, eventId), eq(phaseResults.phaseNumber, 1)))
      .orderBy(desc(phaseResults.completedAt))
      .limit(1)

    // Phase 1 결과가 없으면 비교 불가 → stale 아님
    if (!phase1Row) {
      return NextResponse.json(
        { isStale: false, staleSince: null, outdatedByPhases: [] },
        { status: 200 }
      )
    }

    // 대상 Phase의 가장 최근 completedAt 조회
    const [targetRow] = await db
      .select({ completedAt: phaseResults.completedAt })
      .from(phaseResults)
      .where(and(eq(phaseResults.eventId, eventId), eq(phaseResults.phaseNumber, phaseNumber)))
      .orderBy(desc(phaseResults.completedAt))
      .limit(1)

    // 대상 Phase가 아직 실행되지 않은 경우 → stale 아님 (미실행 상태)
    if (!targetRow) {
      return NextResponse.json(
        { isStale: false, staleSince: null, outdatedByPhases: [] },
        { status: 200 }
      )
    }

    // Phase 1이 대상 Phase보다 최신이면 → stale
    const phase1Time = phase1Row.completedAt?.getTime() ?? 0
    const targetTime = targetRow.completedAt?.getTime() ?? 0

    if (phase1Time > targetTime) {
      return NextResponse.json(
        {
          isStale: true,
          staleSince: phase1Row.completedAt?.toISOString() ?? null,
          outdatedByPhases: [1],
        },
        { status: 200 }
      )
    }

    // 최신 상태 → stale 아님
    return NextResponse.json(
      { isStale: false, staleSince: null, outdatedByPhases: [] },
      { status: 200 }
    )
  } catch (err) {
    // 페이지 크래시 방지: DB 오류 시에도 graceful 응답
    console.error('[phase-staleness] error:', err)
    return NextResponse.json(
      { error: 'Phase 신선도 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
