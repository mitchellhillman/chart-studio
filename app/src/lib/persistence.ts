import type { GanttConfig } from '../charts/gantt/types'

export const AUTOSAVE_KEY = 'gantt:autosave'

export interface PersistedDoc {
  config: Partial<GanttConfig>
  data: unknown
}

export function persistGantt(config: GanttConfig, data: unknown): void {
  try {
    localStorage.setItem(
      AUTOSAVE_KEY,
      JSON.stringify({ version: 1, kind: 'gantt', config, data }),
    )
  } catch (err) {
    console.warn('Autosave failed:', err)
  }
}

export function restoreGantt(): PersistedDoc | null {
  let raw: string | null
  try {
    raw = localStorage.getItem(AUTOSAVE_KEY)
  } catch {
    return null
  }
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || !parsed.config || !parsed.data) return null
    return { config: parsed.config, data: parsed.data }
  } catch (err) {
    console.warn('Autosave parse failed, ignoring:', err)
    return null
  }
}

export function clearGantt(): void {
  try {
    localStorage.removeItem(AUTOSAVE_KEY)
  } catch {
    /* ignore */
  }
}
