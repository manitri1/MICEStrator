'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Event {
  id: string
  name: string
  status: string | null
  createdAt: string | null
}

const PHASES = [
  { num: 1, label: '행사 기획', short: 'P1' },
  { num: 2, label: 'WBS & 타임라인', short: 'P2' },
  { num: 3, label: '비주얼 아이덴티티', short: 'P3' },
  { num: 4, label: '연사 섭외', short: 'P4' },
  { num: 5, label: '마케팅 에셋', short: 'P5' },
  { num: 6, label: 'ROI 분석', short: 'P6' },
]

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function HomePage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/events')
      .then(r => r.json())
      .then(data => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      if (!res.ok) throw new Error('생성 실패')
      const event: Event = await res.json()
      router.push(`/event/${event.id}/phase-1`)
    } catch {
      setError('행사 생성에 실패했습니다. 다시 시도해주세요.')
      setCreating(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">MICEstrator</h1>
            <p className="text-xs text-gray-400 mt-0.5">MICE 행사 기획 자동화 에이전트</p>
          </div>
          <button
            type="button"
            onClick={() => { setShowForm(true); setNewName('') }}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            + 새 행사 만들기
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* 새 행사 생성 폼 */}
        {showForm && (
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold mb-4">새 행사 만들기</h2>
            <form onSubmit={handleCreate} className="flex gap-3">
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="행사명을 입력하세요 (예: 2026 AI 리더십 서밋)"
                disabled={creating}
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={creating || !newName.trim()}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {creating ? '생성 중...' : '시작하기'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={creating}
                className="px-4 py-2 border text-sm text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                취소
              </button>
            </form>
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          </div>
        )}

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

          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-8 justify-center">
              <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              불러오는 중...
            </div>
          )}

          {!loading && events.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-sm font-medium">아직 기획된 행사가 없습니다.</p>
              <p className="text-xs mt-1">"새 행사 만들기"를 눌러 시작하세요.</p>
            </div>
          )}

          <div className="space-y-3">
            {events.map(event => (
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

                {/* Phase 진입 버튼 */}
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
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
