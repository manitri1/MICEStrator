import type { Phase02Output } from '@/lib/schemas/phase-02.schema'

const PRIORITY_COLOR: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
}

const PRIORITY_LABEL: Record<string, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
}

export function Phase2Section({ data }: { data: Phase02Output }) {
  return (
    <section id="phase-2" className="print-break-before space-y-6 pt-8">
      <div className="flex items-center gap-3 border-b pb-4">
        <span className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
          2
        </span>
        <h2 className="text-xl font-bold text-gray-900">Phase 2 — 조직 구조 & 일정 계획</h2>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '총 준비 기간', value: `${data.totalWeeks}주` },
          { label: '태스크 수', value: `${data.wbsTasks.length}개` },
          { label: '마일스톤', value: `${data.milestones.length}개` },
        ].map(item => (
          <div key={item.label} className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
            <p className="text-xs text-blue-500 font-medium">{item.label}</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      {data.criticalPath.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-red-600 mb-2">임계 경로 (Critical Path)</p>
          <div className="flex flex-wrap gap-1.5">
            {data.criticalPath.map(id => (
              <span key={id} className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-mono rounded">
                {id}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border rounded-xl overflow-hidden">
        <p className="text-sm font-semibold text-gray-700 px-5 py-3 border-b bg-gray-50">부서 구성</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
          {data.departments.map((dept, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-900">{dept.name}</p>
                <span className="text-xs bg-white border text-gray-600 px-2 py-0.5 rounded-full">
                  {dept.teamSize}명
                </span>
              </div>
              <p className="text-xs text-blue-600 font-medium mb-2">{dept.headRole}</p>
              <ul className="space-y-0.5">
                {dept.responsibilities.map((r, j) => (
                  <li key={j} className="text-xs text-gray-600">• {r}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <p className="text-sm font-semibold text-gray-700 px-5 py-3 border-b bg-gray-50">주요 마일스톤</p>
        <div className="divide-y">
          {[...data.milestones].sort((a, b) => a.week - b.week).map((ms, i) => (
            <div key={i} className={`flex gap-4 p-4 ${ms.isCritical ? 'bg-red-50' : ''}`}>
              <div className="flex-shrink-0 w-14 text-center">
                <span className={`text-xs font-bold ${ms.isCritical ? 'text-red-600' : 'text-blue-600'}`}>
                  W{ms.week}
                </span>
                {ms.isCritical && <p className="text-xs text-red-400 mt-0.5">임계</p>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{ms.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{ms.description}</p>
                <p className="text-xs text-blue-600 mt-1 font-medium">{ms.responsible}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <p className="text-sm font-semibold text-gray-700 px-5 py-3 border-b bg-gray-50">WBS 태스크</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['ID', '부서', '태스크', '시작', '기간', '우선순위'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.wbsTasks.map((task, i) => (
                <tr key={i} className={data.criticalPath.includes(task.id) ? 'bg-red-50' : ''}>
                  <td className="px-3 py-2 font-mono text-xs text-gray-600">{task.id}</td>
                  <td className="px-3 py-2 text-xs whitespace-nowrap">{task.department}</td>
                  <td className="px-3 py-2 text-xs">{task.taskName}</td>
                  <td className="px-3 py-2 text-xs text-center">W{task.startWeek}</td>
                  <td className="px-3 py-2 text-xs text-center">{task.durationWeeks}주</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLOR[task.priority]}`}>
                      {PRIORITY_LABEL[task.priority]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
