import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { events } from '@/lib/db/schema'

const CreateEventSchema = z.object({
  name: z.string().min(1, '행사명을 입력하세요'),
})

export async function GET() {
  const rows = await db.select().from(events).orderBy(desc(events.createdAt))
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '유효하지 않은 요청입니다.' }, { status: 400 })
  }

  const parsed = CreateEventSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const [event] = await db
    .insert(events)
    .values({ name: parsed.data.name })
    .returning()

  return NextResponse.json(event, { status: 201 })
}
