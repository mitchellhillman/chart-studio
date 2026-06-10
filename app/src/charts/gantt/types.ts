import type { AxisType } from '../../lib/ganttDoc'

export type { AxisType, GanttModel, Row, Segment, LabelPos } from '../../lib/ganttDoc'

export type LegendPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export interface GanttConfig {
  title: string
  eyebrow: string
  subtitle: string
  source: string[]
  axis: AxisType
  tickInterval: number | null
  font: string
  palette: string
  categoryColors: Record<string, string>
  background: string
  legendBackground: string
  rowHeight: number
  rowGap: number
  width: number
  showLegend: boolean
  legendPosition: LegendPosition
  showTopAxis: boolean
  showBottomAxis: boolean
}
