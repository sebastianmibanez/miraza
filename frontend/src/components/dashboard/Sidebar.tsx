import { useState } from 'react'
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { TEMAS } from './DashboardLayout'
import './Sidebar.css'

const ETIQUETA: Record<string, string> = {
  paes:       'Plan PAES',
  nem:        'Plan NEM',
  nivelacion: 'Plan Nivelación',
  especial:   'Plan Especial',
  teacher:    'Profesora',
  admin:      'Dirección',
}

/* Iconos de línea (trazo 1.7, estilo Feather) — sin dependencias. */
const svg = (d: React.ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
)

const ICONS: Record<string, JSX.Element> = {
  inicio: svg(<><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></>),
  aprobaciones: svg(<><path d="m9 11.5 2 2 4-4.5" /><rect x="3" y="4" width="18" height="16" rx="2" /></>),
  gestion: svg(<><path d="M4 8h10M18 8h2M4 16h2M10 16h10" /><circle cx="16" cy="8" r="2" /><circle cx="8" cy="16" r="2" /></>),
  material: svg(<><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="m10 9.5 5 2.5-5 2.5Z" /></>),
  perfil: svg(<><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" /></>),
  avisos: svg(<><path d="M18 8a6 6 0 0 0-12 0c0 7-2 8-2 8h16s-2-1-2-8" /><path d="M10.3 20a2 2 0 0 0 3.4 0" /></>),
  horario: svg(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>),
  ramos: svg(<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14Z" /><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" /></>),
  alumnos: svg(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><path d="M16 5a3.5 3.5 0 0 1 0 7M17.5 14.5c2.4.8 4 2.8 4 5.5" /></>),
  salir: svg(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></>),
  colapsar: svg(<><path d="m14 7-5 5 5 5" /></>),
  expandir: svg(<><path d="m10 7 5 5-5 5" /></>),
}

/** El sidebar es la única navegación del panel: lista TODAS las secciones
 *  de cada rol (antes el panel docente repetía esto en una fila de tabs). */
const TABS: Record<string, { tab: string; icono: string; texto: string }[]> = {
  admin: [
    { tab: 'aprobaciones',  icono: 'aprobaciones',  texto: 'Revisar material' },
    { tab: 'gestion',       icono: 'gestion',       texto: 'Gestión' },
    { tab: 'material',      icono: 'material',      texto: 'Mi Material' },
    { tab: 'perfil',        icono: 'perfil',        texto: 'Mi Perfil' },
    { tab: 'avisos',        icono: 'avisos',        texto: 'Avisos' },
    { tab: 'horario',       icono: 'horario',       texto: 'Horario' },
    { tab: 'ramos',         icono: 'ramos',         texto: 'Ramos' },
    { tab: 'alumnos',       icono: 'alumnos',       texto: 'Alumnos' },
  ],
  teacher: [
    { tab: 'material', icono: 'material', texto: 'Mi Material' },
    { tab: 'perfil',   icono: 'perfil',   texto: 'Mi Perfil' },
    { tab: 'avisos',   icono: 'avisos',   texto: 'Avisos' },
    { tab: 'horario',  icono: 'horario',  texto: 'Mi Horario' },
    { tab: 'ramos',    icono: 'ramos',    texto: 'Mis Ramos' },
    { tab: 'alumnos',  icono: 'alumnos',  texto: 'Mis Alumnos' },
  ],
}

interface Props {
  tema: string
  setTema: (t: string) => void
}

export default function Sidebar({ tema, setTema }: Props) {
  const { state, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [colapsado, setColapsado] = useState(() => localStorage.getItem('miraza_side') === '1')

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

  function toggle() {
    const v = !colapsado
    setColapsado(v)
    localStorage.setItem('miraza_side', v ? '1' : '0')
  }

  return (
    <aside className={colapsado ? 'sidebar colapsado' : 'sidebar'}>
      <div className="sidebar-top">
        <div className="sidebar-head">
          <a href="/" className="sidebar-brand">
            <span className="sidebar-brand-text">miraza</span>
            <span className="sidebar-brand-dot">.</span>
          </a>
          <button
            className="sidebar-toggle"
            onClick={toggle}
            title={colapsado ? 'Expandir menú' : 'Contraer menú'}
            aria-label={colapsado ? 'Expandir menú' : 'Contraer menú'}
          >
            {colapsado ? ICONS.expandir : ICONS.colapsar}
          </button>
        </div>

        <div className="sidebar-user" title={`${user?.nombre} ${user?.apellido} — ${ETIQUETA[rol]}`}>
          <div className="sidebar-avatar">{iniciales}</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.nombre} {user?.apellido}</span>
            <span className="sidebar-plan-badge">{ETIQUETA[rol]}</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {/* className como función: evita que NavLink agregue su clase "active"
            automática por pathname (todas las pestañas comparten la misma ruta). */}
        <NavLink
          to={base}
          end
          title="Inicio"
          className={() => tabActual === 'inicio' ? 'sidebar-link active' : 'sidebar-link'}
        >
          <span className="sidebar-icon">{ICONS.inicio}</span>
          <span className="sidebar-txt">Inicio</span>
        </NavLink>

        {tabs.map(t => (
          <NavLink
            key={t.tab}
            to={`${base}?tab=${t.tab}`}
            title={t.texto}
            className={() => tabActual === t.tab ? 'sidebar-link active' : 'sidebar-link'}
          >
            <span className="sidebar-icon">{ICONS[t.icono]}</span>
            <span className="sidebar-txt">{t.texto}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-temas" role="group" aria-label="Tema de color">
          {TEMAS.map(t => (
            <button
              key={t.id}
              className={tema === t.id ? 'tema-dot activo' : 'tema-dot'}
              style={{ background: t.bg, borderColor: t.accent }}
              onClick={() => setTema(t.id)}
              title={t.nombre}
              aria-label={`Tema ${t.nombre}`}
            >
              <span style={{ background: t.accent }} />
            </button>
          ))}
        </div>

        <button className="sidebar-logout" onClick={salir} title="Cerrar sesión">
          <span className="sidebar-icon">{ICONS.salir}</span>
          <span className="sidebar-txt">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
