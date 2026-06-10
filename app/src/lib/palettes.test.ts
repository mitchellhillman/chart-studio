import { beforeEach } from 'vitest'
import {
  BUILTIN_PALETTES,
  CUSTOM_PALETTES_KEY,
  loadCustomPalettes,
  mapPaletteToCategories,
  readCustomPalettes,
  saveCustomPalette,
} from './palettes'

describe('palettes', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('round-trips a saved custom palette through localStorage', () => {
    const pal = { series: ['#111111', '#222222'], background: '#ffffff' }
    expect(saveCustomPalette('Mine', pal)).toBe(true)
    expect(readCustomPalettes()).toEqual({ Mine: pal })
  })

  it('merges built-ins with custom palettes', () => {
    saveCustomPalette('Mine', { series: ['#111111'], background: '#ffffff' })
    const merged = loadCustomPalettes()
    expect(Object.keys(merged)).toEqual(expect.arrayContaining([...Object.keys(BUILTIN_PALETTES), 'Mine']))
  })

  it('does not let a custom palette clobber a built-in', () => {
    saveCustomPalette('Economist', { series: ['#000000'], background: '#000000' })
    expect(loadCustomPalettes().Economist).toEqual(BUILTIN_PALETTES.Economist)
  })

  it('refuses to save a blank name or empty series', () => {
    expect(saveCustomPalette('', { series: ['#111'], background: '#fff' })).toBe(false)
    expect(saveCustomPalette('X', { series: [], background: '#fff' })).toBe(false)
  })

  it('returns {} when storage is empty or corrupt', () => {
    expect(readCustomPalettes()).toEqual({})
    localStorage.setItem(CUSTOM_PALETTES_KEY, 'not json')
    expect(readCustomPalettes()).toEqual({})
  })
})

describe('mapPaletteToCategories', () => {
  it('assigns series across categories in order', () => {
    expect(mapPaletteToCategories(['#a', '#b', '#c'], ['x', 'y'])).toEqual({ x: '#a', y: '#b' })
  })

  it('wraps when there are more categories than series', () => {
    expect(mapPaletteToCategories(['#a', '#b'], ['x', 'y', 'z'])).toEqual({
      x: '#a',
      y: '#b',
      z: '#a',
    })
  })

  it('returns {} for an empty series', () => {
    expect(mapPaletteToCategories([], ['x'])).toEqual({})
  })
})
