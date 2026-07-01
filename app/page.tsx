export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { events } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import { NewEventForm } from '@/components/NewEventForm'
import { getEventSummaryBatch } from '@/lib/summary/event-summary'
import type { EventSummary } from '@/lib/summary/event-summary'

const PHASES = [
  { num: 1, label: '행사 기획', short: 'P1' },
  { num: 2, label: 'WBS & 타임라인', short: 'P2' },
  { num: 3, label: '비주얼 아이덴티티', short: 'P3' },
  { num: 4, label: '연사 섭외', short: 'P4' },
  { num: 5, label: '마케팅 에셋', short: 'P5' },
  { num: 6, label: 'ROI 분석', short: 'P6' },
]

function formatDate(date: Date | null) {
  if (!date) return ''
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default async function HomePage() {
  const eventList = await db
    .select({ id: events.id, name: events.name, status: events.status, createdAt: events.createdAt })
    .from(events)
    .orderBy(desc(events.createdAt))
    .limit(100)

  // 단일 배치 쿼리로 모든 이벤트 요약 조회 (REQ-SUMMARY-009: N+1 방지, 총 쿼리 수 = 2)
  const summaryMap = await getEventSummaryBatch(eventList.map(e => e.id))

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">MICEstrator</h1>
            <p className="text-xs text-gray-400 mt-0.5">MICE 행사 기획 자동화 에이전트</p>
          </div>
          <NewEventForm />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* 6-Phase 소개 */}
        <div className="bg-white border rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">6단계 AI 기획 파이프라인</h2>
          <div className="grid grid-cols-6 gap-2">
            {PHASES.map((p, i) => (
              <div key={p.num} className="relative flex flex-col items-center gap-1">
                {i < PHASES.length - 1 && (
                  <div className="absolute top-4 left-[58%] w-full h-0.5 bg-gray-200 z-0" />
                )}
                <div className="relative z-10 w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {p.num}
                </div>
                <p className="text-[10px] text-center text-gray-500 leading-tight">{p.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 행사 목록 */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">행사 목록</h2>

          {eventList.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-sm font-medium">아직 기획된 행사가 없습니다.</p>
              <p className="text-xs mt-1">&quot;새 행사 만들기&quot;를 눌러 시작하세요.</p>
            </div>
          )}

          <div className="space-y-3">
            {eventList.map(event => {
              // 해당 이벤트의 요약 정보 (없을 수도 있음)
              const summary: EventSummary | undefined = summaryMap.get(event.id)
              // 의미 있는 필드가 하나 이상인지 확인
              const hasSummary = summary && (
                summary.slogan ||
                summary.preparationPeriod ||
                summary.eventScale ||
                summary.taskCount !== undefined ||
                summary.milestoneCount !== undefined ||
                summary.tone ||
                (Array.isArray(summary.speakerNames) && summary.speakerNames.length > 0)
              )

              return (
              <div
                key={event.id}
                className="bg-white border rounded-xl p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{event.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(event.createdAt)}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 flex-shrink-0">
                    {event.status ?? 'draft'}
                  </span>
                </div>

                {/* 행사 요약 칩 — Phase 1~4 데이터가 있을 때만 표시 */}
                {hasSummary && (
                  <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-gray-500">
                    {summary.slogan && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full italic truncate max-w-[160px]" title={summary.slogan}>
                        &ldquo;{summary.slogan}&rdquo;
                      </span>
                    )}
                    {summary.preparationPeriod && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                        준비기간: {summary.preparationPeriod}
                      </span>
                    )}
                    {summary.eventScale && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                        {summary.eventScale}
                      </span>
                    )}
                    {(summary.taskCount !== undefined || summary.milestoneCount !== undefined) && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                        {[
                          summary.taskCount !== undefined ? `태스크 ${summary.taskCount}개` : null,
                          summary.milestoneCount !== undefined ? `마일스톤 ${summary.milestoneCount}개` : null,
                        ].filter(Boolean).join(' / ')}
                      </span>
                    )}
                    {summary.tone && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                        톤: {summary.tone}
                      </span>
                    )}
                    {Array.isArray(summary.speakerNames) && summary.speakerNames.length > 0 && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                        연사: {summary.speakerNames.slice(0, 2).join(', ')}
                        {summary.speakerNames.length > 2 && ` +${summary.speakerNames.length - 2}명`}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {PHASES.map(p => (
                    <a
                      key={p.num}
                      href={`/event/${event.id}/phase-${p.num}`}
                      className="text-xs px-3 py-1.5 border rounded-lg text-gray-600 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 transition-colors"
                    >
                      {p.short} {p.label}
                    </a>
                  ))}
                  <a
                    href={`/event/${event.id}/report`}
                    target="_blank"
                    className="text-xs px-3 py-1.5 border border-indigo-200 rounded-lg text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 transition-colors"
                  >
                    통합 보고서
                  </a>
                </div>
              </div>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  )
}
