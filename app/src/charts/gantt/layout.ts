import { format, scaleLinear, scaleUtc, utcFormat } from 'd3'
import { contrastColor } from '../../lib/color'
import { detectAxisType, niceYearStep, numericTickCount, parseLabelDate } from '../../lib/dates'
import { measureMaxTextWidth } from '../../lib/measure'
import { BUILTIN_PALETTES, DEFAULT_PALETTE } from '../../lib/palettes'
import type { GanttModel, LabelPos, Segment } from '../../lib/ganttDoc'
import type { GanttConfig } from './types'

const LABEL_INK = '#111827'
const LABEL_PAD = 5

const PAD = 24
const RIGHT_INSET_MIN = 8
const LABEL_GUTTER_PAD = 10
const TOP_AXIS_H = 20
const BOTTOM_AXIS_H = 20
const SOURCE_LINE_H = 14
const SOURCE_TOP_GAP = 24

export interface TickLayout {
  x: number
  label: string
}

export interface RowLayout {
  label: string
  top: number
  centerY: number
  height: number
}

export interface SegmentLabelLayout {
  text: string
  x: number
  y: number
  anchor: 'start' | 'middle' | 'end'
  fill: string
}

export interface SegmentLayout {
  rowIndex: number
  x: number
  width: number
  top: number
  height: number
  centerY: number
  fill: string
  isPoint: boolean
  label?: string
  labelPos?: Segment['labelPos']
  labelLayout?: SegmentLabelLayout
}

export interface LegendEntry {
  label: string
  color: string
}

export interface TitleBlock {
  eyebrow?: { text: string; y: number }
  title?: { text: string; y: number }
  subtitle?: { text: string; y: number }
}

export interface GanttLayout {
  axisType: 'date' | 'number'
  warning?: string
  totalWidth: number
  totalHeight: number
  pad: number
  background: string
  font: string
  titleBlock: TitleBlock
  plot: { left: number; top: number; width: number; height: number }
  ticks: TickLayout[]
  showTopAxis: boolean
  showBottomAxis: boolean
  rows: RowLayout[]
  segments: SegmentLayout[]
  legend: LegendEntry[] | null
  legendPosition: GanttConfig['legendPosition']
  source: string[]
  sourceTop: number
}

function resolvePaletteSeries(palette: string): string[] {
  if (palette && BUILTIN_PALETTES[palette]) return BUILTIN_PALETTES[palette].series
  return DEFAULT_PALETTE
}

function toAxisValue(v: string | number, axisType: 'date' | 'number'): number {
  if (axisType === 'date') {
    const d = parseLabelDate(v)
    return d ? d.getTime() : NaN
  }
  return Number(v)
}

function distinctCategories(model: GanttModel): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const row of model.rows) {
    for (const seg of row.segments) {
      if (seg.category && !seen.has(seg.category)) {
        seen.add(seg.category)
        out.push(seg.category)
      }
    }
  }
  return out
}

interface SegGeom {
  x: number
  width: number
  top: number
  height: number
  centerY: number
  fill: string
  isPoint: boolean
}

