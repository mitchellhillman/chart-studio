import { decodeState, encodeState, isWithinShareCap, SHARE_CAP } from './shareState'

const doc = {
  version: 1,
  kind: 'gantt',
  config: { title: 'Shared' },
  data: { rows: [{ label: 'r', segments: [{ start: '2020-01-01', end: '2021-01-01' }] }] },
}

describe('shareState', () => {
  it('round-trips a document through encode/decode', () => {
    const decoded = decodeState(encodeState(doc))
    expect(decoded?.config.title).toBe('Shared')
    expect(decoded?.data.rows).toHaveLength(1)
  })

  it('produces a URL-safe payload', () => {
    expect(encodeState(doc)).not.toMatch(/[^A-Za-z0-9\-_.+$]/)
  })

  it('returns null for garbage input', () => {
    expect(decodeState('!!!not-valid!!!')).toBeNull()
    expect(decodeState('')).toBeNull()
  })

  it('flags payloads over the cap', () => {
    expect(isWithinShareCap('x'.repeat(SHARE_CAP))).toBe(true)
    expect(isWithinShareCap('x'.repeat(SHARE_CAP + 1))).toBe(false)
  })
})
