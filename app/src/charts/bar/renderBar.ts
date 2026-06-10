import {
  curveMonotoneX,
  curveMonotoneY,
  format,
  line,
  max,
  scaleBand,
  scaleLinear,
  select,
  stack,
  type Selection,
} from 'd3'
import { labelRowsFor } from '../../lib/dates'
import { measureMaxTextWidth } from '../../lib/measure'
import { DEFAULT_PALETTE } from '../../lib/palettes'
import { getSeries, type DataRow } from '../../lib/parse'
import type { BarConfig } from './types'

const PAD = 24
const MARGIN_TOP = 64
const MARGIN_LEFT = 0
const MARGIN_RIGHT = 0
const LABEL_GUTTER_PAD = 8
const AXIS_INK = '#111827'
const GRID = '#d1d5db'
const RULE = '#000000'
const SOURCE_INK = '#6b7280'

type GSel = Selection<SVGGElement, unknown, null, undefined>
type StackRow = Record<string, number | string | null | undefined> & { label: string }

interface Ctx {
  rows: DataRow[]
  cfg: BarConfig
  series: string[]
  colors: Record<string, string>
  availableWidth: number
  innerHeight: number
}

function resolveSeriesColors(series: string[], existing: Record<string, string>): Record<string, string> {
  const out = { ...existing }
  series.forEach((s, i) => {
    if (!out[s]) out[s] = DEFAULT_PALETTE[i % DEFAULT_PALETTE.length]
  })
  return out
}

const num = (v: unknown): number | null =>
  v == null || v === '' || Number.isNaN(Number(v)) ? null : Number(v)

