# MICEstrator — 기술 스택

## 핵심 기술 선택

| 계층 | 기술 | 선택 이유 |
| --- | --- | --- |
| **웹 프레임워크** | Next.js 15 (App Router) | SSR + API Routes로 프론트·백엔드 일원화. 별도 서버 불필요 |
| **AI SDK** | Vercel AI SDK (`ai`) | 스트리밍, 구조화 출력(Zod), 도구 호출, 멀티스텝 에이전트 네이티브 지원 |
| **AI 모델** | OpenAI GPT-4o | 구조화 JSON 출력, 함수 호출, 한국어 품질 우수 |
| **언어** | TypeScript | 에이전트 I/O 스키마를 Zod로 타입 안전하게 정의 |
| **DB** | Supabase (PostgreSQL) | 행사별 Phase 결과 영속, 브랜드 메모리 저장. Auth·Storage 내장 |
| **UI** | shadcn/ui + Tailwind CSS | 대시보드, Phase 진행 화면 |

> **Python 불필요.** 텍스트 마이닝·ROI 계산·에이전트 오케스트레이션 모두 OpenAI + TypeScript로 처리.
> n8n 제거 — Next.js API Routes가 Phase 파이프라인 오케스트레이터 역할 대체.

## 애플리케이션 구조

```
micestrator/
├── app/                          # Next.js App Router
│   ├── (dashboard)/              # 행사 목록 대시보드
│   │   └── page.tsx
│   ├── event/
│   │   └── [id]/                 # 행사별 Phase 진행 화면
│   │       ├── layout.tsx        # Phase 네비게이션 사이드바
│   │       ├── phase-1/page.tsx  # 트렌드 & 방향성
│   │       ├── phase-2/page.tsx  # WBS & 일정
│   │       ├── phase-3/page.tsx  # 비주얼 아이덴티티
│   │       ├── phase-4/page.tsx  # 연사 소싱
│   │       ├── phase-5/page.tsx  # 마케팅 엔진
│   │       └── phase-6/page.tsx  # ROI 분석
│   └── api/
│       ├── events/route.ts       # 행사 CRUD
│       └── agents/
│           ├── phase-1/route.ts  # 트렌드 에이전트 호출 (스트리밍)
│           ├── phase-2/route.ts
│           ├── phase-3/route.ts
│           ├── phase-4/route.ts
│           ├── phase-5/route.ts
│           └── phase-6/route.ts
│
├── lib/
│   ├── agents/                   # Phase별 에이전트 로직 (TypeScript)
│   │   ├── phase-01-trend.ts
│   │   ├── phase-02-wbs.ts
│   │   ├── phase-03-design.ts
│   │   ├── phase-04-speaker.ts
│   │   ├── phase-05-marketing.ts
│   │   └── phase-06-roi.ts
│   ├── schemas/                  # Zod 스키마 (Phase I/O 계약)
│   │   ├── event-master.schema.ts
│   │   ├── brand-identity.schema.ts
│   │   └── phase-*.schema.ts
│   ├── prompts/                  # 시스템 프롬프트 템플릿
│   └── db/                       # DB 클라이언트 (Drizzle ORM)
│
├── components/
│   ├── phase/                    # Phase별 입력 폼 + 출력 카드
│   ├── dashboard/                # 행사 목록 컴포넌트
│   └── ui/                       # shadcn/ui 기본 컴포넌트
│
└── ref/                          # 설계 레퍼런스 문서 (현재 존재)
```

## AI 에이전트 구현 패턴

### Vercel AI SDK — 구조화 출력 (Phase 1~5)

```typescript
// lib/agents/phase-01-trend.ts
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { eventMasterSchema } from '../schemas/event-master.schema'

export async function runPhase1(input: Phase1Input) {
  const { object } = await generateObject({
    model: openai('gpt-4o'),
    schema: eventMasterSchema,   // Zod 스키마 → 자동 JSON 검증
    temperature: 0.7,
    system: PHASE1_SYSTEM_PROMPT,
    prompt: JSON.stringify(input),
  })
  return object  // 타입 안전한 event_master 객체
}
```

### Vercel AI SDK — 스트리밍 (긴 리포트 생성)

```typescript
// app/api/agents/phase-6/route.ts
import { streamObject } from 'ai'
import { openai } from '@ai-sdk/openai'

export async function POST(req: Request) {
  const result = streamObject({
    model: openai('gpt-4o'),
    schema: roiReportSchema,
    temperature: 0.2,   // Phase 6: 수치 정확성 최우선
    system: PHASE6_SYSTEM_PROMPT,
    prompt: await req.text(),
  })
  return result.toTextStreamResponse()
}
```

