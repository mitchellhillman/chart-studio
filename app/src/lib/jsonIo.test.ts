import { readDocFile, serializeDoc } from './jsonIo'

function jsonFile(obj: unknown): File {
  return new File([JSON.stringify(obj)], 'chart.json', { type: 'application/json' })
}

describe('jsonIo', () => {
  it('reads and validates a well-formed document file', async () => {
    const file = jsonFile({
      version: 1,
      kind: 'gantt',
      config: { title: 'X' },
      data: { rows: [{ label: 'r', segments: [{ start: 1, end: 2 }] }] },
    })
    const doc = await readDocFile(file)
    expect(doc.data.rows).toHaveLength(1)
    expect(doc.config.title).toBe('X')
  })

  it('rejects an invalid document file with a readable error', async () => {
    const file = jsonFile({ data: { rows: [{ label: 'r', segments: [{ category: 'x' }] }] } })
    await expect(readDocFile(file)).rejects.toThrow(/start/)
  })

  it('serializes a document with indentation', () => {
    expect(serializeDoc({ a: 1 })).toBe('{\n  "a": 1\n}')
  })
})
