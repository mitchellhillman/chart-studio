export type ChartType = 'bar' | 'line'
export type Orientation = 'vertical' | 'horizontal'
export type LegendPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export interface BarConfig {
  title: string
  subtitle: string
  source: string[]
  colors: Record<string, string>
  background: string
  legendBackground: string
  palette: string
  chartType: ChartType
  orientation: Orientation
  width: number
  plotHeight: number
  barGap: number
  tickCount: number
  tickLabelFormat: string
  showDots: boolean
  lineWidth: number
  maxCategoryLabels: number
  showLegend: boolean
  legendPosition: LegendPosition
  font: string
}
