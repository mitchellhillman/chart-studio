import { DEFAULT_FONT } from '../../lib/fonts'
import type { BarConfig } from './types'

export const DEFAULT_BAR_CSV = `label,Q1,Q2,Q3,Q4
North,12,18,15,22
South,9,14,11,17
East,15,11,19,13
West,7,20,16,10`

export const DEFAULT_BAR_CONFIG: BarConfig = {
  title: 'Quarterly results by region',
  subtitle: 'Illustrative figures',
  source: [],
  colors: {},
  background: '#ffffff',
  legendBackground: '#f5f5f5',
  palette: '',
  chartType: 'bar',
  orientation: 'vertical',
  width: 560,
  plotHeight: 280,
  barGap: 8,
  tickCount: 5,
  tickLabelFormat: '',
  showDots: true,
  lineWidth: 3,
  maxCategoryLabels: 0,
  showLegend: true,
  legendPosition: 'top-left',
  font: DEFAULT_FONT,
}

export function mergeBarConfig(partial: Partial<BarConfig> | undefined | null): BarConfig {
  return { ...DEFAULT_BAR_CONFIG, ...(partial ?? {}) }
}
