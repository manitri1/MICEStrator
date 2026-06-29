// scripts/generate-pitch-deck.js
// MICEstrator 피치덱 → PPTX 생성

const PptxGenJS = require('pptxgenjs')
const path = require('path')

const pptx = new PptxGenJS()

// ── 슬라이드 크기 (와이드 16:9) ──────────────────────
pptx.layout = 'LAYOUT_WIDE'

// ── 색상 팔레트 ──────────────────────────────────────
const C = {
  navy:   '0D1B4B',   // 딥 네이비 배경
  gold:   'D4A843',   // 골드 액센트
  white:  'FFFFFF',
  lightBg:'F4F6FB',   // 밝은 슬라이드 배경
  gray:   '6B7280',   // 보조 텍스트
  blue:   '2563EB',   // 강조 블루
  green:  '059669',   // 긍정 지표
  red:    'DC2626',   // 경고/문제
  darkText:'1E2A4A',  // 어두운 본문 텍스트
}

// ── 공통 헬퍼 ────────────────────────────────────────

function addCoverSlide(slide, title, subtitle, badgeText) {
  // 배경
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: '100%', fill: { color: C.navy },
  })
  // 골드 상단 바
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 0.08, fill: { color: C.gold },
  })
  // 골드 하단 바
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 7.42, w: '100%', h: 0.08, fill: { color: C.gold },
  })
  if (badgeText) {
    slide.addText(badgeText, {
      x: 0.5, y: 0.3, w: 3, h: 0.35,
      fontSize: 10, color: C.gold, bold: true, align: 'left',
      fontFace: 'Arial',
    })
  }
  slide.addText(title, {
    x: 0.8, y: 1.8, w: 11.4, h: 1.6,
    fontSize: 44, color: C.white, bold: true, align: 'center',
    fontFace: 'Arial',
  })
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.8, y: 3.6, w: 11.4, h: 0.7,
      fontSize: 20, color: C.gold, bold: false, align: 'center',
      fontFace: 'Arial',
    })
  }
}

function addSectionHeader(slide, num, title) {
  // 배경 그라데이션 느낌을 위한 두 rect
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: '100%', fill: { color: C.lightBg },
  })
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 0.06, fill: { color: C.navy },
  })
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 7.44, w: '100%', h: 0.06, fill: { color: C.gold },
  })
  // 슬라이드 번호 뱃지
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.4, y: 0.25, w: 0.55, h: 0.55, fill: { color: C.navy }, rectRadius: 0.08,
  })
  slide.addText(String(num), {
    x: 0.4, y: 0.25, w: 0.55, h: 0.55,
    fontSize: 18, color: C.gold, bold: true, align: 'center', valign: 'middle',
    fontFace: 'Arial',
  })
  // 제목
  slide.addText(title, {
    x: 1.1, y: 0.2, w: 11, h: 0.7,
    fontSize: 22, color: C.navy, bold: true, align: 'left',
    fontFace: 'Arial',
  })
  // 구분선
  slide.addShape(pptx.ShapeType.line, {
    x: 0.4, y: 1.05, w: 12.2, h: 0,
    line: { color: C.gold, width: 2 },
  })
}

function addFooter(slide, pageNum) {
  slide.addText(`MICEstrator  ·  Confidential  ·  ${pageNum}/15`, {
    x: 0, y: 7.3, w: '100%', h: 0.2,
    fontSize: 8, color: C.gray, align: 'center', fontFace: 'Arial',
  })
}

function tableCell(text, opts = {}) {
  return {
    text,
    options: {
      bold: opts.bold || false,
      fontSize: opts.fontSize || 11,
      color: opts.color || C.darkText,
      fill: opts.fill || C.white,
      align: opts.align || 'left',
      valign: 'middle',
      fontFace: 'Arial',
    },
  }
}

function headerCell(text) {
  return tableCell(text, { bold: true, color: C.white, fill: C.navy, align: 'center' })
}

function bulletList(slide, items, x, y, w, h, opts = {}) {
  const rows = items.map(item => ({
    text: item.text || item,
    options: {
      bullet: item.bullet !== false ? { type: 'bullet', indent: 15 } : false,
      fontSize: opts.fontSize || 13,
      color: opts.color || C.darkText,
      paraSpaceAfter: 6,
      fontFace: 'Arial',
    },
  }))
  slide.addText(rows, { x, y, w, h, valign: 'top', fontFace: 'Arial' })
}

// ══════════════════════════════════════════════════════
// Slide 1 — Cover
// ══════════════════════════════════════════════════════
;(function slide1() {
  const slide = pptx.addSlide()
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: '100%', fill: { color: C.navy },
  })
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.08, fill: { color: C.gold } })
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 7.42, w: '100%', h: 0.08, fill: { color: C.gold } })

  // 중앙 장식 원
  slide.addShape(pptx.ShapeType.ellipse, {
    x: 4.9, y: 0.5, w: 3.2, h: 3.2,
    fill: { color: '1A2F6B', transparency: 40 }, line: { color: C.gold, width: 1.5 },
  })

  slide.addText('MICEstrator', {
    x: 0.8, y: 1.2, w: 11.4, h: 1.1,
    fontSize: 52, color: C.white, bold: true, align: 'center', fontFace: 'Arial',
  })
  slide.addText('AI가 기획하는 완벽한 행사', {
    x: 0.8, y: 2.5, w: 11.4, h: 0.7,
    fontSize: 26, color: C.gold, bold: false, align: 'center', fontFace: 'Arial',
  })
  slide.addText('아이디어에서 ROI까지 6단계 자동화', {
    x: 0.8, y: 3.3, w: 11.4, h: 0.5,
    fontSize: 18, color: 'A0AECF', align: 'center', fontFace: 'Arial',
  })

  // Phase 아이콘 흐름
  const phases = ['Phase 1\n기획·전략', 'Phase 2\nWBS', 'Phase 3\n브랜드', 'Phase 4\n연사', 'Phase 5\n마케팅', 'Phase 6\nROI']
  phases.forEach((p, i) => {
    const x = 0.5 + i * 2.13
    slide.addShape(pptx.ShapeType.rect, {
      x, y: 4.6, w: 1.85, h: 0.9, fill: { color: '1A2F6B' }, rectRadius: 0.08,
      line: { color: C.gold, width: 1 },
    })
    slide.addText(p, {
      x, y: 4.6, w: 1.85, h: 0.9,
      fontSize: 9.5, color: C.white, align: 'center', valign: 'middle', fontFace: 'Arial',
    })
    if (i < 5) {
      slide.addText('▶', {
        x: x + 1.85, y: 4.85, w: 0.28, h: 0.4,
        fontSize: 10, color: C.gold, align: 'center', fontFace: 'Arial',
      })
    }
  })

  slide.addText('MICE 기획의 수십 시간, 단 1시간으로', {
    x: 0.8, y: 5.9, w: 11.4, h: 0.45,
    fontSize: 14, color: 'A0AECF', align: 'center', fontFace: 'Arial', italic: true,
  })
  slide.addText('MICEstrator  v1.0  ·  2026', {
    x: 0.8, y: 7.05, w: 11.4, h: 0.25,
    fontSize: 9, color: '5B6EA8', align: 'center', fontFace: 'Arial',
  })
})()

