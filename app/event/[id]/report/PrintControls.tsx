'use client'

import { useState } from 'react'

interface Props {
  eventId: string
  eventName: string
}

export function PrintControls({ eventId, eventName }: Props) {
  const [pdfLoading, setPdfLoading] = useState(false)
  const [mdLoading, setMdLoading] = useState(false)

  async function handlePDFDownload() {
    setPdfLoading(true)
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      // 보고서 커버부터 마지막 섹션까지 캡처
      const coverEl = document.getElementById('report-body')
      const el = coverEl?.parentElement ?? (document.querySelector('.max-w-3xl') as HTMLElement)
      if (!el) throw new Error('보고서 요소를 찾을 수 없습니다')

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#f9fafb',
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.9)
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const imgW = pageW
      const imgH = (canvas.height * imgW) / canvas.width
      let remaining = imgH
      let yOffset = 0

      pdf.addImage(imgData, 'JPEG', 0, yOffset, imgW, imgH)
      remaining -= pageH

      while (remaining > 0) {
        yOffset -= pageH
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, yOffset, imgW, imgH)
        remaining -= pageH
      }

      pdf.save(`${eventName}-report.pdf`)
    } catch {
      alert('PDF 저장 중 오류가 발생했습니다.')
    } finally {
      setPdfLoading(false)
    }
  }

  async function handleMarkdownDownload() {
    setMdLoading(true)
    try {
      const res = await fetch(`/api/events/${eventId}/report`)
      if (!res.ok) throw new Error('다운로드 실패')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${eventName}-report.md`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('마크다운 다운로드 중 오류가 발생했습니다.')
    } finally {
      setMdLoading(false)
    }
  }

  return (
    <div className="print-hide flex items-center gap-3 flex-wrap">
      <button
        onClick={handlePDFDownload}
        disabled={pdfLoading}
        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
        {pdfLoading ? 'PDF 생성 중...' : 'PDF 저장'}
      </button>

      <button
        onClick={handleMarkdownDownload}
        disabled={mdLoading}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        {mdLoading ? '다운로드 중...' : 'Markdown 다운로드'}
      </button>
    </div>
  )
}
