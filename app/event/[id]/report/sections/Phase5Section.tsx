import type { Phase05Output } from '@/lib/schemas/phase-05.schema'

export function Phase5Section({ data }: { data: Phase05Output }) {
  return (
    <section id="phase-5" className="print-break-before space-y-6 pt-8">
      <div className="flex items-center gap-3 border-b pb-4">
        <span className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
          5
        </span>
        <h2 className="text-xl font-bold text-gray-900">Phase 5 — 디지털 에셋 & 마케팅</h2>
      </div>

      <div className="bg-white border rounded-xl p-5 space-y-4">
        <p className="text-sm font-semibold text-gray-700">Instagram 게시물</p>
        <div className="bg-gray-50 border rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 mb-1">캡션</p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{data.instagramPost.caption}</p>
        </div>
        <div className="bg-gray-50 border rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 mb-2">해시태그</p>
          <div className="flex flex-wrap gap-1.5">
            {data.instagramPost.hashtags.map(tag => (
              <span key={tag} className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="bg-gray-50 border rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 mb-1">스토리 텍스트</p>
          <p className="text-sm text-gray-700">{data.instagramPost.storyTextOverlay}</p>
        </div>
        <div className="bg-gray-50 border rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 mb-1">이미지 프롬프트</p>
          <p className="text-xs text-gray-700 leading-relaxed font-mono">{data.instagramPost.imagePrompt}</p>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5 space-y-4">
        <p className="text-sm font-semibold text-gray-700">LinkedIn 게시물</p>
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-gray-50 border rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 mb-1">헤드라인</p>
            <p className="text-sm font-semibold text-gray-800">{data.linkedinPost.headline}</p>
          </div>
          <div className="bg-gray-50 border rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 mb-1">본문</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{data.linkedinPost.body}</p>
          </div>
          <div className="bg-gray-50 border rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 mb-1">CTA</p>
            <p className="text-sm text-gray-700">{data.linkedinPost.callToAction}</p>
          </div>
          <div className="bg-gray-50 border rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">해시태그</p>
            <div className="flex flex-wrap gap-1.5">
              {data.linkedinPost.hashtags.map(tag => (
                <span key={tag} className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5">
        <p className="text-sm font-semibold text-gray-700 mb-3">이메일 제목 라인</p>
        <div className="space-y-2">
          {data.emailSubjectLines.map((subject, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-50 border rounded-xl px-4 py-3">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <p className="text-sm text-gray-800">{subject}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5">
        <p className="text-sm font-semibold text-gray-700 mb-3">랜딩페이지 섹션 구성</p>
        <div className="space-y-3">
          {data.landingPageSections.map((sec, i) => (
            <div key={i} className="border rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{sec.sectionName}</p>
              </div>
              <p className="text-base font-bold text-gray-900">{sec.headline}</p>
              <p className="text-sm text-gray-600 leading-relaxed">{sec.subtext}</p>
              {sec.cta && (
                <span className="inline-block bg-blue-600 text-white text-xs px-4 py-1.5 rounded-lg font-medium">
                  {sec.cta}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <p className="text-sm font-semibold text-gray-700 px-5 py-3 border-b bg-gray-50">D-Day 캠페인 스케줄</p>
        <div className="divide-y">
          {data.campaignSchedule.map((item, i) => (
            <div key={i} className="flex gap-4 p-4">
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
      </div>
    </section>
  )
}