// ══════════════════════════════════════════════════════
// Slide 2 — Problem
// ══════════════════════════════════════════════════════
;(function slide2() {
  const slide = pptx.addSlide()
  addSectionHeader(slide, 2, 'Problem — 기획자의 현실')
  addFooter(slide, 2)

  slide.addText('행사 1건 기획에 평균 200시간 이상', {
    x: 0.4, y: 1.15, w: 12.2, h: 0.45,
    fontSize: 15, color: C.blue, bold: true, italic: true, fontFace: 'Arial',
  })

  // 3가지 문제 카드
  const problems = [
    { icon: '🔀', title: '분산된 작업', desc: '기획서·WBS·브랜드·이메일·마케팅을\n각기 다른 툴로 따로 작업' },
    { icon: '❌', title: '일관성 부재', desc: '기획서의 컨셉이 마케팅 카피에\n반영되지 않음' },
    { icon: '📉', title: 'ROI 검증 불가', desc: '행사 종료 후 성과 분석을 체계적으로\n수행하는 기획사 10% 미만' },
  ]
  problems.forEach((p, i) => {
    const x = 0.4 + i * 4.15
    slide.addShape(pptx.ShapeType.rect, {
      x, y: 1.7, w: 3.9, h: 2.4, fill: { color: 'EEF2FF' }, rectRadius: 0.12,
      line: { color: C.navy, width: 1.2 },
    })
    slide.addText(p.icon, { x, y: 1.85, w: 3.9, h: 0.55, fontSize: 24, align: 'center' })
    slide.addText(p.title, {
      x, y: 2.5, w: 3.9, h: 0.4,
      fontSize: 14, color: C.navy, bold: true, align: 'center', fontFace: 'Arial',
    })
    slide.addText(p.desc, {
      x: x + 0.15, y: 2.95, w: 3.6, h: 0.9,
      fontSize: 11, color: C.darkText, align: 'center', fontFace: 'Arial',
    })
  })

  slide.addText('기획자의 하루', {
    x: 0.4, y: 4.25, w: 4, h: 0.35,
    fontSize: 13, color: C.navy, bold: true, fontFace: 'Arial',
  })
  const timeline = [
    '오전  기획서 초안 작성 (Word)',
    '오후  엑셀로 WBS 수동 입력',
    '저녁  연사 섭외 이메일 개별 작성',
    '다음날  디자이너에게 브리프 전달 → 수정 → 수정 → 수정...',
  ]
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.4, y: 4.65, w: 6, h: 2.1, fill: { color: 'F9FAFB' }, rectRadius: 0.08,
    line: { color: 'D1D5DB', width: 1 },
  })
  slide.addText(timeline.map(t => ({ text: t, options: { bullet: { type: 'bullet' }, fontSize: 11, color: C.darkText, paraSpaceAfter: 4, fontFace: 'Arial' } })), {
    x: 0.6, y: 4.75, w: 5.7, h: 1.9, valign: 'top',
  })

  slide.addShape(pptx.ShapeType.rect, {
    x: 6.7, y: 4.25, w: 6, h: 2.5, fill: { color: 'FFF7ED' }, rectRadius: 0.12,
    line: { color: 'F97316', width: 1.5 },
  })
  slide.addText('"연사 섭외 이메일 하나 쓰는 데\n하루 종일 걸렸습니다."', {
    x: 6.9, y: 4.5, w: 5.6, h: 1.4,
    fontSize: 14, color: '7C2D12', italic: true, align: 'center', fontFace: 'Arial',
  })
  slide.addText('— 이벤트사 PM', {
    x: 6.9, y: 6.0, w: 5.6, h: 0.4,
    fontSize: 12, color: C.gray, align: 'right', fontFace: 'Arial',
  })
})()

// ══════════════════════════════════════════════════════
// Slide 3 — Solution
// ══════════════════════════════════════════════════════
;(function slide3() {
  const slide = pptx.addSlide()
  addSectionHeader(slide, 3, 'Solution — 6단계 AI 파이프라인')
  addFooter(slide, 3)

  slide.addText('아이디어 3줄 → 완성된 기획서 1시간', {
    x: 0.4, y: 1.15, w: 12.2, h: 0.45,
    fontSize: 15, color: C.blue, bold: true, italic: true, fontFace: 'Arial',
  })

  // 입력 박스
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.4, y: 1.7, w: 12.2, h: 0.55, fill: { color: C.navy }, rectRadius: 0.08,
  })
  slide.addText('입력: 업종 · 기간 · 규모  (30초)', {
    x: 0.4, y: 1.7, w: 12.2, h: 0.55,
    fontSize: 13, color: C.white, bold: true, align: 'center', valign: 'middle', fontFace: 'Arial',
  })

  // Phase 1~3
  const group1 = [
    { num: '1', label: 'Phase 1\n전략·기획', color: '1E40AF' },
    { num: '2', label: 'Phase 2\nWBS·역할', color: '1D4ED8' },
    { num: '3', label: 'Phase 3\n비주얼 ID', color: '2563EB' },
  ]
  group1.forEach((p, i) => {
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.4 + i * 4.1, y: 2.45, w: 3.8, h: 1.2, fill: { color: p.color }, rectRadius: 0.1,
    })
    slide.addText(p.label, {
      x: 0.4 + i * 4.1, y: 2.45, w: 3.8, h: 1.2,
      fontSize: 14, color: C.white, bold: true, align: 'center', valign: 'middle', fontFace: 'Arial',
    })
    if (i < 2) {
      slide.addText('→', {
        x: 0.4 + i * 4.1 + 3.8, y: 2.75, w: 0.3, h: 0.6,
        fontSize: 16, color: C.gold, align: 'center', fontFace: 'Arial',
      })
    }
  })

  // brandMemory 화살표 + 레이블
  slide.addText('↓  brandMemory 자동 주입', {
    x: 0.4, y: 3.75, w: 12.2, h: 0.45,
    fontSize: 12, color: C.gold, bold: true, align: 'center', fontFace: 'Arial',
  })

  // Phase 4~6
  const group2 = [
    { num: '4', label: 'Phase 4\n연사 소싱', color: '7E22CE' },
    { num: '5', label: 'Phase 5\n디지털 에셋', color: '6D28D9' },
    { num: '6', label: 'Phase 6\nROI 분석', color: '5B21B6' },
  ]
  group2.forEach((p, i) => {
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.4 + i * 4.1, y: 4.3, w: 3.8, h: 1.2, fill: { color: p.color }, rectRadius: 0.1,
    })
    slide.addText(p.label, {
      x: 0.4 + i * 4.1, y: 4.3, w: 3.8, h: 1.2,
      fontSize: 14, color: C.white, bold: true, align: 'center', valign: 'middle', fontFace: 'Arial',
    })
    if (i < 2) {
      slide.addText('→', {
        x: 0.4 + i * 4.1 + 3.8, y: 4.6, w: 0.3, h: 0.6,
        fontSize: 16, color: C.gold, align: 'center', fontFace: 'Arial',
      })
    }
  })

  // 출력 박스
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.4, y: 5.7, w: 12.2, h: 0.55, fill: { color: C.gold }, rectRadius: 0.08,
  })
  slide.addText('출력: 통합 보고서 (웹 뷰 · PDF · Markdown)', {
    x: 0.4, y: 5.7, w: 12.2, h: 0.55,
    fontSize: 13, color: C.navy, bold: true, align: 'center', valign: 'middle', fontFace: 'Arial',
  })

  slide.addText('각 Phase가 이전 결과를 자동 인계 — 사용자는 핵심 입력만 제공', {
    x: 0.4, y: 6.45, w: 12.2, h: 0.35,
    fontSize: 11, color: C.gray, align: 'center', italic: true, fontFace: 'Arial',
  })
})()

