import { useState, useEffect, useCallback } from 'react'
import {
  getHorarioPersonal, crearHorarioPersonal, borrarHorarioPersonal, getAlumnosRegistro,
  type HorarioPersonalItem, type AlumnoRegistro,
} from '../../services/api'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

function generarOpcionesHora() {
  const out: string[] = []
  for (let m = 8 * 60; m <= 22 * 60; m += 30) {
    out.push(`${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`)
  }
  return out
}
const OPCIONES_HORA = generarOpcionesHora()

function aMinutos(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function ordenDia(dia: string) {
  const i = DIAS.indexOf(dia)
  return i === -1 ? DIAS.length : i
}

export default function AlumnosRegistroTab() {
  const [alumnos, setAlumnos] = useState<AlumnoRegistro[]>([])
  const [horario, setHorario] = useState<HorarioPersonalItem[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError]     = useState('')
  const [abierto, setAbierto] = useState<number | null>(null)
  const [enviando, setEnviando] = useState(false)

  const [form, setForm] = useState({ dia: 'Lunes', hora_inicio: '', hora_fin: '', nota: '' })

  // mostrarCarga=false en recargas tras agregar/borrar un bloque: solo actualiza los
  // datos sin mostrar "Cargando…", para que la lista no parpadee en cada acción.
  const cargar = useCallback(async (mostrarCarga = true) => {
    if (mostrarCarga) setCargando(true)
    try {
      const [ra, rh] = await Promise.all([getAlumnosRegistro(), getHorarioPersonal()])
      setAlumnos(ra.data.alumnos || [])
      setHorario(rh.data.horario || [])
    } catch {
      setError('No pudimos cargar tus alumnos.')
    } finally {
      if (mostrarCarga) setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  function abrir(id: number) {
    setError('')
    setForm({ dia: 'Lunes', hora_inicio: '', hora_fin: '', nota: '' })
    setAbierto(abierto === id ? null : id)
  }

  async function agregar(alumnoId: number, e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.hora_inicio) { setError('Elige una hora de inicio.'); return }
    if (form.hora_fin && aMinutos(form.hora_fin) <= aMinutos(form.hora_inicio)) {
      setError('La hora de término debe ser posterior a la de inicio.')
      return
    }

    setEnviando(true)
    try {
      const res = await crearHorarioPersonal({
        alumno_id: alumnoId, dia: form.dia,
        hora_inicio: form.hora_inicio, hora_fin: form.hora_fin, nota: form.nota.trim(),
      })
      if (res.data.ok) {
        setForm(v => ({ ...v, hora_inicio: '', hora_fin: '', nota: '' }))
        await cargar(false)
      } else {
        setError(res.data.error || 'No se pudo guardar.')
      }
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { error?: string } } }
      setError(e2.response?.data?.error || 'No se pudo guardar.')
    } finally {
      setEnviando(false)
    }
  }

  async function quitar(id: number) {
    setError('')
    try {
      await borrarHorarioPersonal(id)
      await cargar(false)
    } catch {
      setError('No se pudo borrar.')
    }
  }

  if (cargando) return <div className="docente-card"><div className="docente-loading">Cargando…</div></div>

  return (
    <div className="docente-card">
      <h2 className="docente-card-title">Mis alumnos registrados</h2>
      <p className="insc-subtitle">
        Elige un alumno para ver o editar su horario semanal completo, sin importar el día.
      </p>

      {error && <p className="insc-error">{error}</p>}

      {alumnos.length === 0 ? (
        <p className="docente-empty">
          Todavía no has registrado alumnos. Agrégalos desde el tab Horario.
        </p>
      ) : (
        <div className="alumnoreg-lista">
          {alumnos.map(a => {
            const suyos = horario
              .filter(h => h.alumno_id === a.id)
              .sort((x, y) => ordenDia(x.dia) - ordenDia(y.dia) || x.hora_inicio.localeCompare(y.hora_inicio))
            return (
              <div key={a.id} className="alumnoreg-item">
                <button type="button" className="alumnoreg-head" onClick={() => abrir(a.id)}>
                  <span className="alumnoreg-nombre">{a.nombre} {a.apellido}</span>
                  {a.plan && <span className="horario-plan-chip">{a.plan}</span>}
                  <span className="alumnoreg-count">
                    {suyos.length} bloque{suyos.length !== 1 ? 's' : ''}/semana
                  </span>
                </button>

                {abierto === a.id && (
                  <div className="alumnoreg-detalle">
                    {suyos.length === 0 ? (
                      <p className="docente-empty">Sin horario agendado todavía.</p>
                    ) : (
                      <div className="alumnoreg-bloques">
                        {suyos.map(h => (
                          <div key={h.id} className="alumnoreg-bloque">
                            <span className="alumnoreg-dia">{h.dia}</span>
                            <span>{h.hora_inicio}{h.hora_fin ? `–${h.hora_fin}` : ''}</span>
                            {h.nota && <em>{h.nota}</em>}
                            <button className="gestion-x" onClick={() => quitar(h.id)}>Quitar</button>
                          </div>
                        ))}
                      </div>
                    )}

                    <form className="gestion-form horario-form" onSubmit={e => agregar(a.id, e)}>
                      <select
                        className="docente-select"
                        value={form.dia}
                        onChange={e => setForm(v => ({ ...v, dia: e.target.value }))}
                      >
                        {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <select
                        className="docente-select"
                        value={form.hora_inicio}
                        onChange={e => setForm(v => ({ ...v, hora_inicio: e.target.value }))}
                      >
                        <option value="">Inicio…</option>
                        {OPCIONES_HORA.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                      <select
                        className="docente-select"
                        value={form.hora_fin}
                        onChange={e => setForm(v => ({ ...v, hora_fin: e.target.value }))}
                      >
                        <option value="">Término…</option>
                        {OPCIONES_HORA.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                      <input
                        className="gestion-input"
                        placeholder="Nota (opcional)"
                        value={form.nota}
                        onChange={e => setForm(v => ({ ...v, nota: e.target.value }))}
                      />
                      <button className="insc-btn-crear" type="submit" disabled={enviando}>
                        {enviando ? 'Agregando…' : 'Agregar bloque'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
