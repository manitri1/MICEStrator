import type { ZodIssue } from 'zod'

export function friendlyZodError(issues: ZodIssue[]): string {
  if (!issues || issues.length === 0) return '편집 내용을 저장할 수 없습니다.'

  const issue = issues[0]
  const msg = issue.message.toLowerCase()
  const field = issue.path.join('.')
  const isColorField = issue.path.some(p => String(p).toLowerCase().includes('color'))

  if (isColorField) return 'hex 색상 형식(#RRGGBB)으로 입력해주세요. 예: #1A5276'

  const code = issue.code as string
  if (code === 'too_small') {
    const min = (issue as unknown as { minimum?: number }).minimum
    return `항목 수가 부족합니다. 최소 ${min ?? ''}개 이상이어야 합니다.`
  }

  if (code === 'too_big') {
    const max = (issue as unknown as { maximum?: number }).maximum
    return `항목 수가 초과되었습니다. 최대 ${max ?? ''}개까지 가능합니다.`
  }

  if (code === 'invalid_type' || code === 'invalid_format') {
    return field
      ? `'${field}' 필드의 값 형식이 올바르지 않습니다.`
      : '필드 형식이 올바르지 않습니다.'
  }

  if (msg.includes('required') || msg.includes('필수')) {
    return field ? `'${field}' 필드가 비어 있습니다.` : '필수 항목이 비어 있습니다.'
  }

  return '편집 내용이 형식에 맞지 않습니다. 내용을 확인하고 다시 시도해주세요.'
}
