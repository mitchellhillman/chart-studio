import type { ReactNode } from 'react'
import styles from './ChartStage.module.css'

export interface ChartStageProps {
  children: ReactNode
  footer?: ReactNode
}

export default function ChartStage({ children, footer }: ChartStageProps) {
  return (
    <div className={styles.stage}>
      <div className={styles.card}>{children}</div>
      {footer}
    </div>
  )
}
