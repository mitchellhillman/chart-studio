import type { ReactNode } from 'react'
import styles from './FieldRow.module.css'

export interface FieldRowProps {
  align?: 'end'
  children: ReactNode
}

export default function FieldRow({ align, children }: FieldRowProps) {
  const className = align === 'end' ? `${styles.row} ${styles.end}` : styles.row
  return <div className={className}>{children}</div>
}
