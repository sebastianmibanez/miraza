import { NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import './Sidebar.css'

const ETIQUETA: Record<string, string> = {
  paes:       'Plan PAES',
  nem:        'Plan NEM',
  nivelacion: 'Plan Nivelación',
  especial:   'Plan Especial',
  teacher:    'Profesora',
  admin:      'Dirección',
}

const COLOR: Record<string, string> = {
  paes:       '#2563eb',
  nem:        '#16a34a',
  nivelacion: '#9333ea',
  especial:   '#0e7490',
  teacher:    '#b45309',
  admin:      '#b45309',
}

/** Las pestañas de cada rol. Solo se listan las que existen de verdad: antes el
 *  alumno veía "Clases grabadas", "Materiales" y "Mi progreso", que apuntaban a
 *  pestañas inexistentes y al hacer clic no pasaba nada. */
const TABS: Record<string, { tab: string; icono: string; texto: string }[]> = {
  admin: [
    { tab: 'inscripciones', icono: '📥', texto: 'Inscripciones' },
    { tab: 'gestion',       icono: '⚙️', texto: 'Gestión' },
    { tab: 'avisos',        icono: '📢', texto: 'Avisos' },
    { tab: 'horario',       icono: '📅', texto: 'Horario' },
    { tab: 'ramos',         icono: '📚', texto: 'Ramos' },
    { tab: 'alumnos',       icono: '👥', texto: 'Alumnos' },
  ],
  teacher: [
    { tab: 'avisos',  icono: '📢', texto: 'Avisos' },
    { tab: 'horario', icono: '📅', texto: 'Mi Horario' },
    { tab: 'ramos',   icono: '📚', texto: 'Mis Ramos' },
    { tab: 'alumnos', icono: '👥', texto: 'Mis Alumnos' },
  ],
}

export default function Sidebar() {
  const { state, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const user = state.user
  const rol = user?.rol ?? 'paes'
  const esStaff = rol === 'teacher' || rol === 'admin'
  const base = esStaff ? '/dashboard/docente' : `/dashboard/${rol}`
  const tabActual = searchParams.get('tab') || 'inicio'

  const iniciales = user ? `${user.nombre[0]}${user.apellido[0]}`.toUpperCase() : '??'
  const tabs = TABS[rol] ?? []

  function salir() {
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
          <div className="sidebar-avatar" style={{ background: COLOR[rol] }}>
            {iniciales}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.nombre} {user?.apellido}</span>
            <span className="sidebar-plan-badge" style={{ background: COLOR[rol] }}>
              {ETIQUETA[rol]}
            </span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to={base}
          end
          className={tabActual === 'inicio' ? 'sidebar-link active' : 'sidebar-link'}
        >
          <span className="sidebar-icon">🏠</span> Inicio
        </NavLink>

        {tabs.map(t => (
          <NavLink
            key={t.tab}
            to={`${base}?tab=${t.tab}`}
            className={tabActual === t.tab ? 'sidebar-link active' : 'sidebar-link'}
          >
            <span className="sidebar-icon">{t.icono}</span> {t.texto}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button className="sidebar-logout" onClick={salir}>
          <span className="sidebar-icon">🚪</span> Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
