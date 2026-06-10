import { DEFAULT_CONFIG, mergeConfig } from './defaults'

describe('mergeConfig', () => {
  it('returns defaults when given nothing', () => {
    expect(mergeConfig(null)).toEqual(DEFAULT_CONFIG)
    expect(mergeConfig(undefined)).toEqual(DEFAULT_CONFIG)
  })

  it('overlays a partial config onto defaults', () => {
    const c = mergeConfig({ title: 'Presidents', width: 1200 })
    expect(c.title).toBe('Presidents')
    expect(c.width).toBe(1200)
    expect(c.rowHeight).toBe(DEFAULT_CONFIG.rowHeight)
  })
})