function drawVertical(root: GSel, ctx: Ctx) {
  const { rows, cfg, series, colors, availableWidth, innerHeight } = ctx
  const labelRows = labelRowsFor(rows, cfg)
  const fmtActive = !!cfg.tickLabelFormat?.trim()

  const stackedData =
    cfg.chartType === 'bar'
      ? stack<StackRow>().keys(series)(
          rows.map((r) => ({ ...r, ...Object.fromEntries(series.map((s) => [s, num(r[s]) ?? 0])) })) as StackRow[],
        )
      : null

  const yMax =
    cfg.chartType === 'bar'
      ? max(stackedData!, (ss) => max(ss, (d) => d[1])) || 0
      : max(rows, (r) => max(series, (s) => num(r[s]) ?? 0)) || 0

  const y = scaleLinear().domain([0, yMax]).nice().range([innerHeight, 0])
  const ticks = y.ticks(cfg.tickCount)
  const labelGutter = measureMaxTextWidth(ticks.map((d) => format(',')(d)), cfg.font) + LABEL_GUTTER_PAD
  const barsEnd = availableWidth - labelGutter

  const paddingInner = (cfg.barGap * rows.length) / Math.max(1, barsEnd)
  const x = scaleBand<string>()
    .domain(rows.map((d) => d.label))
    .range([0, barsEnd])
    .paddingInner(paddingInner)
    .paddingOuter(paddingInner / 2)

  const cx = (label: string) => (x(label) ?? 0) + x.bandwidth() / 2

  let tickRows = labelRows
  if (fmtActive && labelRows.length >= 2) {
    const labelW = measureMaxTextWidth(
      labelRows.map((r) => String(r.label)),
      cfg.font,
    )
    tickRows = labelRows.slice()
    if (cx(tickRows[1].label) - cx(tickRows[0].label) < labelW * 1.5) tickRows = tickRows.slice(1)
    const n = tickRows.length
    if (n >= 2 && cx(tickRows[n - 1].label) - cx(tickRows[n - 2].label) < labelW * 1.5) {
      tickRows = tickRows.slice(0, n - 1)
    }
  }

  const plot = root.append('g').attr('transform', `translate(${MARGIN_LEFT}, ${MARGIN_TOP})`)

  plot
    .append('g')
    .selectAll('line')
    .data(ticks)
    .join('line')
    .attr('x1', 0)
    .attr('x2', availableWidth)
    .attr('y1', (d) => y(d))
    .attr('y2', (d) => y(d))
    .attr('stroke', GRID)
    .attr('stroke-width', 1)

  if (cfg.chartType === 'line') {
    for (const s of series) {
      const gen = line<DataRow>()
        .curve(curveMonotoneX)
        .defined((d) => num(d[s]) != null)
        .x((d) => cx(d.label))
        .y((d) => y(num(d[s]) ?? 0))
      plot
        .append('path')
        .datum(rows)
        .attr('d', gen)
        .attr('fill', 'none')
        .attr('stroke', colors[s])
        .attr('stroke-width', cfg.lineWidth)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
      if (cfg.showDots) {
        plot
          .append('g')
          .selectAll('circle')
          .data(rows.filter((r) => num(r[s]) != null))
          .join('circle')
          .attr('cx', (d) => cx(d.label))
          .attr('cy', (d) => y(num(d[s]) ?? 0))
          .attr('r', 4)
          .attr('fill', (d) => d.color || colors[s])
      }
    }
  } else {
    for (const sd of stackedData!) {
      plot
        .append('g')
        .selectAll('rect')
        .data(sd)
        .join('rect')
        .attr('x', (d) => x(d.data.label) ?? 0)
        .attr('y', (d) => y(d[1]))
        .attr('width', x.bandwidth())
        .attr('height', (d) => Math.max(0, y(d[0]) - y(d[1])))
        .attr('fill', (d) => (d.data.color as string) || colors[sd.key])
    }
  }

  plot
    .append('g')
    .selectAll('text.tick')
    .data(ticks)
    .join('text')
    .attr('class', 'tick')
    .attr('x', availableWidth)
    .attr('y', (d) => y(d) - 4)
    .attr('text-anchor', 'end')
    .attr('font-variant-numeric', 'tabular-nums')
    .attr('fill', AXIS_INK)
    .text((d) => format(',')(d))

  plot
    .append('g')
    .selectAll('line.xtick')
    .data(tickRows)
    .join('line')
    .attr('class', 'xtick')
    .attr('x1', (d) => cx(d.label))
    .attr('x2', (d) => cx(d.label))
    .attr('y1', innerHeight)
    .attr('y2', innerHeight + 4)
    .attr('stroke', RULE)
    .attr('stroke-width', 1)

  plot
    .append('g')
    .selectAll('text.label')
    .data(tickRows)
    .join('text')
    .attr('class', 'label')
    .attr('x', (d, i) =>
      fmtActive ? cx(d.label) : i === 0 ? 0 : i === tickRows.length - 1 ? barsEnd : cx(d.label),
    )
    .attr('y', innerHeight + 18)
    .attr('text-anchor', (_, i) =>
      i === 0 ? 'start' : i === tickRows.length - 1 ? 'end' : 'middle',
    )
    .attr('font-weight', 500)
    .attr('fill', AXIS_INK)
    .text((d) => String(d.label))

  plot
    .append('line')
    .attr('x1', 0)
    .attr('x2', availableWidth)
    .attr('y1', innerHeight)
    .attr('y2', innerHeight)
    .attr('stroke', RULE)
    .attr('stroke-width', 1)
}

