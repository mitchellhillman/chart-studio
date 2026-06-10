import type { ReactNode } from 'react'
import styles from './Field.module.css'

export interface FieldProps {
  label?: string
  htmlFor?: string
  help?: string
  children: ReactNode
}

export default function Field({ label, htmlFor, help, children }: FieldProps) {
  return (
    <div className={styles.field}>
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {help && <p className={styles.help}>{help}</p>}
    </div>
  )
}
