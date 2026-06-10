import { dsvFormat } from 'd3'
import { normalizeHex } from './color'

const COLOR_KEY = 'color'

export interface DataRow {
  label: string
  color?: string | null
  [series: string]: string | number | null | undefined
}

// Numeric series keys (every column except the reserved label/color).
export function getSeries(rows: DataRow[]): string[] {
  if (!rows.length) return []
  return Object.keys(rows[0]).filter((k) => k !== 'label' && k !== 'color')
}

// Legacy CSV/TSV parser, kept for the later bar/line port.
export function parseData(text: string): DataRow[] {
  const firstLine = text.split('\n').find((l) => l.trim().length > 0) ?? ''
  const delim = firstLine.includes('\t') ? '\t' : ','
  return dsvFormat(delim).parse(text, (d) => {
    const row: DataRow = { label: d.label ?? '' }
    for (const key of Object.keys(d)) {
      if (key === 'label') continue
      if (key.toLowerCase() === COLOR_KEY) {
        row.color = normalizeHex(d[key])
        continue
      }
      const v = d[key]
      row[key] = v === '' || v == null ? null : +v
    }
    return row
  }) as unknown as DataRow[]
}
