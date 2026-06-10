import { normalizeHex } from './color'

export type AxisType = 'auto' | 'date' | 'number'

export const LABEL_POSITIONS = [
  'start-inside',
  'start-outside',
  'end-inside',
  'end-outside',
  'center',
  'above',
  'below',
] as const
export type LabelPos = (typeof LABEL_POSITIONS)[number]

export interface Segment {
  start: string | number
  end?: string | number
  color?: string
  category?: string
  label?: string
  labelPos?: LabelPos
}

export interface Row {
  label: string
  segments: Segment[]
}

export interface GanttModel {
  rows: Row[]
}

export interface GanttDoc {
  version: number
  kind: 'gantt'
  config: Record<string, unknown>
  data: GanttModel
}

export interface ValidationError {
  path: string
  message: string
}

export interface ParseResult {
  ok: boolean
  errors: ValidationError[]
  value: GanttDoc | null
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isScalarValue(v: unknown): v is string | number {
  return (typeof v === 'string' && v.trim() !== '') || (typeof v === 'number' && Number.isFinite(v))
}

function validateSegment(
  raw: unknown,
  path: string,
  errors: ValidationError[],
): Segment | null {
  if (!isObject(raw)) {
    errors.push({ path, message: 'segment must be an object' })
    return null
  }

  if (!('start' in raw) || !isScalarValue(raw.start)) {
    errors.push({ path: `${path}.start`, message: 'start is required (date string or number)' })
    return null
  }

  const seg: Segment = { start: raw.start as string | number }

  if ('end' in raw && raw.end != null) {
    if (!isScalarValue(raw.end)) {
      errors.push({ path: `${path}.end`, message: 'end must be a date string or number' })
    } else {
      seg.end = raw.end as string | number
    }
  }

  if ('color' in raw && raw.color != null && raw.color !== '') {
    const hex = normalizeHex(String(raw.color))
    if (!hex) {
      errors.push({ path: `${path}.color`, message: `invalid hex color: ${String(raw.color)}` })
    } else {
      seg.color = hex
    }
  }

  if ('category' in raw && raw.category != null) {
    if (typeof raw.category !== 'string') {
      errors.push({ path: `${path}.category`, message: 'category must be a string' })
    } else {
      seg.category = raw.category
    }
  }

  if ('label' in raw && raw.label != null) {
    if (typeof raw.label !== 'string') {
      errors.push({ path: `${path}.label`, message: 'label must be a string' })
    } else {
      seg.label = raw.label
    }
  }

  if ('labelPos' in raw && raw.labelPos != null) {
    if (!LABEL_POSITIONS.includes(raw.labelPos as LabelPos)) {
      errors.push({
        path: `${path}.labelPos`,
        message: `labelPos must be one of: ${LABEL_POSITIONS.join(', ')}`,
      })
    } else {
      seg.labelPos = raw.labelPos as LabelPos
    }
  }

  return seg
}

function validateRow(raw: unknown, path: string, errors: ValidationError[]): Row | null {
  if (!isObject(raw)) {
    errors.push({ path, message: 'row must be an object' })
    return null
  }
  if (typeof raw.label !== 'string') {
    errors.push({ path: `${path}.label`, message: 'label is required (string)' })
    return null
  }
  if (!Array.isArray(raw.segments)) {
    errors.push({ path: `${path}.segments`, message: 'segments must be an array' })
    return null
  }
  const segments: Segment[] = []
  raw.segments.forEach((s, i) => {
    const seg = validateSegment(s, `${path}.segments[${i}]`, errors)
    if (seg) segments.push(seg)
  })
  return { label: raw.label, segments }
}

export function parseGanttDoc(input: string | unknown): ParseResult {
  const errors: ValidationError[] = []

  let raw: unknown = input
  if (typeof input === 'string') {
    try {
      raw = JSON.parse(input)
    } catch (err) {
      return {
        ok: false,
        errors: [{ path: 'document', message: (err as Error).message }],
        value: null,
      }
    }
  }

  if (!isObject(raw)) {
    return { ok: false, errors: [{ path: 'document', message: 'document must be an object' }], value: null }
  }

  if ('kind' in raw && raw.kind !== 'gantt') {
    errors.push({ path: 'kind', message: `expected kind "gantt", got ${JSON.stringify(raw.kind)}` })
  }

  const version = typeof raw.version === 'number' ? raw.version : 1
  const config = isObject(raw.config) ? raw.config : {}

  if (!isObject(raw.data) || !Array.isArray((raw.data as Record<string, unknown>).rows)) {
    errors.push({ path: 'data.rows', message: 'data.rows must be an array' })
    return { ok: false, errors, value: null }
  }

  const rawRows = (raw.data as { rows: unknown[] }).rows
  const rows: Row[] = []
  rawRows.forEach((r, i) => {
    const row = validateRow(r, `data.rows[${i}]`, errors)
    if (row) rows.push(row)
  })

  const ok = errors.length === 0
  return {
    ok,
    errors,
    value: ok ? { version, kind: 'gantt', config, data: { rows } } : null,
  }
}
