import { select } from 'd3'
import { measureMaxTextWidth } from '../../lib/measure'
import type { GanttModel } from '../../lib/ganttDoc'
import { computeLayout, type GanttLayout } from './layout'
import type { GanttConfig } from './types'

const AXIS_INK = '#111827'
const GRID = '#d1d5db'
const RULE = '#000000'
const SOURCE_INK = '#6b7280'
const TICK_LEN = 5

function drawLegend(
  root: ReturnType<typeof select<SVGGElement, unknown>>,
  layout: GanttLayout,
  cfg: GanttConfig,
) {
  if (!layout.legend) return
  const innerPad = 6
  const swatch = 11
  const gap = 6
  const rowH = 18
  const labels = layout.legend.map((e) => e.label)
  const boxW = innerPad * 2 + swatch + gap + measureMaxTextWidth(labels, cfg.font)
  const boxH = innerPad * 2 + (layout.legend.length - 1) * rowH + swatch

  const { left, top, width, height } = layout.plot
  const pos = layout.legendPosition
  const gx = pos.includes('right') ? left + width - boxW : left
  const gy = pos.includes('bottom') ? top + height - boxH : top

  const g = root.append('g').attr('transform', `translate(${gx}, ${gy})`)
  if (cfg.legendBackground) {
    g.append('rect')
      .attr('class', 'legend-bg')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', boxW)
      .attr('height', boxH)
      .attr('fill', cfg.legendBackground)
  }
  layout.legend.forEach((entry, i) => {
    const ly = innerPad + i * rowH
    g.append('rect')
      .attr('x', innerPad)
      .attr('y', ly)
      .attr('width', swatch)
      .attr('height', swatch)
      .attr('fill', entry.color)
    g.append('text')
      .attr('x', innerPad + swatch + gap)
      .attr('y', ly + swatch - 1.5)
      .attr('font-size', 12)
      .attr('fill', AXIS_INK)
      .text(entry.label)
  })
}

