import presidents from '../../../public/presets/presidents.json'
import { parseGanttDoc } from '../../lib/ganttDoc'
import { computeLayout } from './layout'
import { mergeConfig } from './defaults'

describe('bundled presets', () => {
  it('presidents.json is a valid gantt document', () => {
    const r = parseGanttDoc(presidents)
    expect(r.ok).toBe(true)
    expect(r.errors).toEqual([])
  })

  it('presidents.json lays out on a date axis with 25-year ticks', () => {
    const r = parseGanttDoc(presidents)
    const layout = computeLayout(r.value!.data, mergeConfig(r.value!.config))
    expect(layout.axisType).toBe('date')
    expect(layout.ticks.every((t) => Number(t.label) % 25 === 0)).toBe(true)
    expect(layout.rows).toHaveLength(11)
  })
})