function drawHorizontal(root: GSel, ctx: Ctx) {
  const { rows, cfg, series, colors, availableWidth, innerHeight } = ctx
  const labelRows = labelRowsFor(rows, cfg)

  const stackedData =
    cfg.chartType === 'bar'
      ? stack<StackRow>().keys(series)(
          rows.map((r) => ({ ...r, ...Object.fromEntries(series.map((s) => [s, num(r[s]) ?? 0])) })) as StackRow[],
        )
      : null

  const xMax =
    cfg.chartType === 'bar'
      ? max(stackedData!, (ss) => max(ss, (d) => d[1])) || 0
      : max(rows, (r) => max(series, (s) => num(r[s]) ?? 0)) || 0

  const leftGutter =
    measureMaxTextWidth(
      rows.map((d) => d.label),
      cfg.font,
      500,
    ) + LABEL_GUTTER_PAD

  const x = scaleLinear().domain([0, xMax]).nice()
  const ticks = x.ticks(cfg.tickCount)
  const maxTickWidth = measureMaxTextWidth(ticks.map((d) => format(',')(d)), cfg.font)
  const rightInset = maxTickWidth / 2 + 4
  const innerWidth = availableWidth - leftGutter - rightInset
  x.range([0, innerWidth])

  const paddingInner = (cfg.barGap * rows.length) / Math.max(1, innerHeight)
  const y = scaleBand<string>()
    .domain(rows.map((d) => d.label))
    .range([0, innerHeight])
    .paddingInner(paddingInner)
    .paddingOuter(paddingInner / 2)

  const cy = (label: string) => (y(label) ?? 0) + y.bandwidth() / 2

  const plot = root.append('g').attr('transform', `translate(${MARGIN_LEFT + leftGutter}, ${MARGIN_TOP})`)

  plot
    .append('g')
    .selectAll('line')
    .data(ticks)
    .join('line')
    .attr('x1', (d) => x(d))
    .attr('x2', (d) => x(d))
    .attr('y1', 0)
    .attr('y2', innerHeight)
    .attr('stroke', GRID)
    .attr('stroke-width', 1)

  if (cfg.chartType === 'line') {
    for (const s of series) {
      const gen = line<DataRow>()
        .curve(curveMonotoneY)
        .defined((d) => num(d[s]) != null)
        .x((d) => x(num(d[s]) ?? 0))
        .y((d) => cy(d.label))
      plot
        .append('path')
        .datum(rows)
        .attr('d', gen)
        .attr('fill', 'none')
        .attr('stroke', colors[s])
        .attr('stroke-width', cfg.lineWidth)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
      if (cfg.showDots) {
        plot
          .append('g')
          .selectAll('circle')
          .data(rows.filter((r) => num(r[s]) != null))
          .join('circle')
          .attr('cx', (d) => x(num(d[s]) ?? 0))
          .attr('cy', (d) => cy(d.label))
          .attr('r', 4)
          .attr('fill', (d) => d.color || colors[s])
      }
    }
  } else {
    for (const sd of stackedData!) {
      plot
        .append('g')
        .selectAll('rect')
        .data(sd)
        .join('rect')
        .attr('x', (d) => x(d[0]))
        .attr('y', (d) => y(d.data.label) ?? 0)
        .attr('width', (d) => Math.max(0, x(d[1]) - x(d[0])))
        .attr('height', y.bandwidth())
        .attr('fill', (d) => (d.data.color as string) || colors[sd.key])
    }
  }

  plot
    .append('g')
    .selectAll('text.tick')
    .data(ticks)
    .join('text')
    .attr('class', 'tick')
    .attr('x', (d) => x(d))
    .attr('y', innerHeight + 18)
    .attr('text-anchor', 'middle')
    .attr('font-variant-numeric', 'tabular-nums')
    .attr('fill', AXIS_INK)
    .text((d) => format(',')(d))

  plot
    .append('g')
    .selectAll('line.ytick')
    .data(labelRows)
    .join('line')
    .attr('class', 'ytick')
    .attr('x1', -4)
    .attr('x2', 0)
    .attr('y1', (d) => cy(d.label))
    .attr('y2', (d) => cy(d.label))
    .attr('stroke', RULE)
    .attr('stroke-width', 1)

  plot
    .append('g')
    .selectAll('text.label')
    .data(labelRows)
    .join('text')
    .attr('class', 'label')
    .attr('x', -8)
    .attr('y', (d) => cy(d.label))
    .attr('dy', '0.35em')
    .attr('text-anchor', 'end')
    .attr('font-weight', 500)
    .attr('fill', AXIS_INK)
    .text((d) => String(d.label))

  plot
    .append('line')
    .attr('x1', 0)
    .attr('x2', 0)
    .attr('y1', 0)
    .attr('y2', innerHeight)
    .attr('stroke', RULE)
    .attr('stroke-width', 1)
}

