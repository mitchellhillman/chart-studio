import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import GanttPage from './pages/GanttPage'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/gantt" element={<GanttPage />} />
        <Route path="*" element={<Navigate to="/gantt" replace />} />
      </Routes>
    </HashRouter>
  )
}
