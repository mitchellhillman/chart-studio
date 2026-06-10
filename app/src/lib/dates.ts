import { utcFormat } from 'd3'
import type { GanttModel } from './ganttDoc'

export function parseLabelDate(label: string | number): Date | null {
  const s = String(label).trim()
  if (!s) return null
  const iso = /^\d{4}$/.test(s) ? s + '-01-01' : /^\d{4}-\d{2}$/.test(s) ? s + '-01' : s
  const t = Date.parse(iso)
  return Number.isNaN(t) ? null : new Date(t)
}

export function formatLabel(label: string | number, spec?: string): string {
  const fmt = spec?.trim()
  if (!fmt) return String(label)
  const d = parseLabelDate(label)
  if (!d) return String(label)
  try {
    return utcFormat(fmt)(d)
  } catch {
    return String(label)
  }
}

function isDateValue(v: string | number): boolean {
  if (typeof v === 'number') return false
  return parseLabelDate(v) != null
}

function isNumericValue(v: string | number): boolean {
  if (typeof v === 'number') return Number.isFinite(v)
  const t = v.trim()
  return t !== '' && Number.isFinite(Number(t))
}

export interface AxisDetection {
  type: 'date' | 'number'
  warning?: string
}

export function detectAxisType(model: GanttModel): AxisDetection {
  const values: (string | number)[] = []
  for (const row of model.rows) {
    for (const seg of row.segments) {
      values.push(seg.start)
      if (seg.end != null) values.push(seg.end)
    }
  }

  if (values.length === 0) return { type: 'number' }

  // Numeric first: a bare number string like "1789" is parseable as both a
  // number and (via Date.parse) a date, so prefer the unambiguous numeric read.
  const allNumeric = values.every(isNumericValue)
  if (allNumeric) return { type: 'number' }

  const allDates = values.every(isDateValue)
  if (allDates) return { type: 'date' }

  return { type: 'number', warning: 'Mixed date and numeric values; falling back to a numeric axis.' }
}

const YEAR_STEPS = [1, 2, 5, 10, 25, 50, 100, 200, 500, 1000]

export function niceYearStep(spanYears: number, maxTicks = 10): number {
  if (spanYears <= 0) return 1
  for (const step of YEAR_STEPS) {
    if (spanYears / step <= maxTicks) return step
  }
  return YEAR_STEPS[YEAR_STEPS.length - 1]
}

export function numericTickCount(width: number): number {
  return Math.max(4, Math.min(12, Math.round(width / 90)))
}
