import { getSeries, parseData } from './parse'

describe('parseData', () => {
  it('parses CSV with numeric series and a reserved color column', () => {
    const rows = parseData('label,KIA,color\nD-Day,4414,#4b69aa\nOkinawa,12520,\n')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({ label: 'D-Day', KIA: 4414, color: '#4b69aa' })
    expect(rows[1].color).toBeNull()
  })

  it('auto-detects TSV', () => {
    const rows = parseData('label\tv\nA\t1\nB\t2')
    expect(rows[0]).toMatchObject({ label: 'A', v: 1 })
  })

  it('coerces blank numeric cells to null', () => {
    const rows = parseData('label,v\nA,\n')
    expect(rows[0].v).toBeNull()
  })
})

describe('getSeries', () => {
  it('returns numeric columns, excluding label and color', () => {
    const rows = parseData('label,KIA,WIA,color\nA,1,2,#fff\n')
    expect(getSeries(rows)).toEqual(['KIA', 'WIA'])
  })
  it('returns [] for no rows', () => {
    expect(getSeries([])).toEqual([])
  })
})