// Free-text label placement. Inside positions auto-flip outward when the text
// is wider than the bar; inside text gets a luminance-based contrast fill.
function placeSegmentLabel(
  geom: SegGeom,
  text: string,
  pos: LabelPos | undefined,
  font: string,
): SegmentLabelLayout {
  const baseline = geom.centerY + 4
  const textW = measureMaxTextWidth([text], font)
  const fitsInside = !geom.isPoint && geom.width >= textW + LABEL_PAD * 2
  const contrast = contrastColor(geom.fill)
  const cx = geom.x + geom.width / 2
  const placement = pos ?? 'center'

  switch (placement) {
    case 'above':
      return { text, x: cx, y: geom.top - 5, anchor: 'middle', fill: LABEL_INK }
    case 'below':
      return { text, x: cx, y: geom.top + geom.height + 13, anchor: 'middle', fill: LABEL_INK }
    case 'start-outside':
      return { text, x: geom.x - LABEL_PAD, y: baseline, anchor: 'end', fill: LABEL_INK }
    case 'end-outside':
      return {
        text,
        x: geom.x + geom.width + LABEL_PAD,
        y: baseline,
        anchor: 'start',
        fill: LABEL_INK,
      }
    case 'start-inside':
      return fitsInside
        ? { text, x: geom.x + LABEL_PAD, y: baseline, anchor: 'start', fill: contrast }
        : { text, x: geom.x - LABEL_PAD, y: baseline, anchor: 'end', fill: LABEL_INK }
    case 'end-inside':
      return fitsInside
        ? { text, x: geom.x + geom.width - LABEL_PAD, y: baseline, anchor: 'end', fill: contrast }
        : {
            text,
            x: geom.x + geom.width + LABEL_PAD,
            y: baseline,
            anchor: 'start',
            fill: LABEL_INK,
          }
    case 'center':
    default:
      return fitsInside
        ? { text, x: cx, y: baseline, anchor: 'middle', fill: contrast }
        : { text, x: cx, y: geom.top - 5, anchor: 'middle', fill: LABEL_INK }
  }
}

