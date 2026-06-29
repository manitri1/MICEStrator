'use client'

// @MX:ANCHOR: [AUTO] Phase 편집 후 하위 영향 배너 — Phase 1~6 페이지 6곳에서 사용 (fan_in=6)
// @MX:REASON: 공통 UX 컴포넌트; props 시그니처 변경 시 모든 Phase 페이지 업데이트 필요

interface Props {
  editedPhase: number
  affectedPhases: number[]
  onDismiss: () => void
}

const PHASE_LABELS: Record<number, string> = {
  1: 'Phase 1 (기획)',
  2: 'Phase 2 (WBS)',
  3: 'Phase 3 (브랜드)',
  4: 'Phase 4 (연사)',
  5: 'Phase 5 (마케팅)',
  6: 'Phase 6 (ROI분석)',
}

export function PhaseStaleBanner({ editedPhase, affectedPhases, onDismiss }: Props) {
  if (affectedPhases.length === 0) return null

  const affectedLabel = affectedPhases.map(n => `Phase ${n}`).join(', ')

  return (
    <div className="my-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
      <span className="mt-0.5 text-amber-500">⚠️</span>
      <div className="flex-1">
        <p className="font-medium text-amber-800">
          {PHASE_LABELS[editedPhase]} 수정이 {affectedLabel}에 영향을 줄 수 있습니다.
        </p>
        <p className="mt-0.5 text-amber-700">
          정확한 결과를 위해 영향받는 Phase를 재실행하는 것을 권장합니다.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {affectedPhases.map(n => (
            <a
              key={n}
              href={`phase-${n}`}
              className="rounded-md border border-amber-300 bg-white px-2 py-0.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
            >
              Phase {n} 이동 →
            </a>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-auto text-amber-400 hover:text-amber-600"
        aria-label="닫기"
      >
        ✕
      </button>
    </div>
  )
}
