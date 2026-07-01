'use client'

// 행사 요약 배너 — 각 Phase 페이지 상단에 표시되는 컴팩트 요약 스트립 (REQ-SUMMARY-014, REQ-SUMMARY-015)
import { useEffect, useState } from 'react'
import type { EventSummary } from '@/lib/summary/event-summary'

interface EventSummaryBannerProps {
  eventId: string
}

// @MX:ANCHOR: [AUTO] Phase 페이지 6개 + 기타 컨텍스트 페이지에서 호출되는 공유 배너 컴포넌트.
// @MX:REASON: 모든 Phase 페이지에서 재사용되므로 fan_in >= 6. 라이프사이클(마운트 fetch, 에러 무시) 변경 시 모든 페이지에 영향.
export function EventSummaryBanner({ eventId }: EventSummaryBannerProps) {
  const [summary, setSummary] = useState<EventSummary | null>(null)
  // 로딩 중: true, 완료 후(성공/실패 무관): false
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 마운트 시 요약 정보를 비동기 lazy fetch (REQ-SUMMARY-014: 페이지 메인 콘텐츠 렌더링을 차단하지 않음)
    fetch(`/api/event-summary?eventId=${eventId}`)
      .then(r => {
        if (!r.ok) throw new Error('요약 조회 실패')
        return r.json() as Promise<EventSummary>
      })
      .then(data => setSummary(data))
      .catch(() => {
        // 에러 발생 시 배너를 표시하지 않음 (REQ-SUMMARY-015: graceful degradation)
        setSummary(null)
      })
      .finally(() => setLoading(false))
  }, [eventId])

  // 로딩 중: 애니메이션 스켈레톤 바 표시
  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
        <div className="h-4 bg-blue-100 rounded animate-pulse w-2/3" />
      </div>
    )
  }

  // 의미 있는 필드가 하나도 없으면 렌더링 생략 (REQ-SUMMARY-015)
  if (!summary || !hasMeaningfulField(summary)) {
    return null
  }

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 items-center">
        {/* 슬로건 — 이탤릭체, 최대 너비 제한 */}
        {summary.slogan && (
          <span className="text-xs italic text-blue-700 max-w-[200px] truncate" title={summary.slogan}>
            &ldquo;{summary.slogan}&rdquo;
          </span>
        )}

        {/* 준비 기간 */}
        {summary.preparationPeriod && (
          <Chip label="준비기간" value={summary.preparationPeriod} />
        )}

        {/* 행사 규모 */}
        {summary.eventScale && (
          <Chip label="규모" value={summary.eventScale} />
        )}

        {/* 태스크 + 마일스톤 — 두 값 중 하나라도 있으면 표시 */}
        {(summary.taskCount !== undefined || summary.milestoneCount !== undefined) && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {[
              summary.taskCount !== undefined ? `태스크 ${summary.taskCount}개` : null,
              summary.milestoneCount !== undefined ? `마일스톤 ${summary.milestoneCount}개` : null,
            ]
              .filter(Boolean)
              .join(' / ')}
          </span>
        )}

        {/* 톤 */}
        {summary.tone && (
          <Chip label="톤" value={summary.tone} />
        )}

        {/* 연사 — 최대 3명 표시 후 초과 시 +N명 */}
        {summary.speakerNames && summary.speakerNames.length > 0 && (
          <SpeakerChip names={summary.speakerNames} />
        )}
      </div>
    </div>
  )
}

// 공통 레이블+값 칩 서브 컴포넌트
function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
      <span className="text-gray-400">{label}: </span>
      {value}
    </span>
  )
}

// 연사 목록 칩 — 최대 3명, 초과 시 "+N명" 표시
function SpeakerChip({ names }: { names: string[] }) {
  const MAX_DISPLAY = 3
  const displayed = names.slice(0, MAX_DISPLAY)
  const remaining = names.length - MAX_DISPLAY

  return (
    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
      <span className="text-gray-400">연사: </span>
      {displayed.join(', ')}
      {remaining > 0 && ` +${remaining}명`}
    </span>
  )
}

// 요약 정보에 의미 있는 필드가 하나 이상 존재하는지 확인 (REQ-SUMMARY-015)
function hasMeaningfulField(summary: EventSummary): boolean {
  return (
    Boolean(summary.slogan) ||
    Boolean(summary.preparationPeriod) ||
    Boolean(summary.eventScale) ||
    summary.taskCount !== undefined ||
    summary.milestoneCount !== undefined ||
    Boolean(summary.tone) ||
    (Array.isArray(summary.speakerNames) && summary.speakerNames.length > 0)
  )
}
