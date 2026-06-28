'use client'

import { useState, use, useEffect } from 'react'
import type { Phase05Output } from '@/lib/schemas/phase-05.schema'

interface Props {
  params: Promise<{ id: string }>
}

type TabKey = 'instagram' | 'linkedin' | 'email' | 'landing' | 'music' | 'schedule'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'instagram', label: '인스타그램' },
  { key: 'linkedin', label: '링크드인' },
  { key: 'email', label: '이메일 제목' },
  { key: 'landing', label: '랜딩페이지' },
  { key: 'music', label: '음악 프롬프트' },
  { key: 'schedule', label: 'D-Day 캠페인' },
]

function CopyBtn({ text, label = '복사' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text)
        setDone(true)
        setTimeout(() => setDone(false), 1800)
      }}
      className="text-xs px-2.5 py-1 bg-white border rounded-lg hover:bg-gray-50 text-gray-600 flex-shrink-0"
    >
      {done ? '복사됨!' : label}
    </button>
  )
}

function ContentBlock({ label, content }: { label?: string; content: string }) {
  return (
    <div className="bg-gray-50 border rounded-xl p-4">
      {label && (
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-500">{label}</p>
          <CopyBtn text={content} />
        </div>
      )}
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>
      {!label && (
        <div className="mt-2 flex justify-end">
          <CopyBtn text={content} />
        </div>
      )}
    </div>
  )
}

export default function Phase5Page({ params }: Props) {
  const { id: eventId } = use(params)
  const [speakerInput, setSpeakerInput] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [registrationUrl, setRegistrationUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Phase05Output | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('instagram')

  useEffect(() => {
    fetch(`/api/phase-result?eventId=${eventId}&phase=5`)
      .then(r => r.json())
      .then(data => { if (data) setResult(data) })
      .catch(() => {})
  }, [eventId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const confirmedSpeakers = speakerInput
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)

    try {
      const res = await fetch('/api/agents/phase-05', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          ...(confirmedSpeakers.length > 0 ? { confirmedSpeakers } : {}),
          ...(eventDate ? { eventDate } : {}),
          ...(registrationUrl ? { registrationUrl } : {}),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? '에이전트 실행에 실패했습니다.')
      }
      setResult(await res.json())
      setActiveTab('instagram')
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Phase 5 — 디지털 에셋 & 마케팅</h1>
        <p className="mt-1 text-sm text-gray-500">
          Phase 1·3 데이터를 자동 로드하여 SNS·랜딩페이지·캠페인 스케줄을 생성합니다.
        </p>
      </div>

      {/* 입력 폼 */}
      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">
            확정 연사 목록 <span className="text-gray-400 font-normal text-xs">(선택 — 한 줄에 한 명)</span>
          </label>
          <textarea
            rows={3}
            disabled={loading}
            value={speakerInput}
            onChange={e => setSpeakerInput(e.target.value)}
            placeholder={'홍길동 / ABC Corp CEO\n Jane Smith / XYZ AI CSO'}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              행사 예정일 <span className="text-gray-400">(선택)</span>
            </label>
            <input
              type="date"
              disabled={loading}
              value={eventDate}
              onChange={e => setEventDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              등록 URL <span className="text-gray-400">(선택)</span>
            </label>
            <input
              type="url"
              disabled={loading}
              value={registrationUrl}
              onChange={e => setRegistrationUrl(e.target.value)}
              placeholder="https://event.example.com"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '마케팅 콘텐츠 생성 중...' : 'Phase 5 실행'}
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
              href={`/event/${eventId}/report#phase-5`}
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
          AI가 채널별 마케팅 콘텐츠를 생성하고 있습니다...
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
          {/* 탭 네비게이션 */}
          <div className="flex overflow-x-auto border-b gap-0 -mb-px">
            {TABS.map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap flex-shrink-0 -mb-px ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 인스타그램 */}
          {activeTab === 'instagram' && (
            <div className="space-y-4">
              <ContentBlock label="캡션" content={result.instagramPost.caption} />

              <div className="bg-gray-50 border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500">해시태그</p>
                  <CopyBtn text={result.instagramPost.hashtags.join(' ')} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.instagramPost.hashtags.map(tag => (
                    <span key={tag} className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <ContentBlock label="스토리 텍스트 오버레이 (30자 이내)" content={result.instagramPost.storyTextOverlay} />
              <ContentBlock label="이미지 생성 프롬프트 (Midjourney/DALL-E, --ar 4:5)" content={result.instagramPost.imagePrompt} />
            </div>
          )}

          {/* 링크드인 */}
          {activeTab === 'linkedin' && (
            <div className="space-y-4">
              <ContentBlock label="헤드라인" content={result.linkedinPost.headline} />
              <ContentBlock label="본문" content={result.linkedinPost.body} />
              <ContentBlock label="CTA (Call to Action)" content={result.linkedinPost.callToAction} />

              <div className="bg-gray-50 border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500">해시태그</p>
                  <CopyBtn text={result.linkedinPost.hashtags.join(' ')} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.linkedinPost.hashtags.map(tag => (
                    <span key={tag} className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 이메일 제목 */}
          {activeTab === 'email' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">오픈율을 높이는 이메일 제목 후보입니다.</p>
              {result.emailSubjectLines.map((subject, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-50 border rounded-xl px-4 py-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-800 flex-1">{subject}</p>
                  <CopyBtn text={subject} />
                </div>
              ))}
            </div>
          )}

          {/* 랜딩페이지 */}
          {activeTab === 'landing' && (
            <div className="space-y-3">
              {result.landingPageSections.map((sec, i) => (
                <div key={i} className="bg-white border rounded-xl p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{sec.sectionName}</p>
                  </div>
                  <p className="text-base font-bold text-gray-900">{sec.headline}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{sec.subtext}</p>
                  {sec.cta && (
                    <div className="pt-1">
                      <span className="inline-block bg-blue-600 text-white text-xs px-4 py-1.5 rounded-lg font-medium">
                        {sec.cta}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 음악 프롬프트 */}
          {activeTab === 'music' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">Suno AI 또는 Udio에 붙여넣기 하여 오프닝 음악을 생성하세요.</p>
              <ContentBlock content={result.openingMusicPrompt} />
            </div>
          )}

          {/* D-Day 캠페인 스케줄 */}
          {activeTab === 'schedule' && (
            <div className="space-y-3">
              {result.campaignSchedule.map((item, i) => (
                <div key={i} className="flex gap-4 bg-white border rounded-xl p-4">
                  <div className="flex-shrink-0 w-14 text-center">
                    <span className="text-sm font-bold text-blue-600">{item.dDay}</span>
                    <p className="text-xs text-gray-400 mt-0.5">{item.channel}</p>
                  </div>
                  <div className="flex-1 min-w-0 border-l pl-4">
                    <p className="text-sm font-semibold text-gray-800">{item.action}</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.keyMessage}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  )
}