export function renderGantt(el: SVGSVGElement, model: GanttModel, cfg: GanttConfig): GanttLayout {
  const layout = computeLayout(model, cfg)

  const svg = select(el)
  svg.selectAll('*').remove()

  svg
    .attr('xmlns', 'http://www.w3.org/2000/svg')
    .attr('viewBox', `0 0 ${layout.totalWidth} ${layout.totalHeight}`)
    .attr('width', layout.totalWidth)
    .attr('height', layout.totalHeight)
    .attr('font-family', layout.font)
    .attr('font-size', 14)
    .attr('fill', AXIS_INK)

  svg.append('title').text(cfg.title)

  svg
    .append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', layout.totalWidth)
    .attr('height', layout.totalHeight)
    .attr('fill', layout.background)

  const root = svg.append('g').attr('transform', `translate(${layout.pad}, ${layout.pad})`)

  // Title block.
  const tb = layout.titleBlock
  if (tb.eyebrow) {
    root
      .append('text')
      .attr('x', 0)
      .attr('y', tb.eyebrow.y)
      .attr('font-size', 11)
      .attr('font-weight', 600)
      .attr('letter-spacing', '0.12em')
      .attr('fill', SOURCE_INK)
      .text(tb.eyebrow.text.toUpperCase())
  }
  if (tb.title) {
    root
      .append('text')
      .attr('x', 0)
      .attr('y', tb.title.y)
      .attr('font-size', 18)
      .attr('font-weight', 700)
      .attr('fill', '#000')
      .text(tb.title.text)
  }
  if (tb.subtitle) {
    root
      .append('text')
      .attr('x', 0)
      .attr('y', tb.subtitle.y)
      .attr('font-size', 14)
      .attr('font-weight', 700)
      .attr('fill', '#000')
      .text(tb.subtitle.text)
  }

  const plot = root.append('g').attr('transform', `translate(${layout.plot.left}, ${layout.plot.top})`)

  // Vertical gridlines.
  plot
    .append('g')
    .attr('class', 'gridlines')
    .selectAll('line')
    .data(layout.ticks)
    .join('line')
    .attr('x1', (d) => d.x)
    .attr('x2', (d) => d.x)
    .attr('y1', 0)
    .attr('y2', layout.plot.height)
    .attr('stroke', GRID)
    .attr('stroke-width', 1)

  // Segments (array order; later paints on top).
  const segG = plot.append('g').attr('class', 'segments')
  for (const seg of layout.segments) {
    if (seg.isPoint) {
      const r = seg.height / 3
      const cx = seg.x
      const cy = seg.centerY
      segG
        .append('path')
        .attr('class', 'point')
        .attr('d', `M${cx} ${cy - r} L${cx + r} ${cy} L${cx} ${cy + r} L${cx - r} ${cy} Z`)
        .attr('fill', seg.fill)
    } else {
      segG
        .append('rect')
        .attr('class', 'segment')
        .attr('x', seg.x)
        .attr('y', seg.top)
        .attr('width', seg.width)
        .attr('height', seg.height)
        .attr('fill', seg.fill)
    }
  }

  // Free-text segment labels (above the bars).
  const labelG = plot.append('g').attr('class', 'segment-labels')
  for (const seg of layout.segments) {
    const ll = seg.labelLayout
    if (!ll) continue
    labelG
      .append('text')
      .attr('x', ll.x)
      .attr('y', ll.y)
      .attr('text-anchor', ll.anchor)
      .attr('font-size', 12)
      .attr('fill', ll.fill)
      .text(ll.text)
  }

  // Row labels in the left gutter.
  plot
    .append('g')
    .attr('class', 'row-labels')
    .selectAll('text')
    .data(layout.rows)
    .join('text')
    .attr('x', -8)
    .attr('y', (d) => d.centerY)
    .attr('dy', '0.35em')
    .attr('text-anchor', 'end')
    .attr('font-weight', 500)
    .attr('fill', AXIS_INK)
    .text((d) => d.label)

  // Axis rules + tick labels (dual top/bottom).
  if (layout.showTopAxis) {
    plot
      .append('line')
      .attr('class', 'top-rule')
      .attr('x1', 0)
      .attr('x2', layout.plot.width)
      .attr('y1', 0)
      .attr('y2', 0)
      .attr('stroke', RULE)
      .attr('stroke-width', 1)
    plot
      .append('g')
      .attr('class', 'top-tickmarks')
      .selectAll('line')
      .data(layout.ticks)
      .join('line')
      .attr('x1', (d) => d.x)
      .attr('x2', (d) => d.x)
      .attr('y1', 0)
      .attr('y2', -TICK_LEN)
      .attr('stroke', RULE)
      .attr('stroke-width', 1)
    plot
      .append('g')
      .attr('class', 'top-ticks')
      .selectAll('text')
      .data(layout.ticks)
      .join('text')
      .attr('x', (d) => d.x)
      .attr('y', -7)
      .attr('text-anchor', 'middle')
      .attr('font-variant-numeric', 'tabular-nums')
      .attr('fill', AXIS_INK)
      .text((d) => d.label)
  }

  if (layout.showBottomAxis) {
    plot
      .append('line')
      .attr('class', 'bottom-rule')
      .attr('x1', 0)
      .attr('x2', layout.plot.width)
      .attr('y1', layout.plot.height)
      .attr('y2', layout.plot.height)
      .attr('stroke', RULE)
      .attr('stroke-width', 1)
    plot
      .append('g')
      .attr('class', 'bottom-tickmarks')
      .selectAll('line')
      .data(layout.ticks)
      .join('line')
      .attr('x1', (d) => d.x)
      .attr('x2', (d) => d.x)
      .attr('y1', layout.plot.height)
      .attr('y2', layout.plot.height + TICK_LEN)
      .attr('stroke', RULE)
      .attr('stroke-width', 1)
    plot
      .append('g')
      .attr('class', 'bottom-ticks')
      .selectAll('text')
      .data(layout.ticks)
      .join('text')
      .attr('x', (d) => d.x)
      .attr('y', layout.plot.height + 16)
      .attr('text-anchor', 'middle')
      .attr('font-variant-numeric', 'tabular-nums')
      .attr('fill', AXIS_INK)
      .text((d) => d.label)
  }

  drawLegend(root, layout, cfg)

  // Source footnotes.
  root
    .append('g')
    .attr('class', 'source')
    .selectAll('text')
    .data(layout.source)
    .join('text')
    .attr('x', 0)
    .attr('y', (_, i) => layout.sourceTop + i * 14)
    .attr('font-size', 12)
    .attr('fill', SOURCE_INK)
    .text((d) => d)

  return layout
}
