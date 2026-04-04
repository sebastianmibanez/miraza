import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import './DashboardLayout.css'

export default function DashboardLayout() {
  return (
    <div className="dash-shell">
      <Sidebar />
      <main className="dash-main">
        <Outlet />
      </main>
    </div>
  )
}
