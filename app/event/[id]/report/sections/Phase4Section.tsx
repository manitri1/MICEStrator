import type { Phase04Output } from '@/lib/schemas/phase-04.schema'

export function Phase4Section({ data }: { data: Phase04Output }) {
  return (
    <section id="phase-4" className="print-break-before space-y-6 pt-8">
      <div className="flex items-center gap-3 border-b pb-4">
        <span className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
          4
        </span>
        <h2 className="text-xl font-bold text-gray-900">Phase 4 — 연사 소싱 & 아웃리치</h2>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-amber-700 mb-1">캠페인 주의사항</p>
        <p className="text-xs text-amber-800 leading-relaxed">{data.campaignNotes}</p>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <p className="text-sm font-semibold text-gray-700 px-5 py-3 border-b bg-gray-50">
          연사 목록 ({data.outreachList.length}명)
        </p>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['#', '연사명', '세션', '해외'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.outreachList.map((outreach, i) => (
              <tr key={i}>
                <td className="px-4 py-2.5 text-xs text-gray-500">{i + 1}</td>
                <td className="px-4 py-2.5 text-xs font-semibold text-gray-900">{outreach.speakerName}</td>
                <td className="px-4 py-2.5 text-xs text-gray-600">{outreach.emailSubject.slice(0, 40)}...</td>
                <td className="px-4 py-2.5 text-xs text-gray-500">
                  {/* speakerName 기반 isOverseas 정보가 없으므로 이메일에서 추론 불가 — 빈 값 */}
                  —
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-6">
        {data.outreachList.map((outreach, i) => (
          <div key={i} className="bg-white border rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 bg-blue-50/50 border-b">
              <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <p className="text-sm font-bold text-gray-900">{outreach.speakerName}</p>
            </div>

            <div className="px-5 py-4 bg-blue-50/30 border-b">
              <p className="text-xs font-semibold text-blue-600 mb-1">선정 사유</p>
              <p className="text-xs text-gray-700 leading-relaxed">{outreach.selectionRationale}</p>
            </div>

            <div className="px-5 py-4 border-b space-y-3">
              <p className="text-xs font-semibold text-gray-700">초청 이메일</p>
              <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2">
                <span className="text-xs font-semibold text-gray-500 flex-shrink-0">제목:</span>
                <span className="text-xs text-gray-800">{outreach.emailSubject}</span>
              </div>
              <div className="bg-gray-50 border rounded-lg p-4">
                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{outreach.emailBody}</p>
              </div>
            </div>

            <div className="px-5 py-4 space-y-2">
              <p className="text-xs font-semibold text-gray-700">PPT 아웃라인</p>
              {outreach.proposalSlides.map((slide, j) => (
                <div key={j} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="flex-shrink-0 w-6 h-6 rounded bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                    {slide.slideNumber}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800">{slide.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{slide.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
