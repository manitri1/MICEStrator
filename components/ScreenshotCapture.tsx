'use client'

import { useState } from 'react'
import { captureElement } from '@/lib/screenshot'

interface Props {
  targetRef: React.RefObject<HTMLElement | null>
  onCapture: (dataUrl: string) => void
}

export function ScreenshotCapture({ targetRef, onCapture }: Props) {
  const [capturing, setCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCapture() {
    const el = targetRef.current ?? document.body

    setCapturing(true)
    setError(null)
    try {
      const dataUrl = await captureElement(el)
      onCapture(dataUrl)
    } catch {
      setError('화면 캡처에 실패했습니다.')
    } finally {
      setCapturing(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleCapture}
        disabled={capturing}
        title="현재 화면을 캡처하여 AI 검토 요청"
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 shadow-sm"
      >
        {capturing ? (
          <span className="inline-block w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <span>📷</span>
        )}
        {capturing ? '캡처 중...' : '화면 리뷰'}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
