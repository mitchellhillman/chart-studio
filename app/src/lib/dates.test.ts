import {
  detectAxisType,
  niceYearStep,
  numericTickCount,
  parseLabelDate,
  formatLabel,
  thinLabels,
  labelRowsFor,
} from './dates'
import type { GanttModel } from './ganttDoc'

const model = (segments: { start: string | number; end?: string | number }[]): GanttModel => ({
  rows: [{ label: 'r', segments }],
})

describe('parseLabelDate', () => {
  it('expands a bare year', () => {
    expect(parseLabelDate('1789')?.getUTCFullYear()).toBe(1789)
  })
  it('expands year-month', () => {
    const d = parseLabelDate('2021-01')
    expect(d?.getUTCFullYear()).toBe(2021)
    expect(d?.getUTCMonth()).toBe(0)
  })
  it('returns null for non-dates', () => {
    expect(parseLabelDate('hello')).toBeNull()
    expect(parseLabelDate('')).toBeNull()
  })
})

describe('formatLabel', () => {
  it('formats a date with a d3 spec', () => {
    expect(formatLabel('2021-06-15', '%Y')).toBe('2021')
  })
  it('returns the raw label without a spec', () => {
    expect(formatLabel('whatever')).toBe('whatever')
  })
})

describe('detectAxisType', () => {
  it('detects an all-date axis', () => {
    expect(detectAxisType(model([{ start: '1789-04-30', end: '1797-03-04' }])).type).toBe('date')
  })
  it('detects an all-numeric axis', () => {
    expect(detectAxisType(model([{ start: 0, end: 10 }])).type).toBe('number')
    expect(detectAxisType(model([{ start: '1', end: '5' }])).type).toBe('number')
  })
  it('falls back to numeric with a warning on mixed values', () => {
    const r = detectAxisType(model([{ start: '2020-01-01' }, { start: 5 }]))
    expect(r.type).toBe('number')
    expect(r.warning).toBeTruthy()
  })
})

describe('niceYearStep', () => {
  it('picks 25 for a ~250-year presidential span', () => {
    expect(niceYearStep(250, 10)).toBe(25)
  })
  it('picks 1 for a short span', () => {
    expect(niceYearStep(5, 10)).toBe(1)
  })
})

describe('numericTickCount', () => {
  it('scales with width and clamps to [4,12]', () => {
    expect(numericTickCount(900)).toBe(10)
    expect(numericTickCount(100)).toBe(4)
    expect(numericTickCount(5000)).toBe(12)
  })
})

describe('thinLabels', () => {
  const rows = Array.from({ length: 10 }, (_, i) => ({ label: i }))
  it('keeps everything when max is 0 or >= count', () => {
    expect(thinLabels(rows, 0)).toHaveLength(10)
    expect(thinLabels(rows, 99)).toHaveLength(10)
  })
  it('keeps an evenly spaced subset including first and last', () => {
    const out = thinLabels(rows, 3)
    expect(out[0].label).toBe(0)
    expect(out[out.length - 1].label).toBe(9)
    expect(out.length).toBeLessThanOrEqual(3)
  })
})

describe('labelRowsFor', () => {
  it('collapses rows that format to the same value', () => {
    const rows = [{ label: '1939-09' }, { label: '1939-10' }, { label: '1940-01' }]
    const out = labelRowsFor(rows, { tickLabelFormat: '%Y' })
    expect(out.map((r) => r.label)).toEqual(['1939-09', '1940-01'])
  })
})
