import { parseGanttDoc } from './ganttDoc'

const validDoc = {
  version: 1,
  kind: 'gantt',
  config: { title: 'Presidents' },
  data: {
    rows: [
      {
        label: 'George Washington',
        segments: [
          { start: '1732-02-22', end: '1799-12-14', category: 'Lifespan' },
          { start: '1789-04-30', end: '1797-03-04', category: 'In office', color: '21409A' },
        ],
      },
      { label: 'Joe Biden', segments: [{ start: '1942-11-20', category: 'Still living' }] },
    ],
  },
}

describe('parseGanttDoc', () => {
  it('accepts a valid document and normalizes it', () => {
    const r = parseGanttDoc(validDoc)
    expect(r.ok).toBe(true)
    expect(r.errors).toHaveLength(0)
    expect(r.value?.data.rows).toHaveLength(2)
    expect(r.value?.config).toEqual({ title: 'Presidents' })
  })

  it('preserves row order', () => {
    const r = parseGanttDoc(validDoc)
    expect(r.value?.data.rows.map((row) => row.label)).toEqual(['George Washington', 'Joe Biden'])
  })

  it('normalizes hex colors (adds the hash)', () => {
    const r = parseGanttDoc(validDoc)
    expect(r.value?.data.rows[0].segments[1].color).toBe('#21409A')
  })

  it('treats an omitted end as open-ended (undefined)', () => {
    const r = parseGanttDoc(validDoc)
    expect(r.value?.data.rows[1].segments[0].end).toBeUndefined()
  })

  it('reports a missing start', () => {
    const r = parseGanttDoc({ data: { rows: [{ label: 'X', segments: [{ category: 'a' }] }] } })
    expect(r.ok).toBe(false)
    expect(r.errors[0].path).toBe('data.rows[0].segments[0].start')
  })

  it('rejects an invalid hex color with a contextual path', () => {
    const r = parseGanttDoc({
      data: { rows: [{ label: 'X', segments: [{ start: 1, color: 'zzz' }] }] },
    })
    expect(r.ok).toBe(false)
    expect(r.errors[0].path).toBe('data.rows[0].segments[0].color')
  })

  it('rejects an unknown labelPos', () => {
    const r = parseGanttDoc({
      data: { rows: [{ label: 'X', segments: [{ start: 1, labelPos: 'middle' }] }] },
    })
    expect(r.ok).toBe(false)
    expect(r.errors[0].path).toBe('data.rows[0].segments[0].labelPos')
  })

  it('reports malformed JSON when given a string', () => {
    const r = parseGanttDoc('{ "data": [')
    expect(r.ok).toBe(false)
    expect(r.errors[0].path).toBe('document')
  })

  it('parses a valid JSON string', () => {
    const r = parseGanttDoc(JSON.stringify(validDoc))
    expect(r.ok).toBe(true)
    expect(r.value?.data.rows).toHaveLength(2)
  })

  it('requires data.rows to be an array', () => {
    const r = parseGanttDoc({ kind: 'gantt', data: {} })
    expect(r.ok).toBe(false)
    expect(r.errors.some((e) => e.path === 'data.rows')).toBe(true)
  })

  it('flags a wrong kind', () => {
    const r = parseGanttDoc({ kind: 'bar', data: { rows: [] } })
    expect(r.errors.some((e) => e.path === 'kind')).toBe(true)
  })

  it('accepts numeric start/end values', () => {
    const r = parseGanttDoc({ data: { rows: [{ label: 'N', segments: [{ start: 0, end: 5 }] }] } })
    expect(r.ok).toBe(true)
    expect(r.value?.data.rows[0].segments[0]).toMatchObject({ start: 0, end: 5 })
  })
})
