import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  getDashboardSchedule,
  getTeacherRamos,
  getTeacherAlumnos,
  getDashboardAnnouncements,
  getInscripciones,
  getMaterialesPendientes,
  getMiPerfil,
  getHorarioPersonal,
  type TeacherRamo,
  type TeacherAlumno,
  type Announcement,
  type ScheduleItem,
  type ResumenInscripciones,
  type MiPerfil,
  type HorarioPersonalItem,
} from '../../services/api'
import Avatar from '../../components/Avatar'
import InscripcionesTab from './InscripcionesTab'
import GestionTab from './GestionTab'
import AvisosTab from './AvisosTab'
import MaterialTab from './MaterialTab'
import PerfilTab from './PerfilTab'
import AprobacionesTab from './AprobacionesTab'
import HorarioPersonalTab from './HorarioPersonalTab'
import AlumnosRegistroTab from './AlumnosRegistroTab'
import './DashboardDocente.css'

/* Los colores reales viven en el tema activo (DashboardLayout.css). */
const COLOR = 'var(--d-muted)'

const TIPO_COLORS: Record<string, string> = {
  clase:   'var(--d-tipo-clase)',
  ensayo:  'var(--d-tipo-ensayo)',
  'tutoría': 'var(--d-tipo-tutoria)',
  apoyo:   'var(--d-tipo-apoyo)',
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
  const [vistaHorario, setVistaHorario]   = useState<'dia' | 'alumno'>('dia')
  const [pendientes, setPendientes]       = useState(0)
  const [matPendientes, setMatPendientes] = useState(0)
  const [perfil, setPerfil]               = useState<MiPerfil | null>(null)
  const [horarioPersonal, setHorarioPersonal] = useState<HorarioPersonalItem[]>([])
  const [copiado, setCopiado]             = useState(false)
  const [cargando, setCargando]           = useState(true)

  const cargar = useCallback(() => {
    setCargando(true)
    Promise.all([
      getDashboardSchedule().then(r => setSchedule(r.data.schedule || [])).catch(() => {}),
      getTeacherRamos().then(r => setRamos(r.data.ramos || [])).catch(() => {}),
      getDashboardAnnouncements().then(r => setAnnouncements(r.data.announcements || [])).catch(() => {}),
      getTeacherAlumnos().then(r => setAlumnos(r.data.alumnos || [])).catch(() => {}),
      getMiPerfil().then(r => setPerfil(r.data.perfil)).catch(() => {}),
      getHorarioPersonal().then(r => setHorarioPersonal(r.data.horario || [])).catch(() => {}),
      esAdmin
        ? getInscripciones().then(r => setPendientes(r.data.resumen?.pendiente ?? 0)).catch(() => {})
        : Promise.resolve(),
      esAdmin
        ? getMaterialesPendientes().then(r => setMatPendientes(r.data.materiales?.length ?? 0)).catch(() => {})
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

  // ── "Tu página": completitud del perfil público ──
  const perfilCampos = [
    { ok: !!perfil?.foto_url,           falta: 'tu foto' },
    { ok: !!perfil?.bio?.trim(),        falta: 'una bio corta' },
    { ok: !!perfil?.especialidades?.trim(), falta: 'tus especialidades' },
    { ok: !!perfil?.estudios?.trim(),   falta: 'tu formación' },
  ]
  const perfilPct = Math.round(perfilCampos.filter(c => c.ok).length / perfilCampos.length * 100)
  const perfilFalta = perfilCampos.find(c => !c.ok)?.falta
  const miPaginaUrl = user ? `${window.location.origin}/profes/${user.id}` : ''

  function compartirPagina() {
    if (!miPaginaUrl) return
    const copia = navigator.clipboard?.writeText(miPaginaUrl)
    if (!copia) return
    copia.then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2000) }).catch(() => {})
  }

  // Próximas clases reales = horario personal ordenado desde HOY; si no hay, cae al de ramos.
  const hoyIdx = (new Date().getDay() + 6) % 7
  const proximas = [...horarioPersonal].sort((a, b) => {
    const da = (DIAS_ORDER.indexOf(a.dia) - hoyIdx + 7) % 7
    const db = (DIAS_ORDER.indexOf(b.dia) - hoyIdx + 7) % 7
    return da - db || a.hora_inicio.localeCompare(b.hora_inicio)
  })

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
      </div>

      {/* Solo aparece cuando de verdad hay algo que hacer — el resto del tiempo
          no ocupa espacio (clave en móvil). Cada aviso salta a su pestaña. */}
      {esAdmin && (pendientes > 0 || matPendientes > 0) && (
        <div className="docente-avisos-accion">
          {pendientes > 0 && (
            <button className="docente-aviso-accion" onClick={() => setTab('alumnos')}>
              <span className="docente-aviso-num">{pendientes}</span>
              inscripci{pendientes === 1 ? 'ón nueva' : 'ones nuevas'}
            </button>
          )}
          {matPendientes > 0 && (
            <button className="docente-aviso-accion" onClick={() => setTab('aprobaciones')}>
              <span className="docente-aviso-num">{matPendientes}</span>
              material por revisar
            </button>
          )}
        </div>
      )}

      {/* ── INICIO ── */}
      {tab === 'inicio' && (
        <div className="docente-tab-content">
          {cargando ? (
            <div className="docente-card"><div className="docente-loading">Cargando…</div></div>
          ) : (
            <>
              {/* ── Tu página pública ── */}
              <section className="tp-card">
                <div className="tp-top">
                  <span className="tp-eyebrow">Tu página pública</span>
                  <span className="tp-live"><i aria-hidden="true"></i> En línea</span>
                </div>

                <div className="tp-mini">
                  <Avatar nombre={user?.nombre ?? ''} apellido={user?.apellido ?? ''} foto={perfil?.foto_url ?? ''} size={48} />
                  <div className="tp-mini-info">
                    <span className="tp-mini-name">{user?.nombre} {user?.apellido}</span>
                    <span className="tp-mini-role">{perfil?.especialidades?.trim() || 'Completa tu perfil para que se vea acá'}</span>
                  </div>
                </div>

                {perfilPct < 100 ? (
                  <>
                    <div className="tp-meter-row">
                      <b>Tu página está casi lista</b><span>{perfilPct}%</span>
                    </div>
                    <div className="tp-meter" role="img" aria-label={`${perfilPct} por ciento completa`}>
                      <i style={{ width: `${perfilPct}%` }}></i>
                    </div>
                    <p className="tp-nudge">
                      Falta {perfilFalta}. <button className="tp-nudge-link" onClick={() => setTab('perfil')}>Complétala →</button>
                    </p>
                  </>
                ) : (
                  <p className="tp-nudge tp-nudge-ok">Tu página está completa. Compártela y empieza a recibir alumnos.</p>
                )}

                <div className="tp-actions">
                  <button className="tp-btn tp-btn-ghost" onClick={() => window.open(miPaginaUrl, '_blank', 'noopener')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
                    Ver mi página
                  </button>
                  <button className="tp-btn tp-btn-gold" onClick={compartirPagina}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M12 3v13"/><path d="M8 7l4-4 4 4"/></svg>
                    {copiado ? '¡Link copiado!' : 'Compartir'}
                  </button>
                </div>
              </section>

              {/* ── Próximas clases ── */}
              <section className="docente-card">
                <div className="inicio-card-head">
                  <h2 className="docente-card-title" style={{ margin: 0 }}>Tus próximas clases</h2>
                  <button className="inicio-card-link" onClick={() => setTab('horario')}>Ver horario</button>
                </div>

                {proximas.length > 0 ? (
                  <div className="inicio-clases">
                    {proximas.slice(0, 4).map(c => (
                      <div key={c.id} className="inicio-clase">
                        <span className="inicio-clase-time">{c.dia.slice(0, 3)}<br />{c.hora_inicio}</span>
                        <div className="inicio-clase-body">
                          <span className="inicio-clase-name">{c.alumno_nombre} {c.alumno_apellido}</span>
                          {(c.alumno_plan || c.nota) && (
                            <span className="inicio-clase-meta">{[c.alumno_plan, c.nota].filter(Boolean).join(' · ')}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : sortedSchedule.length > 0 ? (
                  <div className="inicio-clases">
                    {sortedSchedule.slice(0, 4).map((item, i) => (
                      <div key={i} className="inicio-clase">
                        <span className="inicio-clase-time">{item.dia.slice(0, 3)}<br />{item.hora}</span>
                        <div className="inicio-clase-body">
                          <span className="inicio-clase-name">{item.materia}</span>
                          <span className="inicio-clase-meta">
                            {[item.plan, typeof item.alumnos === 'number' ? `${item.alumnos} alumnos` : ''].filter(Boolean).join(' · ')}
                          </span>
                        </div>
                        <span className="inicio-clase-chip" style={{ background: TIPO_COLORS[item.tipo] ?? COLOR }}>{item.tipo}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="docente-empty">
                    Todavía no tienes clases agendadas. <button className="inicio-card-link" onClick={() => setTab('horario')}>Arma tu horario →</button>
                  </p>
                )}
              </section>

              {/* ── Avisos (solo si hay) ── */}
              {announcements.length > 0 && (
                <section className="docente-card">
                  <div className="inicio-card-head">
                    <h2 className="docente-card-title" style={{ margin: 0 }}>Avisos</h2>
                    <button className="inicio-card-link" onClick={() => setTab('avisos')}>Ver todos</button>
                  </div>
                  <div className="docente-announce-list">
                    {announcements.slice(0, 3).map(a => (
                      <div key={a.id} className={`docente-announce-item tipo-${a.tipo}`}>
                        <div className="aviso-head">
                          <span className="docente-announce-title">{a.titulo}</span>
                          <span className={`aviso-destino${a.ramo ? '' : ' general'}`}>{a.ramo ?? 'General'}</span>
                        </div>
                        <span className="docente-announce-text">{a.texto}</span>
                        <span className="docente-announce-date">{a.fecha}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ── Accesos rápidos ── */}
              <section>
                <p className="inicio-label">Administrar</p>
                <div className="inicio-quick">
                  <button className="inicio-qtile" onClick={() => setTab('perfil')}>
                    <span className="inicio-qtile-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/></svg></span>
                    Editar mi página
                  </button>
                  <button className="inicio-qtile" onClick={() => setTab('horario')}>
                    <span className="inicio-qtile-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg></span>
                    Mi horario
                  </button>
                  <button className="inicio-qtile" onClick={() => setTab('alumnos')}>
                    <span className="inicio-qtile-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c0-3.4 2.9-5.6 6.5-5.6s6.5 2.2 6.5 5.6"/><path d="M17 5.2a3.2 3.2 0 0 1 0 6.3"/></svg></span>
                    Mis alumnos
                  </button>
                  <button className="inicio-qtile" onClick={() => setTab('material')}>
                    <span className="inicio-qtile-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="m10 9.5 5 2.5-5 2.5z"/></svg></span>
                    Mi material
                  </button>
                </div>
              </section>

              {/* ── Mis ramos (solo si dirección los creó) ── */}
              {ramos.length > 0 && (
                <section className="docente-card">
                  <h2 className="docente-card-title">Mis ramos</h2>
                  <div className="docente-ramos-grid">
                    {ramos.map(r => (
                      <div key={r.id} className="docente-ramo-card">
                        <div className="docente-ramo-color" style={{ background: r.color }} />
                        <div className="docente-ramo-info">
                          <span className="docente-ramo-nombre">{r.nombre}</span>
                          <span className="docente-ramo-plan">{r.plan}</span>
                        </div>
                        <div className="docente-ramo-meta">
                          <span>{r.alumnos} alumno{r.alumnos !== 1 && 's'}</span>
                          <span>{r.clases_semana > 0 ? `${r.clases_semana}×/sem` : 'sin horario'}</span>
                          <span className="docente-ramo-proxima">{r.proxima ? `Próx: ${r.proxima}` : '—'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'aprobaciones' && esAdmin && <AprobacionesTab onCount={setMatPendientes} />}
      {tab === 'gestion' && esAdmin && <GestionTab />}
      {tab === 'material' && <MaterialTab />}
      {tab === 'perfil' && <PerfilTab />}
      {tab === 'avisos' && <AvisosTab esAdmin={!!esAdmin} />}

      {/* ── HORARIO ── */}
      {tab === 'horario' && (
        <div className="docente-tab-content">
          {ramos.length > 0 && (
            <div className="docente-card">
              <h2 className="docente-card-title">Horario semanal (ramos)</h2>
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
                                    <span className="docente-tag alumnos-tag">{c.alumnos} alumnos</span>
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
          )}

          <div className="docente-estado-btns">
            <button
              className={`docente-estado-btn${vistaHorario === 'dia' ? ' active' : ''}`}
              onClick={() => setVistaHorario('dia')}
            >
              Por día
            </button>
            <button
              className={`docente-estado-btn${vistaHorario === 'alumno' ? ' active' : ''}`}
              onClick={() => setVistaHorario('alumno')}
            >
              Por alumno
            </button>
          </div>

          {vistaHorario === 'dia' ? <HorarioPersonalTab /> : <AlumnosRegistroTab />}
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
          {esAdmin && <InscripcionesTab onResumen={onResumen} />}

          {ramos.length > 0 && (
            <div className="docente-card">
              <div className="docente-alumnos-toolbar">
                <h2 className="docente-card-title" style={{ margin: 0 }}>Alumnos matriculados en ramos</h2>
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
          )}
        </div>
      )}
    </div>
  )
}