export function computeLayout(model: GanttModel, cfg: GanttConfig): GanttLayout {
  const detected = cfg.axis === 'auto' ? detectAxisType(model) : { type: cfg.axis, warning: undefined }
  const axisType = detected.type

  // Domain over every start and defined end value.
  const values: number[] = []
  for (const row of model.rows) {
    for (const seg of row.segments) {
      const s = toAxisValue(seg.start, axisType)
      if (!Number.isNaN(s)) values.push(s)
      if (seg.end != null) {
        const e = toAxisValue(seg.end, axisType)
        if (!Number.isNaN(e)) values.push(e)
      }
    }
  }
  let domainMin = values.length ? Math.min(...values) : 0
  let domainMax = values.length ? Math.max(...values) : 1
  if (domainMin === domainMax) domainMax = domainMin + 1

  // Title block geometry.
  const titleBlock: TitleBlock = {}
  let headerBottom = 0
  if (cfg.eyebrow) {
    titleBlock.eyebrow = { text: cfg.eyebrow, y: 11 }
    headerBottom = 11
  }
  if (cfg.title) {
    const y = headerBottom ? headerBottom + 22 : 18
    titleBlock.title = { text: cfg.title, y }
    headerBottom = y
  }
  if (cfg.subtitle) {
    const y = headerBottom ? headerBottom + 20 : 14
    titleBlock.subtitle = { text: cfg.subtitle, y }
    headerBottom = y
  }
  headerBottom += 6

  // Gutter + plot box.
  const leftGutter =
    measureMaxTextWidth(
      model.rows.map((r) => r.label),
      cfg.font,
      500,
    ) + LABEL_GUTTER_PAD

  // Tick values, computed before the x range so we can reserve a right inset.
  const tickFmt = axisType === 'date' ? utcFormat('%Y') : format(',')
  let tickValues: number[]
  if (axisType === 'date') {
    const minYear = new Date(domainMin).getUTCFullYear()
    const maxYear = new Date(domainMax).getUTCFullYear()
    const step = cfg.tickInterval ?? niceYearStep(maxYear - minYear, numericTickCount(cfg.width))
    const startYear = Math.floor(minYear / step) * step
    const endYear = Math.ceil(maxYear / step) * step
    domainMin = Date.UTC(startYear, 0, 1)
    domainMax = Date.UTC(endYear, 0, 1)
    tickValues = []
    for (let y = startYear; y <= endYear; y += step) tickValues.push(Date.UTC(y, 0, 1))
  } else if (cfg.tickInterval) {
    const step = cfg.tickInterval
    const start = Math.floor(domainMin / step) * step
    const end = Math.ceil(domainMax / step) * step
    domainMin = start
    domainMax = end
    tickValues = []
    for (let v = start; v <= end; v += step) tickValues.push(v)
  } else {
    const s = scaleLinear().domain([domainMin, domainMax]).nice(numericTickCount(cfg.width))
    ;[domainMin, domainMax] = s.domain()
    tickValues = s.ticks(numericTickCount(cfg.width))
  }

  const tickLabels = tickValues.map((v) => tickFmt(v as number & Date))
  const lastLabelWidth = tickLabels.length
    ? measureMaxTextWidth([tickLabels[tickLabels.length - 1]], cfg.font)
    : 0
  const rightInset = Math.max(RIGHT_INSET_MIN, lastLabelWidth / 2 + 4)

  const plotWidth = Math.max(10, cfg.width - leftGutter - rightInset)
  const x =
    axisType === 'date'
      ? scaleUtc().domain([domainMin, domainMax]).range([0, plotWidth])
      : scaleLinear().domain([domainMin, domainMax]).range([0, plotWidth])

  const ticks: TickLayout[] = tickValues.map((v, i) => ({ x: x(v as number & Date), label: tickLabels[i] }))

  // Rows + segments.
  const step = cfg.rowHeight + cfg.rowGap
  const n = model.rows.length
  const plotHeight = n > 0 ? n * cfg.rowHeight + (n - 1) * cfg.rowGap : 0

  const showTopAxis = cfg.showTopAxis
  const showBottomAxis = cfg.showBottomAxis
  const plotTop = headerBottom + 16 + (showTopAxis ? TOP_AXIS_H : 0)
  const plotLeft = leftGutter

  const rows: RowLayout[] = model.rows.map((r, i) => {
    const top = i * step
    return { label: r.label, top, centerY: top + cfg.rowHeight / 2, height: cfg.rowHeight }
  })

  const categories = distinctCategories(model)
  const series = resolvePaletteSeries(cfg.palette)
  const categoryColor: Record<string, string> = {}
  let pi = 0
  for (const cat of categories) {
    categoryColor[cat] = cfg.categoryColors[cat] ?? series[pi++ % series.length]
  }

  const segments: SegmentLayout[] = []
  model.rows.forEach((row, rowIndex) => {
    const top = rowIndex * step
    row.segments.forEach((seg) => {
      const startVal = toAxisValue(seg.start, axisType)
      const endVal = seg.end != null ? toAxisValue(seg.end, axisType) : domainMax
      const sx = x(startVal as number & Date)
      const ex = x(endVal as number & Date)
      const isPoint = seg.end != null && endVal === startVal
      const fill = seg.color ?? (seg.category ? categoryColor[seg.category] : series[0])
      const geom: SegGeom = {
        x: sx,
        width: Math.max(0, ex - sx),
        top,
        height: cfg.rowHeight,
        centerY: top + cfg.rowHeight / 2,
        fill,
        isPoint,
      }
      segments.push({
        rowIndex,
        ...geom,
        label: seg.label,
        labelPos: seg.labelPos,
        labelLayout: seg.label
          ? placeSegmentLabel(geom, seg.label, seg.labelPos, cfg.font)
          : undefined,
      })
    })
  })

  const legend =
    cfg.showLegend && categories.length
      ? categories.map((c) => ({ label: c, color: categoryColor[c] }))
      : null

  // Source footnotes + total size.
  const source = cfg.source.filter((s) => s.length > 0)
  const plotBottom = plotTop + plotHeight + (showBottomAxis ? BOTTOM_AXIS_H : 0)
  const sourceTop = plotBottom + SOURCE_TOP_GAP
  const contentBottom = source.length
    ? sourceTop + (source.length - 1) * SOURCE_LINE_H + 3
    : plotBottom + 8

  return {
    axisType,
    warning: detected.warning,
    totalWidth: cfg.width + PAD * 2,
    totalHeight: contentBottom + PAD * 2,
    pad: PAD,
    background: cfg.background || '#ffffff',
    font: cfg.font,
    titleBlock,
    plot: { left: plotLeft, top: plotTop, width: plotWidth, height: plotHeight },
    ticks,
    showTopAxis,
    showBottomAxis,
    rows,
    segments,
    legend,
    legendPosition: cfg.legendPosition,
    source,
    sourceTop,
  }
}
