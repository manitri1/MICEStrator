export interface TavilyResult {
  title: string
  url: string
  content: string
  score: number
}

// Tavily REST API 클라이언트 — SDK 없이 fetch만 사용
export async function tavilySearch(query: string, maxResults = 5): Promise<TavilyResult[]> {
  if (!process.env.TAVILY_API_KEY) return []
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      max_results: maxResults,
      search_depth: 'basic',
    }),
  })
  if (!res.ok) return []
  const data = await res.json()
  return (data.results ?? []) as TavilyResult[]
}
