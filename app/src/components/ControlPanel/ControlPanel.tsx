import type { ReactNode } from 'react'
import styles from './ControlPanel.module.css'

export interface ControlPanelProps {
  children: ReactNode
}

export default function ControlPanel({ children }: ControlPanelProps) {
  return <div className={styles.panel}>{children}</div>
}
