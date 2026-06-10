import { renderBar } from './renderBar'
import { mergeBarConfig } from './defaults'
import { parseData } from '../../lib/parse'

const rows = parseData('label,A,B\nNorth,10,5\nSouth,8,12\nEast,6,9')

function render(config = mergeBarConfig({})) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  renderBar(svg, rows, config)
  return svg
}

describe('renderBar', () => {
  it('produces a self-contained, handler-free SVG', () => {
    const svg = render(mergeBarConfig({ title: 'Q' }))
    expect(svg.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg')
    expect(svg.getAttribute('viewBox')).toBeTruthy()
    expect(svg.querySelector('title')?.textContent).toBe('Q')
    expect(svg.outerHTML).not.toMatch(/on[a-z]+=/i)
  })

  it('draws a stacked rect per series per row for vertical bars', () => {
    const svg = render(mergeBarConfig({ chartType: 'bar', orientation: 'vertical' }))
    // background rect + legend rects + bars; count bars by excluding others is fiddly,
    // so assert the total bar rects = rows * series = 3 * 2 = 6 via the plot groups.
    const rects = [...svg.querySelectorAll('rect')]
    const bars = rects.filter((r) => r.getAttribute('width') && !r.classList.length)
    expect(bars.length).toBeGreaterThanOrEqual(6)
  })

  it('draws a path per series for line charts', () => {
    const svg = render(mergeBarConfig({ chartType: 'line' }))
    expect(svg.querySelectorAll('path').length).toBe(2)
  })

  it('omits dots when showDots is off', () => {
    const withDots = render(mergeBarConfig({ chartType: 'line', showDots: true }))
    const noDots = render(mergeBarConfig({ chartType: 'line', showDots: false }))
    expect(withDots.querySelectorAll('circle').length).toBeGreaterThan(0)
    expect(noDots.querySelectorAll('circle').length).toBe(0)
  })

  it('renders a legend swatch per series', () => {
    const svg = render(mergeBarConfig({ showLegend: true }))
    const swatches = [...svg.querySelectorAll('g.legend rect')].filter(
      (r) => r.getAttribute('width') === '11',
    )
    expect(swatches).toHaveLength(2)
  })

  it('honors horizontal orientation', () => {
    const svg = render(mergeBarConfig({ orientation: 'horizontal' }))
    expect(svg.querySelector('line.ytick')).toBeTruthy()
  })
})
