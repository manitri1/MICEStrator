import type { Phase01Output } from '../schemas/phase-01.schema'
import type { Phase02Output } from '../schemas/phase-02.schema'
import type { Phase03Output } from '../schemas/phase-03.schema'
import type { Phase04Output } from '../schemas/phase-04.schema'
import type { Phase05Output } from '../schemas/phase-05.schema'
import type { Phase06Output } from '../schemas/phase-06.schema'

export interface PhaseData {
  phase1: Phase01Output | null
  phase2: Phase02Output | null
  phase3: Phase03Output | null
  phase4: Phase04Output | null
  phase5: Phase05Output | null
  phase6: Phase06Output | null
}

export function buildMarkdown(eventName: string, phases: PhaseData): string {
  const lines: string[] = []
  const date = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  lines.push(`# ${eventName} 기획 보고서`)
  lines.push(``)
  lines.push(`생성일: ${date}`)
  lines.push(``)
  lines.push(`---`)
  lines.push(``)

  if (phases.phase1) {
    const p = phases.phase1
    lines.push(`## Phase 1 — 행사 기획 방향`)
    lines.push(``)
    lines.push(`- **행사명 (한)**: ${p.eventNameKr}`)
    lines.push(`- **행사명 (영)**: ${p.eventNameEn}`)
    lines.push(`- **슬로건**: ${p.slogan}`)
    lines.push(`- **부제**: ${p.subtitle}`)
    lines.push(``)
    lines.push(`**핵심 키워드**: ${p.coreKeywords.map(k => `\`${k}\``).join(' ')}`)
    lines.push(``)
    lines.push(`### 기획 배경`)
    lines.push(``)
    lines.push(p.planningRationale)
    lines.push(``)
    lines.push(`### PEST 분석`)
    lines.push(``)
    lines.push(`| 분류 | 내용 |`)
    lines.push(`| --- | --- |`)
    lines.push(`| 정치 (Political) | ${p.pestAnalysis.political} |`)
    lines.push(`| 경제 (Economic) | ${p.pestAnalysis.economic} |`)
    lines.push(`| 사회 (Social) | ${p.pestAnalysis.social} |`)
    lines.push(`| 기술 (Technological) | ${p.pestAnalysis.technological} |`)
    lines.push(``)
    lines.push(`### 타깃 페르소나`)
    lines.push(``)
    for (const persona of p.targetPersonas) {
      lines.push(`#### ${persona.name} (${persona.role})`)
      lines.push(``)
      lines.push(`**Pain Points**`)
      for (const pt of persona.painPoints) lines.push(`- ${pt}`)
      lines.push(``)
      lines.push(`**참석 동기**`)
      for (const m of persona.motivations) lines.push(`- ${m}`)
      lines.push(``)
      lines.push(`**기대 가치**: ${persona.expectedValue}`)
      lines.push(``)
    }
    lines.push(`---`)
    lines.push(``)
  }

  if (phases.phase2) {
    const p = phases.phase2
    lines.push(`## Phase 2 — 조직 구조 & 일정 계획`)
    lines.push(``)
    lines.push(`총 준비 기간: **${p.totalWeeks}주** | 태스크: ${p.wbsTasks.length}개 | 마일스톤: ${p.milestones.length}개`)
    lines.push(``)
    if (p.criticalPath.length > 0) {
      lines.push(`**임계 경로**: ${p.criticalPath.join(' → ')}`)
      lines.push(``)
    }
    lines.push(`### 부서 구성`)
    lines.push(``)
    lines.push(`| 부서 | 팀장 | 인원 | 주요 책임 |`)
    lines.push(`| --- | --- | --- | --- |`)
    for (const dept of p.departments) {
      lines.push(`| ${dept.name} | ${dept.headRole} | ${dept.teamSize}명 | ${dept.responsibilities.join(', ')} |`)
    }
    lines.push(``)
    lines.push(`### 주요 마일스톤`)
    lines.push(``)
    for (const ms of [...p.milestones].sort((a, b) => a.week - b.week)) {
      const crit = ms.isCritical ? ' ⚠️' : ''
      lines.push(`- **W${ms.week}** ${ms.title}${crit}: ${ms.description} (${ms.responsible})`)
    }
    lines.push(``)
    lines.push(`---`)
    lines.push(``)
  }

  if (phases.phase3) {
    const p = phases.phase3
    lines.push(`## Phase 3 — 비주얼 아이덴티티`)
    lines.push(``)
    lines.push(`- **Primary**: ${p.primaryColor}`)
    lines.push(`- **Secondary**: ${p.secondaryColors.join(', ')}`)
    lines.push(`- **Accent**: ${p.accentColor}`)
    lines.push(`- **디자인 무드**: ${p.designMood}`)
    lines.push(`- **추천 서체**: ${p.fontStyle}`)
    lines.push(`- **브랜드 성격**: ${p.brandPersonality}`)
    lines.push(`- **비주얼 키워드**: ${p.visualKeywords.join(', ')}`)
    lines.push(``)
    lines.push(`### 컬러 선택 배경`)
    lines.push(``)
    lines.push(p.colorRationale)
    lines.push(``)
    lines.push(`### Canva 프롬프트`)
    lines.push(``)
    lines.push(`\`\`\``)
    lines.push(p.canvaPrompt)
    lines.push(`\`\`\``)
    lines.push(``)
    lines.push(`### Midjourney 프롬프트`)
    lines.push(``)
    lines.push(`\`\`\``)
    lines.push(p.midjourneyPrompt)
    lines.push(`\`\`\``)
    lines.push(``)
    lines.push(`---`)
    lines.push(``)
  }

  if (phases.phase4) {
    const p = phases.phase4
    lines.push(`## Phase 4 — 연사 소싱 & 아웃리치`)
    lines.push(``)
    lines.push(`### 캠페인 주의사항`)
    lines.push(``)
    lines.push(p.campaignNotes)
    lines.push(``)
    for (const outreach of p.outreachList) {
      lines.push(`### ${outreach.speakerName}`)
      lines.push(``)
      lines.push(`**선정 이유**: ${outreach.selectionRationale}`)
      lines.push(``)
      lines.push(`**초청 이메일 제목**: ${outreach.emailSubject}`)
      lines.push(``)
      lines.push(`\`\`\``)
      lines.push(outreach.emailBody)
      lines.push(`\`\`\``)
      lines.push(``)
      lines.push(`**PPT 아웃라인**`)
      for (const slide of outreach.proposalSlides) {
        lines.push(`${slide.slideNumber}. **${slide.title}**: ${slide.content}`)
      }
      lines.push(``)
    }
    lines.push(`---`)
    lines.push(``)
  }

  if (phases.phase5) {
    const p = phases.phase5
    lines.push(`## Phase 5 — 디지털 에셋 & 마케팅`)
    lines.push(``)
    lines.push(`### Instagram 게시물`)
    lines.push(``)
    lines.push(p.instagramPost.caption)
    lines.push(``)
    lines.push(`**해시태그**: ${p.instagramPost.hashtags.join(' ')}`)
    lines.push(``)
    lines.push(`**이미지 프롬프트**: ${p.instagramPost.imagePrompt}`)
    lines.push(``)
    lines.push(`### LinkedIn 게시물`)
    lines.push(``)
    lines.push(`**헤드라인**: ${p.linkedinPost.headline}`)
    lines.push(``)
    lines.push(p.linkedinPost.body)
    lines.push(``)
    lines.push(`**CTA**: ${p.linkedinPost.callToAction}`)
    lines.push(``)
    lines.push(`**해시태그**: ${p.linkedinPost.hashtags.join(' ')}`)
    lines.push(``)
    lines.push(`### 이메일 제목 라인`)
    lines.push(``)
    for (const subject of p.emailSubjectLines) lines.push(`- ${subject}`)
    lines.push(``)
    lines.push(`### 랜딩페이지 구성`)
    lines.push(``)
    p.landingPageSections.forEach((sec, i) => {
      lines.push(`**${i + 1}. ${sec.sectionName}**`)
      lines.push(`- 헤드라인: ${sec.headline}`)
      lines.push(`- 서브텍스트: ${sec.subtext}`)
      if (sec.cta) lines.push(`- CTA: ${sec.cta}`)
      lines.push(``)
    })
    lines.push(`### D-Day 캠페인 스케줄`)
    lines.push(``)
    lines.push(`| D-Day | 채널 | 액션 | 핵심 메시지 |`)
    lines.push(`| --- | --- | --- | --- |`)
    for (const item of p.campaignSchedule) {
      lines.push(`| ${item.dDay} | ${item.channel} | ${item.action} | ${item.keyMessage} |`)
    }
    lines.push(``)
    lines.push(`---`)
    lines.push(``)
  }

  if (phases.phase6) {
    const p = phases.phase6
    lines.push(`## Phase 6 — ROI 분석 & 차기 제언`)
    lines.push(``)
    lines.push(`### 종합 요약`)
    lines.push(``)
    lines.push(p.executiveSummary)
    lines.push(``)
    lines.push(`### KPI 실적`)
    lines.push(``)
    lines.push(`- **출석 달성률**: ${p.kpiPerformance.attendanceAchievementRate.toFixed(1)}%`)
    lines.push(`- **평균 만족도**: ${p.kpiPerformance.avgSatisfactionScore.toFixed(1)} / 5.0`)
    lines.push(`- **예산 집행**: ${p.kpiPerformance.budgetEfficiencyNote}`)
    if (p.kpiPerformance.businessRoiNote) {
      lines.push(`- **비즈니스 ROI**: ${p.kpiPerformance.businessRoiNote}`)
    }
    lines.push(``)
    lines.push(`### 강점`)
    lines.push(``)
    for (const item of p.topStrengths) {
      lines.push(`- **[${item.category}]** ${item.finding}`)
      lines.push(`  - 근거: "${item.evidence}"`)
    }
    lines.push(``)
    lines.push(`### 약점`)
    lines.push(``)
    for (const item of p.topWeaknesses) {
      lines.push(`- **[${item.category}]** ${item.finding}`)
      lines.push(`  - 근거: "${item.evidence}"`)
    }
    lines.push(``)
    lines.push(`### 페르소나 검증`)
    lines.push(``)
    for (const item of p.personaFeedbackLoop) {
      const status = item.painPointResolved ? '✓ 해소됨' : '✗ 미해소'
      lines.push(`- **${item.personaName}** (${item.personaRole}): ${status}`)
      lines.push(`  - ${item.evidence}`)
    }
    lines.push(``)
    lines.push(`### 차기 행사 제언`)
    lines.push(``)
    for (const rec of p.nextEventRecommendations) {
      lines.push(`- **[${rec.priority}]** ${rec.actionItem}`)
      lines.push(`  - ${rec.strategy}`)
    }
  }

  return lines.join('\n')
}
