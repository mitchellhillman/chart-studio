export function normalizeHex(s: string | null | undefined): string | null {
  const v = (s ?? '').trim()
  if (!v) return null
  const withHash = v.startsWith('#') ? v : '#' + v
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(withHash) ? withHash : null
}

const DARK_INK = '#111827'
const LIGHT_INK = '#ffffff'

// Black-or-white text that reads on a given background, via WCAG relative luminance.
export function contrastColor(hex: string): string {
  const c = normalizeHex(hex)
  if (!c) return DARK_INK
  let h = c.slice(1)
  if (h.length === 3)
    h = h
      .split('')
      .map((x) => x + x)
      .join('')
  const channel = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  const r = channel(parseInt(h.slice(0, 2), 16))
  const g = channel(parseInt(h.slice(2, 4), 16))
  const b = channel(parseInt(h.slice(4, 6), 16))
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance > 0.5 ? DARK_INK : LIGHT_INK
}