// ══════════════════════════════════════════════════════
// Slide 4 — Product Demo
// ══════════════════════════════════════════════════════
;(function slide4() {
  const slide = pptx.addSlide()
  addSectionHeader(slide, 4, 'Product Demo — 입력 vs. 출력')
  addFooter(slide, 4)

  slide.addText('입력 3줄 → 산출물 50+', {
    x: 0.4, y: 1.15, w: 12.2, h: 0.4, fontSize: 15, color: C.blue, bold: true, italic: true, fontFace: 'Arial',
  })

  // 입력 카드
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.4, y: 1.65, w: 3.6, h: 1.7, fill: { color: C.navy }, rectRadius: 0.1,
  })
  slide.addText('입력 (30초)', { x: 0.4, y: 1.65, w: 3.6, h: 0.4, fontSize: 12, color: C.gold, bold: true, align: 'center', fontFace: 'Arial' })
  slide.addText('업종:      디지털 헬스케어\n준비 기간: 3개월\n규모:      중규모 150명', {
    x: 0.6, y: 2.1, w: 3.2, h: 1.1, fontSize: 12, color: C.white, fontFace: 'Courier New',
  })

  slide.addText('⟹', { x: 4.1, y: 2.1, w: 0.5, h: 0.9, fontSize: 22, color: C.gold, align: 'center', fontFace: 'Arial' })

  // 출력 테이블
  const rows = [
    [headerCell('카테고리'), headerCell('산출물')],
    [tableCell('기획', { bold: true, color: C.blue }), tableCell('행사명 · 슬로건 · 부제 · PEST 분석 · 페르소나 3명')],
    [tableCell('일정', { bold: true, color: C.blue }), tableCell('WBS 30+ 태스크 · 부서별 역할 · 임계 경로')],
    [tableCell('브랜드', { bold: true, color: C.blue }), tableCell('색상 팔레트 · 디자인 무드 · Canva · Midjourney 프롬프트')],
    [tableCell('연사', { bold: true, color: C.blue }), tableCell('후보 3~8인 · 초청 이메일 3통 · PPT 아웃라인')],
    [tableCell('마케팅', { bold: true, color: C.blue }), tableCell('인스타·링크드인·이메일 카피 · D-60 캘린더')],
    [tableCell('성과', { bold: true, color: C.blue }), tableCell('KPI 대시보드 · 페르소나 피드백 · 개선 권고안')],
  ]
  slide.addTable(rows, {
    x: 4.7, y: 1.65, w: 8, h: 4.5,
    rowH: 0.6, border: { color: 'D1D5DB', pt: 0.5 },
    fontFace: 'Arial',
  })
})()

// ══════════════════════════════════════════════════════
// Slide 5 — How It Works
// ══════════════════════════════════════════════════════
;(function slide5() {
  const slide = pptx.addSlide()
  addSectionHeader(slide, 5, 'How It Works — 기술 구조')
  addFooter(slide, 5)

  slide.addText('데이터가 Phase 간 자동으로 흐른다', {
    x: 0.4, y: 1.15, w: 12.2, h: 0.4, fontSize: 15, color: C.blue, bold: true, italic: true, fontFace: 'Arial',
  })

  // 핵심 차별점 2개
  const diffs = [
    { icon: '🧠', title: 'brandMemory 자동 주입', desc: 'Phase 3에서 확정된 색상·무드·서체가\nPhase 4·5 AI 프롬프트에 자동 반영' },
    { icon: '🔒', title: '타입 세이프 AI 출력', desc: 'Zod 스키마 + GPT-4o Strict Mode\n→ 신뢰 가능한 JSON 보장' },
  ]
  diffs.forEach((d, i) => {
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.4 + i * 6.2, y: 1.7, w: 5.9, h: 1.25, fill: { color: 'EFF6FF' }, rectRadius: 0.1,
      line: { color: C.blue, width: 1 },
    })
    slide.addText(d.icon, { x: 0.7 + i * 6.2, y: 1.8, w: 0.6, h: 0.5, fontSize: 22, fontFace: 'Arial' })
    slide.addText(d.title, { x: 1.4 + i * 6.2, y: 1.75, w: 4.6, h: 0.35, fontSize: 12, color: C.navy, bold: true, fontFace: 'Arial' })
    slide.addText(d.desc, { x: 1.4 + i * 6.2, y: 2.15, w: 4.6, h: 0.65, fontSize: 10.5, color: C.darkText, fontFace: 'Arial' })
  })

  // 기술 스택 테이블
  slide.addText('기술 스택', { x: 0.4, y: 3.1, w: 4, h: 0.35, fontSize: 13, color: C.navy, bold: true, fontFace: 'Arial' })
  const stackRows = [
    [headerCell('레이어'), headerCell('기술')],
    [tableCell('프론트엔드', { bold: true }), tableCell('Next.js 16 App Router · Tailwind CSS')],
    [tableCell('AI', { bold: true }), tableCell('OpenAI GPT-4o · Vercel AI SDK (generateObject)')],
    [tableCell('스키마', { bold: true }), tableCell('Zod v4 · GPT-4o Structured Output')],
    [tableCell('DB', { bold: true }), tableCell('Drizzle ORM · Supabase (PostgreSQL)')],
    [tableCell('보고서', { bold: true }), tableCell('@media print CSS · Markdown API')],
  ]
  slide.addTable(stackRows, {
    x: 0.4, y: 3.5, w: 7, h: 3.2,
    rowH: 0.5, border: { color: 'D1D5DB', pt: 0.5 }, fontFace: 'Arial',
  })

  // 아키텍처 다이어그램 (간략 텍스트)
  slide.addShape(pptx.ShapeType.rect, {
    x: 7.6, y: 3.1, w: 5.0, h: 3.65, fill: { color: 'F9FAFB' }, rectRadius: 0.1,
    line: { color: 'D1D5DB', width: 1 },
  })
  slide.addText('아키텍처 흐름', { x: 7.6, y: 3.1, w: 5.0, h: 0.38, fontSize: 11, color: C.navy, bold: true, align: 'center', fontFace: 'Arial' })
  const archLines = [
    '사용자 입력',
    '    ↓',
    'Phase 1 → PostgreSQL (SSoT)',
    '    ↓',
    'Phase 3 → brandMemory',
    '    ↓              ↓',
    'Phase 4       Phase 5',
    '    ↓',
    'Phase 6 → 통합 보고서',
  ]
  slide.addText(archLines.join('\n'), {
    x: 7.8, y: 3.55, w: 4.6, h: 3.1, fontSize: 10.5, color: C.darkText, fontFace: 'Courier New', valign: 'top',
  })
})()

