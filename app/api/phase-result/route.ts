import { NextRequest, NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { phaseResults, brandMemory } from '@/lib/db/schema'
import { Phase01OutputSchema } from '@/lib/schemas/phase-01.schema'
import { Phase02OutputSchema } from '@/lib/schemas/phase-02.schema'
import { Phase03OutputSchema } from '@/lib/schemas/phase-03.schema'
import { Phase04OutputSchema } from '@/lib/schemas/phase-04.schema'
import { Phase05OutputSchema } from '@/lib/schemas/phase-05.schema'
import { Phase06OutputSchema } from '@/lib/schemas/phase-06.schema'
import type { ZodTypeAny } from 'zod'

const OUTPUT_SCHEMAS: Record<number, ZodTypeAny> = {
  1: Phase01OutputSchema,
  2: Phase02OutputSchema,
  3: Phase03OutputSchema,
  4: Phase04OutputSchema,
  5: Phase05OutputSchema,
  6: Phase06OutputSchema,
}

// @MX:ANCHOR: [AUTO] 모든 Phase 편집 저장의 단일 진입점 — PUT handler.
// @MX:REASON: PhaseChat의 diff 적용이 이 엔드포인트를 통해서만 저장되므로 fan_in >= 6 예상.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('eventId')
  const phase = searchParams.get('phase')

  if (!eventId || !phase) {
    return NextResponse.json({ error: 'eventId, phase 파라미터가 필요합니다.' }, { status: 400 })
  }

  const phaseNumber = Number(phase)
  if (!Number.isInteger(phaseNumber) || phaseNumber < 1 || phaseNumber > 6) {
    return NextResponse.json({ error: 'phase는 1~6 사이 정수여야 합니다.' }, { status: 400 })
  }

  const rows = await db
    .select()
    .from(phaseResults)
    .where(and(eq(phaseResults.eventId, eventId), eq(phaseResults.phaseNumber, phaseNumber)))
    .orderBy(phaseResults.completedAt)
    .limit(1)

  if (rows.length === 0) {
    return NextResponse.json(null, { status: 200 })
  }

  return NextResponse.json(rows[0].outputJson, { status: 200 })
}

export async function PUT(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '유효하지 않은 요청 형식입니다.' }, { status: 400 })
  }

  const { eventId, phaseNumber: phaseRaw, patch } = body as {
    eventId?: unknown
    phaseNumber?: unknown
    patch?: unknown
  }

  if (typeof eventId !== 'string' || !eventId) {
    return NextResponse.json({ error: 'eventId가 필요합니다.' }, { status: 400 })
  }

  const phaseNumber = Number(phaseRaw)
  if (!Number.isInteger(phaseNumber) || phaseNumber < 1 || phaseNumber > 6) {
    return NextResponse.json({ error: 'phaseNumber는 1~6 사이 정수여야 합니다.' }, { status: 400 })
  }

  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    return NextResponse.json({ error: 'patch는 객체여야 합니다.' }, { status: 400 })
  }

  // 기존 결과 로드
  const rows = await db
    .select()
    .from(phaseResults)
    .where(and(eq(phaseResults.eventId, eventId), eq(phaseResults.phaseNumber, phaseNumber)))
    .orderBy(phaseResults.completedAt)
    .limit(1)

  if (rows.length === 0) {
    return NextResponse.json({ error: '기존 Phase 결과가 없습니다. 먼저 Phase를 실행하세요.' }, { status: 404 })
  }

  const existing = rows[0].outputJson as Record<string, unknown>

  // Deep merge: patch가 기존 outputJson에 shallow merge (중첩 객체는 patch 우선)
  const merged = deepMerge(existing, patch as Record<string, unknown>)

  // OutputSchema 재검증
  const schema = OUTPUT_SCHEMAS[phaseNumber]
  const validated = schema.safeParse(merged)
  if (!validated.success) {
    return NextResponse.json(
      { error: '편집 내용이 스키마 검증에 실패했습니다.', details: validated.error.flatten() },
      { status: 400 }
    )
  }

  const updatedJson = validated.data as Record<string, unknown>

  // phaseResults 갱신
  await db
    .update(phaseResults)
    .set({ outputJson: updatedJson, completedAt: new Date() })
    .where(and(eq(phaseResults.eventId, eventId), eq(phaseResults.phaseNumber, phaseNumber)))

  // @MX:WARN: [AUTO] Phase 3 편집 시 brandMemory도 동기화 — 누락 시 Phase 4·5가 구버전 참조.
  // @MX:REASON: brandMemory는 Phase 4·5 시스템 프롬프트에 자동 주입되는 브랜드 컨셉 메모리.
  if (phaseNumber === 3) {
    const out = updatedJson as {
      primaryColor: string
      secondaryColors: string[]
      designMood: string
      fontStyle: string
      visualKeywords: string[]
    }
    await db
      .insert(brandMemory)
      .values({
        eventId,
        primaryColor: out.primaryColor,
        secondaryColors: out.secondaryColors,
        designMood: out.designMood,
        fontStyle: out.fontStyle,
        visualKeywords: out.visualKeywords,
      })
      .onConflictDoUpdate({
        target: brandMemory.eventId,
        set: {
          primaryColor: out.primaryColor,
          secondaryColors: out.secondaryColors,
          designMood: out.designMood,
          fontStyle: out.fontStyle,
          visualKeywords: out.visualKeywords,
          updatedAt: new Date(),
        },
      })
  }

  return NextResponse.json(updatedJson, { status: 200 })
}

function deepMerge(
  base: Record<string, unknown>,
  patch: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base }
  for (const key of Object.keys(patch)) {
    const pv = patch[key]
    const bv = base[key]

    if (
      Array.isArray(pv) && Array.isArray(bv) &&
      pv.length > 0 && pv[0] !== null && typeof pv[0] === 'object'
    ) {
      // 객체 배열은 인덱스별 병합 — 나머지 필드 유지
      const merged = (bv as unknown[]).map(item => ({ ...(item as object) })) as Record<string, unknown>[]
      for (let i = 0; i < pv.length; i++) {
        if (i < merged.length) {
          merged[i] = deepMerge(merged[i], pv[i] as Record<string, unknown>)
        } else {
          merged[i] = pv[i] as Record<string, unknown>
        }
      }
      result[key] = merged
    } else if (
      pv !== null &&
      typeof pv === 'object' &&
      !Array.isArray(pv) &&
      bv !== null &&
      typeof bv === 'object' &&
      !Array.isArray(bv)
    ) {
      result[key] = deepMerge(bv as Record<string, unknown>, pv as Record<string, unknown>)
    } else {
      result[key] = pv
    }
  }
  return result
}