function drawLegend(root: GSel, ctx: Ctx) {
  const { cfg, series, colors, availableWidth, innerHeight } = ctx
  const innerPad = 6
  const swatch = 11
  const gap = 6
  const rowH = 18
  const maxTextWidth = measureMaxTextWidth(series, cfg.font)
  const boxW = innerPad * 2 + swatch + gap + maxTextWidth
  const boxH = innerPad * 2 + (series.length - 1) * rowH + swatch

  const plotLeft = MARGIN_LEFT
  const plotRight = MARGIN_LEFT + availableWidth
  const plotTop = MARGIN_TOP
  const plotBottom = MARGIN_TOP + innerHeight
  const pos = cfg.legendPosition
  const gx = pos.includes('right') ? plotRight - boxW : plotLeft
  const gy = pos.includes('bottom') ? plotBottom - boxH : plotTop

  const g = root.append('g').attr('class', 'legend').attr('transform', `translate(${gx}, ${gy})`)
  if (cfg.legendBackground) {
    g.append('rect').attr('width', boxW).attr('height', boxH).attr('fill', cfg.legendBackground)
  }
  series.forEach((s, i) => {
    const ly = innerPad + i * rowH
    g.append('rect').attr('x', innerPad).attr('y', ly).attr('width', swatch).attr('height', swatch).attr('fill', colors[s])
    g.append('text')
      .attr('x', innerPad + swatch + gap)
      .attr('y', ly + swatch - 1.5)
      .attr('font-size', 12)
      .attr('fill', AXIS_INK)
      .text(s)
  })
}

export function renderBar(el: SVGSVGElement, rows: DataRow[], cfg: BarConfig): void {
  const sourceLines = (Array.isArray(cfg.source) ? cfg.source : [cfg.source]).filter((l) => l.length > 0)
  const sourceFirstOffset = 47
  const sourceLineHeight = 14
  const sourceDescender = 3
  const bottomPadding = 8
  const categoryLabelsBottom = 28
  const sourceBottom = sourceLines.length
    ? sourceFirstOffset + (sourceLines.length - 1) * sourceLineHeight + sourceDescender
    : 0
  const marginBottom = Math.max(categoryLabelsBottom, sourceBottom) + bottomPadding

  const series = getSeries(rows)
  const colors = resolveSeriesColors(series, cfg.colors)
  const availableWidth = cfg.width - MARGIN_LEFT - MARGIN_RIGHT
  const innerHeight = cfg.plotHeight

  const contentHeight = MARGIN_TOP + cfg.plotHeight + marginBottom
  const totalWidth = cfg.width + PAD * 2
  const totalHeight = contentHeight + PAD * 2

  const svg = select(el)
  svg.selectAll('*').remove()
  svg
    .attr('xmlns', 'http://www.w3.org/2000/svg')
    .attr('viewBox', `0 0 ${totalWidth} ${totalHeight}`)
    .attr('width', totalWidth)
    .attr('height', totalHeight)
    .attr('font-family', cfg.font)
    .attr('font-size', 14)
    .attr('fill', AXIS_INK)

  svg.append('title').text(cfg.title)
  svg.append('rect').attr('width', totalWidth).attr('height', totalHeight).attr('fill', cfg.background || '#ffffff')

  const root = svg.append('g').attr('transform', `translate(${PAD}, ${PAD})`)

  root.append('text').attr('x', 0).attr('y', 18).attr('font-size', 18).attr('font-weight', 700).attr('fill', '#000').text(cfg.title)
  root.append('text').attr('x', 0).attr('y', 38).attr('font-size', 14).attr('font-weight', 700).attr('fill', '#000').text(cfg.subtitle)

  const ctx: Ctx = { rows, cfg, series, colors, availableWidth, innerHeight }
  if (cfg.orientation === 'horizontal') drawHorizontal(root, ctx)
  else drawVertical(root, ctx)

  if (cfg.showLegend && series.length) drawLegend(root, ctx)

  root
    .append('g')
    .selectAll('text.source')
    .data(sourceLines)
    .join('text')
    .attr('class', 'source')
    .attr('x', MARGIN_LEFT)
    .attr('y', (_, i) => MARGIN_TOP + innerHeight + sourceFirstOffset + i * sourceLineHeight)
    .attr('font-size', 12)
    .attr('fill', SOURCE_INK)
    .text((d) => d)
}