// ══════════════════════════════════════════════════════
// Slide 6 — Phase 1~3 Showcase
// ══════════════════════════════════════════════════════
;(function slide6() {
  const slide = pptx.addSlide()
  addSectionHeader(slide, 6, 'Phase 1~3 Showcase — 기획 → 브랜드')
  addFooter(slide, 6)

  slide.addText('15분 만에 완성되는 기획 기반', {
    x: 0.4, y: 1.15, w: 12.2, h: 0.4, fontSize: 15, color: C.blue, bold: true, italic: true, fontFace: 'Arial',
  })

  // Phase 1 카드
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.4, y: 1.65, w: 3.9, h: 5.1, fill: { color: 'EFF6FF' }, rectRadius: 0.1,
    line: { color: C.blue, width: 1.2 },
  })
  slide.addText('Phase 1 — 이벤트 전략', { x: 0.4, y: 1.65, w: 3.9, h: 0.4, fontSize: 12, color: C.navy, bold: true, align: 'center', fontFace: 'Arial' })
  const p1Lines = [
    '행사명:   2026 헬스케어 AI 서밋',
    '슬로건:   데이터가 살리는 생명',
    '부제:     디지털 혁신이 만드는 미래 의료',
    '키워드:   혁신·신뢰·데이터·협력·미래',
    '',
    '페르소나 3명 자동 생성:',
    '• 의료 AI 스타트업 CTO (35세)',
    '• 대학병원 원장 (52세)',
    '• 디지털 헬스케어 투자자 (43세)',
    '',
    'PEST 분석 + Pain Point × 해결 포함',
  ]
  slide.addText(p1Lines.join('\n'), {
    x: 0.6, y: 2.1, w: 3.5, h: 4.4, fontSize: 9.5, color: C.darkText, fontFace: 'Arial', valign: 'top',
  })

  // Phase 2 카드
  slide.addShape(pptx.ShapeType.rect, {
    x: 4.45, y: 1.65, w: 3.9, h: 5.1, fill: { color: 'EFF6FF' }, rectRadius: 0.1,
    line: { color: C.blue, width: 1.2 },
  })
  slide.addText('Phase 2 — WBS & 역할 분담', { x: 4.45, y: 1.65, w: 3.9, h: 0.4, fontSize: 12, color: C.navy, bold: true, align: 'center', fontFace: 'Arial' })
  const p2Rows = [
    [headerCell('지표'), headerCell('결과')],
    [tableCell('총 준비 기간'), tableCell('16주')],
    [tableCell('WBS 태스크'), tableCell('28개')],
    [tableCell('임계 경로'), tableCell('7단계')],
    [tableCell('부서 구성'), tableCell('5개 팀')],
  ]
  slide.addTable(p2Rows, {
    x: 4.65, y: 2.15, w: 3.5, h: 2.3,
    rowH: 0.44, border: { color: 'D1D5DB', pt: 0.5 }, fontFace: 'Arial',
  })

  // Phase 3 카드
  slide.addShape(pptx.ShapeType.rect, {
    x: 8.5, y: 1.65, w: 4.1, h: 5.1, fill: { color: 'EFF6FF' }, rectRadius: 0.1,
    line: { color: C.blue, width: 1.2 },
  })
  slide.addText('Phase 3 — 비주얼 아이덴티티', { x: 8.5, y: 1.65, w: 4.1, h: 0.4, fontSize: 12, color: C.navy, bold: true, align: 'center', fontFace: 'Arial' })
  // 컬러 팔레트
  const colors3 = [
    { hex: '1A5276', label: '#1A5276\n로열 블루' },
    { hex: '2E86C1', label: '#2E86C1\n세컨더리' },
    { hex: '85C1E9', label: '#85C1E9\n라이트' },
    { hex: 'F39C12', label: '#F39C12\n골드 액센트' },
  ]
  colors3.forEach((c, i) => {
    slide.addShape(pptx.ShapeType.rect, {
      x: 8.65 + i * 0.92, y: 2.15, w: 0.75, h: 0.7, fill: { color: c.hex }, rectRadius: 0.06,
    })
    slide.addText(c.label, {
      x: 8.6 + i * 0.92, y: 2.9, w: 0.85, h: 0.55,
      fontSize: 6.5, color: C.darkText, align: 'center', fontFace: 'Arial',
    })
  })
  const p3Info = [
    '디자인 무드:',
    '"혁신적이면서 신뢰감, 미래지향적"',
    '',
    '추천 서체:',
    'Pretendard (본문)',
    'Montserrat (헤드라인)',
    '',
    '자동 생성:',
    '• Canva 한국어 프롬프트',
    '• Midjourney 영문 프롬프트',
  ]
  slide.addText(p3Info.join('\n'), {
    x: 8.65, y: 3.55, w: 3.7, h: 2.9, fontSize: 9.5, color: C.darkText, fontFace: 'Arial', valign: 'top',
  })
})()

// ══════════════════════════════════════════════════════
// Slide 7 — Phase 4~6 Showcase
// ══════════════════════════════════════════════════════
;(function slide7() {
  const slide = pptx.addSlide()
  addSectionHeader(slide, 7, 'Phase 4~6 Showcase — 실행 → 성과')
  addFooter(slide, 7)

  slide.addText('기획에서 멈추지 않는다 — 실행과 성과 측정까지', {
    x: 0.4, y: 1.15, w: 12.2, h: 0.4, fontSize: 15, color: C.blue, bold: true, italic: true, fontFace: 'Arial',
  })

  // Phase 4
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.4, y: 1.65, w: 3.9, h: 5.1, fill: { color: 'F5F3FF' }, rectRadius: 0.1,
    line: { color: '7C3AED', width: 1.2 },
  })
  slide.addText('Phase 4 — 연사 소싱', { x: 0.4, y: 1.65, w: 3.9, h: 0.4, fontSize: 12, color: '4C1D95', bold: true, align: 'center', fontFace: 'Arial' })
  const p4Rows = [
    [headerCell('등급'), headerCell('특징')],
    [tableCell('Keynote'), tableCell('기조연설, 비전 제시')],
    [tableCell('Session'), tableCell('실전 사례 공유')],
    [tableCell('Panel'), tableCell('토론 리더십')],
  ]
  slide.addTable(p4Rows, {
    x: 0.6, y: 2.15, w: 3.5, h: 1.9,
    rowH: 0.44, border: { color: 'D1D5DB', pt: 0.5 }, fontFace: 'Arial',
  })
  slide.addText('자동 생성:\n• 초청 이메일 (제목+본문)\n• PPT 아웃라인\n• 선정 근거 리포트', {
    x: 0.6, y: 4.15, w: 3.5, h: 1.5, fontSize: 10, color: C.darkText, fontFace: 'Arial',
  })

  // Phase 5
  slide.addShape(pptx.ShapeType.rect, {
    x: 4.45, y: 1.65, w: 3.9, h: 5.1, fill: { color: 'F5F3FF' }, rectRadius: 0.1,
    line: { color: '7C3AED', width: 1.2 },
  })
  slide.addText('Phase 5 — 디지털 마케팅', { x: 4.45, y: 1.65, w: 3.9, h: 0.4, fontSize: 12, color: '4C1D95', bold: true, align: 'center', fontFace: 'Arial' })
  const p5Items = [
    '📸 인스타그램: 캡션 + 해시태그 20개',
    '💼 링크드인: 헤드라인 + 본문 + CTA',
    '✉️ 이메일: 제목 5개 후보',
    '🌐 랜딩페이지: Hero·Features·Speakers',
    '📅 D-Day 캠페인: D-60~D-Day 스케줄',
  ]
  slide.addText(p5Items.map(t => ({ text: t, options: { bullet: false, fontSize: 10.5, color: C.darkText, paraSpaceAfter: 7, fontFace: 'Arial' } })), {
    x: 4.65, y: 2.15, w: 3.5, h: 4.4, valign: 'top',
  })

  // Phase 6
  slide.addShape(pptx.ShapeType.rect, {
    x: 8.5, y: 1.65, w: 4.1, h: 5.1, fill: { color: 'F5F3FF' }, rectRadius: 0.1,
    line: { color: '7C3AED', width: 1.2 },
  })
  slide.addText('Phase 6 — ROI 분석', { x: 8.5, y: 1.65, w: 4.1, h: 0.4, fontSize: 12, color: '4C1D95', bold: true, align: 'center', fontFace: 'Arial' })
  const p6Rows = [
    [headerCell('KPI'), headerCell('결과 예시')],
    [tableCell('참석 달성률'), tableCell('94%', { bold: true, color: C.green })],
    [tableCell('평균 만족도'), tableCell('4.3 / 5.0', { bold: true, color: C.green })],
  ]
  slide.addTable(p6Rows, {
    x: 8.7, y: 2.15, w: 3.7, h: 1.6,
    rowH: 0.48, border: { color: 'D1D5DB', pt: 0.5 }, fontFace: 'Arial',
  })
  slide.addText('자동 분석:\n• 강점·약점 분류\n• 페르소나 Pain Point 해결 여부\n• 우선순위별 개선 권고안\n  (HIGH / MID / LOW)', {
    x: 8.7, y: 3.85, w: 3.7, h: 1.8, fontSize: 10, color: C.darkText, fontFace: 'Arial',
  })
})()

