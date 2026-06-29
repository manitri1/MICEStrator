import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { events, phaseResults } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const PHASES = [
  { n: 1, title: '행사 기획 방향', desc: '이벤트 컨셉·타깃 페르소나·핵심 메시지 설정' },
  { n: 2, title: '조직 구조 & 일정 계획', desc: '운영 팀 구성·마스터 타임라인 수립' },
  { n: 3, title: '비주얼 아이덴티티', desc: '브랜드 컬러·폰트·디자인 가이드라인' },
  { n: 4, title: '연사 소싱 & 아웃리치', desc: '연사 후보 탐색·섭외 이메일 및 제안서' },
  { n: 5, title: '디지털 에셋 & 마케팅', desc: '랜딩페이지·SNS 캘린더·광고 카피' },
  { n: 6, title: 'ROI 분석 & 차기 제언', desc: '예산 ROI·KPI 분석·성공지표 보고' },
]

export default async function EventDashboardPage({
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
  const completedPhases = new Set(phaseRows.map(r => r.phaseNumber))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 mb-6 inline-block">
          ← 행사 목록
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{completedPhases.size} / 6 Phase 완료</p>
        </div>

        <div className="grid gap-3">
          {PHASES.map(({ n, title, desc }) => {
            const done = completedPhases.has(n)
            return (
              <Link
                key={n}
                href={`/event/${eventId}/phase-${n}`}
                className="flex items-center gap-4 bg-white border rounded-xl px-5 py-4 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <span className={`w-9 h-9 rounded-full text-sm font-bold flex items-center justify-center flex-shrink-0 ${done ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {n}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Phase {n}</span>
                    {done && (
                      <span className="text-xs text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">완료</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{desc}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300 flex-shrink-0">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            )
          })}
        </div>

        <Link
          href={`/event/${eventId}/report`}
          className="flex items-center justify-center gap-2 mt-4 w-full bg-gray-900 text-white rounded-xl px-5 py-3.5 text-sm font-semibold hover:bg-gray-700 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          통합 보고서 보기
        </Link>
      </div>
    </div>
  )
}
