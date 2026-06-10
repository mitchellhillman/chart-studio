import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import GanttPage from './pages/GanttPage'
import BarPage from './pages/BarPage'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/gantt" element={<GanttPage />} />
        <Route path="/bar" element={<BarPage />} />
        <Route path="*" element={<Navigate to="/gantt" replace />} />
      </Routes>
    </HashRouter>
  )
}