// ══════════════════════════════════════════════════════
// Slide 8 — Market Size
// ══════════════════════════════════════════════════════
;(function slide8() {
  const slide = pptx.addSlide()
  addSectionHeader(slide, 8, 'Market Size — 글로벌 MICE 시장')
  addFooter(slide, 8)

  slide.addText('$1.5조 규모 시장, AI 도입률 5% 미만', {
    x: 0.4, y: 1.15, w: 12.2, h: 0.4, fontSize: 15, color: C.blue, bold: true, italic: true, fontFace: 'Arial',
  })

  // TAM / SAM / SOM 시각화
  const markets = [
    { label: 'TAM', size: '$1.5T', desc: '글로벌 MICE 전체', w: 5, color: C.navy },
    { label: 'SAM', size: '$45B', desc: '디지털 MICE 기획 솔루션', w: 3.5, color: C.blue },
    { label: 'SOM', size: '$500M', desc: '한국·아시아 SMB 기획사', w: 2.2, color: C.gold },
  ]
  markets.forEach((m, i) => {
    const x = 0.4 + i * 0.5
    const y = 1.7 + i * 1.1
    slide.addShape(pptx.ShapeType.rect, {
      x, y, w: m.w, h: 0.9, fill: { color: m.color }, rectRadius: 0.08,
    })
    slide.addText(`${m.label}  ${m.size}  —  ${m.desc}`, {
      x, y, w: m.w, h: 0.9,
      fontSize: 12, color: C.white, bold: true, align: 'center', valign: 'middle', fontFace: 'Arial',
    })
  })

  // 성장 드라이버
  slide.addText('성장 드라이버', { x: 0.4, y: 5.0, w: 5, h: 0.35, fontSize: 13, color: C.navy, bold: true, fontFace: 'Arial' })
  const drivers = [
    '포스트-팬데믹 이벤트 수요 급증 (연 12% CAGR 전망)',
    'ESG · 지속가능 행사 의무화 확대',
    '기업 행사 예산 복구 + AI 도입 가속화',
    '한국 MICE 산업 정부 육성 정책 (K-MICE 전략 2030)',
  ]
  slide.addText(drivers.map(d => ({ text: d, options: { bullet: { type: 'bullet' }, fontSize: 12, color: C.darkText, paraSpaceAfter: 6, fontFace: 'Arial' } })), {
    x: 0.4, y: 5.4, w: 7, h: 1.7, valign: 'top',
  })

  // 오른쪽 통계 강조
  slide.addShape(pptx.ShapeType.rect, {
    x: 7.8, y: 1.7, w: 4.8, h: 4.5, fill: { color: C.navy }, rectRadius: 0.12,
  })
  slide.addText('AI 도입률', { x: 7.8, y: 2.0, w: 4.8, h: 0.45, fontSize: 14, color: 'A0AECF', align: 'center', fontFace: 'Arial' })
  slide.addText('5%', { x: 7.8, y: 2.5, w: 4.8, h: 1.2, fontSize: 72, color: C.gold, bold: true, align: 'center', fontFace: 'Arial' })
  slide.addText('미만', { x: 7.8, y: 3.7, w: 4.8, h: 0.45, fontSize: 18, color: C.white, align: 'center', fontFace: 'Arial' })
  slide.addShape(pptx.ShapeType.line, { x: 8.2, y: 4.25, w: 4, h: 0, line: { color: C.gold, width: 1 } })
  slide.addText('= 거대한 화이트 스페이스', { x: 7.8, y: 4.4, w: 4.8, h: 0.45, fontSize: 13, color: C.gold, bold: true, align: 'center', fontFace: 'Arial' })
})()

// ══════════════════════════════════════════════════════
// Slide 9 — Business Model
// ══════════════════════════════════════════════════════
;(function slide9() {
  const slide = pptx.addSlide()
  addSectionHeader(slide, 9, 'Business Model — 수익 구조')
  addFooter(slide, 9)

  slide.addText('Phase당 과금 → 연간 구독 전환', {
    x: 0.4, y: 1.15, w: 12.2, h: 0.4, fontSize: 15, color: C.blue, bold: true, italic: true, fontFace: 'Arial',
  })

  // 3단계 수익 모델 카드
  const models = [
    { label: 'FREEMIUM', sublabel: 'Phase 1 무료', desc: '리드 확보 · 제품 체험', color: '16A34A', bg: 'F0FDF4' },
    { label: 'PAY-PER-PHASE', sublabel: 'Phase 2~6 개별 과금', desc: '₩5,000 ~ ₩15,000 / Phase\n필요한 Phase만 선택', color: C.blue, bg: 'EFF6FF' },
    { label: 'PRO 구독', sublabel: '월 ₩99,000', desc: '무제한 실행\n팀 협업 + 우선 지원', color: '7C3AED', bg: 'F5F3FF' },
  ]
  models.forEach((m, i) => {
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.4 + i * 4.1, y: 1.7, w: 3.85, h: 2.9, fill: { color: m.bg }, rectRadius: 0.12,
      line: { color: m.color, width: 2 },
    })
    slide.addText(m.label, { x: 0.5 + i * 4.1, y: 1.8, w: 3.65, h: 0.45, fontSize: 14, color: m.color, bold: true, align: 'center', fontFace: 'Arial' })
    slide.addText(m.sublabel, { x: 0.5 + i * 4.1, y: 2.3, w: 3.65, h: 0.45, fontSize: 13, color: C.darkText, bold: true, align: 'center', fontFace: 'Arial' })
    slide.addShape(pptx.ShapeType.line, { x: 0.7 + i * 4.1, y: 2.8, w: 3.25, h: 0, line: { color: m.color, width: 0.5 } })
    slide.addText(m.desc, { x: 0.5 + i * 4.1, y: 2.9, w: 3.65, h: 1.3, fontSize: 11, color: C.gray, align: 'center', fontFace: 'Arial' })
  })

  // 단위 경제
  slide.addText('단위 경제', { x: 0.4, y: 4.8, w: 5, h: 0.35, fontSize: 13, color: C.navy, bold: true, fontFace: 'Arial' })
  const econRows = [
    [headerCell('지표'), headerCell('수치')],
    [tableCell('기획사 1곳 월 행사'), tableCell('10~30건')],
    [tableCell('Phase당 평균 과금'), tableCell('₩10,000')],
    [tableCell('월 ARR (Pay-per-Phase)'), tableCell('₩1,500,000~', { bold: true, color: C.green })],
    [tableCell('연 LTV (Pro 전환)'), tableCell('₩3,600,000+', { bold: true, color: C.green })],
  ]
  slide.addTable(econRows, {
    x: 0.4, y: 5.2, w: 7, h: 2.0,
    rowH: 0.38, border: { color: 'D1D5DB', pt: 0.5 }, fontFace: 'Arial',
  })
})()

