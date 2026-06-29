'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function NewEventForm() {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: { preventDefault(): void }) {
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
      const event = await res.json()
      router.push(`/event/${event.id}/phase-1`)
    } catch {
      setError('행사 생성에 실패했습니다. 다시 시도해주세요.')
      setCreating(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setShowForm(true); setNewName('') }}
        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
      >
        + 새 행사 만들기
      </button>

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
    </>
  )
}
