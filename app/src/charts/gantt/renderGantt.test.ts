import { renderGantt } from './renderGantt'
import { mergeConfig } from './defaults'
import type { GanttModel } from '../../lib/ganttDoc'

const model: GanttModel = {
  rows: [
    {
      label: 'George Washington',
      segments: [
        { start: '1732-02-22', end: '1799-12-14', category: 'Lifespan' },
        { start: '1789-04-30', end: '1797-03-04', category: 'In office' },
      ],
    },
    {
      label: 'Joe Biden',
      segments: [
        { start: '1942-11-20', category: 'Still living' },
        { start: '2021-01-20', end: '2025-01-20', category: 'In office' },
      ],
    },
  ],
}

function renderInto(config = mergeConfig({ title: 'Presidents', tickInterval: 25, axis: 'date' })) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  renderGantt(svg, model, config)
  return svg
}

describe('renderGantt', () => {
  it('produces a self-contained, serializable SVG', () => {
    const svg = renderInto()
    expect(svg.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg')
    expect(svg.getAttribute('viewBox')).toBeTruthy()
    expect(svg.getAttribute('width')).toBeTruthy()
    expect(svg.getAttribute('height')).toBeTruthy()
    expect(svg.querySelector('title')?.textContent).toBe('Presidents')
    expect(svg.querySelector('rect')).toBeTruthy() // background
  })

  it('carries no event handlers (static export)', () => {
    const svg = renderInto()
    expect(svg.outerHTML).not.toMatch(/on[a-z]+=/i)
  })

  it('draws one rect per non-point segment plus the background', () => {
    const svg = renderInto()
    const segRects = svg.querySelectorAll('g.segments rect')
    expect(segRects).toHaveLength(4)
  })

  it('draws a row label per row', () => {
    const svg = renderInto()
    const labels = [...svg.querySelectorAll('g.row-labels text')].map((t) => t.textContent)
    expect(labels).toEqual(['George Washington', 'Joe Biden'])
  })

  it('draws dual axes when both are enabled', () => {
    const svg = renderInto()
    expect(svg.querySelector('line.top-rule')).toBeTruthy()
    expect(svg.querySelector('line.bottom-rule')).toBeTruthy()
    expect(svg.querySelectorAll('g.top-ticks text').length).toBeGreaterThan(2)
    expect(svg.querySelectorAll('g.top-tickmarks line').length).toBeGreaterThan(2)
    expect(svg.querySelectorAll('g.bottom-tickmarks line').length).toBeGreaterThan(2)
  })

  it('omits an axis when disabled', () => {
    const svg = renderInto(mergeConfig({ axis: 'date', showTopAxis: false }))
    expect(svg.querySelector('line.top-rule')).toBeNull()
    expect(svg.querySelector('line.bottom-rule')).toBeTruthy()
  })

  it('draws a legend swatch per category', () => {
    const svg = renderInto(
      mergeConfig({
        axis: 'date',
        categoryColors: { Lifespan: '#E2E4E7', 'In office': '#21409A', 'Still living': '#A3C2E3' },
      }),
    )
    const swatches = svg.querySelectorAll('g.gridlines') // ensure plot built
    expect(swatches.length).toBe(1)
    // legend group has 3 swatch rects + 3 labels
    const legendRects = [...svg.querySelectorAll('rect')].filter(
      (r) => r.getAttribute('width') === '11' && r.getAttribute('height') === '11',
    )
    expect(legendRects).toHaveLength(3)
  })

  it('renders a point marker as a path, not a rect', () => {
    const grad: GanttModel = {
      rows: [{ label: 'grad', segments: [{ start: '2011-05-01', end: '2011-05-01' }] }],
    }
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    renderGantt(svg, grad, mergeConfig({ axis: 'date' }))
    expect(svg.querySelector('g.segments path.point')).toBeTruthy()
    expect(svg.querySelector('g.segments rect.segment')).toBeNull()
  })

  it('renders a free-text segment label', () => {
    const labeled: GanttModel = {
      rows: [{ label: 'r', segments: [{ start: 0, end: 100, label: 'Phase 1' }] }],
    }
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    renderGantt(svg, labeled, mergeConfig({ axis: 'number', width: 900 }))
    const labels = [...svg.querySelectorAll('g.segment-labels text')].map((t) => t.textContent)
    expect(labels).toContain('Phase 1')
  })

  it('full-rebuilds on re-render (no duplicate content)', () => {
    const svg = renderInto()
    renderGantt(svg, model, mergeConfig({ title: 'Presidents', axis: 'date' }))
    expect(svg.querySelectorAll('g.segments rect')).toHaveLength(4)
    expect(svg.querySelectorAll('title')).toHaveLength(1)
  })
})