// ══════════════════════════════════════════════════════
// Slide 10 — Competitive Landscape
// ══════════════════════════════════════════════════════
;(function slide10() {
  const slide = pptx.addSlide()
  addSectionHeader(slide, 10, 'Competitive Landscape — 경쟁 분석')
  addFooter(slide, 10)

  slide.addText('"AI MICE 기획" 전문 솔루션은 없다', {
    x: 0.4, y: 1.15, w: 12.2, h: 0.4, fontSize: 15, color: C.blue, bold: true, italic: true, fontFace: 'Arial',
  })

  // 포지셔닝 테이블
  const compRows = [
    [headerCell(''), headerCell('MICE 전문성'), headerCell('AI 생성'), headerCell('6-Phase 연결'), headerCell('한국어 최적화')],
    [tableCell('MICEstrator', { bold: true, color: C.navy }), tableCell('✓', { bold: true, color: C.green, align: 'center' }), tableCell('✓', { bold: true, color: C.green, align: 'center' }), tableCell('✓', { bold: true, color: C.green, align: 'center' }), tableCell('✓', { bold: true, color: C.green, align: 'center' })],
    [tableCell('ChatGPT / Claude'), tableCell('✗', { color: C.red, align: 'center' }), tableCell('✓', { color: C.green, align: 'center' }), tableCell('✗', { color: C.red, align: 'center' }), tableCell('△', { color: C.gray, align: 'center' })],
    [tableCell('기존 이벤트 SaaS'), tableCell('✓', { color: C.green, align: 'center' }), tableCell('✗', { color: C.red, align: 'center' }), tableCell('✗', { color: C.red, align: 'center' }), tableCell('✗', { color: C.red, align: 'center' })],
    [tableCell('기획사 수작업'), tableCell('✓', { color: C.green, align: 'center' }), tableCell('✗', { color: C.red, align: 'center' }), tableCell('✗', { color: C.red, align: 'center' }), tableCell('✓', { color: C.green, align: 'center' })],
  ]
  slide.addTable(compRows, {
    x: 0.4, y: 1.7, w: 12.2, h: 2.5,
    rowH: 0.48, border: { color: 'D1D5DB', pt: 0.5 }, fontFace: 'Arial',
  })

  // 핵심 포지셔닝
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.4, y: 4.4, w: 12.2, h: 1.7, fill: { color: C.navy }, rectRadius: 0.12,
  })
  slide.addText('핵심 포지셔닝', { x: 0.6, y: 4.5, w: 11.8, h: 0.4, fontSize: 12, color: C.gold, bold: true, align: 'center', fontFace: 'Arial' })
  slide.addText('"MICE 도메인 깊이 × AI 자동화 × End-to-End 파이프라인"', {
    x: 0.6, y: 4.95, w: 11.8, h: 0.55,
    fontSize: 17, color: C.white, bold: true, align: 'center', fontFace: 'Arial',
  })
  slide.addText('이 세 가지 교차점을 동시에 제공하는 솔루션은 현재 존재하지 않는다.', {
    x: 0.6, y: 5.55, w: 11.8, h: 0.35, fontSize: 11, color: 'A0AECF', align: 'center', italic: true, fontFace: 'Arial',
  })
})()

// ══════════════════════════════════════════════════════
// Slide 11 — Technology Moat
// ══════════════════════════════════════════════════════
;(function slide11() {
  const slide = pptx.addSlide()
  addSectionHeader(slide, 11, 'Technology Moat — 기술적 해자')
  addFooter(slide, 11)

  slide.addText('5가지 기술 경쟁 우위', {
    x: 0.4, y: 1.15, w: 12.2, h: 0.4, fontSize: 15, color: C.blue, bold: true, italic: true, fontFace: 'Arial',
  })

  const moats = [
    { num: '1', title: 'Phase-to-Phase 데이터 연속성', desc: '각 Phase 결과가 PostgreSQL SSoT에 저장 → 다음 Phase AI 프롬프트에 자동 주입. 사용자 재입력 불필요.' },
    { num: '2', title: '도메인 특화 프롬프트 엔지니어링', desc: 'MICE 15~20년 경력 전문가 페르소나 × 단계별 CoT 추론. 범용 AI와 달리 MICE 도메인 지식 내재화.' },
    { num: '3', title: 'brandMemory 자동 주입', desc: 'Phase 3에서 확정된 색상·무드·서체·키워드가 Phase 4·5 AI 프롬프트에 자동 반영.' },
    { num: '4', title: '타입 세이프 AI 출력', desc: 'Zod 스키마 + GPT-4o Strict JSON Mode → 구조화된 JSON 보장. AI 환각 파싱 오류 원천 차단.' },
    { num: '5', title: '멀티채널 동시 생성', desc: 'Phase 5 1회 실행 → 인스타·링크드인·이메일·랜딩페이지·음악 프롬프트 동시 산출. 90% 시간 절감.' },
  ]

  moats.forEach((m, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = col === 0 ? 0.4 : 6.6
    const y = 1.65 + row * 1.7
    const w = i === 4 ? 12.2 : 5.9

    slide.addShape(pptx.ShapeType.rect, {
      x, y, w, h: 1.5, fill: { color: 'EFF6FF' }, rectRadius: 0.08,
      line: { color: C.navy, width: 1 },
    })
    slide.addShape(pptx.ShapeType.rect, {
      x, y, w: 0.45, h: 1.5, fill: { color: C.navy }, rectRadius: 0.08,
    })
    slide.addText(m.num, { x, y, w: 0.45, h: 1.5, fontSize: 16, color: C.gold, bold: true, align: 'center', valign: 'middle', fontFace: 'Arial' })
    slide.addText(m.title, { x: x + 0.55, y: y + 0.1, w: w - 0.65, h: 0.38, fontSize: 11.5, color: C.navy, bold: true, fontFace: 'Arial' })
    slide.addText(m.desc, { x: x + 0.55, y: y + 0.5, w: w - 0.65, h: 0.9, fontSize: 10, color: C.darkText, fontFace: 'Arial' })
  })
})()

