let canvas: HTMLCanvasElement | null = null

export function measureMaxTextWidth(labels: string[], fontFamily: string, weight = 400): number {
  if (!labels.length) return 0

  if (typeof document !== 'undefined') {
    canvas = canvas ?? document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.font = `${weight} 14px ${fontFamily}`
      return Math.max(...labels.map((s) => ctx.measureText(s).width))
    }
  }

  // Fallback (no canvas, e.g. jsdom): estimate from character count.
  return Math.max(...labels.map((s) => s.length)) * 14 * 0.6
}
