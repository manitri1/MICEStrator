import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { db } from '../db'
import { phaseResults } from '../db/schema'
import { eq, and, desc } from 'drizzle-orm'
import type { Phase01Output } from '../schemas/phase-01.schema'
import {
  Phase04SourcingOutputSchema,
  Phase04SourcingCriteriaSchema,
  type Phase04SourcingOutput,
  type SpeakerCriterion,
} from '../schemas/phase-04-sourcing.schema'
import {
  PHASE04_SOURCING_CRITERIA_PROMPT,
  PHASE04_SOURCING_SYNTHESIS_PROMPT,
} from '../prompts/phase-04-sourcing.system-prompt'
import { tavilySearch, type TavilyResult } from '../search/tavily'

interface Phase04SourcingInput {
  eventId: string
}

// Stage 2 검색 결과를 담는 내부 타입
interface CriterionWithResults {
  criterion: SpeakerCriterion
  profileResults: TavilyResult[]
  lectureResults: TavilyResult[]
}

// @MX:ANCHOR: [AUTO] 3-stage speaker sourcing pipeline — called by API route and direct invocation
// @MX:REASON: 복수 호출 경로(API route, 직접 테스트)가 존재하며 반환 타입이 Phase04SourcingOutput으로 고정
export async function runPhase04Sourcing(input: Phase04SourcingInput): Promise<Phase04SourcingOutput> {
  // Phase 1 결과 조회
  const rows = await db
    .select()
    .from(phaseResults)
    .where(and(eq(phaseResults.eventId, input.eventId), eq(phaseResults.phaseNumber, 1)))
    .orderBy(desc(phaseResults.completedAt))
    .limit(1)

  if (rows.length === 0) {
    throw new Error('Phase 1 결과가 없습니다. Phase 1을 먼저 실행해 주세요.')
  }

  const phase1 = rows[0].outputJson as Phase01Output

  // Phase 1 컨텍스트를 담은 공통 userPrompt
  const eventContext = `행사명: ${phase1.eventNameKr} (${phase1.eventNameEn})
슬로건: ${phase1.slogan}
핵심 키워드: ${phase1.coreKeywords.join(', ')}

타깃 페르소나:
${phase1.targetPersonas.map(p => `- ${p.name} (${p.role}): Pain Points — ${p.painPoints.join(', ')}`).join('\n')}

기획 배경:
${phase1.planningRationale}`

  // ──────────────────────────────────────────────
  // Stage 1: 연사 검색 기준 생성 (실명 없이 유형 + 검색 쿼리)
  // ──────────────────────────────────────────────
  const { object: criteriaResult } = await generateObject({
    model: openai('gpt-4o'),
    schema: Phase04SourcingCriteriaSchema,
    temperature: 0.7,
    system: PHASE04_SOURCING_CRITERIA_PROMPT,
    prompt: `다음 MICE 행사의 연사 검색 기준을 생성해 주세요.\n\n${eventContext}\n\n위 정보를 기반으로 행사에 최적화된 연사 유형 3~8개와 각 유형별 웹 검색 쿼리를 생성해 주세요.`,
  })

  // ──────────────────────────────────────────────
  // Stage 2: 각 기준별 Tavily 웹 검색 (병렬 실행)
  // TAVILY_API_KEY 미설정 시 빈 배열 반환 — 하위 호환성 유지
  // @MX:WARN: [AUTO] Promise.all로 N*2개 검색을 병렬 실행 — 기준 수에 비례해 API 호출 증가
  // @MX:REASON: 각 criterion은 독립적이므로 병렬화가 안전하나, Tavily rate limit 초과 가능성 존재
  // ──────────────────────────────────────────────
  // 기준 인덱스를 키로 사용하여 참조 동일성 문제 방지
  const searchPromises = criteriaResult.criteria.flatMap(
    (criterion, idx): Promise<{ idx: number; type: 'profile' | 'lecture'; results: TavilyResult[] }>[] => [
      tavilySearch(`${criterion.searchQuery} 전문가 강사 프로필`, 3).then(results => ({
        idx,
        type: 'profile' as const,
        results,
      })),
      tavilySearch(`${criterion.searchQuery} 강연 발표`, 3).then(results => ({
        idx,
        type: 'lecture' as const,
        results,
      })),
    ]
  )

  const allSearchResults = await Promise.all(searchPromises)

  // 기준별로 결과 병합 (인덱스 기반)
  const criteriaWithResults: CriterionWithResults[] = criteriaResult.criteria.map((criterion, idx) => {
    const profileResults = allSearchResults
      .filter(r => r.idx === idx && r.type === 'profile')
      .flatMap(r => r.results)
    const lectureResults = allSearchResults
      .filter(r => r.idx === idx && r.type === 'lecture')
      .flatMap(r => r.results)
    return { criterion, profileResults, lectureResults }
  })

  // ──────────────────────────────────────────────
  // Stage 3: 검색 결과를 바탕으로 실제 연사 후보 합성
  // ──────────────────────────────────────────────
  const synthesisUserPrompt = `다음 MICE 행사의 연사 후보를 웹 검색 결과 기반으로 합성해 주세요.

${eventContext}

=== 연사 검색 기준 및 웹 검색 결과 ===
${criteriaWithResults.map((item, idx) => `
[기준 ${idx + 1}] ${item.criterion.speakerTier.toUpperCase()} — ${item.criterion.expertise}
제안 세션: ${item.criterion.proposedSession}
선정 이유: ${item.criterion.rationale}
해외 연사 여부: ${item.criterion.isOverseas ? '예' : '아니오'}

[프로필 검색 결과]
${item.profileResults.length > 0
  ? item.profileResults.map(r => `- 제목: ${r.title}\n  URL: ${r.url}\n  내용: ${r.content.slice(0, 300)}`).join('\n')
  : '(검색 결과 없음)'}

[강연 검색 결과]
${item.lectureResults.length > 0
  ? item.lectureResults.map(r => `- 제목: ${r.title}\n  URL: ${r.url}\n  내용: ${r.content.slice(0, 300)}`).join('\n')
  : '(검색 결과 없음)'}
`).join('\n---\n')}

위 검색 결과를 바탕으로 실제 존재하는 전문가를 연사 후보로 합성해 주세요. 검색 결과에서 실명을 확인한 경우 isRealPerson: true, 찾지 못한 경우 현실적인 archetype을 생성하되 isRealPerson: false로 설정하세요. lectureLinks는 검색 결과에 실제로 존재하는 URL만 사용하세요.`

  const { object } = await generateObject({
    model: openai('gpt-4o'),
    schema: Phase04SourcingOutputSchema,
    temperature: 0.7,
    system: PHASE04_SOURCING_SYNTHESIS_PROMPT,
    prompt: synthesisUserPrompt,
  })

  return object
}