// ══════════════════════════════════════════════════════
// Slide 12 — Go-to-Market
// ══════════════════════════════════════════════════════
;(function slide12() {
  const slide = pptx.addSlide()
  addSectionHeader(slide, 12, 'Go-to-Market Strategy')
  addFooter(slide, 12)

  slide.addText('이벤트사 PM → 대기업 행사팀 → 플랫폼 API', {
    x: 0.4, y: 1.15, w: 12.2, h: 0.4, fontSize: 15, color: C.blue, bold: true, italic: true, fontFace: 'Arial',
  })

  const stages = [
    { stage: '1단계\n0~6개월', subtitle: 'PMF 검증', items: ['소규모 이벤트 기획사 직접 영업 (20~50인)', '사용자 인터뷰 + 사용 패턴 분석', 'Phase별 과금 최적화 및 온보딩 개선'], color: C.green },
    { stage: '2단계\n6~18개월', subtitle: '시장 확장', items: ['대기업 행사 담당 부서 B2B 계약', '협회·학회 파트너십 (공식 기획 도구)', '성공 사례 기반 레퍼런스 마케팅'], color: C.blue },
    { stage: '3단계\n18개월+', subtitle: '플랫폼화', items: ['API 개방 → 이벤트 SaaS 플랫폼 임베드', '글로벌 확장: 일본·동남아시아 진출', '화이트라벨 라이선스 모델'], color: '7C3AED' },
  ]

  stages.forEach((s, i) => {
    const x = 0.4 + i * 4.1
    slide.addShape(pptx.ShapeType.rect, { x, y: 1.7, w: 3.85, h: 4.5, fill: { color: 'FAFAFA' }, rectRadius: 0.1, line: { color: s.color, width: 2 } })
    slide.addShape(pptx.ShapeType.rect, { x, y: 1.7, w: 3.85, h: 1.0, fill: { color: s.color }, rectRadius: 0.1 })
    slide.addText(s.stage, { x, y: 1.75, w: 3.85, h: 0.55, fontSize: 13, color: C.white, bold: true, align: 'center', fontFace: 'Arial' })
    slide.addText(s.subtitle, { x, y: 2.3, w: 3.85, h: 0.35, fontSize: 11, color: C.white, align: 'center', fontFace: 'Arial' })
    slide.addText(s.items.map(t => ({ text: t, options: { bullet: { type: 'bullet' }, fontSize: 11, color: C.darkText, paraSpaceAfter: 5, fontFace: 'Arial' } })), {
      x: x + 0.15, y: 2.8, w: 3.55, h: 3.2, valign: 'top',
    })
    if (i < 2) {
      slide.addText('▶', { x: x + 3.85, y: 3.3, w: 0.25, h: 0.6, fontSize: 14, color: C.gold, align: 'center', fontFace: 'Arial' })
    }
  })

  // 채널
  slide.addText('채널: MICE Korea · 한국이벤트학회 · 유튜브 데모 · KTO · COEX MICE 박람회', {
    x: 0.4, y: 6.45, w: 12.2, h: 0.35, fontSize: 10.5, color: C.gray, align: 'center', fontFace: 'Arial',
  })
})()

// ══════════════════════════════════════════════════════
// Slide 13 — Traction & Validation
// ══════════════════════════════════════════════════════
;(function slide13() {
  const slide = pptx.addSlide()
  addSectionHeader(slide, 13, 'Traction & Validation')
  addFooter(slide, 13)

  slide.addText('6-Phase 풀스택 구현 완료, 데모 즉시 가능', {
    x: 0.4, y: 1.15, w: 12.2, h: 0.4, fontSize: 15, color: C.green, bold: true, italic: true, fontFace: 'Arial',
  })

  // 현재 상태 체크리스트
  const status = [
    { item: '전체 기술 스택 구현', done: true },
    { item: 'Phase 1~6 완전 실행', done: true },
    { item: '통합 보고서 발행 (웹·PDF·Markdown)', done: true },
    { item: '연사 AI 추천 기능 (Phase 4)', done: true },
    { item: 'brandMemory 파이프라인 (Phase 3→4·5)', done: true },
    { item: 'AI 채팅 결과 편집 (PhaseChat)', done: true },
    { item: '라이브 데모', done: true },
  ]
  slide.addText('현재 상태 (2026년 6월)', { x: 0.4, y: 1.7, w: 6, h: 0.35, fontSize: 13, color: C.navy, bold: true, fontFace: 'Arial' })
  status.forEach((s, i) => {
    const y = 2.1 + i * 0.55
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.4, y, w: 6, h: 0.44, fill: { color: i % 2 === 0 ? 'F0FDF4' : 'FFFFFF' }, rectRadius: 0.06,
    })
    slide.addText(s.done ? '✅' : '⬜', { x: 0.5, y, w: 0.4, h: 0.44, fontSize: 12, align: 'center', fontFace: 'Arial' })
    slide.addText(s.item, { x: 0.95, y, w: 5.3, h: 0.44, fontSize: 11.5, color: C.darkText, valign: 'middle', fontFace: 'Arial' })
  })

  // 기술 검증 지표
  slide.addText('기술 검증 지표', { x: 6.8, y: 1.7, w: 5.8, h: 0.35, fontSize: 13, color: C.navy, bold: true, fontFace: 'Arial' })
  const metrics = [
    { label: '50+', desc: '자동 생성\n산출물', color: C.blue },
    { label: '6회', desc: 'GPT-4o API\n호출로 완주', color: '7C3AED' },
    { label: '0건', desc: 'AI 출력\n구조 오류', color: C.green },
  ]
  metrics.forEach((m, i) => {
    slide.addShape(pptx.ShapeType.rect, {
      x: 6.8 + i * 1.95, y: 2.1, w: 1.75, h: 1.6, fill: { color: C.navy }, rectRadius: 0.1,
    })
    slide.addText(m.label, { x: 6.8 + i * 1.95, y: 2.15, w: 1.75, h: 0.85, fontSize: 30, color: m.color, bold: true, align: 'center', fontFace: 'Arial' })
    slide.addText(m.desc, { x: 6.8 + i * 1.95, y: 3.0, w: 1.75, h: 0.6, fontSize: 9, color: 'A0AECF', align: 'center', fontFace: 'Arial' })
  })

  // 다음 마일스톤
  slide.addText('다음 마일스톤', { x: 6.8, y: 3.9, w: 5.8, h: 0.35, fontSize: 13, color: C.navy, bold: true, fontFace: 'Arial' })
  const next = [
    '베타 파트너 기획사 5곳 PoC 진행',
    '실사용 피드백 기반 UX 개선',
    'Vercel 프로덕션 배포',
  ]
  slide.addText(next.map(t => ({ text: t, options: { bullet: { type: 'bullet' }, fontSize: 12, color: C.darkText, paraSpaceAfter: 7, fontFace: 'Arial' } })), {
    x: 6.8, y: 4.3, w: 5.8, h: 1.5, valign: 'top',
  })
})()

