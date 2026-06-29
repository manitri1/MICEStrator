'use client'

import { useState, useEffect, useRef } from 'react'
import { ScreenshotCapture } from '@/components/ScreenshotCapture'

interface Props {
  phaseNumber: number
  eventId: string
  currentOutput: Record<string, unknown> | null
  context?: string
  onApply: (updated: Record<string, unknown>) => void
}

type ContentPart = { type: 'text'; text: string } | { type: 'image'; image: string }
type ChatContent = string | ContentPart[]

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: ChatContent
}

function extractPatch(text: string): Record<string, unknown> | null {
  const match = text.match(/```json\s*([\s\S]*?)```/)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[1].trim())
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
  } catch {
    // 파싱 실패 시 null 반환
  }
  return null
}

export function PhaseChat({ phaseNumber, eventId, currentOutput, context, onApply }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [pendingPatch, setPendingPatch] = useState<Record<string, unknown> | null>(null)
  const [applying, setApplying] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const targetRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(userContent: ChatContent) {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userContent,
    }

    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat/phase-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phaseNumber,
          currentOutput,
          context,
          messages: nextMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!res.ok || !res.body) {
        throw new Error(`요청 실패: ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      const assistantId = crypto.randomUUID()

      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content: accumulated } : m)
        )
      }

      const patch = extractPatch(accumulated)
      if (patch) setPendingPatch(patch)
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '⚠️ 요청 처리 중 오류가 발생했습니다. 다시 시도해 주세요.',
      }])
    } finally {
      setIsLoading(false)
    }
  }

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!input.trim() && !capturedImage) return

    if (capturedImage) {
      sendMessage([
        { type: 'image', image: capturedImage },
        { type: 'text', text: input.trim() || '이 화면을 검토하고 개선 사항을 알려줘.' },
      ])
      setCapturedImage(null)
    } else {
      sendMessage(input.trim())
    }
    setInput('')
  }

  async function applyPatch() {
    if (!pendingPatch || !currentOutput) return
    setApplying(true)
    setApplyError(null)

    try {
      const res = await fetch('/api/phase-result', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, phaseNumber, patch: pendingPatch }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? '저장에 실패했습니다.')
      }

      const updated = await res.json()
      onApply(updated)
      setPendingPatch(null)
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : '저장 오류가 발생했습니다.')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          <span>{open ? '▲' : '▼'}</span>
          💬 결과 수정하기
        </button>

        {currentOutput && (
          <ScreenshotCapture
            targetRef={targetRef}
            onCapture={url => {
              setCapturedImage(url)
              if (!open) setOpen(true)
            }}
          />
        )}
      </div>

      {open && (
        <div className="mt-3 border rounded-xl overflow-hidden shadow-sm">
          <div className="h-64 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <p className="text-sm text-gray-400 text-center pt-8">
                결과를 수정하고 싶은 내용을 말씀해주세요.
                <br />
                <span className="text-xs">예: &quot;슬로건을 더 간결하게 바꿔줘&quot;</span>
              </p>
            )}
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border text-gray-700'
                  }`}
                >
                  {typeof m.content === 'string'
                    ? m.content
                    : '📷 ' + (m.content.find(p => p.type === 'text') as { type: 'text'; text: string } | undefined)?.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border rounded-xl px-3 py-2 text-sm text-gray-400">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce [animation-delay:0ms]">·</span>
                    <span className="animate-bounce [animation-delay:150ms]">·</span>
                    <span className="animate-bounce [animation-delay:300ms]">·</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {pendingPatch && (
            <div className="mx-4 my-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-semibold text-amber-700 mb-2">변경 제안</p>
              <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap mb-3">
                {JSON.stringify(pendingPatch, null, 2)}
              </pre>
              {applyError && <p className="text-xs text-red-500 mb-2">{applyError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={applyPatch}
                  disabled={applying}
                  className="flex-1 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {applying ? '저장 중...' : '✅ 적용'}
                </button>
                <button
                  type="button"
                  onClick={() => setPendingPatch(null)}
                  disabled={applying}
                  className="flex-1 py-1.5 border text-xs text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  ❌ 취소
                </button>
              </div>
            </div>
          )}

          {capturedImage && (
            <div className="mx-4 mb-2 flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <img src={capturedImage} alt="캡처 미리보기" className="w-12 h-8 object-cover rounded border" />
              <span className="text-xs text-blue-600 flex-1">화면 캡처 첨부됨</span>
              <button
                type="button"
                onClick={() => setCapturedImage(null)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          )}

          <form
            onSubmit={handleFormSubmit}
            className="flex items-end gap-2 p-3 bg-white border-t"
          >
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isLoading}
              placeholder="수정 내용을 입력하세요..."
              rows={2}
              className="flex-1 resize-none border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  e.currentTarget.form?.requestSubmit()
                }
              }}
            />
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !capturedImage)}
              className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 self-end"
            >
              전송
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
