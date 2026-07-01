# Phase 4 연사 후보 — 실존 인물 탐색 + 강연 링크 첨부

## Context

Phase-04-Sourcing은 GPT-4o가 허구적(archetypal) 연사 후보를 생성한다. 실존하는
인물을 찾지 못하고 강연 링크가 없어, 실제 섭외 활용도가 낮다.

요구사항:
1. 실존하는 적절한 인물을 연사 후보로 탐색
2. 각 후보에 최근 강연 링크 (YouTube·TED·국내 플랫폼) 첨부

---

## 접근 방식: Tavily 웹검색 + GPT-4o 3단계 파이프라인

### 선택 이유 (Tavily)

| 옵션 | 판단 |
|---|---|
| **Tavily API** | AI 에이전트 전용 검색, 무료 1,000회/월, REST API (SDK 불필요), 결과에 URL 포함 → **채택** |
| OpenAI web_search | Responses API 필요 — `generateObject`와 직접 결합 불가 |
| Brave Search | AI 에이전트 포맷 지원 부족 |

### 3단계 파이프라인

```
[Stage 1] GPT-4o — 검색 기준 생성
  입력: Phase 1 컨텍스트 (행사명, 키워드, 페르소나)
  출력: { speakerTier, expertise, searchQuery }[]  ← 실명 없음, 유형 기준만

[Stage 2] Tavily — 실존 인물 + 강연 URL 탐색 (병렬)
  요청 A: "{searchQuery} 강사 전문가 프로필"
  요청 B: "{searchQuery} 강연 site:youtube.com OR site:ted.com"
  출력: 원시 검색 결과 (title, url, content snippet)

[Stage 3] GPT-4o — 검색 결과 구조화
  입력: Stage 1 기준 + Stage 2 원시 결과
  출력: SpeakerCandidateSchema[] (lectureLinks 포함)
```

---

## 스키마 변경 (`lib/schemas/phase-04-sourcing.schema.ts`)

```typescript
const LectureLinkSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  platform: z.string(), // "YouTube", "TED", "네이버TV" 등
  year: z.number().optional(),
})

// SpeakerCandidateSchema에 추가
lectureLinks: z.array(LectureLinkSchema).default([]),
profileUrl: z.string().url().optional(),
isRealPerson: z.boolean().default(false),
```

---

## 수정/신규 파일 목록

| 파일 | 유형 | 역할 |
|---|---|---|
| `lib/search/tavily.ts` | 신규 | Tavily REST API 클라이언트 (fetch 기반, SDK 불필요) |
| `lib/schemas/phase-04-sourcing.schema.ts` | 수정 | LectureLinkSchema + 3개 필드 추가 |
| `lib/prompts/phase-04-sourcing.system-prompt.ts` | 수정 | Stage 1 (기준 생성) + Stage 3 (결과 구조화) 프롬프트 분리 |
| `lib/agents/phase-04-sourcing.ts` | 수정 | 3단계 파이프라인 구현 |
| `app/event/[id]/phase-4/page.tsx` | 수정 | 강연 링크 칩 UI 추가 |
| `.env.local` | 수동 | `TAVILY_API_KEY=tvly-...` (키 없으면 fallback) |

---

## 핵심 구현 상세

### `lib/search/tavily.ts`

```typescript
interface TavilyResult { title: string; url: string; content: string; score: number }

export async function tavilySearch(query: string, maxResults = 5): Promise<TavilyResult[]> {
  if (!process.env.TAVILY_API_KEY) return []
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: process.env.TAVILY_API_KEY, query, max_results: maxResults }),
  })
  const data = await res.json()
  return data.results ?? []
}
```

API 키 미설정 시 `[]` 반환 → Stage 3에서 AI 생성 후보로 graceful fallback.

### `lib/agents/phase-04-sourcing.ts` — 3단계 파이프라인

```typescript
// Stage 1: 검색 기준 생성
const { object: criteria } = await generateObject({
  model: openai('gpt-4o'),
  schema: Phase04SourcingCriteriaSchema,
  system: PHASE04_SOURCING_CRITERIA_PROMPT,
  prompt: userPrompt,  // 기존 Phase 1 컨텍스트
})

// Stage 2: 병렬 Tavily 탐색
const searchResults = await Promise.all(
  criteria.candidates.map(async (c) => {
    const [profiles, lectures] = await Promise.all([
      tavilySearch(`${c.searchQuery} 강사 전문가 프로필`),
      tavilySearch(`${c.searchQuery} 강연 site:youtube.com OR site:ted.com OR site:tv.naver.com`),
    ])
    return { criteria: c, profiles, lectures }
  })
)

// Stage 3: 검색 결과 → 구조화된 후보 목록
const { object } = await generateObject({
  model: openai('gpt-4o'),
  schema: Phase04SourcingOutputSchema,
  system: PHASE04_SOURCING_SYNTHESIS_PROMPT,
  prompt: buildSynthesisPrompt(phase1, searchResults),
})
```

### UI 변경 (`app/event/[id]/phase-4/page.tsx`)

후보 카드(`SpeakerCandidate` 렌더링 블록, 현재 약 199~231번째 줄)에 강연 링크 칩 추가:

```tsx
{c.lectureLinks.length > 0 && (
  <div className="flex flex-wrap gap-1.5 mt-2">
    {c.lectureLinks.map((link, j) => (
      <a key={j} href={link.url} target="_blank" rel="noopener noreferrer"
         className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100">
        ▶ {link.platform}{link.year ? ` (${link.year})` : ''}
      </a>
    ))}
  </div>
)}
```

---

## Tavily API 키 설정

사용자가 `.env.local`에 수동 추가:
```
TAVILY_API_KEY=tvly-xxxxxxxxxx
```

키 발급: https://tavily.com (무료 플랜 1,000회/월)

키 미설정 → Stage 2 결과가 빈 배열 → Stage 3가 기존 AI 생성 후보만 반환 (graceful fallback).

---

## 검증 방법

```bash
npm run dev
```

1. `.env.local`에 `TAVILY_API_KEY` 추가 후 Phase 4 페이지 → "연사 후보 찾기" 클릭
2. 후보 카드에 실존 인물 이름·소속 표시 확인
3. 강연 링크 칩 클릭 → 실제 YouTube/TED 영상 연결 확인
4. `isRealPerson: true` 후보에 "실존 확인" 뱃지 표시 확인
5. `TAVILY_API_KEY` 미설정 시 → 기존 AI 생성 후보로 graceful fallback 확인
