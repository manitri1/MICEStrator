import type { Phase01Output } from '@/lib/schemas/phase-01.schema'

export function Phase1Section({ data }: { data: Phase01Output }) {
  return (
    <section id="phase-1" className="print-break-before space-y-6 pt-8">
      <div className="flex items-center gap-3 border-b pb-4">
        <span className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
          1
        </span>
        <h2 className="text-xl font-bold text-gray-900">Phase 1 — 행사 기획 방향</h2>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6">
        <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide mb-1">Event Name</p>
        <h3 className="text-2xl font-bold text-gray-900">{data.eventNameKr}</h3>
        <p className="mt-1 text-lg text-gray-600 italic">{data.eventNameEn}</p>
        <div className="mt-4 pt-4 border-t border-blue-100 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500">슬로건</p>
            <p className="mt-0.5 text-sm font-semibold text-blue-700">"{data.slogan}"</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">부제</p>
            <p className="mt-0.5 text-sm text-gray-600">{data.subtitle}</p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">핵심 키워드</p>
        <div className="flex flex-wrap gap-2">
          {data.coreKeywords.map(kw => (
            <span key={kw} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
              #{kw}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5">
        <p className="text-sm font-semibold text-gray-700 mb-2">기획 배경</p>
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{data.planningRationale}</p>
      </div>

      <div className="bg-white border rounded-xl p-5">
        <p className="text-sm font-semibold text-gray-700 mb-3">PEST 분석</p>
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(data.pestAnalysis) as [string, string][]).map(([key, val]) => (
            <div key={key} className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-bold text-gray-400 uppercase">{key}</p>
              <p className="mt-1 text-xs text-gray-600 leading-relaxed">{val}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">
          타깃 페르소나 ({data.targetPersonas.length}명)
        </p>
        <div className="space-y-4">
          {data.targetPersonas.map((persona, i) => (
            <div key={i} className="bg-white border rounded-xl p-5 space-y-3">
              <div>
                <span className="text-sm font-bold text-gray-900">{persona.name}</span>
                <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {persona.role}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Pain Points</p>
                  <ul className="space-y-0.5">
                    {persona.painPoints.map((pt, j) => (
                      <li key={j} className="text-xs text-gray-600">• {pt}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">참석 동기</p>
                  <ul className="space-y-0.5">
                    {persona.motivations.map((m, j) => (
                      <li key={j} className="text-xs text-gray-600">→ {m}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">기대 가치</p>
                <p className="text-xs text-gray-600">{persona.expectedValue}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
