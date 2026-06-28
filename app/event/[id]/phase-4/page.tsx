'use client'

import { useState, use, useEffect } from 'react'
import type { Phase04Output, SpeakerInput } from '@/lib/schemas/phase-04.schema'
import type { Phase04SourcingOutput, SpeakerCandidate } from '@/lib/schemas/phase-04-sourcing.schema'

interface Props {
  params: Promise<{ id: string }>
}

type BudgetTier = 'premium' | 'standard' | 'economy'

const BUDGET_OPTIONS: { value: BudgetTier; label: string; desc: string }[] = [
  { value: 'premium', label: '프리미엄', desc: '해외 항공·5성급 호텔 전액' },
  { value: 'standard', label: '스탠다드', desc: '국내선 또는 근거리 해외' },
  { value: 'economy', label: '이코노미', desc: '거마비 중심 실비 정산' },
]

const EMPTY_SPEAKER: SpeakerInput = {
  name: '',
  affiliation: '',
  expertise: '',
  proposedSession: '',
  isOverseas: false,
}

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text)
    setDone(true)
    setTimeout(() => setDone(false), 1800)
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="text-xs px-2.5 py-1 bg-white border rounded-lg hover:bg-gray-50 text-gray-600 flex-shrink-0"
    >
      {done ? '복사됨!' : '복사'}
    </button>
  )
}

