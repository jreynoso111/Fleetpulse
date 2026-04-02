import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layout/AppLayout'
import AutomationsPage from './pages/AutomationsPage'
import BoardsPage from './pages/BoardsPage'
import DashboardPage from './pages/DashboardPage'
import LandingPage from './pages/LandingPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="boards" element={<BoardsPage />} />
        <Route path="automations" element={<AutomationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
