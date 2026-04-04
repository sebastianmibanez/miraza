import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import './Sidebar.css'

const PLAN_LABELS: Record<string, string> = {
  paes:       'Plan PAES',
  nem:        'Plan NEM',
  nivelacion: 'Plan Nivelación',
  especial:   'Plan Especial',
  teacher:    'Profesora',
}

const PLAN_COLORS: Record<string, string> = {
  paes:       '#2563eb',
  nem:        '#16a34a',
  nivelacion: '#9333ea',
  especial:   '#0e7490',
  teacher:    '#b45309',
}

export default function Sidebar() {
  const { state, logout } = useAuth()
  const navigate = useNavigate()
  const user = state.user
  const rol = user?.rol ?? 'paes'
  const dashPath = rol === 'teacher' ? '/dashboard/paes' : `/dashboard/${rol}`
  const initials = user ? `${user.nombre[0]}${user.apellido[0]}`.toUpperCase() : '??'

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <a href="/" className="sidebar-brand">
          <span className="sidebar-brand-text">miraza</span>
          <span className="sidebar-brand-dot">.</span>
        </a>

        <div className="sidebar-user">
          <div
            className="sidebar-avatar"
            style={{ background: PLAN_COLORS[rol] }}
          >
            {initials}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">
              {user?.nombre} {user?.apellido}
            </span>
            <span
              className="sidebar-plan-badge"
              style={{ background: PLAN_COLORS[rol] }}
            >
              {PLAN_LABELS[rol]}
            </span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to={dashPath} end className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
          <span className="sidebar-icon">🏠</span> Inicio
        </NavLink>
        <NavLink to={`${dashPath}?tab=clases`} className="sidebar-link">
          <span className="sidebar-icon">🎥</span> Clases grabadas
        </NavLink>
        <NavLink to={`${dashPath}?tab=materiales`} className="sidebar-link">
          <span className="sidebar-icon">📄</span> Materiales
        </NavLink>
        <NavLink to={`${dashPath}?tab=progreso`} className="sidebar-link">
          <span className="sidebar-icon">📊</span> Mi progreso
        </NavLink>
      </nav>

      <div className="sidebar-bottom">
        <button className="sidebar-logout" onClick={handleLogout}>
          <span className="sidebar-icon">🚪</span> Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
