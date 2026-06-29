'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import type { Phase06Output, SurveyResponse } from '@/lib/schemas/phase-06.schema'
import { PhaseChat } from '@/components/PhaseChat'

type TabKey = 'kpi' | 'sentiment' | 'persona' | 'recommendations'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'kpi', label: 'KPI 대시보드' },
  { key: 'sentiment', label: '설문 분석' },
  { key: 'persona', label: '페르소나 검증' },
  { key: 'recommendations', label: '차기 제언' },
]

const PRIORITY_STYLE: Record<string, string> = {
  HIGH: 'bg-red-50 text-red-700 border-red-200',
  MID: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  LOW: 'bg-green-50 text-green-700 border-green-200',
}

const PRIORITY_LABEL: Record<string, string> = {
  HIGH: '필수',
  MID: '권장',
  LOW: '검토',
}

const CATEGORY_COLORS: Record<string, string> = {
  콘텐츠: 'bg-blue-100 text-blue-700',
  베뉴: 'bg-purple-100 text-purple-700',
  운영: 'bg-orange-100 text-orange-700',
  마케팅: 'bg-pink-100 text-pink-700',
  연사: 'bg-indigo-100 text-indigo-700',
  네트워킹: 'bg-teal-100 text-teal-700',
}

function StarRating({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg
          key={i}
          className={`w-4 h-4 ${i <= Math.round(score) ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-sm font-bold text-gray-700">{score.toFixed(1)}</span>
    </div>
  )
}

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border rounded-xl p-5 space-y-1">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 leading-relaxed">{sub}</p>}
    </div>
  )
}

export default function Phase6Page() {
  const { id: eventId } = useParams<{ id: string }>()
  const [targetAttendees, setTargetAttendees] = useState('')
  const [totalRegistered, setTotalRegistered] = useState('')
  const [actualAttended, setActualAttended] = useState('')
  const [totalBudgetKrw, setTotalBudgetKrw] = useState('')
  const [totalSpentKrw, setTotalSpentKrw] = useState('')
  const [businessMeetings, setBusinessMeetings] = useState('')
  const [estimatedContractValueKrw, setEstimatedContractValueKrw] = useState('')
  const [surveys, setSurveys] = useState<SurveyResponse[]>([
    { rating: 5, comment: '' },
    { rating: 4, comment: '' },
    { rating: 3, comment: '' },
  ])

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Phase06Output | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('kpi')

  useEffect(() => {
    fetch(`/api/phase-result?eventId=${eventId}&phase=6`)
      .then(r => r.json())
      .then(data => { if (data) setResult(data) })
      .catch(() => {})
  }, [eventId])

  function addSurvey() {
    if (surveys.length < 20) setSurveys(prev => [...prev, { rating: 4, comment: '' }])
  }

  function removeSurvey(i: number) {
    if (surveys.length > 1) setSurveys(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateSurvey(i: number, field: keyof SurveyResponse, value: string | number) {
    setSurveys(prev => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validSurveys = surveys.filter(s => s.comment.trim() !== '')
    if (validSurveys.length === 0) {
      setError('설문 응답을 최소 1건 이상 입력해주세요.')
      return
    }

    setLoading(true)
    setError(null)

    const body: Record<string, unknown> = {
      eventId,
      targetAttendees: Number(targetAttendees),
      totalRegistered: Number(totalRegistered),
      actualAttended: Number(actualAttended),
      surveyResponses: validSurveys,
    }
    if (totalBudgetKrw && totalSpentKrw) {
      body.totalBudgetKrw = Number(totalBudgetKrw)
      body.totalSpentKrw = Number(totalSpentKrw)
    }
    if (businessMeetings) {
      body.businessMeetings = Number(businessMeetings)
      if (estimatedContractValueKrw)
        body.estimatedContractValueKrw = Number(estimatedContractValueKrw)
    }

    try {
      const res = await fetch('/api/agents/phase-06', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? '에이전트 실행에 실패했습니다.')
      }
      setResult(await res.json())
      setActiveTab('kpi')
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Phase 6 — 사후 관리 & 효과 측정</h1>
        <p className="mt-1 text-sm text-gray-500">
          행사 실적 데이터와 설문 응답을 입력하면 ROI 성과 보고서와 차기 제언을 자동 생성합니다.
        </p>
      </div>

      {/* 입력 폼 */}
      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
        {/* 참가자 현황 */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-gray-800">참가자 현황</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '목표 참가자', value: targetAttendees, set: setTargetAttendees, required: true },
              { label: '실제 등록', value: totalRegistered, set: setTotalRegistered, required: true },
              { label: '실제 출석', value: actualAttended, set: setActualAttended, required: true },
            ].map(({ label, value, set, required }) => (
              <div key={label}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {label}{required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <input
                  type="number"
                  min="0"
                  required={required}
                  disabled={loading}
                  value={value}
                  onChange={e => set(e.target.value)}
                  placeholder="0"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 예산 집행 (선택) */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-gray-800">
            예산 집행 <span className="text-gray-400 font-normal text-xs">(선택)</span>
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '총 예산 (원)', value: totalBudgetKrw, set: setTotalBudgetKrw },
              { label: '실 집행액 (원)', value: totalSpentKrw, set: setTotalSpentKrw },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input
                  type="number"
                  min="0"
                  disabled={loading}
                  value={value}
                  onChange={e => set(e.target.value)}
                  placeholder="55000000"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 비즈니스 성과 (선택) */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-gray-800">
            비즈니스 성과 <span className="text-gray-400 font-normal text-xs">(선택)</span>
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '미팅 건수', value: businessMeetings, set: setBusinessMeetings, placeholder: '42' },
              {
                label: '예상 계약액 (원)',
                value: estimatedContractValueKrw,
                set: setEstimatedContractValueKrw,
                placeholder: '200000000',
              },
            ].map(({ label, value, set, placeholder }) => (
              <div key={label}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input
                  type="number"
                  min="0"
                  disabled={loading}
                  value={value}
                  onChange={e => set(e.target.value)}
                  placeholder={placeholder}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 설문 응답 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">
              참가자 설문 응답 <span className="text-red-500">*</span>
            </h3>
            <button
              type="button"
              onClick={addSurvey}
              disabled={surveys.length >= 20 || loading}
              className="text-xs px-2.5 py-1 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-40"
            >
              + 응답 추가
            </button>
          </div>
          <div className="space-y-2">
            {surveys.map((s, i) => (
              <div key={i} className="flex gap-2 items-start">
                <select
                  disabled={loading}
                  value={s.rating}
                  onChange={e => updateSurvey(i, 'rating', Number(e.target.value))}
                  className="w-20 flex-shrink-0 border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {[5, 4, 3, 2, 1].map(r => (
                    <option key={r} value={r}>
                      {r}점
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  disabled={loading}
                  value={s.comment}
                  onChange={e => updateSurvey(i, 'comment', e.target.value)}
                  placeholder="주관식 응답을 입력해주세요"
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => removeSurvey(i)}
                  disabled={surveys.length <= 1 || loading}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 disabled:opacity-30"
                  title="삭제"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-gray-400">빈 댓글 행은 제외됩니다. 최대 20건.</p>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'ROI 성과 분석 중...' : 'Phase 6 실행'}
          </button>
          {result && (
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 border border-blue-600 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50 disabled:opacity-50"
            >
              재분석
            </button>
          )}
          {result && (
            <a
              href={`/event/${eventId}/report#phase-6`}
              target="_blank"
              className="px-4 py-2.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 flex items-center"
            >
              보고서 발행
            </a>
          )}
        </div>
      </form>

      {loading && (
        <div className="flex items-center gap-3 text-sm text-gray-500 p-4 bg-gray-50 rounded-xl border">
          <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          AI가 행사 성과를 분석하고 ROI 보고서를 작성하고 있습니다...
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 결과 */}
      {result && !loading && (
        <div className="space-y-4">
          {/* 종합 요약 배너 */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <p className="text-xs font-semibold text-blue-600 mb-1">종합 요약 (Executive Summary)</p>
            <p className="text-sm text-gray-800 leading-relaxed">{result.executiveSummary}</p>
          </div>

          {/* 탭 네비게이션 */}
          <div className="flex border-b gap-0 -mb-px">
            {TABS.map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap flex-shrink-0 -mb-px ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* KPI 대시보드 */}
          {activeTab === 'kpi' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <KpiCard
                  label="출석 달성률"
                  value={`${result.kpiPerformance.attendanceAchievementRate.toFixed(1)}%`}
                  sub="목표 대비 실 출석"
                />
                <div className="bg-white border rounded-xl p-5 space-y-1">
                  <p className="text-xs font-medium text-gray-500">평균 만족도</p>
                  <StarRating score={result.kpiPerformance.avgSatisfactionScore} />
                </div>
              </div>
              <div className="bg-white border rounded-xl p-5 space-y-1">
                <p className="text-xs font-medium text-gray-500">예산 집행 현황</p>
                <p className="text-sm text-gray-800 font-medium leading-relaxed">
                  {result.kpiPerformance.budgetEfficiencyNote}
                </p>
              </div>
              {result.kpiPerformance.businessRoiNote && (
                <div className="bg-white border rounded-xl p-5 space-y-1">
                  <p className="text-xs font-medium text-gray-500">비즈니스 ROI</p>
                  <p className="text-sm text-gray-800 font-medium leading-relaxed">
                    {result.kpiPerformance.businessRoiNote}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 설문 분석 */}
          {activeTab === 'sentiment' && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-green-700 mb-2">강점 (Top Strengths)</p>
                <div className="space-y-3">
                  {result.topStrengths.map((item, i) => (
                    <div key={i} className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[item.category] ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {item.category}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800">{item.finding}</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed italic">"{item.evidence}"</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-red-700 mb-2">약점 (Top Weaknesses)</p>
                <div className="space-y-3">
                  {result.topWeaknesses.map((item, i) => (
                    <div key={i} className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[item.category] ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {item.category}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800">{item.finding}</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed italic">"{item.evidence}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 페르소나 피드백 루프 */}
          {activeTab === 'persona' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Phase 1에서 설정한 타깃 페르소나의 Pain Point가 이번 행사에서 실제로 해소되었는지 검증합니다.
              </p>
              {result.personaFeedbackLoop.map((item, i) => (
                <div
                  key={i}
                  className={`border rounded-xl p-5 ${item.painPointResolved ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{item.personaName}</p>
                      <p className="text-xs text-gray-500">{item.personaRole}</p>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${item.painPointResolved ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}
                    >
                      {item.painPointResolved ? '해소됨' : '미해소'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-3 leading-relaxed">{item.evidence}</p>
                </div>
              ))}
            </div>
          )}

          {/* 차기 행사 제언 */}
          {activeTab === 'recommendations' && (
            <div className="space-y-3">
              {result.nextEventRecommendations.map((item, i) => (
                <div
                  key={i}
                  className={`border rounded-xl p-5 ${PRIORITY_STYLE[item.priority] ?? 'bg-gray-50 border-gray-200 text-gray-700'}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded border ${PRIORITY_STYLE[item.priority]}`}
                    >
                      {PRIORITY_LABEL[item.priority] ?? item.priority}
                    </span>
                    <p className="text-sm font-bold">{item.actionItem}</p>
                  </div>
                  <p className="text-xs leading-relaxed">{item.strategy}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <PhaseChat
        phaseNumber={6}
        eventId={eventId}
        currentOutput={result as Record<string, unknown> | null}
        onApply={updated => setResult(updated as Phase06Output)}
      />
    </main>
  )
}
