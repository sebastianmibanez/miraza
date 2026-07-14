import { useState, useEffect, useCallback } from 'react'
import {
  getTeacherRamos, getProfesores, getAlumnosGestion, getClases,
  crearRamo, editarRamo, borrarRamo,
  crearClase, borrarClase, matricular, desmatricular,
  DIAS, TIPOS_CLASE,
  type TeacherRamo, type Profesor, type AlumnoGestion, type Clase,
} from '../../services/api'

const PLANES = ['PAES', 'NEM', 'Nivelación', 'Especializada']

const COLORES = [
  '#1B4DB8', '#16a34a', '#9333ea', '#0e7490',
  '#b45309', '#be123c', '#4338ca', '#0f766e',
]

export default function GestionTab() {
  const [ramos, setRamos]         = useState<TeacherRamo[]>([])
  const [profesores, setProfes]   = useState<Profesor[]>([])
  const [alumnos, setAlumnos]     = useState<AlumnoGestion[]>([])
  const [cargando, setCargando]   = useState(true)
  const [error, setError]         = useState('')

  // Ramo abierto en el panel de detalle (horario + alumnos).
  const [abierto, setAbierto]     = useState<TeacherRamo | null>(null)
  const [clases, setClases]       = useState<Clase[]>([])

  const [nuevoRamo, setNuevoRamo] = useState({ nombre: '', plan: 'PAES', color: COLORES[0], profesor_id: '' })
  const [creando, setCreando]     = useState(false)

  const [nuevaClase, setNuevaClase] = useState({ dia: 'Lunes', hora: '18:00', tipo: 'clase' })
  const [nuevoAlumno, setNuevoAlumno] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const [r, p, a] = await Promise.all([getTeacherRamos(), getProfesores(), getAlumnosGestion()])
      setRamos(r.data.ramos || [])
      setProfes(p.data.profesores || [])
      setAlumnos(a.data.alumnos || [])
    } catch {
      setError('No pudimos cargar la información.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // Al abrir un ramo, traer su horario.
  useEffect(() => {
    if (!abierto) { setClases([]); return }
    getClases(abierto.id).then(r => setClases(r.data.clases || [])).catch(() => setClases([]))
  }, [abierto])

  async function accion(fn: () => Promise<unknown>) {
    setError('')
    try {
      await fn()
      await cargar()
      // refrescar el horario del ramo abierto
      if (abierto) {
        const r = await getClases(abierto.id)
        setClases(r.data.clases || [])
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      setError(err.response?.data?.error || 'No se pudo completar la acción.')
    }
  }

  async function onCrearRamo(e: React.FormEvent) {
    e.preventDefault()
    if (!nuevoRamo.nombre.trim()) { setError('Ponle un nombre al ramo.'); return }
    setCreando(true)
    await accion(() => crearRamo({
      nombre: nuevoRamo.nombre.trim(),
      plan: nuevoRamo.plan,
      color: nuevoRamo.color,
      profesor_id: nuevoRamo.profesor_id ? Number(nuevoRamo.profesor_id) : null,
    }))
    setNuevoRamo({ nombre: '', plan: 'PAES', color: COLORES[0], profesor_id: '' })
    setCreando(false)
  }

  // El ramo abierto, releído de la lista fresca.
  const detalle = abierto ? ramos.find(r => r.id === abierto.id) ?? null : null
  const enElRamo = detalle ? alumnos.filter(a => a.ramos.some(r => r.id === detalle.id)) : []
  const fueraDelRamo = detalle ? alumnos.filter(a => !a.ramos.some(r => r.id === detalle.id)) : []

  if (cargando) return <div className="docente-tab-content"><div className="docente-loading">Cargando…</div></div>

  return (
    <div className="docente-tab-content">
      {error && <p className="insc-error">{error}</p>}

      {/* ── Crear ramo ── */}
      <div className="docente-card">
        <h2 className="docente-card-title">Crear un ramo</h2>
        <p className="insc-subtitle">
          Un ramo es una clase con su profesora, su horario y sus alumnos. El horario que
          cargues acá es el que determina las horas de la profesora.
        </p>

        <form className="gestion-form" onSubmit={onCrearRamo}>
          <input
            className="gestion-input"
            placeholder="Nombre (ej: Matemática M1)"
            value={nuevoRamo.nombre}
            onChange={e => setNuevoRamo(v => ({ ...v, nombre: e.target.value }))}
          />
          <select
            className="docente-select"
            value={nuevoRamo.plan}
            onChange={e => setNuevoRamo(v => ({ ...v, plan: e.target.value }))}
          >
            {PLANES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            className="docente-select"
            value={nuevoRamo.profesor_id}
            onChange={e => setNuevoRamo(v => ({ ...v, profesor_id: e.target.value }))}
          >
            <option value="">Sin profesora aún</option>
            {profesores.map(p => (
              <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
            ))}
          </select>
          <div className="gestion-colores">
            {COLORES.map(c => (
              <button
                key={c}
                type="button"
                className={`gestion-color${nuevoRamo.color === c ? ' activo' : ''}`}
                style={{ background: c }}
                onClick={() => setNuevoRamo(v => ({ ...v, color: c }))}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
          <button className="insc-btn-crear" type="submit" disabled={creando}>
            {creando ? 'Creando…' : 'Crear ramo'}
          </button>
        </form>
      </div>

      {/* ── Lista de ramos ── */}
      <div className="docente-card">
        <h2 className="docente-card-title">Ramos ({ramos.length})</h2>

        {ramos.length === 0 ? (
          <p className="docente-empty">
            Todavía no hay ramos. Crea el primero arriba: después podrás asignarle profesora,
            horario y alumnos.
          </p>
        ) : (
          <div className="gestion-ramos">
            {ramos.map(r => (
              <div
                key={r.id}
                className={`gestion-ramo${detalle?.id === r.id ? ' abierto' : ''}`}
                style={{ borderLeftColor: r.color }}
              >
                <div className="gestion-ramo-head">
                  <div>
                    <span className="gestion-ramo-nombre">{r.nombre}</span>
                    <span className="docente-plan-chip">{r.plan}</span>
                  </div>
                  <div className="gestion-ramo-meta">
                    <span>
                      {r.profesor_nombre
                        ? `${r.profesor_nombre} ${r.profesor_apellido}`
                        : <em className="gestion-falta">sin profesora</em>}
                    </span>
                    <span>{r.alumnos} alumno{r.alumnos !== 1 && 's'}</span>
                    <span>
                      {r.clases_semana > 0
                        ? `${r.clases_semana} clase${r.clases_semana !== 1 ? 's' : ''}/sem`
                        : <em className="gestion-falta">sin horario</em>}
                    </span>
                  </div>
                  <div className="insc-acciones">
                    <button
                      className="insc-btn-descartar"
                      onClick={() => setAbierto(detalle?.id === r.id ? null : r)}
                    >
                      {detalle?.id === r.id ? 'Cerrar' : 'Gestionar'}
                    </button>
                    <button
                      className="insc-btn-descartar"
                      onClick={() => {
                        if (confirm(`¿Dar de baja "${r.nombre}"? Sus alumnos dejarán de verlo.`)) {
                          accion(() => borrarRamo(r.id))
                          if (detalle?.id === r.id) setAbierto(null)
                        }
                      }}
                    >
                      Dar de baja
                    </button>
                  </div>
                </div>

                {/* ── Detalle: profesora, Meet, horario, alumnos ── */}
                {detalle?.id === r.id && (
                  <div className="gestion-detalle">

                    <div className="gestion-bloque">
                      <h4>Profesora y sala</h4>
                      <div className="gestion-fila">
                        <select
                          className="docente-select"
                          value={r.profesor_id ?? ''}
                          onChange={e => accion(() => editarRamo(r.id, {
                            profesor_id: e.target.value ? Number(e.target.value) : null,
                          }))}
                        >
                          <option value="">Sin profesora</option>
                          {profesores.map(p => (
                            <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                          ))}
                        </select>
                        <input
                          className="gestion-input"
                          placeholder="Enlace de Google Meet (opcional)"
                          defaultValue={r.meet_url || ''}
                          onBlur={e => {
                            if (e.target.value !== (r.meet_url || '')) {
                              accion(() => editarRamo(r.id, { meet_url: e.target.value.trim() }))
                            }
                          }}
                        />
                      </div>
                      <p className="gestion-hint">
                        Sin este enlace, el botón “Entrar a la clase” no le aparece al alumno.
                      </p>
                    </div>

                    <div className="gestion-bloque">
                      <h4>Horario · {clases.length} clase{clases.length !== 1 && 's'} por semana</h4>

                      {clases.length === 0 ? (
                        <p className="docente-empty">
                          Sin horario. Mientras no cargues clases, sus alumnos no verán nada en su panel.
                        </p>
                      ) : (
                        <div className="gestion-clases">
                          {clases.map(c => (
                            <span key={c.id} className="gestion-clase">
                              {c.dia} {c.hora} · {c.tipo}
                              <button
                                className="gestion-x"
                                onClick={() => accion(() => borrarClase(c.id))}
                                aria-label="Quitar clase"
                              >×</button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="gestion-fila">
                        <select
                          className="docente-select"
                          value={nuevaClase.dia}
                          onChange={e => setNuevaClase(v => ({ ...v, dia: e.target.value }))}
                        >
                          {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <input
                          className="gestion-input corta"
                          type="time"
                          value={nuevaClase.hora}
                          onChange={e => setNuevaClase(v => ({ ...v, hora: e.target.value }))}
                        />
                        <select
                          className="docente-select"
                          value={nuevaClase.tipo}
                          onChange={e => setNuevaClase(v => ({ ...v, tipo: e.target.value }))}
                        >
                          {TIPOS_CLASE.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <button
                          className="insc-btn-crear"
                          onClick={() => accion(() =>
                            crearClase(r.id, nuevaClase.dia, nuevaClase.hora, nuevaClase.tipo))}
                        >
                          Agregar clase
                        </button>
                      </div>
                    </div>

                    <div className="gestion-bloque">
                      <h4>Alumnos · {enElRamo.length}</h4>

                      {enElRamo.length === 0 ? (
                        <p className="docente-empty">Nadie matriculado todavía.</p>
                      ) : (
                        <div className="gestion-clases">
                          {enElRamo.map(a => (
                            <span key={a.id} className="gestion-alumno">
                              {a.nombre} {a.apellido}
                              <button
                                className="gestion-x"
                                onClick={() => accion(() => desmatricular(r.id, a.id))}
                                aria-label="Sacar del ramo"
                              >×</button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="gestion-fila">
                        <select
                          className="docente-select"
                          value={nuevoAlumno}
                          onChange={e => setNuevoAlumno(e.target.value)}
                        >
                          <option value="">Elige un alumno…</option>
                          {fueraDelRamo.map(a => (
                            <option key={a.id} value={a.id}>
                              {a.nombre} {a.apellido} ({a.plan})
                            </option>
                          ))}
                        </select>
                        <button
                          className="insc-btn-crear"
                          disabled={!nuevoAlumno}
                          onClick={() => {
                            accion(() => matricular(r.id, Number(nuevoAlumno)))
                            setNuevoAlumno('')
                          }}
                        >
                          Matricular
                        </button>
                      </div>
                      {fueraDelRamo.length === 0 && alumnos.length > 0 && (
                        <p className="gestion-hint">Todos los alumnos ya están en este ramo.</p>
                      )}
                      {alumnos.length === 0 && (
                        <p className="gestion-hint">
                          Todavía no hay alumnos. Aprueba inscripciones para poder matricular.
                        </p>
                      )}
                    </div>

                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
