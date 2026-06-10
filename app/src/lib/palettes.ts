export interface Palette {
  series: string[]
  background: string
}

export const DEFAULT_PALETTE = ['#363537', '#0cce6b', '#dced31']

export const BUILTIN_PALETTES: Record<string, Palette> = {
  Economist: { series: ['#E3120B', '#F4A39E', '#7E9DC9', '#3B4BA0'], background: '#ffffff' },
  'Economist warm': { series: ['#E3120B', '#F4A582', '#C2C2C2', '#575757'], background: '#E9E4DA' },
  Monochrome: {
    series: ['#a8a9ae', '#585a5f', '#211c20', '#4369aa', '#f1585c'],
    background: '#ffffff',
  },
}

// Shared with the legacy app so saved palettes appear in both.
export const CUSTOM_PALETTES_KEY = 'barchart:palettes'

export function readCustomPalettes(): Record<string, Palette> {
  try {
    const raw = localStorage.getItem(CUSTOM_PALETTES_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, Palette>) : {}
  } catch {
    return {}
  }
}

// Built-ins merged with persisted custom palettes; built-ins win on name clash.
export function loadCustomPalettes(): Record<string, Palette> {
  const merged: Record<string, Palette> = { ...BUILTIN_PALETTES }
  for (const [name, pal] of Object.entries(readCustomPalettes())) {
    if (!merged[name]) merged[name] = pal
  }
  return merged
}

// Assign a palette's series across categories in order (wrapping if short).
export function mapPaletteToCategories(
  series: string[],
  categories: string[],
): Record<string, string> {
  const out: Record<string, string> = {}
  if (!series.length) return out
  categories.forEach((c, i) => {
    out[c] = series[i % series.length]
  })
  return out
}

export function saveCustomPalette(name: string, palette: Palette): boolean {
  if (!name.trim() || !palette.series.length) return false
  const store = readCustomPalettes()
  store[name] = palette
  try {
    localStorage.setItem(CUSTOM_PALETTES_KEY, JSON.stringify(store))
    return true
  } catch (err) {
    console.warn('Saving palette failed:', err)
    return false
  }
}
