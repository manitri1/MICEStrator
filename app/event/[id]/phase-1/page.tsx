'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import type { Phase01Output } from '@/lib/schemas/phase-01.schema'
import { PhaseChat } from '@/components/PhaseChat'
import { PhaseStaleBanner } from '@/components/PhaseStaleBanner'
import { EventSummaryBanner } from '@/components/EventSummaryBanner'

type PrepPeriod = '3months' | '6months' | '12months'
type EventScale = 'small' | 'medium' | 'large'

const PREP_PERIOD_OPTIONS: { value: PrepPeriod; label: string }[] = [
  { value: '3months', label: '3개월' },
  { value: '6months', label: '6개월' },
  { value: '12months', label: '12개월' },
]

const EVENT_SCALE_OPTIONS: { value: EventScale; label: string; desc: string }[] = [
  { value: 'small', label: '소규모', desc: '100명 이하' },
  { value: 'medium', label: '중규모', desc: '100~500명' },
  { value: 'large', label: '대규모', desc: '500명 이상' },
]

export default function Phase1Page() {
  const { id: eventId } = useParams<{ id: string }>()
  const [industry, setIndustry] = useState('')
  const [prepPeriod, setPrepPeriod] = useState<PrepPeriod>('6months')
  const [eventScale, setEventScale] = useState<EventScale>('medium')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Phase01Output | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [staledPhases, setStaledPhases] = useState<number[]>([])
  const [openPersona, setOpenPersona] = useState<number | null>(null)
  useEffect(() => {
    fetch(`/api/phase-result?eventId=${eventId}&phase=1`)
      .then(r => r.json())
      .then(data => {
        if (data) {
          setResult(data)
          // 이전 실행의 희망 분야 복원 (패스스루 필드)
          if (typeof data.industry === 'string' && data.industry) {
            setIndustry(data.industry)
          }
        }
      })
      .catch(() => {})
  }, [eventId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/agents/phase-01', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          industry,
          preparationPeriod: prepPeriod,
          eventScale,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? '에이전트 실행에 실패했습니다.')
      }

      const data: Phase01Output & { affectedDownstream?: number[] } = await res.json()
      setResult(data)
      // Phase 1 재실행 완료 시 하위 영향 Phase 알림 표시 (REQ-UI-004)
      if (Array.isArray(data.affectedDownstream) && data.affectedDownstream.length > 0) {
        setStaledPhases(data.affectedDownstream)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      {/* 행사 요약 배너 — Phase 1~4 요약 정보를 비동기 로드하여 표시 (REQ-SUMMARY-014) */}
      <EventSummaryBanner eventId={eventId} />
      <div>
        <h1 className="text-2xl font-bold">Phase 1 — 인텔리전스 토대 구축</h1>
        <p className="mt-1 text-sm text-gray-500">
          희망 분야와 규모를 입력하면 AI가 행사 컨셉, 슬로건, 타깃 페르소나를 생성합니다.
        </p>
      </div>

      {/* 입력 폼 */}
      <form onSubmit={handleSubmit} className="space-y-6 bg-white border rounded-xl p-6 shadow-sm">
        <div>
          <label htmlFor="industry" className="block text-sm font-medium mb-1">
            희망 분야 / 산업 <span className="text-red-500">*</span>
          </label>
          <input
            id="industry"
            type="text"
            required
            disabled={loading}
            value={industry}
            onChange={e => setIndustry(e.target.value)}
            placeholder="예: 친환경 모빌리티, 디지털 헬스케어, AI 금융"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>

        <div>
          <p className="text-sm font-medium mb-2">준비 기간</p>
          <div className="flex gap-3">
            {PREP_PERIOD_OPTIONS.map(opt => (
              <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="prepPeriod"
                  value={opt.value}
                  checked={prepPeriod === opt.value}
                  onChange={() => setPrepPeriod(opt.value)}
                  disabled={loading}
                  className="accent-blue-600"
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">개최 규모</p>
          <div className="flex gap-3">
            {EVENT_SCALE_OPTIONS.map(opt => (
              <label key={opt.value} className="flex-1 flex flex-col items-center gap-1 border rounded-lg p-3 cursor-pointer has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                <input
                  type="radio"
                  name="eventScale"
                  value={opt.value}
                  checked={eventScale === opt.value}
                  onChange={() => setEventScale(opt.value)}
                  disabled={loading}
                  className="sr-only"
                />
                <span className="text-sm font-medium">{opt.label}</span>
                <span className="text-xs text-gray-400">{opt.desc}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !industry.trim()}
            className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '생성 중...' : 'Phase 1 실행'}
          </button>
          {result && (
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 border border-blue-600 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50 disabled:opacity-50"
            >
              재생성
            </button>
          )}
          {result && (
            <a
              href={`/event/${eventId}/report#phase-1`}
              target="_blank"
              className="px-4 py-2.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 flex items-center"
            >
              보고서 발행
            </a>
          )}
        </div>
      </form>

      {/* 로딩 상태 — REQ-020 */}
      {loading && (
        <div className="flex items-center gap-3 text-sm text-gray-500 p-4 bg-gray-50 rounded-xl border">
          <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          AI가 PEST 분석 및 컨셉을 생성하고 있습니다...
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 결과 — REQ-011 */}
      {result && !loading && (
        <div className="space-y-6">
          {/* 행사명 카드 */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6">
            <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide mb-1">Event Name</p>
            <h2 className="text-2xl font-bold text-gray-900">{result.eventNameKr}</h2>
            <p className="mt-1 text-lg text-gray-600 italic">{result.eventNameEn}</p>
            <div className="mt-4 pt-4 border-t border-blue-100">
              <p className="text-sm font-medium text-gray-700">슬로건</p>
              <p className="mt-0.5 text-base font-semibold text-blue-700">&ldquo;{result.slogan}&rdquo;</p>
            </div>
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-700">부제</p>
              <p className="mt-0.5 text-sm text-gray-600">{result.subtitle}</p>
            </div>
          </div>

          {/* 핵심 키워드 배지 */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">핵심 키워드</p>
            <div className="flex flex-wrap gap-2">
              {result.coreKeywords.map(kw => (
                <span key={kw} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                  #{kw}
                </span>
              ))}
            </div>
          </div>

          {/* 기획 배경 */}
          <div className="bg-white border rounded-xl p-5">
            <p className="text-sm font-semibold text-gray-700 mb-2">기획 배경</p>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{result.planningRationale}</p>
          </div>

          {/* PEST 분석 */}
          <div className="bg-white border rounded-xl p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">PEST 분석</p>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(result.pestAnalysis) as [string, string][]).map(([key, val]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-bold text-gray-400 uppercase">{key}</p>
                  <p className="mt-1 text-xs text-gray-600 leading-relaxed">{val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 타깃 페르소나 아코디언 */}
          <div className="bg-white border rounded-xl overflow-hidden">
            <p className="text-sm font-semibold text-gray-700 px-5 py-3 border-b">
              타깃 페르소나 ({result.targetPersonas.length}명)
            </p>
            {result.targetPersonas.map((p, i) => (
              <div key={i} className="border-b last:border-b-0">
                <button
                  type="button"
                  onClick={() => setOpenPersona(openPersona === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-gray-50"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900">{p.name}</span>
                    <span className="ml-2 text-xs text-gray-400">{p.role}</span>
                  </div>
                  <span className="text-gray-400 text-xs">{openPersona === i ? '▲' : '▼'}</span>
                </button>
                {openPersona === i && (
                  <div className="px-5 pb-4 space-y-3 bg-gray-50">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">Pain Points</p>
                      <ul className="space-y-0.5">
                        {p.painPoints.map((pt, j) => (
                          <li key={j} className="text-xs text-gray-600 before:content-['•'] before:mr-1.5">{pt}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">참석 동기</p>
                      <ul className="space-y-0.5">
                        {p.motivations.map((m, j) => (
                          <li key={j} className="text-xs text-gray-600 before:content-['→'] before:mr-1.5">{m}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">기대 가치</p>
                      <p className="text-xs text-gray-600">{p.expectedValue}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <PhaseStaleBanner
        editedPhase={1}
        affectedPhases={staledPhases}
        onDismiss={() => setStaledPhases([])}
        eventId={eventId}
      />
      <PhaseChat
        phaseNumber={1}
        eventId={eventId}
        currentOutput={result as Record<string, unknown> | null}
        onApply={(updated, affected) => {
          setResult(updated as Phase01Output)
          setStaledPhases(affected)
        }}
      />
    </main>
  )
}
