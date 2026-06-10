import { measureMaxTextWidth } from './measure'

describe('measureMaxTextWidth', () => {
  it('returns 0 for no labels', () => {
    expect(measureMaxTextWidth([], 'sans-serif')).toBe(0)
  })

  it('returns the widest label width (longest string wins)', () => {
    const w = measureMaxTextWidth(['a', 'longer label'], 'sans-serif')
    expect(w).toBeGreaterThan(0)
    expect(w).toBe(measureMaxTextWidth(['longer label'], 'sans-serif'))
  })
})
