'use client'

// Gemini Canvas 프롬프트 표시 모달 컴포넌트 (REQ-PROMPT-003, 004, 008)
// 프롬프트 전체 텍스트 표시 + 클립보드 복사 + Canvas 안내 문구
import { useState, useEffect, useRef } from 'react'

interface CanvasPromptModalProps {
  isOpen: boolean
  onClose: () => void
  /** 표시할 프롬프트 문자열 */
  prompt: string
  /** 모달 제목 */
  title: string
}

/**
 * Gemini Canvas 프롬프트 표시 모달.
 * 프롬프트를 스크롤 가능한 영역에 표시하고, 클립보드 복사 버튼을 제공한다. (REQ-PROMPT-004)
 */
export function CanvasPromptModal({ isOpen, onClose, prompt, title }: CanvasPromptModalProps) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)

  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // 모달 열릴 때 body 스크롤 막기
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // 열려있지 않으면 렌더링하지 않음
  if (!isOpen) return null

  // 클립보드 복사 처리 — API 불가 시 에러 안내 (엣지 케이스 E6)
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setCopyError(false)
      // 2초 후 피드백 초기화
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 클립보드 API 사용 불가(권한 거부 등) — 모달 유지, 에러 안내 표시 (REQ-PROMPT-004, E6)
      setCopyError(true)
      setTimeout(() => setCopyError(false), 3000)
    }
  }

  // 배경 클릭으로 모달 닫기
  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === backdropRef.current) onClose()
  }

  return (
    /* 배경 오버레이 */
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="canvas-modal-title"
    >
      {/* 모달 패널 */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <div>
            <h2
              id="canvas-modal-title"
              className="text-base font-bold text-gray-900"
            >
              {title}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              아래 프롬프트를 복사하여 Gemini Canvas에 붙여넣기 하세요.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="모달 닫기"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {/* X 아이콘 */}
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 프롬프트 텍스트 영역 (스크롤 가능) */}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          <pre className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-mono bg-gray-50 rounded-xl p-4 border select-all">
            {prompt}
          </pre>
        </div>

        {/* 푸터 — 복사 버튼 + 안내 */}
        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-2xl flex-shrink-0 space-y-3">
          {/* 복사 에러 안내 (E6) */}
          {copyError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              클립보드 복사에 실패했습니다. 위 텍스트를 직접 선택하여 복사해 주세요.
            </p>
          )}

          <div className="flex items-center gap-3">
            {/* 클립보드 복사 버튼 (REQ-PROMPT-004) */}
            <button
              type="button"
              onClick={handleCopy}
              className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                copied
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {copied ? '복사됨!' : '클립보드에 복사'}
            </button>

            {/* 닫기 버튼 */}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
            >
              닫기
            </button>
          </div>

          {/* Gemini Canvas 이동 안내 */}
          <p className="text-xs text-gray-400 text-center">
            복사 후 <span className="font-medium text-gray-600">gemini.google.com</span>에서 Canvas 모드로 붙여넣기 하세요.
          </p>
        </div>
      </div>
    </div>
  )
}
