import { NavLink } from 'react-router-dom'
import styles from './AppHeader.module.css'

const logoSrc = `${import.meta.env.BASE_URL}deco/mark.svg`

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? `${styles.link} ${styles.linkActive}` : styles.link

export default function AppHeader() {
  return (
    <header className={styles.bar}>
      <img className={styles.logo} src={logoSrc} alt="" width={22} height={22} />
      <h1 className={styles.title}>Chart Studio</h1>
      <nav className={styles.nav}>
        <NavLink to="/gantt" className={linkClass}>
          Gantt
        </NavLink>
        <NavLink to="/bar" className={linkClass}>
          Bar/Line
        </NavLink>
      </nav>
    </header>
  )
}
