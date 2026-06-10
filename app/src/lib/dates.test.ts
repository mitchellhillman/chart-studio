import { detectAxisType, niceYearStep, numericTickCount, parseLabelDate, formatLabel } from './dates'
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
