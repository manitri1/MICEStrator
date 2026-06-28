import type { Phase03Output } from '@/lib/schemas/phase-03.schema'

function ColorSwatch({ hex, label }: { hex: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="w-14 h-14 rounded-xl shadow-md border border-black/5"
        style={{ backgroundColor: hex }}
      />
      <span className="text-xs font-mono text-gray-500">{hex}</span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  )
}

export function Phase3Section({ data }: { data: Phase03Output }) {
  return (
    <section id="phase-3" className="print-break-before space-y-6 pt-8">
      <div className="flex items-center gap-3 border-b pb-4">
        <span className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
          3
        </span>
        <h2 className="text-xl font-bold text-gray-900">Phase 3 — 비주얼 아이덴티티</h2>
      </div>

      <div className="bg-white border rounded-xl p-6">
        <p className="text-sm font-semibold text-gray-700 mb-4">컬러 팔레트</p>
        <div className="flex gap-6 flex-wrap">
          <ColorSwatch hex={data.primaryColor} label="Primary" />
          {data.secondaryColors.map((c, i) => (
            <ColorSwatch key={i} hex={c} label={`Secondary ${i + 1}`} />
          ))}
          <ColorSwatch hex={data.accentColor} label="Accent" />
        </div>
        <div
          className="mt-5 h-10 rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${data.primaryColor}, ${data.secondaryColors[0] ?? data.accentColor}, ${data.accentColor})`,
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 mb-1">디자인 무드</p>
          <p className="text-sm font-medium text-gray-800">{data.designMood}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 mb-1">추천 서체</p>
          <p className="text-sm font-medium text-gray-800">{data.fontStyle}</p>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5">
        <p className="text-xs font-semibold text-gray-500 mb-1">브랜드 성격</p>
        <p className="text-sm text-gray-700 leading-relaxed">{data.brandPersonality}</p>
      </div>

      <div className="bg-white border rounded-xl p-5">
        <p className="text-xs font-semibold text-gray-500 mb-1">컬러 선택 배경</p>
        <p className="text-sm text-gray-600 leading-relaxed">{data.colorRationale}</p>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">비주얼 키워드</p>
        <div className="flex flex-wrap gap-2">
          {data.visualKeywords.map(kw => (
            <span
              key={kw}
              className="px-3 py-1 text-xs font-medium rounded-full border"
              style={{
                backgroundColor: `${data.primaryColor}15`,
                borderColor: `${data.primaryColor}40`,
                color: data.primaryColor,
              }}
            >
              {kw}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-700">생성 AI 프롬프트</p>
        <div className="bg-gray-50 border rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-600 mb-2">Canva 프롬프트 (한국어)</p>
          <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-mono">{data.canvaPrompt}</p>
        </div>
        <div className="bg-gray-50 border rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-600 mb-2">Midjourney 프롬프트 (영문)</p>
          <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-mono">{data.midjourneyPrompt}</p>
        </div>
      </div>
    </section>
  )
}