## Phase별 에이전트 설정

| Phase | Temperature | 출력 방식 | 이유 |
| --- | --- | --- | --- |
| Phase 1 — 트렌드 분석 | 0.7 | `generateObject` | 창의적 컨셉 도출 |
| Phase 2 — WBS | 0.3 | `generateObject` | 논리적 일정 계산 |
| Phase 3 — 디자인 | 0.8 | `generateObject` | 디자인 무드 발상 |
| Phase 4 — 연사 | 0.5 | `generateObject` | 격식 이메일 생성 |
| Phase 5 — 마케팅 | 0.7 | `streamObject` | 채널별 콘텐츠 (긴 텍스트) |
| Phase 6 — ROI | 0.2 | `streamObject` | 수치 정확성 + 긴 리포트 |

## 데이터베이스 (Supabase + Drizzle ORM)

Supabase의 PostgreSQL을 Drizzle ORM으로 접근합니다.
Supabase 클라이언트(`@supabase/ssr`)는 인증·파일 저장(Storage)에 사용합니다.

```typescript
// lib/db/schema.ts (Drizzle)
import { pgTable, uuid, integer, jsonb, timestamp, text } from 'drizzle-orm/pg-core'

export const events = pgTable('events', {
  id:         uuid('id').primaryKey().defaultRandom(),
  name:       text('name').notNull(),
  status:     text('status').default('draft'),
  createdAt:  timestamp('created_at').defaultNow(),
})

export const phaseResults = pgTable('phase_results', {
  id:          uuid('id').primaryKey().defaultRandom(),
  eventId:     uuid('event_id').references(() => events.id),
  phaseNumber: integer('phase_number').notNull(),   // 1~6
  outputJson:  jsonb('output_json').notNull(),
  completedAt: timestamp('completed_at').defaultNow(),
})

export const brandMemory = pgTable('brand_memory', {
  eventId:        uuid('event_id').primaryKey().references(() => events.id),
  primaryColor:   text('primary_color'),
  secondaryColors: jsonb('secondary_colors'),
  designMood:     text('design_mood'),
  updatedAt:      timestamp('updated_at').defaultNow(),
})
```

브랜드 메모리(`brand_memory`)는 Phase 3 완료 시 저장되며,
Phase 4·5 에이전트가 시스템 프롬프트에 자동 주입합니다.

## 외부 통합 (프롬프트 출력 방식)

n8n 없이 Claude가 직접 프롬프트 텍스트를 생성 → 사용자가 외부 서비스에 복사·붙여넣기

| 서비스 | 연동 방식 |
| --- | --- |
| **Canva / Midjourney** | Phase 3 에이전트가 이미지 생성 프롬프트(영문) 출력 |
| **Suno / Udio** | Phase 5 에이전트가 음악 생성 프롬프트 출력 |
| **Google Forms** | Phase 6 에이전트가 설문 항목 텍스트 출력 (수동 복사) |
| **Google Docs** | Phase 6 리포트 → UI에서 복사 또는 PDF 내보내기 |

> 고도화 시 Google API 직접 연동 가능 (별도 Next.js API Route 추가)

## 개발 환경

```bash
# 필수 패키지
npm install ai @ai-sdk/openai openai
npm install next react react-dom
npm install @supabase/supabase-js @supabase/ssr
npm install drizzle-orm drizzle-kit pg
npm install zod

# UI
npx shadcn@latest init
```

| 항목 | 버전 |
| --- | --- |
| Node.js | 20+ |
| Next.js | 15 (App Router) |
| TypeScript | 5.x |
| Vercel AI SDK | 4.x |
| OpenAI 모델 | gpt-4o |

## 배포

| 환경 | 플랫폼 |
| --- | --- |
| **프로덕션** | Vercel (Next.js 네이티브, 스트리밍 지원) |
| **DB** | Supabase (PostgreSQL) |
| **로컬 개발** | `next dev` + `.env.local` |

```bash
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=postgresql://postgres:<password>@db.<project>.supabase.co:5432/postgres
```

## 품질 설정

| 항목 | 값 |
| --- | --- |
| Development Mode | TDD |
| 에이전트 출력 검증 | Zod 스키마 자동 검증 (스키마 위반 시 재생성) |
| 타입 안전성 | TypeScript strict mode |
| Phase 6 Temperature | 0.2 (수치 정확성) |
