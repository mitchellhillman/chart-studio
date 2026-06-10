import { serializeSvg, slugify } from './svgExport'

describe('slugify', () => {
  it('lowercases and dashes non-alphanumerics', () => {
    expect(slugify('Presidents: Lifespans & Terms')).toBe('presidents-lifespans-terms')
  })
  it('trims leading/trailing dashes', () => {
    expect(slugify('  WWII!  ')).toBe('wwii')
  })
  it('handles empty input', () => {
    expect(slugify('')).toBe('')
  })
})

describe('serializeSvg', () => {
  it('returns the element outerHTML', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('width', '10')
    expect(serializeSvg(svg)).toContain('<svg')
    expect(serializeSvg(svg)).toContain('width="10"')
  })
})
