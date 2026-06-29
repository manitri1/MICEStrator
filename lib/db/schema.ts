import { pgTable, uuid, integer, jsonb, timestamp, text, index } from 'drizzle-orm/pg-core'

export const events = pgTable('events', {
  id:        uuid('id').primaryKey().defaultRandom(),
  name:      text('name').notNull(),
  status:    text('status').default('draft'),   // draft | in_progress | completed
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, t => [index('events_created_at_idx').on(t.createdAt)])

// Phase 1~6 에이전트 실행 결과 저장
export const phaseResults = pgTable('phase_results', {
  id:          uuid('id').primaryKey().defaultRandom(),
  eventId:     uuid('event_id').references(() => events.id, { onDelete: 'cascade' }),
  phaseNumber: integer('phase_number').notNull(),  // 1~6
  outputJson:  jsonb('output_json').notNull(),
  completedAt: timestamp('completed_at').defaultNow(),
})

// Phase 3 확정 후 저장 → Phase 4·5 시스템 프롬프트에 자동 주입
export const brandMemory = pgTable('brand_memory', {
  eventId:         uuid('event_id').primaryKey().references(() => events.id, { onDelete: 'cascade' }),
  primaryColor:    text('primary_color'),
  secondaryColors: jsonb('secondary_colors').$type<string[]>(),
  designMood:      text('design_mood'),
  fontStyle:       text('font_style'),
  visualKeywords:  jsonb('visual_keywords').$type<string[]>(),
  updatedAt:       timestamp('updated_at').defaultNow(),
})

export type Event = typeof events.$inferSelect
export type PhaseResult = typeof phaseResults.$inferSelect
export type BrandMemory = typeof brandMemory.$inferSelect
