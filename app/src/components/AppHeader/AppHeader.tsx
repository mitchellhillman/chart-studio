import { NavLink } from 'react-router-dom'
import styles from './AppHeader.module.css'

export interface AppHeaderProps {
  legacyHref?: string
}

const logoSrc = `${import.meta.env.BASE_URL}deco/mark.svg`

export default function AppHeader({ legacyHref = '../' }: AppHeaderProps) {
  return (
    <header className={styles.bar}>
      <img className={styles.logo} src={logoSrc} alt="" width={22} height={22} />
      <h1 className={styles.title}>Chart Studio</h1>
      <nav className={styles.nav}>
        <NavLink
          to="/gantt"
          className={({ isActive }) => (isActive ? `${styles.link} ${styles.linkActive}` : styles.link)}
        >
          Gantt
        </NavLink>
        <a className={styles.link} href={legacyHref}>
          Bar/Line
        </a>
      </nav>
    </header>
  )
}
