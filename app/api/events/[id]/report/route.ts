import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { events, phaseResults } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { buildMarkdown } from '@/lib/reports/to-markdown'
import type { Phase01Output } from '@/lib/schemas/phase-01.schema'
import type { Phase02Output } from '@/lib/schemas/phase-02.schema'
import type { Phase03Output } from '@/lib/schemas/phase-03.schema'
import type { Phase04Output } from '@/lib/schemas/phase-04.schema'
import type { Phase05Output } from '@/lib/schemas/phase-05.schema'
import type { Phase06Output } from '@/lib/schemas/phase-06.schema'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params

  const [eventRows, phaseRows] = await Promise.all([
    db.select().from(events).where(eq(events.id, eventId)).limit(1),
    db.select().from(phaseResults).where(eq(phaseResults.eventId, eventId)),
  ])

  if (eventRows.length === 0) {
    return NextResponse.json({ error: '행사를 찾을 수 없습니다.' }, { status: 404 })
  }

  const event = eventRows[0]
  const phaseMap: Record<number, unknown> = {}
  for (const row of phaseRows) {
    phaseMap[row.phaseNumber] = row.outputJson
  }

  const markdown = buildMarkdown(event.name, {
    phase1: (phaseMap[1] as Phase01Output) ?? null,
    phase2: (phaseMap[2] as Phase02Output) ?? null,
    phase3: (phaseMap[3] as Phase03Output) ?? null,
    phase4: (phaseMap[4] as Phase04Output) ?? null,
    phase5: (phaseMap[5] as Phase05Output) ?? null,
    phase6: (phaseMap[6] as Phase06Output) ?? null,
  })

  const filename = encodeURIComponent(`${event.name}-report.md`)
  return new NextResponse(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename*=UTF-8''${filename}`,
    },
  })
}
