import { contrastColor, normalizeHex } from './color'

describe('normalizeHex', () => {
  it('adds a missing leading hash', () => {
    expect(normalizeHex('21409A')).toBe('#21409A')
  })

  it('accepts 3- and 6-digit hex', () => {
    expect(normalizeHex('#abc')).toBe('#abc')
    expect(normalizeHex('#aabbcc')).toBe('#aabbcc')
  })

  it('trims surrounding whitespace', () => {
    expect(normalizeHex('  #fff  ')).toBe('#fff')
  })

  it('rejects invalid input', () => {
    expect(normalizeHex('nothex')).toBeNull()
    expect(normalizeHex('#12')).toBeNull()
    expect(normalizeHex('')).toBeNull()
    expect(normalizeHex(null)).toBeNull()
  })
})

describe('contrastColor', () => {
  it('returns white text on a dark fill', () => {
    expect(contrastColor('#21409A')).toBe('#ffffff')
    expect(contrastColor('#000')).toBe('#ffffff')
  })

  it('returns dark text on a light fill', () => {
    expect(contrastColor('#E2E4E7')).toBe('#111827')
    expect(contrastColor('#ffffff')).toBe('#111827')
  })

  it('expands 3-digit hex', () => {
    expect(contrastColor('#fff')).toBe('#111827')
  })

  it('falls back to dark ink for invalid input', () => {
    expect(contrastColor('nope')).toBe('#111827')
  })
})
