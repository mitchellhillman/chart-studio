import { DEFAULT_FONT } from '../../lib/fonts'
import type { GanttConfig } from './types'

export const DEFAULT_CONFIG: GanttConfig = {
  title: '',
  eyebrow: '',
  subtitle: '',
  source: [],
  axis: 'auto',
  tickInterval: null,
  font: DEFAULT_FONT,
  palette: '',
  categoryColors: {},
  background: '#ffffff',
  legendBackground: '#ffffff',
  rowHeight: 22,
  rowGap: 1,
  width: 900,
  showLegend: true,
  legendPosition: 'top-left',
  showTopAxis: true,
  showBottomAxis: true,
}

// Merge a document's partial config (untyped from JSON) onto the defaults.
export function mergeConfig(partial: Record<string, unknown> | undefined | null): GanttConfig {
  return { ...DEFAULT_CONFIG, ...(partial as Partial<GanttConfig>) }
}
