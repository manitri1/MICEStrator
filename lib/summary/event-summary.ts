// 행사 요약 집계 유틸리티 — phaseResults 배치/단건 조회 → EventSummary (REQ-SUMMARY-001~003)
import { db } from '@/lib/db'
import { phaseResults } from '@/lib/db/schema'
import { inArray, eq } from 'drizzle-orm'

export interface EventSummary {
  eventId: string
  slogan?: string
  preparationPeriod?: string
  eventScale?: string
  taskCount?: number
  milestoneCount?: number
  tone?: string
  speakerNames?: string[]
}

// 준비 기간 enum → 한국어 레이블
export const PREP_PERIOD_LABEL: Record<string, string> = {
  '3months': '3개월',
  '6months': '6개월',
  '12months': '12개월',
}

// 행사 규모 enum → 한국어 레이블
export const EVENT_SCALE_LABEL: Record<string, string> = {
  small: '소규모 (100명 이하)',
  medium: '중규모 (100~500명)',
  large: '대규모 (500명 이상)',
}

// phaseResults 행 타입 (Drizzle 인퍼 타입 일부 사용)
interface PhaseRow {
  eventId: string | null
  phaseNumber: number
  outputJson: unknown
  completedAt: Date | null
}

/**
 * phaseResults 행 배열에서 EventSummary를 추출하는 공통 헬퍼.
 * 동일 eventId+phaseNumber 중복 시 completedAt DESC 기준 최신 행을 사용.
 */
function extractSummary(eventId: string, rows: PhaseRow[]): EventSummary {
  // 각 phaseNumber별 최신 행 선택
  const latestByPhase = new Map<number, PhaseRow>()
  for (const row of rows) {
    const existing = latestByPhase.get(row.phaseNumber)
    if (!existing) {
      latestByPhase.set(row.phaseNumber, row)
    } else {
      const existingTime = existing.completedAt?.getTime() ?? 0
      const rowTime = row.completedAt?.getTime() ?? 0
      if (rowTime > existingTime) {
        latestByPhase.set(row.phaseNumber, row)
      }
    }
  }

  const summary: EventSummary = { eventId }

  // Phase 1: slogan, preparationPeriod, eventScale
  const p1 = latestByPhase.get(1)
  if (p1) {
    const o = p1.outputJson as Record<string, unknown>
    if (typeof o.slogan === 'string') {
      summary.slogan = o.slogan
    }
    if (typeof o.preparationPeriod === 'string') {
      summary.preparationPeriod = PREP_PERIOD_LABEL[o.preparationPeriod] ?? o.preparationPeriod
    }
    if (typeof o.eventScale === 'string') {
      summary.eventScale = EVENT_SCALE_LABEL[o.eventScale] ?? o.eventScale
    }
  }

  // Phase 2: taskCount, milestoneCount
  const p2 = latestByPhase.get(2)
  if (p2) {
    const o = p2.outputJson as Record<string, unknown>
    if (Array.isArray(o.wbsTasks)) {
      summary.taskCount = o.wbsTasks.length
    }
    if (Array.isArray(o.milestones)) {
      summary.milestoneCount = o.milestones.length
    }
  }

  // Phase 3: tone (designMood 우선, brandPersonality 폴백)
  const p3 = latestByPhase.get(3)
  if (p3) {
    const o = p3.outputJson as Record<string, unknown>
    if (typeof o.designMood === 'string') {
      summary.tone = o.designMood
    } else if (typeof o.brandPersonality === 'string') {
      summary.tone = o.brandPersonality
    }
  }

  // Phase 4: speakerNames (outreachList 배열에서 speakerName 추출)
  const p4 = latestByPhase.get(4)
  if (p4) {
    const o = p4.outputJson as Record<string, unknown>
    if (Array.isArray(o.outreachList)) {
      const names = (o.outreachList as { speakerName?: string }[])
        .map(s => s.speakerName)
        .filter((n): n is string => typeof n === 'string' && n.length > 0)
      if (names.length > 0) {
        summary.speakerNames = names
      }
    }
  }

  return summary
}

// @MX:ANCHOR: [AUTO] 이벤트 목록 페이지 배치 요약 조회 — 이벤트 목록·대시보드 등 다수 호출 지점.
// @MX:REASON: N+1 쿼리 방지를 위해 단일 쿼리로 전체 배치 처리. 호출자가 3개 이상(목록 페이지, 대시보드, API).
/**
 * 여러 이벤트의 요약 정보를 단일 쿼리로 일괄 조회한다. (REQ-SUMMARY-002)
 * @param eventIds - 조회할 이벤트 UUID 배열
 * @returns Map<eventId, EventSummary>
 */
export async function getEventSummaryBatch(
  eventIds: string[],
): Promise<Map<string, EventSummary>> {
  // 빈 배열 엣지 케이스: DB 쿼리 없이 즉시 반환
  if (eventIds.length === 0) {
    return new Map()
  }

  const rows = await db
    .select()
    .from(phaseResults)
    .where(inArray(phaseResults.eventId, eventIds))

  // eventId별로 행 분류
  const grouped = new Map<string, PhaseRow[]>()
  for (const row of rows) {
    if (!row.eventId) continue
    const list = grouped.get(row.eventId) ?? []
    list.push(row as PhaseRow)
    grouped.set(row.eventId, list)
  }

  const result = new Map<string, EventSummary>()
  for (const eventId of eventIds) {
    const eventRows = grouped.get(eventId) ?? []
    result.set(eventId, extractSummary(eventId, eventRows))
  }

  return result
}

// @MX:ANCHOR: [AUTO] 단건 이벤트 요약 조회 — Phase 페이지 6개 + API 라우트 등 다수 호출 지점.
// @MX:REASON: 각 Phase 페이지 및 /api/event-summary 라우트에서 직접 호출. 호출자가 3개 이상.
/**
 * 단일 이벤트의 요약 정보를 조회한다. (REQ-SUMMARY-001)
 * @param eventId - 조회할 이벤트 UUID
 * @returns EventSummary
 */
export async function getEventSummary(eventId: string): Promise<EventSummary> {
  const rows = await db
    .select()
    .from(phaseResults)
    .where(eq(phaseResults.eventId, eventId))

  return extractSummary(eventId, rows as PhaseRow[])
}
