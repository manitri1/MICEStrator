'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import type { Phase03Output } from '@/lib/schemas/phase-03.schema'
import { PhaseChat } from '@/components/PhaseChat'

type TonePref = 'modern' | 'classic' | 'bold' | 'elegant' | 'playful'

const TONE_OPTIONS: { value: TonePref; label: string; desc: string }[] = [
  { value: 'modern', label: '모던', desc: '혁신·미래 지향' },
  { value: 'classic', label: '클래식', desc: '격식·신뢰감' },
  { value: 'bold', label: '대담', desc: '강렬·임팩트' },
  { value: 'elegant', label: '우아', desc: '세련·고급감' },
  { value: 'playful', label: '활기', desc: '친근·역동' },
]

function ColorSwatch({ hex, label }: { hex: string; label: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(hex)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="flex flex-col items-center gap-2 group"
      title={`${hex} 복사`}
    >
      <div
        className="w-16 h-16 rounded-xl shadow-md border border-black/5 group-hover:scale-105 transition-transform"
        style={{ backgroundColor: hex }}
      />
      <span className="text-xs font-mono text-gray-500 group-hover:text-gray-800">
        {copied ? '복사됨!' : hex}
      </span>
      <span className="text-xs text-gray-400">{label}</span>
    </button>
  )
}

function CopyBlock({ label, content }: { label: string; content: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-gray-50 border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-600">{label}</p>
        <button
          type="button"
          onClick={copy}
          className="text-xs px-2.5 py-1 bg-white border rounded-lg hover:bg-gray-50 text-gray-600"
        >
          {copied ? '복사됨!' : '복사'}
        </button>
      </div>
      <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  )
}

export default function Phase3Page() {
  const { id: eventId } = useParams<{ id: string }>()
  const [tone, setTone] = useState<TonePref | ''>('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Phase03Output | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/phase-result?eventId=${eventId}&phase=3`)
      .then(r => r.json())
      .then(data => { if (data) setResult(data) })
      .catch(() => {})
  }, [eventId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/agents/phase-03', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          ...(tone ? { tonePreference: tone } : {}),
        }),
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
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Phase 3 — 비주얼 아이덴티티</h1>
        <p className="mt-1 text-sm text-gray-500">
          Phase 1 컨셉을 자동 로드하여 컬러 팔레트, 디자인 무드, 생성 AI 프롬프트를 생성합니다.
        </p>
      </div>

      {/* 입력 폼 */}
      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 shadow-sm space-y-5">
        <div>
          <p className="text-sm font-medium mb-2">톤 선호도 <span className="text-gray-400 font-normal">(선택)</span></p>
          <div className="flex flex-wrap gap-2">
            {TONE_OPTIONS.map(opt => (
              <label key={opt.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="tone"
                  value={opt.value}
                  checked={tone === opt.value}
                  onChange={() => setTone(prev => prev === opt.value ? '' : opt.value)}
                  disabled={loading}
                  className="sr-only"
                />
                <span className={`inline-flex flex-col items-center px-3 py-2 rounded-lg border text-center text-xs transition-colors ${
                  tone === opt.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}>
                  <span className="font-medium">{opt.label}</span>
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
            {loading ? '비주얼 아이덴티티 생성 중...' : 'Phase 3 실행'}
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
              href={`/event/${eventId}/report#phase-3`}
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
          AI가 컬러 팔레트와 비주얼 아이덴티티를 설계하고 있습니다...
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {result && !loading && (
        <div className="space-y-6">
          {/* 컬러 팔레트 */}
          <div className="bg-white border rounded-xl p-6">
            <p className="text-sm font-semibold text-gray-700 mb-4">컬러 팔레트</p>
            <div className="flex gap-6 flex-wrap">
              <ColorSwatch hex={result.primaryColor} label="Primary" />
              {result.secondaryColors.map((c, i) => (
                <ColorSwatch key={i} hex={c} label={`Secondary ${i + 1}`} />
              ))}
              <ColorSwatch hex={result.accentColor} label="Accent" />
            </div>

            {/* 그라디언트 프리뷰 */}
            <div
              className="mt-5 h-12 rounded-xl"
              style={{
                background: `linear-gradient(135deg, ${result.primaryColor}, ${result.secondaryColors[0] ?? result.accentColor}, ${result.accentColor})`,
              }}
            />
          </div>

          {/* 무드 & 서체 & 성격 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 mb-1">디자인 무드</p>
              <p className="text-sm font-medium text-gray-800">{result.designMood}</p>
            </div>
            <div className="bg-white border rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 mb-1">추천 서체</p>
              <p className="text-sm font-medium text-gray-800">{result.fontStyle}</p>
            </div>
          </div>

          <div className="bg-white border rounded-xl p-5">
            <p className="text-xs font-semibold text-gray-500 mb-1">브랜드 성격</p>
            <p className="text-sm text-gray-700 leading-relaxed">{result.brandPersonality}</p>
          </div>

          {/* 색상 선택 이유 */}
          <div className="bg-white border rounded-xl p-5">
            <p className="text-xs font-semibold text-gray-500 mb-1">컬러 선택 배경</p>
            <p className="text-sm text-gray-600 leading-relaxed">{result.colorRationale}</p>
          </div>

          {/* 비주얼 키워드 */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">비주얼 키워드</p>
            <div className="flex flex-wrap gap-2">
              {result.visualKeywords.map(kw => (
                <span
                  key={kw}
                  className="px-3 py-1 text-xs font-medium rounded-full border"
                  style={{
                    backgroundColor: `${result.primaryColor}15`,
                    borderColor: `${result.primaryColor}40`,
                    color: result.primaryColor,
                  }}
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>

          {/* 생성 AI 프롬프트 */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">생성 AI 프롬프트</p>
            <CopyBlock label="Canva 프롬프트 (한국어)" content={result.canvaPrompt} />
            <CopyBlock label="Midjourney 프롬프트 (영문)" content={result.midjourneyPrompt} />
          </div>

          {/* 브랜드 메모리 저장 안내 */}
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-100 rounded-xl text-sm text-green-700">
            <span className="mt-0.5 text-base">✓</span>
            <p>브랜드 메모리가 저장되었습니다. Phase 4·5 에이전트가 이 컬러와 무드를 자동으로 참조합니다.</p>
          </div>
        </div>
      )}

      <PhaseChat
        phaseNumber={3}
        eventId={eventId}
        currentOutput={result as Record<string, unknown> | null}
        context="Phase 3 편집 시 primaryColor, secondaryColors, accentColor 변경은 brandMemory에 자동 동기화됩니다."
        onApply={updated => setResult(updated as Phase03Output)}
      />
    </main>
  )
}
