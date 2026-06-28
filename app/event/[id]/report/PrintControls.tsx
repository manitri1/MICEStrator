'use client'

import { useState } from 'react'

interface Props {
  eventId: string
  eventName: string
}

export function PrintControls({ eventId, eventName }: Props) {
  const [downloading, setDownloading] = useState(false)

  function handlePrint() {
    window.print()
  }

  async function handleMarkdownDownload() {
    setDownloading(true)
    try {
      const res = await fetch(`/api/events/${eventId}/report`)
      if (!res.ok) throw new Error('다운로드 실패')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${eventName}-report.md`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('마크다운 다운로드 중 오류가 발생했습니다.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="print-hide flex items-center gap-3 flex-wrap">
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
        PDF 저장
      </button>

      <button
        onClick={handleMarkdownDownload}
        disabled={downloading}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        {downloading ? '다운로드 중...' : 'Markdown 다운로드'}
      </button>
    </div>
  )
}
