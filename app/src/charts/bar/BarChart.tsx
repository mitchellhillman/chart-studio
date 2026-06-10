import { useEffect, useRef, type RefObject } from 'react'
import type { DataRow } from '../../lib/parse'
import { renderBar } from './renderBar'
import type { BarConfig } from './types'

export interface BarChartProps {
  rows: DataRow[]
  config: BarConfig
  svgRef?: RefObject<SVGSVGElement>
}

export default function BarChart({ rows, config, svgRef }: BarChartProps) {
  const innerRef = useRef<SVGSVGElement>(null)
  const ref = svgRef ?? innerRef

  useEffect(() => {
    if (ref.current) renderBar(ref.current, rows, config)
  }, [rows, config, ref])

  return <svg ref={ref} />
}
