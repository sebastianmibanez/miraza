import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  getDashboardSchedule,
  getTeacherRamos,
  getTeacherAlumnos,
  getDashboardAnnouncements,
  getInscripciones,
  type TeacherRamo,
  type TeacherAlumno,
  type Announcement,
  type ScheduleItem,
  type ResumenInscripciones,
} from '../../services/api'
import InscripcionesTab from './InscripcionesTab'
import GestionTab from './GestionTab'
import AvisosTab from './AvisosTab'
import MaterialTab from './MaterialTab'
import PerfilTab from './PerfilTab'
import './DashboardDocente.css'

const COLOR = '#b45309'

const TIPO_COLORS: Record<string, string> = {
  clase:   '#1B4DB8',
  ensayo:  '#9333ea',
  'tutoría': '#0e7490',
  apoyo:   '#16a34a',
}

const DIAS_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export default function DashboardDocente() {
  const { state } = useAuth()
  const user = state.user
  const esAdmin = user?.rol === 'admin'
  const esStaff = user?.rol === 'teacher' || esAdmin

  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'inicio'

  const [schedule, setSchedule]           = useState<ScheduleItem[]>([])
  const [ramos, setRamos]                 = useState<TeacherRamo[]>([])
  const [alumnos, setAlumnos]             = useState<TeacherAlumno[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [ramoFiltro, setRamoFiltro]       = useState('')
  const [pendientes, setPendientes]       = useState(0)
  const [cargando, setCargando]           = useState(true)

  // Las pestañas de gestión solo existen para dirección.
  const TABS = [
    { key: 'inicio',        label: '🏠 Inicio' },
    ...(esAdmin ? [{ key: 'inscripciones', label: '📥 Inscripciones' }] : []),
    ...(esAdmin ? [{ key: 'gestion',       label: '⚙️ Gestión' }] : []),
    { key: 'material',      label: '🎬 Mi Material' },
    { key: 'perfil',        label: '🪪 Mi Perfil' },
    { key: 'avisos',        label: '📢 Avisos' },
    { key: 'horario',       label: '📅 Mi Horario' },
    { key: 'ramos',         label: '📚 Mis Ramos' },
    { key: 'alumnos',       label: '👥 Mis Alumnos' },
  ]

  const cargar = useCallback(() => {
    setCargando(true)
    Promise.all([
      getDashboardSchedule().then(r => setSchedule(r.data.schedule || [])).catch(() => {}),
      getTeacherRamos().then(r => setRamos(r.data.ramos || [])).catch(() => {}),
      getDashboardAnnouncements().then(r => setAnnouncements(r.data.announcements || [])).catch(() => {}),
      getTeacherAlumnos().then(r => setAlumnos(r.data.alumnos || [])).catch(() => {}),
      esAdmin
        ? getInscripciones().then(r => setPendientes(r.data.resumen?.pendiente ?? 0)).catch(() => {})
        : Promise.resolve(),
    ]).finally(() => setCargando(false))
  }, [esAdmin])

  // Recargar al montar y cada vez que se vuelve a una pestaña de lectura. Sin
  // esto, tras crear ramos/alumnos en Gestión, el Inicio seguía mostrando los
  // datos viejos (contadores en cero) hasta recargar la página entera.
  useEffect(() => { cargar() }, [cargar, tab])

  const onResumen = useCallback((r: ResumenInscripciones) => setPendientes(r.pendiente), [])

  function setTab(key: string) {
    setSearchParams({ tab: key }, { replace: true })
  }

  const sortedSchedule = [...schedule].sort((a, b) =>
    DIAS_ORDER.indexOf(a.dia) - DIAS_ORDER.indexOf(b.dia) || a.hora.localeCompare(b.hora)
  )

  const alumnosFiltrados = ramoFiltro
    ? alumnos.filter(a => a.ramo === ramoFiltro)
    : alumnos

  // Un alumno puede estar en varios ramos: se cuenta una sola vez.
  const alumnosUnicos = new Set(alumnos.filter(a => a.estado === 'activo').map(a => a.id)).size

  const hoy = DIAS_ORDER[(new Date().getDay() + 6) % 7]
  const clasesHoy = schedule.filter(s => s.dia === hoy).length

  const sinNada = !cargando && ramos.length === 0

  // El backend igual rechaza a un alumno que llame a estos endpoints, pero sin
  // esto podría escribir /dashboard/docente a mano y ver la cáscara del panel.
  if (user && !esStaff) {
    return <Navigate to={`/dashboard/${user.rol}`} replace />
  }

  return (
    <div className="docente-page">
      <div className="docente-header">
        <div>
          <h1 className="docente-title">Hola, {user?.nombre}</h1>
          <p className="docente-subtitle">
            {esAdmin ? 'Dirección' : 'Panel Docente'} · Miraza Preuniversitario
          </p>
        </div>
        <div className="docente-stats-row">
          <div className="docente-stat-pill">
            <span className="docente-stat-num">{ramos.length}</span>
            <span className="docente-stat-label">Ramos</span>
          </div>
          <div className="docente-stat-pill">
            <span className="docente-stat-num">{alumnosUnicos}</span>
            <span className="docente-stat-label">Alumnos</span>
          </div>
          <div className="docente-stat-pill">
            <span className="docente-stat-num">{clasesHoy}</span>
            <span className="docente-stat-label">Clases hoy</span>
          </div>
          {esAdmin && (
            <div className={`docente-stat-pill${pendientes > 0 ? ' destacada' : ''}`}>
              <span className="docente-stat-num">{pendientes}</span>
              <span className="docente-stat-label">Inscripciones nuevas</span>
            </div>
          )}
        </div>
      </div>

      <div className="docente-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`docente-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.key === 'inscripciones' && pendientes > 0 && (
              <span className="docente-tab-badge">{pendientes}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── INICIO ── */}
      {tab === 'inicio' && (
        <div className="docente-tab-content">
          {cargando ? (
            <div className="docente-card"><div className="docente-loading">Cargando…</div></div>
          ) : sinNada ? (
            <div className="docente-card docente-arranque">
              <h2 className="docente-card-title">
                {esAdmin ? 'Miraza está vacío. Empecemos.' : 'Todavía no tienes ramos asignados'}
              </h2>
              {esAdmin ? (
                <>
                  <p className="insc-subtitle">
                    Nada de lo que ves acá es de mentira: los números están en cero porque
                    todavía no hay nada cargado. Estos son los pasos:
                  </p>
                  <ol className="docente-pasos">
                    <li>
                      <strong>Crea tus ramos</strong> en <em>Gestión</em>, y asígnale a cada uno
                      su profesora y su horario.
                    </li>
                    <li>
                      <strong>Aprueba inscripciones</strong> para dar de alta a los alumnos.
                    </li>
                    <li>
                      <strong>Matricula a cada alumno</strong> en sus ramos. Recién ahí verá su
                      horario al entrar.
                    </li>
                  </ol>
                  <button className="insc-btn-crear" onClick={() => setTab('gestion')}>
                    Crear el primer ramo →
                  </button>
                </>
              ) : (
                <p className="insc-subtitle">
                  Cuando dirección te asigne un ramo, acá vas a ver tu horario, tus alumnos y
                  vas a poder publicarles avisos.
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="docente-grid-2">
                <div className="docente-card">
                  <h2 className="docente-card-title">Próximas clases</h2>
                  {sortedSchedule.length === 0 ? (
                    <p className="docente-empty">
                      Tus ramos no tienen horario cargado.
                      {esAdmin && ' Agrégalo desde Gestión.'}
                    </p>
                  ) : (
                    <div className="docente-schedule-list">
                      {sortedSchedule.slice(0, 5).map((item, i) => (
                        <div key={i} className="docente-schedule-row">
                          <div
                            className="docente-tipo-dot"
                            style={{ background: TIPO_COLORS[item.tipo] ?? COLOR }}
                          />
                          <div className="docente-schedule-info">
                            <span className="docente-schedule-materia">{item.materia}</span>
                            <span className="docente-schedule-meta">
                              {item.dia} {item.hora}
                              {item.plan && ` · ${item.plan}`}
                              {typeof item.alumnos === 'number' && ` · ${item.alumnos} alumnos`}
                            </span>
                          </div>
                          <span
                            className="docente-tipo-badge"
                            style={{ background: TIPO_COLORS[item.tipo] ?? COLOR }}
                          >
                            {item.tipo}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="docente-card">
                  <h2 className="docente-card-title">Avisos</h2>
                  {announcements.length === 0 ? (
                    <p className="docente-empty">
                      Sin avisos. Publica el primero desde la pestaña <em>Avisos</em>.
                    </p>
                  ) : (
                    <div className="docente-announce-list">
                      {announcements.slice(0, 4).map(a => (
                        <div key={a.id} className={`docente-announce-item tipo-${a.tipo}`}>
                          <div className="aviso-head">
                            <span className="docente-announce-title">{a.titulo}</span>
                            <span className={`aviso-destino${a.ramo ? '' : ' general'}`}>
                              {a.ramo ?? '📣 General'}
                            </span>
                          </div>
                          <span className="docente-announce-text">{a.texto}</span>
                          <span className="docente-announce-date">{a.fecha}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="docente-card">
                <h2 className="docente-card-title">Mis ramos</h2>
                <div className="docente-ramos-grid">
                  {ramos.map(r => (
                    <div key={r.id} className="docente-ramo-card" style={{ borderColor: r.color }}>
                      <div className="docente-ramo-color" style={{ background: r.color }} />
                      <div className="docente-ramo-info">
                        <span className="docente-ramo-nombre">{r.nombre}</span>
                        <span className="docente-ramo-plan">{r.plan}</span>
                      </div>
                      <div className="docente-ramo-meta">
                        <span>{r.alumnos} alumno{r.alumnos !== 1 && 's'}</span>
                        <span>
                          {r.clases_semana > 0 ? `${r.clases_semana}×/sem` : 'sin horario'}
                        </span>
                        <span className="docente-ramo-proxima">
                          {r.proxima ? `Próx: ${r.proxima}` : '—'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'inscripciones' && esAdmin && <InscripcionesTab onResumen={onResumen} />}
      {tab === 'gestion' && esAdmin && <GestionTab />}
      {tab === 'material' && <MaterialTab />}
      {tab === 'perfil' && <PerfilTab />}
      {tab === 'avisos' && <AvisosTab esAdmin={!!esAdmin} />}

      {/* ── HORARIO ── */}
      {tab === 'horario' && (
        <div className="docente-tab-content">
          <div className="docente-card">
            <h2 className="docente-card-title">Horario semanal</h2>
            {sortedSchedule.length === 0 ? (
              <p className="docente-empty">
                No hay clases cargadas.
                {esAdmin
                  ? ' Crea un ramo en Gestión y agrégale su horario.'
                  : ' Dirección todavía no ha cargado el horario de tus ramos.'}
              </p>
            ) : (
              <div className="docente-schedule-full">
                {DIAS_ORDER.map(dia => {
                  const clases = sortedSchedule.filter(s => s.dia === dia)
                  if (clases.length === 0) return null
                  return (
                    <div key={dia} className="docente-dia-block">
                      <div className="docente-dia-label">{dia}</div>
                      <div className="docente-dia-clases">
                        {clases.map((c, i) => (
                          <div
                            key={i}
                            className="docente-clase-card"
                            style={{ borderLeftColor: TIPO_COLORS[c.tipo] ?? COLOR }}
                          >
                            <div className="docente-clase-hora">{c.hora}</div>
                            <div className="docente-clase-body">
                              <span className="docente-clase-materia">{c.materia}</span>
                              <div className="docente-clase-tags">
                                {c.plan && <span className="docente-tag plan-tag">{c.plan}</span>}
                                {typeof c.alumnos === 'number' && (
                                  <span className="docente-tag alumnos-tag">👥 {c.alumnos}</span>
                                )}
                                <span
                                  className="docente-tag tipo-tag"
                                  style={{ background: TIPO_COLORS[c.tipo] ?? COLOR }}
                                >
                                  {c.tipo}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── RAMOS ── */}
      {tab === 'ramos' && (
        <div className="docente-tab-content">
          {ramos.length === 0 ? (
            <div className="docente-card">
              <p className="docente-empty">
                {esAdmin
                  ? 'No hay ramos. Crea el primero desde Gestión.'
                  : 'Dirección todavía no te ha asignado ningún ramo.'}
              </p>
            </div>
          ) : (
            <div className="docente-ramos-full">
              {ramos.map(r => (
                <div key={r.id} className="docente-ramo-detail-card">
                  <div className="docente-ramo-detail-header" style={{ background: r.color }}>
                    <h3>{r.nombre}</h3>
                    <span className="docente-ramo-detail-plan">{r.plan}</span>
                  </div>
                  <div className="docente-ramo-detail-body">
                    <div className="docente-ramo-detail-stat">
                      <span className="num">{r.alumnos}</span>
                      <span className="lbl">Alumnos</span>
                    </div>
                    <div className="docente-ramo-detail-stat">
                      <span className="num">{r.clases_semana}</span>
                      <span className="lbl">Clases/sem</span>
                    </div>
                    <div className="docente-ramo-detail-stat proxima">
                      <span className="num-sm">{r.proxima ?? 'Sin horario'}</span>
                      <span className="lbl">Próxima clase</span>
                    </div>
                  </div>
                  <button
                    className="docente-ramo-ver-alumnos"
                    style={{ borderColor: r.color, color: r.color }}
                    onClick={() => { setRamoFiltro(r.nombre); setTab('alumnos') }}
                  >
                    Ver alumnos →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ALUMNOS ── */}
      {tab === 'alumnos' && (
        <div className="docente-tab-content">
          <div className="docente-card">
            <div className="docente-alumnos-toolbar">
              <h2 className="docente-card-title" style={{ margin: 0 }}>Mis alumnos</h2>
              <select
                className="docente-select"
                value={ramoFiltro}
                onChange={e => setRamoFiltro(e.target.value)}
              >
                <option value="">Todos los ramos</option>
                {ramos.map(r => (
                  <option key={r.id} value={r.nombre}>{r.nombre} ({r.plan})</option>
                ))}
              </select>
            </div>

            {alumnosFiltrados.length === 0 ? (
              <p className="docente-empty">
                {alumnos.length === 0
                  ? (esAdmin
                      ? 'Todavía no hay alumnos matriculados. Aprueba inscripciones y matricúlalos en un ramo desde Gestión.'
                      : 'Tus ramos todavía no tienen alumnos matriculados.')
                  : 'Ningún alumno en ese ramo.'}
              </p>
            ) : (
              <div className="docente-alumnos-table-wrap">
                <table className="docente-alumnos-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Correo</th>
                      <th>Ramo</th>
                      <th>Plan</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alumnosFiltrados.map(a => (
                      <tr key={`${a.ramo_id}-${a.id}`}>
                        <td className="docente-alumno-nombre">{a.nombre} {a.apellido}</td>
                        <td className="insc-tel">{a.email}</td>
                        <td>{a.ramo}</td>
                        <td><span className="docente-plan-chip">{a.plan}</span></td>
                        <td>
                          <span className={`docente-estado-chip ${a.estado}`}>{a.estado}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="docente-alumnos-count">
              {alumnosFiltrados.length} matrícula{alumnosFiltrados.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
