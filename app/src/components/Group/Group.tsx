import type { ReactNode } from 'react'
import styles from './Group.module.css'

export interface GroupProps {
  title?: string
  children: ReactNode
}

export default function Group({ title, children }: GroupProps) {
  return (
    <section className={styles.group}>
      {title && <h2 className={styles.title}>{title}</h2>}
      {children}
    </section>
  )
}
