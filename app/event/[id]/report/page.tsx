import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { events, phaseResults } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import type { Phase01Output } from '@/lib/schemas/phase-01.schema'
import type { Phase02Output } from '@/lib/schemas/phase-02.schema'
import type { Phase03Output } from '@/lib/schemas/phase-03.schema'
import type { Phase04Output } from '@/lib/schemas/phase-04.schema'
import type { Phase05Output } from '@/lib/schemas/phase-05.schema'
import type { Phase06Output } from '@/lib/schemas/phase-06.schema'
import { Phase1Section } from './sections/Phase1Section'
import { Phase2Section } from './sections/Phase2Section'
import { Phase3Section } from './sections/Phase3Section'
import { Phase4Section } from './sections/Phase4Section'
import { Phase5Section } from './sections/Phase5Section'
import { Phase6Section } from './sections/Phase6Section'
import { PrintControls } from './PrintControls'

const PHASE_LABELS: Record<number, string> = {
  1: 'Phase 1 — 행사 기획 방향',
  2: 'Phase 2 — 조직 구조 & 일정 계획',
  3: 'Phase 3 — 비주얼 아이덴티티',
  4: 'Phase 4 — 연사 소싱 & 아웃리치',
  5: 'Phase 5 — 디지털 에셋 & 마케팅',
  6: 'Phase 6 — ROI 분석 & 차기 제언',
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: eventId } = await params

  const [eventRows, phaseRows] = await Promise.all([
    db.select().from(events).where(eq(events.id, eventId)).limit(1),
    db.select().from(phaseResults).where(eq(phaseResults.eventId, eventId)),
  ])

  if (eventRows.length === 0) notFound()

  const event = eventRows[0]

  const phaseMap: Record<number, unknown> = {}
  for (const row of phaseRows) {
    phaseMap[row.phaseNumber] = row.outputJson
  }

  const phase1 = phaseMap[1] as Phase01Output | undefined
  const phase2 = phaseMap[2] as Phase02Output | undefined
  const phase3 = phaseMap[3] as Phase03Output | undefined
  const phase4 = phaseMap[4] as Phase04Output | undefined
  const phase5 = phaseMap[5] as Phase05Output | undefined
  const phase6 = phaseMap[6] as Phase06Output | undefined

  const completedPhases = [1, 2, 3, 4, 5, 6].filter(n => phaseMap[n])
  const date = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header toolbar (print-hide) */}
        <div className="print-hide flex items-center justify-between mb-8 gap-4 flex-wrap">
          <Link href={`/event/${eventId}`} className="text-sm text-gray-500 hover:text-gray-700">
            ← 행사로 돌아가기
          </Link>
          <PrintControls eventId={eventId} eventName={event.name} />
        </div>

        {/* Cover */}
        <div className="bg-white border rounded-2xl p-8 mb-2">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-3">
            MICE Planning Report
          </p>
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">{event.name}</h1>
          <p className="mt-2 text-sm text-gray-400">생성일: {date}</p>

          {completedPhases.length === 0 && (
            <div className="mt-6 bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-sm text-amber-700">아직 실행된 Phase가 없습니다. 각 Phase를 실행한 후 보고서를 확인하세요.</p>
            </div>
          )}

          {completedPhases.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-semibold text-gray-500 mb-3">목차</p>
              <nav className="space-y-1.5">
                {completedPhases.map(n => (
                  <a
                    key={n}
                    href={`#phase-${n}`}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                  >
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {n}
                    </span>
                    {PHASE_LABELS[n]}
                  </a>
                ))}
              </nav>
            </div>
          )}
        </div>

        {/* Phase sections */}
        <div className="bg-white border rounded-2xl px-8 py-2 space-y-0">
          {phase1 ? <Phase1Section data={phase1} /> : <SkippedPhase n={1} />}
          {phase2 ? <Phase2Section data={phase2} /> : <SkippedPhase n={2} />}
          {phase3 ? <Phase3Section data={phase3} /> : <SkippedPhase n={3} />}
          {phase4 ? <Phase4Section data={phase4} /> : <SkippedPhase n={4} />}
          {phase5 ? <Phase5Section data={phase5} /> : <SkippedPhase n={5} />}
          {phase6 ? <Phase6Section data={phase6} /> : <SkippedPhase n={6} />}
          <div className="pb-8" />
        </div>
      </div>
    </div>
  )
}

function SkippedPhase({ n }: { n: number }) {
  return (
    <div id={`phase-${n}`} className="print-break-before pt-8">
      <div className="flex items-center gap-3 border-b pb-4 mb-4">
        <span className="w-8 h-8 rounded-full bg-gray-200 text-gray-400 text-sm font-bold flex items-center justify-center flex-shrink-0">
          {n}
        </span>
        <h2 className="text-xl font-bold text-gray-400">{PHASE_LABELS[n]}</h2>
      </div>
      <p className="text-sm text-gray-400 italic">이 Phase는 아직 실행되지 않았습니다.</p>
    </div>
  )
}
