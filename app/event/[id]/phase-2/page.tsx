'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import type { Phase02Output } from '@/lib/schemas/phase-02.schema'
import { PhaseChat } from '@/components/PhaseChat'

const PRIORITY_COLOR: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
}

const PRIORITY_LABEL: Record<string, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
}

export default function Phase2Page() {
  const { id: eventId } = useParams<{ id: string }>()
  const [staffCount, setStaffCount] = useState(5)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Phase02Output | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'wbs' | 'milestones' | 'departments'>('departments')

  useEffect(() => {
    fetch(`/api/phase-result?eventId=${eventId}&phase=2`)
      .then(r => r.json())
      .then(data => { if (data) setResult(data) })
      .catch(() => {})
  }, [eventId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/agents/phase-02', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, staffCount }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? '에이전트 실행에 실패했습니다.')
      }

      setResult(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Phase 2 — WBS & 역할 분담</h1>
        <p className="mt-1 text-sm text-gray-500">
          Phase 1 결과를 자동으로 로드하여 팀 구성, WBS 태스크, 마일스톤을 생성합니다.
        </p>
      </div>

      {/* 입력 폼 */}
      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
        <div>
          <label htmlFor="staffCount" className="block text-sm font-medium mb-1">
            총 가용 인력 수 <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              id="staffCount"
              type="range"
              min={1}
              max={50}
              value={staffCount}
              onChange={e => setStaffCount(Number(e.target.value))}
              disabled={loading}
              className="flex-1 accent-blue-600 disabled:opacity-50"
            />
            <span className="w-14 text-center text-sm font-semibold bg-blue-50 text-blue-700 rounded-lg py-1">
              {staffCount}명
            </span>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'WBS 생성 중...' : 'Phase 2 실행'}
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
              href={`/event/${eventId}/report#phase-2`}
              target="_blank"
              className="px-4 py-2.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 flex items-center"
            >
              보고서 발행
            </a>
          )}
        </div>
      </form>

      {/* 로딩 */}
      {loading && (
        <div className="flex items-center gap-3 text-sm text-gray-500 p-4 bg-gray-50 rounded-xl border">
          <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          AI가 WBS 및 역할 분담을 생성하고 있습니다...
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 결과 */}
      {result && !loading && (
        <div className="space-y-6">
          {/* 요약 배너 */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '총 준비 기간', value: `${result.totalWeeks}주` },
              { label: '태스크 수', value: `${result.wbsTasks.length}개` },
              { label: '마일스톤', value: `${result.milestones.length}개` },
            ].map(item => (
              <div key={item.label} className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                <p className="text-xs text-blue-500 font-medium">{item.label}</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">{item.value}</p>
              </div>
            ))}
          </div>

          {/* 임계 경로 배지 */}
          {result.criticalPath.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-red-600 mb-2">임계 경로 (Critical Path)</p>
              <div className="flex flex-wrap gap-1.5">
                {result.criticalPath.map(id => (
                  <span key={id} className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-mono rounded">
                    {id}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 탭 */}
          <div>
            <div className="flex border-b mb-4">
              {([
                { key: 'departments', label: '부서 구성' },
                { key: 'wbs', label: 'WBS 태스크' },
                { key: 'milestones', label: '마일스톤' },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${
                    activeTab === tab.key
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 부서 구성 */}
            {activeTab === 'departments' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.departments.map((dept, i) => (
                  <div key={i} className="bg-white border rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {dept.teamSize}명
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 font-medium mb-3">{dept.headRole}</p>
                    <ul className="space-y-1">
                      {dept.responsibilities.map((r, j) => (
                        <li key={j} className="text-xs text-gray-600 flex gap-1.5">
                          <span className="text-gray-300">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* WBS 테이블 */}
            {activeTab === 'wbs' && (
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['ID', '부서', '태스크', '시작 주차', '소요 주차', '우선순위', '의존성'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {result.wbsTasks.map((task, i) => (
                      <tr key={i} className={`${result.criticalPath.includes(task.id) ? 'bg-red-50' : ''} hover:bg-gray-50`}>
                        <td className="px-3 py-2.5 font-mono text-xs text-gray-600 whitespace-nowrap">{task.id}</td>
                        <td className="px-3 py-2.5 text-xs whitespace-nowrap">{task.department}</td>
                        <td className="px-3 py-2.5 text-xs">{task.taskName}</td>
                        <td className="px-3 py-2.5 text-xs text-center whitespace-nowrap">W{task.startWeek}</td>
                        <td className="px-3 py-2.5 text-xs text-center whitespace-nowrap">{task.durationWeeks}주</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLOR[task.priority]}`}>
                            {PRIORITY_LABEL[task.priority]}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-xs font-mono text-gray-400 whitespace-nowrap">
                          {task.dependencies.length > 0 ? task.dependencies.join(', ') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 마일스톤 타임라인 */}
            {activeTab === 'milestones' && (
              <div className="space-y-3">
                {result.milestones
                  .sort((a, b) => a.week - b.week)
                  .map((ms, i) => (
                    <div
                      key={i}
                      className={`flex gap-4 p-4 rounded-xl border ${
                        ms.isCritical ? 'bg-red-50 border-red-100' : 'bg-white'
                      }`}
                    >
                      <div className="flex-shrink-0 w-14 text-center">
                        <span className={`text-xs font-bold ${ms.isCritical ? 'text-red-600' : 'text-blue-600'}`}>
                          W{ms.week}
                        </span>
                        {ms.isCritical && (
                          <p className="text-xs text-red-400 mt-0.5">임계</p>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{ms.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{ms.description}</p>
                        <p className="text-xs text-blue-600 mt-1 font-medium">{ms.responsible}</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      <PhaseChat
        phaseNumber={2}
        eventId={eventId}
        currentOutput={result as Record<string, unknown> | null}
        onApply={updated => setResult(updated as Phase02Output)}
      />
    </main>
  )
}
