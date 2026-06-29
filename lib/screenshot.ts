// @MX:NOTE: [AUTO] html2canvas 래퍼 — CORS 이슈·oklch 색상 왜곡 주의.
// @MX:REASON: 외부 폰트·이미지 CORS 차단 시 캡처 누락 가능. useCORS 옵션 필수.
export async function captureElement(element: HTMLElement): Promise<string> {
  const { default: html2canvas } = await import('html2canvas')

  const canvas = await html2canvas(element, {
    useCORS: true,
    allowTaint: false,
    scale: window.devicePixelRatio ?? 1,
    logging: false,
  })

  return canvas.toDataURL('image/png')
}
