import type { Phase06Output } from '@/lib/schemas/phase-06.schema'

const PRIORITY_STYLE: Record<string, string> = {
  HIGH: 'border-red-200 bg-red-50 text-red-700',
  MID: 'border-yellow-200 bg-yellow-50 text-yellow-700',
  LOW: 'border-green-200 bg-green-50 text-green-700',
}

const PRIORITY_LABEL: Record<string, string> = {
  HIGH: '필수',
  MID: '권장',
  LOW: '검토',
}

const CATEGORY_COLORS: Record<string, string> = {
  콘텐츠: 'bg-blue-100 text-blue-700',
  베뉴: 'bg-purple-100 text-purple-700',
  운영: 'bg-orange-100 text-orange-700',
  마케팅: 'bg-pink-100 text-pink-700',
  연사: 'bg-indigo-100 text-indigo-700',
  네트워킹: 'bg-teal-100 text-teal-700',
}

export function Phase6Section({ data }: { data: Phase06Output }) {
  return (
    <section id="phase-6" className="print-break-before space-y-6 pt-8">
      <div className="flex items-center gap-3 border-b pb-4">
        <span className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
          6
        </span>
        <h2 className="text-xl font-bold text-gray-900">Phase 6 — ROI 분석 & 차기 제언</h2>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <p className="text-xs font-semibold text-blue-600 mb-2">종합 요약 (Executive Summary)</p>
        <p className="text-sm text-gray-800 leading-relaxed">{data.executiveSummary}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border rounded-xl p-5 space-y-1">
          <p className="text-xs font-medium text-gray-500">출석 달성률</p>
          <p className="text-2xl font-bold text-gray-900">
            {data.kpiPerformance.attendanceAchievementRate.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-400">목표 대비 실 출석</p>
        </div>
        <div className="bg-white border rounded-xl p-5 space-y-1">
          <p className="text-xs font-medium text-gray-500">평균 만족도</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-gray-900">
              {data.kpiPerformance.avgSatisfactionScore.toFixed(1)}
            </span>
            <span className="text-sm text-gray-400">/ 5.0</span>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5">
        <p className="text-xs font-medium text-gray-500 mb-1">예산 집행 현황</p>
        <p className="text-sm text-gray-800 font-medium leading-relaxed">
          {data.kpiPerformance.budgetEfficiencyNote}
        </p>
      </div>

      {data.kpiPerformance.businessRoiNote && (
        <div className="bg-white border rounded-xl p-5">
          <p className="text-xs font-medium text-gray-500 mb-1">비즈니스 ROI</p>
          <p className="text-sm text-gray-800 font-medium leading-relaxed">
            {data.kpiPerformance.businessRoiNote}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        <div>
          <p className="text-xs font-semibold text-green-700 mb-2">강점 (Top Strengths)</p>
          <div className="space-y-3">
            {data.topStrengths.map((item, i) => (
              <div key={i} className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[item.category] ?? 'bg-gray-100 text-gray-600'}`}>
                    {item.category}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-800">{item.finding}</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed italic">&ldquo;{item.evidence}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-red-700 mb-2">약점 (Top Weaknesses)</p>
          <div className="space-y-3">
            {data.topWeaknesses.map((item, i) => (
              <div key={i} className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[item.category] ?? 'bg-gray-100 text-gray-600'}`}>
                    {item.category}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-800">{item.finding}</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed italic">&ldquo;{item.evidence}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">페르소나 검증 결과</p>
        <div className="space-y-3">
          {data.personaFeedbackLoop.map((item, i) => (
            <div
              key={i}
              className={`border rounded-xl p-4 ${item.painPointResolved ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-gray-900">{item.personaName}</p>
                  <p className="text-xs text-gray-500">{item.personaRole}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${item.painPointResolved ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                  {item.painPointResolved ? '✓ 해소됨' : '✗ 미해소'}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">{item.evidence}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">차기 행사 제언</p>
        <div className="space-y-3">
          {data.nextEventRecommendations.map((item, i) => (
            <div key={i} className={`border rounded-xl p-5 ${PRIORITY_STYLE[item.priority] ?? 'border-gray-200 bg-gray-50 text-gray-700'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${PRIORITY_STYLE[item.priority]}`}>
                  {PRIORITY_LABEL[item.priority] ?? item.priority}
                </span>
                <p className="text-sm font-bold">{item.actionItem}</p>
              </div>
              <p className="text-xs leading-relaxed">{item.strategy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