// ══════════════════════════════════════════════════════
// Slide 14 — Builder
// ══════════════════════════════════════════════════════
;(function slide14() {
  const slide = pptx.addSlide()
  addSectionHeader(slide, 14, 'Builder — 만든 사람')
  addFooter(slide, 14)

  slide.addText('1인 개발자가 만든 엔드투엔드 MICE AI 시스템', {
    x: 0.4, y: 1.15, w: 12.2, h: 0.4, fontSize: 15, color: C.blue, bold: true, italic: true, fontFace: 'Arial',
  })

  // 역할 테이블
  slide.addText('역할 및 기여', { x: 0.4, y: 1.7, w: 6, h: 0.35, fontSize: 13, color: C.navy, bold: true, fontFace: 'Arial' })
  const roleRows = [
    [headerCell('영역'), headerCell('기여')],
    [tableCell('제품 기획', { bold: true }), tableCell('MICE 도메인 분석 · 6-Phase 아키텍처 설계')],
    [tableCell('프론트엔드', { bold: true }), tableCell('Next.js 16 App Router · Tailwind UI · 통합 보고서')],
    [tableCell('백엔드', { bold: true }), tableCell('Drizzle ORM · Supabase · API Route 설계')],
    [tableCell('AI 엔지니어링', { bold: true }), tableCell('GPT-4o Structured Output · 6개 도메인 프롬프트')],
    [tableCell('DevOps', { bold: true }), tableCell('Vercel 배포 · 환경 변수 보안 관리')],
  ]
  slide.addTable(roleRows, {
    x: 0.4, y: 2.1, w: 6.8, h: 2.8,
    rowH: 0.5, border: { color: 'D1D5DB', pt: 0.5 }, fontFace: 'Arial',
  })

  // 철학 카드
  slide.addShape(pptx.ShapeType.rect, {
    x: 7.4, y: 1.7, w: 5.2, h: 3.2, fill: { color: C.navy }, rectRadius: 0.12,
  })
  slide.addText('철학', { x: 7.4, y: 1.8, w: 5.2, h: 0.4, fontSize: 13, color: C.gold, bold: true, align: 'center', fontFace: 'Arial' })
  slide.addText('"MICE 기획자의 반복 작업을 제거하고,\n창의적 의사결정에만\n집중할 수 있도록."', {
    x: 7.6, y: 2.3, w: 4.8, h: 2.2, fontSize: 16, color: C.white, align: 'center', valign: 'middle', fontFace: 'Arial', italic: true,
  })

  // 기술 스택 뱃지
  slide.addText('기술 스택', { x: 0.4, y: 5.1, w: 5, h: 0.35, fontSize: 13, color: C.navy, bold: true, fontFace: 'Arial' })
  const stack = ['Next.js 16', 'TypeScript', 'Tailwind CSS', 'OpenAI GPT-4o', 'Vercel AI SDK', 'Zod v4', 'Drizzle ORM', 'Supabase']
  stack.forEach((s, i) => {
    const x = 0.4 + (i % 4) * 3.1
    const y = 5.5 + Math.floor(i / 4) * 0.5
    slide.addShape(pptx.ShapeType.rect, { x, y, w: 2.8, h: 0.38, fill: { color: 'EFF6FF' }, rectRadius: 0.06 })
    slide.addText(s, { x, y, w: 2.8, h: 0.38, fontSize: 10, color: C.navy, align: 'center', valign: 'middle', bold: true, fontFace: 'Arial' })
  })
})()

// ══════════════════════════════════════════════════════
// Slide 15 — Next Steps (CTA)
// ══════════════════════════════════════════════════════
;(function slide15() {
  const slide = pptx.addSlide()
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: C.navy } })
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.08, fill: { color: C.gold } })
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 7.42, w: '100%', h: 0.08, fill: { color: C.gold } })
  slide.addText('15', { x: 12.1, y: 0.15, w: 0.45, h: 0.3, fontSize: 9, color: '5B6EA8', align: 'right', fontFace: 'Arial' })

  slide.addText('Next Steps', {
    x: 0.8, y: 0.5, w: 11.4, h: 0.6, fontSize: 14, color: C.gold, bold: true, align: 'center', fontFace: 'Arial',
  })
  slide.addText('함께 MICE 산업을 바꿔갑시다', {
    x: 0.8, y: 1.1, w: 11.4, h: 0.65, fontSize: 24, color: C.white, bold: true, align: 'center', fontFace: 'Arial',
  })

  const phases = [
    { label: 'Phase 1 — 즉시 실행', color: C.green, items: ['베타 파트너 기획사 5곳 PoC 예산 확보', '실사용 피드백 수집 채널 구축', 'Vercel 프로덕션 배포 및 도메인 연결'] },
    { label: 'Phase 2 — 단기 개선', color: '2563EB', items: ['Phase 1~3 UI/UX 고도화 (온보딩 플로우)', '다국어 지원 (영어 우선)', '사용자 계정 및 행사 히스토리 관리'] },
    { label: 'Phase 3 — 중기 목표', color: '7C3AED', items: ['API 공개 및 외부 연동 문서화', '이벤트 SaaS 플랫폼 파트너십 협의', '구독 결제 시스템 연동 (Stripe)'] },
  ]
  phases.forEach((p, i) => {
    const x = 0.4 + i * 4.1
    slide.addShape(pptx.ShapeType.rect, { x, y: 1.9, w: 3.85, h: 3.4, fill: { color: '1A2F6B' }, rectRadius: 0.1, line: { color: p.color, width: 1.5 } })
    slide.addText(p.label, { x, y: 1.95, w: 3.85, h: 0.45, fontSize: 12, color: p.color, bold: true, align: 'center', fontFace: 'Arial' })
    slide.addShape(pptx.ShapeType.line, { x: x + 0.3, y: 2.45, w: 3.25, h: 0, line: { color: p.color, width: 0.5 } })
    slide.addText(p.items.map(t => ({ text: t, options: { bullet: { type: 'bullet' }, fontSize: 10.5, color: 'A0AECF', paraSpaceAfter: 6, fontFace: 'Arial' } })), {
      x: x + 0.2, y: 2.55, w: 3.45, h: 2.5, valign: 'top',
    })
  })

  slide.addShape(pptx.ShapeType.rect, { x: 2.2, y: 5.5, w: 8.6, h: 0.9, fill: { color: C.gold }, rectRadius: 0.1 })
  slide.addText('🚀  지금 바로 데모를 — npm run dev  →  localhost:3000', {
    x: 2.2, y: 5.5, w: 8.6, h: 0.9, fontSize: 14, color: C.navy, bold: true, align: 'center', valign: 'middle', fontFace: 'Arial',
  })

  slide.addText('MICEstrator  v1.0  ·  2026  ·  Built with Next.js 16 · GPT-4o · Drizzle ORM · Supabase', {
    x: 0.4, y: 6.75, w: 12.2, h: 0.3, fontSize: 8.5, color: '5B6EA8', align: 'center', fontFace: 'Arial',
  })
})()

// ── 저장 ─────────────────────────────────────────────
const outputPath = path.join(__dirname, '..', 'docs', 'MICEstrator-pitch-deck.pptx')
pptx.writeFile({ fileName: outputPath }).then(() => {
  console.log('✅ PPTX 생성 완료:', outputPath)
}).catch(err => {
  console.error('❌ 오류:', err)
  process.exit(1)
})
