import { useEffect, useRef, type RefObject } from 'react'
import type { GanttModel } from '../../lib/ganttDoc'
import { renderGantt } from './renderGantt'
import type { GanttConfig } from './types'

export interface GanttChartProps {
  model: GanttModel
  config: GanttConfig
  svgRef?: RefObject<SVGSVGElement>
}

export default function GanttChart({ model, config, svgRef }: GanttChartProps) {
  const innerRef = useRef<SVGSVGElement>(null)
  const ref = svgRef ?? innerRef

  useEffect(() => {
    if (ref.current) renderGantt(ref.current, model, config)
  }, [model, config, ref])

  return <svg ref={ref} />
}