export default function Phase4Page({ params }: Props) {
  const { id: eventId } = use(params)
  const [speakers, setSpeakers] = useState<SpeakerInput[]>([{ ...EMPTY_SPEAKER }])
  const [budget, setBudget] = useState<BudgetTier | ''>('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Phase04Output | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [openIndex, setOpenIndex] = useState<number>(0)
  const [activeTab, setActiveTab] = useState<Record<number, 'email' | 'slides'>>({})
  const [sourcingLoading, setSourcingLoading] = useState(false)
  const [sourcingCandidates, setSourcingCandidates] = useState<Phase04SourcingOutput | null>(null)
  const [sourcingError, setSourcingError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/phase-result?eventId=${eventId}&phase=4`)
      .then(r => r.json())
      .then(data => { if (data) setResult(data) })
      .catch(() => {})
  }, [eventId])

  function updateSpeaker(i: number, field: keyof SpeakerInput, value: string | boolean) {
    setSpeakers(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  function addSpeaker() {
    if (speakers.length < 5) setSpeakers(prev => [...prev, { ...EMPTY_SPEAKER }])
  }

  function removeSpeaker(i: number) {
    setSpeakers(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/agents/phase-04', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          speakers,
          ...(budget ? { budgetTier: budget } : {}),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? '에이전트 실행에 실패했습니다.')
      }
      const data: Phase04Output = await res.json()
      setResult(data)
      setOpenIndex(0)
      setActiveTab({ 0: 'email' })
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function getTab(i: number): 'email' | 'slides' {
    return activeTab[i] ?? 'email'
  }

  function setTab(i: number, tab: 'email' | 'slides') {
    setActiveTab(prev => ({ ...prev, [i]: tab }))
  }

  async function handleSourcing() {
    setSourcingLoading(true)
    setSourcingError(null)
    setSourcingCandidates(null)
    try {
      const res = await fetch('/api/agents/phase-04-sourcing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? '연사 후보 검색에 실패했습니다.')
      }
      const data: Phase04SourcingOutput = await res.json()
      setSourcingCandidates(data)
    } catch (err) {
      setSourcingError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setSourcingLoading(false)
    }
  }

  function selectCandidate(candidate: SpeakerCandidate) {
    if (speakers.length >= 5) return
    if (speakers.some(s => s.name === candidate.name)) return
    setSpeakers(prev => [...prev, {
      name: candidate.name,
      affiliation: candidate.affiliation,
      expertise: candidate.expertise,
      proposedSession: candidate.proposedSession,
      isOverseas: candidate.isOverseas,
    }])
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Phase 4 — 연사 소싱 & 아웃리치</h1>
        <p className="mt-1 text-sm text-gray-500">
          초청할 연사 정보를 입력하면 맞춤형 초청 이메일과 제안서 PPT 아웃라인을 생성합니다.
        </p>
      </div>

      {/* 연사 후보 자동 추천 섹션 */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-gray-700">연사 후보 자동 추천</p>
            <p className="text-xs text-gray-400 mt-0.5">Phase 1 컨텍스트를 분석해 적합한 연사를 추천합니다</p>
          </div>
          <button
            type="button"
            onClick={handleSourcing}
            disabled={sourcingLoading}
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50 whitespace-nowrap"
          >
            {sourcingLoading ? '분석 중...' : '연사 후보 찾기'}
          </button>
        </div>

        {sourcingLoading && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Phase 1 데이터를 분석하고 있습니다...
          </div>
        )}

        {sourcingError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{sourcingError}</p>
        )}

        {sourcingCandidates && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 font-medium">
              추천 후보 {sourcingCandidates.candidates.length}명 — "선택"을 누르면 아래 폼에 자동 추가됩니다 (최대 5명)
            </p>
            <div className="space-y-2">
              {sourcingCandidates.candidates.map((c, i) => {
                const TIER_STYLE: Record<string, string> = { keynote: 'bg-purple-100 text-purple-700', session: 'bg-blue-100 text-blue-700', panel: 'bg-green-100 text-green-700' }
                const TIER_LABEL: Record<string, string> = { keynote: '키노트', session: '세션', panel: '패널' }
                const isSelected = speakers.some(s => s.name === c.name)
                const isFull = speakers.length >= 5 && !isSelected
                return (
                  <div key={i} className="bg-white border rounded-xl p-4 flex items-start gap-4">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIER_STYLE[c.speakerTier] ?? 'bg-gray-100 text-gray-600'}`}>
                          {TIER_LABEL[c.speakerTier] ?? c.speakerTier}
                        </span>
                        <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                        {c.isOverseas && <span className="text-xs text-orange-500 font-medium">해외</span>}
                      </div>
                      <p className="text-xs text-gray-500">{c.affiliation}</p>
                      <p className="text-xs text-blue-600 font-medium">{c.proposedSession}</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{c.rationale}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => selectCandidate(c)}
                      disabled={isFull}
                      className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${
                        isSelected
                          ? 'border-green-300 text-green-600 bg-green-50 cursor-default'
                          : isFull
                          ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                          : 'border-gray-300 text-gray-600 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700'
                      }`}
                    >
                      {isSelected ? '추가됨 ✓' : isFull ? '최대' : '선택'}
                    </button>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-gray-400 leading-relaxed pt-1 border-t">{sourcingCandidates.strategySummary}</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 연사 목록 */}
        <div className="space-y-4">
          {speakers.map((spk, i) => (
            <div key={i} className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-gray-700">연사 {i + 1}</p>
                {speakers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSpeaker(i)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    삭제
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    disabled={loading}
                    value={spk.name}
                    onChange={e => updateSpeaker(i, 'name', e.target.value)}
                    placeholder="홍길동"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    소속 / 직책 <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    disabled={loading}
                    value={spk.affiliation}
                    onChange={e => updateSpeaker(i, 'affiliation', e.target.value)}
                    placeholder="ABC Corp / Chief AI Officer"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  전문 분야 <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  disabled={loading}
                  value={spk.expertise}
                  onChange={e => updateSpeaker(i, 'expertise', e.target.value)}
                  placeholder="멀티 에이전트 시스템, AI ROI 측정 방법론"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  제안 세션명 <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  disabled={loading}
                  value={spk.proposedSession}
                  onChange={e => updateSpeaker(i, 'proposedSession', e.target.value)}
                  placeholder="기조연설: AI 에이전트의 비즈니스 ROI 증명"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={spk.isOverseas}
                  onChange={e => updateSpeaker(i, 'isOverseas', e.target.checked)}
                  disabled={loading}
                  className="accent-blue-600 w-4 h-4"
                />
                <span className="text-xs text-gray-600">해외 연사 (항공·숙박 지원 언급 필요)</span>
              </label>
            </div>
          ))}
        </div>

        {speakers.length < 5 && (
          <button
            type="button"
            onClick={addSpeaker}
            disabled={loading}
            className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-50"
          >
            + 연사 추가 (최대 5명)
          </button>
        )}

        {/* 예산 등급 */}
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <p className="text-sm font-medium mb-3">예산 등급 <span className="text-gray-400 font-normal">(선택)</span></p>
          <div className="flex gap-2">
            {BUDGET_OPTIONS.map(opt => (
              <label key={opt.value} className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="budget"
                  value={opt.value}
                  checked={budget === opt.value}
                  onChange={() => setBudget(prev => prev === opt.value ? '' : opt.value)}
                  disabled={loading}
                  className="sr-only"
                />
                <span className={`flex flex-col items-center p-3 rounded-lg border text-center text-xs ${
                  budget === opt.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}>
                  <span className="font-semibold">{opt.label}</span>
                  <span className="text-gray-400 mt-0.5">{opt.desc}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '초청 이메일 생성 중...' : 'Phase 4 실행'}
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
              href={`/event/${eventId}/report#phase-4`}
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
          AI가 연사별 맞춤 초청 이메일을 작성하고 있습니다...
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
          {/* 캠페인 주의사항 */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-700 mb-1">캠페인 주의사항</p>
            <p className="text-xs text-amber-800 leading-relaxed">{result.campaignNotes}</p>
          </div>

          {/* 연사별 아코디언 */}
          {result.outreachList.map((outreach, i) => (
            <div key={i} className="bg-white border rounded-xl overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === i ? -1 : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{outreach.speakerName}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{outreach.selectionRationale.slice(0, 60)}...</p>
                  </div>
                </div>
                <span className="text-gray-400 text-xs ml-3">{openIndex === i ? '▲' : '▼'}</span>
              </button>

              {openIndex === i && (
                <div className="border-t">
                  {/* 선정 사유 */}
                  <div className="px-5 py-4 bg-blue-50/50">
                    <p className="text-xs font-semibold text-blue-600 mb-1">선정 사유</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{outreach.selectionRationale}</p>
                  </div>

                  {/* 탭 */}
                  <div className="flex border-b px-5">
                    {(['email', 'slides'] as const).map(tab => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setTab(i, tab)}
                        className={`px-4 py-2.5 text-xs font-medium border-b-2 -mb-px ${
                          getTab(i) === tab
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500'
                        }`}
                      >
                        {tab === 'email' ? '초청 이메일' : 'PPT 아웃라인'}
                      </button>
                    ))}
                  </div>

                  <div className="p-5">
                    {getTab(i) === 'email' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2.5">
                          <span className="text-xs font-semibold text-gray-500 flex-shrink-0">제목:</span>
                          <span className="text-xs text-gray-800 flex-1">{outreach.emailSubject}</span>
                          <CopyBtn text={outreach.emailSubject} />
                        </div>
                        <div className="bg-gray-50 border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500">본문</span>
                            <CopyBtn text={outreach.emailBody} />
                          </div>
                          <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {outreach.emailBody}
                          </p>
                        </div>
                      </div>
                    )}

                    {getTab(i) === 'slides' && (
                      <div className="space-y-2">
                        {outreach.proposalSlides.map((slide, j) => (
                          <div key={j} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                            <span className="flex-shrink-0 w-6 h-6 rounded bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                              {slide.slideNumber}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-800">{slide.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{slide.content}</p>
                            </div>
                          </div>
                        ))}
                        <div className="mt-2">
                          <CopyBtn
                            text={outreach.proposalSlides
                              .map(s => `[Slide ${s.slideNumber}] ${s.title}\n${s.content}`)
                              .join('\n\n')}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
