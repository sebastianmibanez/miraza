import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
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
import './DashboardDocente.css'

const COLOR = '#b45309'

const TABS = [
  { key: 'inicio',        label: '🏠 Inicio' },
  { key: 'inscripciones', label: '📥 Inscripciones' },
  { key: 'horario',       label: '📅 Mi Horario' },
  { key: 'ramos',         label: '📚 Mis Ramos' },
  { key: 'alumnos',       label: '👥 Mis Alumnos' },
]

const TIPO_COLORS: Record<string, string> = {
  clase:   '#1B4DB8',
  ensayo:  '#9333ea',
  tutoría: '#0e7490',
  apoyo:   '#16a34a',
}

const DIAS_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export default function DashboardDocente() {
  const { state } = useAuth()
  const user = state.user
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'inicio'

  const [schedule, setSchedule]         = useState<ScheduleItem[]>([])
  const [ramos, setRamos]               = useState<TeacherRamo[]>([])
  const [alumnos, setAlumnos]           = useState<TeacherAlumno[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [ramoFiltro, setRamoFiltro]     = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState<'todos' | 'activo' | 'inactivo'>('todos')
  const [loadingAlumnos, setLoadingAlumnos] = useState(false)
  const [pendientes, setPendientes]     = useState(0)

  useEffect(() => {
    getDashboardSchedule().then(r => setSchedule(r.data.schedule || []))
    getTeacherRamos().then(r => setRamos(r.data.ramos || []))
    getDashboardAnnouncements().then(r => setAnnouncements(r.data.announcements || []))
    getInscripciones().then(r => setPendientes(r.data.resumen?.pendiente ?? 0)).catch(() => {})
  }, [])

  const onResumen = useCallback(
    (r: ResumenInscripciones) => setPendientes(r.pendiente),
    []
  )

  useEffect(() => {
    setLoadingAlumnos(true)
    getTeacherAlumnos(ramoFiltro || undefined)
      .then(r => setAlumnos(r.data.alumnos || []))
      .finally(() => setLoadingAlumnos(false))
  }, [ramoFiltro])

  function setTab(key: string) {
    setSearchParams({ tab: key }, { replace: true })
  }

  const sortedSchedule = [...schedule].sort((a, b) =>
    DIAS_ORDER.indexOf(a.dia) - DIAS_ORDER.indexOf(b.dia) ||
    a.hora.localeCompare(b.hora)
  )

  const filteredAlumnos = alumnos.filter(a =>
    estadoFiltro === 'todos' || a.estado === estadoFiltro
  )

  const totalAlumnos  = alumnos.filter(a => a.estado === 'activo').length
  const clasesHoy     = schedule.filter(s => {
    const today = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][new Date().getDay()]
    return s.dia === today
  }).length

  return (
    <div className="docente-page">
      {/* Header */}
      <div className="docente-header">
        <div>
          <h1 className="docente-title">
            Buenos días, {user?.nombre} 👋
          </h1>
          <p className="docente-subtitle">Panel Docente · Miraza Preuniversitario</p>
        </div>
        <div className="docente-stats-row">
          <div className="docente-stat-pill">
            <span className="docente-stat-num">{ramos.length}</span>
            <span className="docente-stat-label">Ramos</span>
          </div>
          <div className="docente-stat-pill">
            <span className="docente-stat-num">{totalAlumnos}</span>
            <span className="docente-stat-label">Alumnos activos</span>
          </div>
          <div className="docente-stat-pill">
            <span className="docente-stat-num">{clasesHoy}</span>
            <span className="docente-stat-label">Clases hoy</span>
          </div>
          <div className={`docente-stat-pill${pendientes > 0 ? ' destacada' : ''}`}>
            <span className="docente-stat-num">{pendientes}</span>
            <span className="docente-stat-label">Inscripciones nuevas</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
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

      {/* ── INSCRIPCIONES ── */}
      {tab === 'inscripciones' && <InscripcionesTab onResumen={onResumen} />}

      {/* ── INICIO ── */}
      {tab === 'inicio' && (
        <div className="docente-tab-content">
          <div className="docente-grid-2">
            {/* Próximas clases */}
            <div className="docente-card">
              <h2 className="docente-card-title">Próximas clases</h2>
              {sortedSchedule.length === 0 ? (
                <p className="docente-empty">No hay clases cargadas.</p>
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
                          {item.alumnos && ` · ${item.alumnos} alumnos`}
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

            {/* Avisos */}
            <div className="docente-card">
              <h2 className="docente-card-title">Avisos</h2>
              {announcements.length === 0 ? (
                <p className="docente-empty">Sin avisos recientes.</p>
              ) : (
                <div className="docente-announce-list">
                  {announcements.map(a => (
                    <div key={a.id} className={`docente-announce-item tipo-${a.tipo}`}>
                      <span className="docente-announce-title">{a.titulo}</span>
                      <span className="docente-announce-text">{a.texto}</span>
                      <span className="docente-announce-date">{a.fecha}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ramos resumen */}
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
                    <span>{r.alumnos} alumnos</span>
                    <span>{r.clases_semana}×/sem</span>
                    <span className="docente-ramo-proxima">Próx: {r.proxima}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── HORARIO ── */}
      {tab === 'horario' && (
        <div className="docente-tab-content">
          <div className="docente-card">
            <h2 className="docente-card-title">Horario semanal</h2>
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
                              {c.plan && (
                                <span className="docente-tag plan-tag">{c.plan}</span>
                              )}
                              {c.alumnos && (
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
          </div>
        </div>
      )}

      {/* ── RAMOS ── */}
      {tab === 'ramos' && (
        <div className="docente-tab-content">
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
                    <span className="num-sm">{r.proxima}</span>
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
        </div>
      )}

      {/* ── ALUMNOS ── */}
      {tab === 'alumnos' && (
        <div className="docente-tab-content">
          <div className="docente-card">
            <div className="docente-alumnos-toolbar">
              <h2 className="docente-card-title" style={{ margin: 0 }}>Mis alumnos</h2>
              <div className="docente-alumnos-filters">
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
                <div className="docente-estado-btns">
                  {(['todos', 'activo', 'inactivo'] as const).map(e => (
                    <button
                      key={e}
                      className={`docente-estado-btn${estadoFiltro === e ? ' active' : ''}`}
                      onClick={() => setEstadoFiltro(e)}
                    >
                      {e.charAt(0).toUpperCase() + e.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loadingAlumnos ? (
              <div className="docente-loading">Cargando...</div>
            ) : filteredAlumnos.length === 0 ? (
              <p className="docente-empty">No hay alumnos con ese filtro.</p>
            ) : (
              <div className="docente-alumnos-table-wrap">
                <table className="docente-alumnos-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Ramo</th>
                      <th>Plan</th>
                      <th>Nivel</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlumnos.map(a => (
                      <tr key={a.id}>
                        <td className="docente-alumno-nombre">{a.nombre} {a.apellido}</td>
                        <td>{a.ramo}</td>
                        <td><span className="docente-plan-chip">{a.plan}</span></td>
                        <td>{a.nivel}</td>
                        <td>
                          <span className={`docente-estado-chip ${a.estado}`}>
                            {a.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="docente-alumnos-count">
              {filteredAlumnos.length} alumno{filteredAlumnos.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
