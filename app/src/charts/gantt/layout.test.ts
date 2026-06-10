import { computeLayout } from './layout'
import { mergeConfig } from './defaults'
import type { GanttModel } from '../../lib/ganttDoc'

const presidents: GanttModel = {
  rows: [
    {
      label: 'George Washington',
      segments: [
        { start: '1732-02-22', end: '1799-12-14', category: 'Lifespan' },
        { start: '1789-04-30', end: '1797-03-04', category: 'In office' },
      ],
    },
    {
      label: 'Joe Biden',
      segments: [
        { start: '1942-11-20', category: 'Still living' },
        { start: '2021-01-20', end: '2025-01-20', category: 'In office' },
      ],
    },
  ],
}

describe('computeLayout', () => {
  it('detects a date axis from ISO dates', () => {
    const layout = computeLayout(presidents, mergeConfig({ axis: 'auto' }))
    expect(layout.axisType).toBe('date')
  })

  it('honors a 25-year tick interval', () => {
    const layout = computeLayout(presidents, mergeConfig({ axis: 'date', tickInterval: 25 }))
    expect(layout.ticks.length).toBeGreaterThan(2)
    // every tick label is a year divisible by 25
    expect(layout.ticks.every((t) => Number(t.label) % 25 === 0)).toBe(true)
  })

  it('lays out one row per data row, in order', () => {
    const layout = computeLayout(presidents, mergeConfig({}))
    expect(layout.rows.map((r) => r.label)).toEqual(['George Washington', 'Joe Biden'])
    expect(layout.rows[1].top).toBeGreaterThan(layout.rows[0].top)
  })

  it('emits a layout segment per data segment', () => {
    const layout = computeLayout(presidents, mergeConfig({}))
    expect(layout.segments).toHaveLength(4)
  })

  it('clamps an open-ended segment to the domain max', () => {
    const layout = computeLayout(presidents, mergeConfig({}))
    const living = layout.segments.find((s) => s.rowIndex === 1 && s.x === Math.min(...[s.x]))
    // Biden's lifespan (open-ended) should stretch to the right edge of the plot.
    const lifespan = layout.segments[2]
    expect(lifespan.x + lifespan.width).toBeCloseTo(layout.plot.width, 0)
    expect(living).toBeTruthy()
  })

  it('builds a legend from distinct categories with mapped colors', () => {
    const layout = computeLayout(
      presidents,
      mergeConfig({
        categoryColors: { Lifespan: '#E2E4E7', 'In office': '#21409A', 'Still living': '#A3C2E3' },
      }),
    )
    expect(layout.legend).toEqual([
      { label: 'Lifespan', color: '#E2E4E7' },
      { label: 'In office', color: '#21409A' },
      { label: 'Still living', color: '#A3C2E3' },
    ])
  })

  it('renders end===start as a point marker', () => {
    const model: GanttModel = {
      rows: [{ label: 'grad', segments: [{ start: '2011-05-01', end: '2011-05-01' }] }],
    }
    const layout = computeLayout(model, mergeConfig({}))
    expect(layout.segments[0].isPoint).toBe(true)
  })

  it('places a wide-bar center label inside with a contrast fill', () => {
    const model: GanttModel = {
      rows: [{ label: 'r', segments: [{ start: 0, end: 100, color: '#21409A', label: 'x' }] }],
    }
    const layout = computeLayout(model, mergeConfig({ axis: 'number', width: 900 }))
    const ll = layout.segments[0].labelLayout!
    expect(ll.anchor).toBe('middle')
    expect(ll.fill).toBe('#ffffff') // contrast on dark blue
  })

  it('auto-flips a center label above when the bar is too narrow', () => {
    const model: GanttModel = {
      rows: [
        {
          label: 'r',
          segments: [
            { start: 0, end: 100 },
            { start: 50, end: 51, color: '#21409A', label: 'a long label that will not fit' },
          ],
        },
      ],
    }
    const layout = computeLayout(model, mergeConfig({ axis: 'number', width: 900 }))
    const narrow = layout.segments[1].labelLayout!
    expect(narrow.fill).toBe('#111827') // flipped outside → ink, not contrast
    expect(narrow.y).toBeLessThan(layout.segments[1].centerY) // sits above the bar
  })

  it('honors explicit outside positions', () => {
    const model: GanttModel = {
      rows: [{ label: 'r', segments: [{ start: 0, end: 100, label: 'L', labelPos: 'end-outside' }] }],
    }
    const layout = computeLayout(model, mergeConfig({ axis: 'number', width: 900 }))
    const ll = layout.segments[0].labelLayout!
    expect(ll.anchor).toBe('start')
    expect(ll.fill).toBe('#111827')
  })

  it('adds no labelLayout when a segment has no label', () => {
    const layout = computeLayout(presidents, mergeConfig({}))
    expect(layout.segments.every((s) => s.labelLayout === undefined)).toBe(true)
  })
})
