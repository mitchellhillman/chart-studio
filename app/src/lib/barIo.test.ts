import { decodeBarState, encodeBarState, parseBarDoc, readBarFile, type BarDoc } from './barIo'

const doc: BarDoc = {
  version: 1,
  kind: 'bar',
  config: { title: 'Q', chartType: 'bar' },
  csv: 'label,A\nNorth,1\nSouth,2',
}

describe('parseBarDoc', () => {
  it('accepts a {config, csv} envelope', () => {
    const r = parseBarDoc(doc)
    expect(r.ok).toBe(true)
    expect(r.value?.csv).toContain('North')
  })
  it('rejects a missing config', () => {
    expect(parseBarDoc({ csv: 'x' }).ok).toBe(false)
  })
  it('rejects a missing csv string', () => {
    expect(parseBarDoc({ config: {} }).ok).toBe(false)
  })
  it('reports malformed JSON strings', () => {
    expect(parseBarDoc('{ broken').ok).toBe(false)
  })
})

describe('bar share state', () => {
  it('round-trips through encode/decode', () => {
    const decoded = decodeBarState(encodeBarState(doc))
    expect(decoded?.config.title).toBe('Q')
    expect(decoded?.csv).toContain('South')
  })
  it('returns null for garbage', () => {
    expect(decodeBarState('!!!')).toBeNull()
  })
})

describe('readBarFile', () => {
  it('reads and validates a bar document file', async () => {
    const file = new File([JSON.stringify(doc)], 'chart.json', { type: 'application/json' })
    const loaded = await readBarFile(file)
    expect(loaded.config.title).toBe('Q')
  })
  it('rejects an invalid file', async () => {
    const file = new File(['{}'], 'x.json', { type: 'application/json' })
    await expect(readBarFile(file)).rejects.toThrow()
  })
})
