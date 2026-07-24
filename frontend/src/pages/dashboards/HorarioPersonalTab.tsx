import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getHorarioPersonal, crearHorarioPersonal, borrarHorarioPersonal, moverHorarioPersonal,
  getAlumnosRegistro, crearAlumnoRegistro,
  type HorarioPersonalItem, type AlumnoRegistro,
} from '../../services/api'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const HOY_IDX = (new Date().getDay() + 6) % 7 // Date: 0=domingo → alineado a DIAS (0=lunes)

// Mismos nombres que el catálogo formal de planes, más "Particular" para lo que no encaja ahí.
const PLANES_TEXTO = ['Preparación PAES', 'Mejora tu NEM', 'Nivelación', 'Clases Especializadas', 'Particular']

const SLOT_INICIO = '08:00'
const SLOT_FIN = '21:00'
const SLOT_MIN = 30

function aMinutos(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
function aHora(mins: number) {
  const h = Math.floor(mins / 60).toString().padStart(2, '0')
  const m = (mins % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}
function generarSlots() {
  const slots: string[] = []
  for (let t = aMinutos(SLOT_INICIO); t < aMinutos(SLOT_FIN); t += SLOT_MIN) slots.push(aHora(t))
  return slots
}
const SLOTS = generarSlots()

/** Opciones del selector de hora del formulario: mismo paso de 30' que los slots, con margen extra para horas de término. */
function generarOpcionesHora() {
  const out: string[] = []
  for (let t = aMinutos('08:00'); t <= aMinutos('22:00'); t += SLOT_MIN) out.push(aHora(t))
  return out
}
const OPCIONES_HORA = generarOpcionesHora()

type Celda = { entrada: HorarioPersonalItem; span: number } | 'ocupada' | null

/** Arma la grilla semana × slot: cada entrada aparece una vez (con su alto en filas) en su slot de inicio; el resto de su bloque queda marcado 'ocupada' para no repetir fila. */
function construirGrilla(items: HorarioPersonalItem[]) {
  const grilla: Record<string, Celda[]> = {}
  for (const dia of DIAS) grilla[dia] = SLOTS.map(() => null)

  for (const it of items) {
    const fila = grilla[it.dia]
    if (!fila) continue
    const idx = SLOTS.indexOf(it.hora_inicio)
    if (idx === -1) continue
    const inicio = aMinutos(it.hora_inicio)
    const fin = it.hora_fin && aMinutos(it.hora_fin) > inicio ? aMinutos(it.hora_fin) : inicio + SLOT_MIN
    const span = Math.max(1, Math.round((fin - inicio) / SLOT_MIN))
    fila[idx] = { entrada: it, span }
    for (let k = 1; k < span && idx + k < fila.length; k++) fila[idx + k] = 'ocupada'
  }
  return grilla
}

export default function HorarioPersonalTab() {
  const [items, setItems]         = useState<HorarioPersonalItem[]>([])
  const [alumnos, setAlumnos]     = useState<AlumnoRegistro[]>([])
  const [cargando, setCargando]   = useState(true)
  const [error, setError]         = useState('')
  const [enviando, setEnviando]   = useState(false)

  const [nuevoAlumno, setNuevoAlumno]     = useState(false)
  const [enviandoAlumno, setEnviandoAlumno] = useState(false)
  const [formAlumno, setFormAlumno] = useState({ nombre: '', apellido: '', email: '', telefono: '', plan: '' })

  const [form, setForm] = useState({
    alumno_id: '', dia: DIAS[HOY_IDX] ?? 'Lunes', hora_inicio: '', hora_fin: '', nota: '',
  })

  const [arrastrandoId, setArrastrandoId] = useState<number | null>(null)
  const [celdaHover, setCeldaHover]       = useState<string | null>(null)

  const [editando, setEditando] = useState<{
    id: number; alumno_id: string; dia: string; hora_inicio: string; hora_fin: string; nota: string
  } | null>(null)
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  // mostrarCarga=false en recargas tras crear/mover/editar/borrar: solo actualiza los
  // datos sin mostrar "Cargando…", para que la grilla no parpadee en cada acción.
  const cargar = useCallback(async (mostrarCarga = true) => {
    if (mostrarCarga) setCargando(true)
    try {
      const [rh, ra] = await Promise.all([getHorarioPersonal(), getAlumnosRegistro()])
      setItems(rh.data.horario || [])
      setAlumnos(ra.data.alumnos || [])
    } catch {
      setError('No pudimos cargar tu horario.')
    } finally {
      if (mostrarCarga) setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const grilla = useMemo(() => construirGrilla(items), [items])

  function elegirSlotLibre(dia: string, slot: string) {
    setError('')
    setForm(v => ({ ...v, dia, hora_inicio: slot, hora_fin: aHora(aMinutos(slot) + SLOT_MIN) }))
  }

  async function agregar(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.alumno_id) { setError('Elige un alumno.'); return }
    if (!form.hora_inicio) { setError('Elige una hora de inicio (haz clic en un espacio libre de la grilla).'); return }
    if (form.hora_fin && aMinutos(form.hora_fin) <= aMinutos(form.hora_inicio)) {
      setError('La hora de término debe ser posterior a la de inicio.')
      return
    }

    setEnviando(true)
    try {
      const res = await crearHorarioPersonal({
        alumno_id: Number(form.alumno_id), dia: form.dia,
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

  function iniciarArrastre(e: React.DragEvent, entrada: HorarioPersonalItem) {
    const inicio = aMinutos(entrada.hora_inicio)
    const fin = entrada.hora_fin ? aMinutos(entrada.hora_fin) : inicio + SLOT_MIN
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: entrada.id, duracion: fin - inicio }))
    e.dataTransfer.effectAllowed = 'move'
    // Imagen de arrastre = el propio bloque, en vez del fantasma feo por defecto del navegador.
    e.dataTransfer.setDragImage(e.currentTarget, 12, 12)
    setArrastrandoId(entrada.id)
  }

  async function soltarEnSlot(e: React.DragEvent, dia: string, slot: string) {
    e.preventDefault()
    setCeldaHover(null)
    setArrastrandoId(null)
    const datos = e.dataTransfer.getData('text/plain')
    if (!datos) return
    setError('')
    try {
      const { id, duracion } = JSON.parse(datos) as { id: number; duracion: number }
      await moverHorarioPersonal(id, {
        dia, hora_inicio: slot, hora_fin: aHora(aMinutos(slot) + duracion),
      })
      await cargar(false)
    } catch {
      setError('No se pudo mover esa clase.')
    }
  }

  function abrirDetalle(entrada: HorarioPersonalItem) {
    setError('')
    setEditando({
      id: entrada.id, alumno_id: String(entrada.alumno_id), dia: entrada.dia,
      hora_inicio: entrada.hora_inicio, hora_fin: entrada.hora_fin, nota: entrada.nota,
    })
  }

  async function guardarEdicion(e: React.FormEvent) {
    e.preventDefault()
    if (!editando) return
    if (editando.hora_fin && aMinutos(editando.hora_fin) <= aMinutos(editando.hora_inicio)) {
      setError('La hora de término debe ser posterior a la de inicio.')
      return
    }
    setGuardandoEdicion(true)
    setError('')
    try {
      const res = await moverHorarioPersonal(editando.id, {
        dia: editando.dia, hora_inicio: editando.hora_inicio, hora_fin: editando.hora_fin,
        alumno_id: Number(editando.alumno_id), nota: editando.nota.trim(),
      })
      if (res.data.ok) {
        setEditando(null)
        await cargar(false)
      } else {
        setError(res.data.error || 'No se pudo guardar.')
      }
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { error?: string } } }
      setError(e2.response?.data?.error || 'No se pudo guardar.')
    } finally {
      setGuardandoEdicion(false)
    }
  }

  async function eliminarEdicion() {
    if (!editando) return
    setEliminando(true)
    setError('')
    try {
      await borrarHorarioPersonal(editando.id)
      setEditando(null)
      await cargar(false)
    } catch {
      setError('No se pudo borrar.')
    } finally {
      setEliminando(false)
    }
  }

  async function guardarAlumno(e: React.FormEvent) {
    e.preventDefault()
    if (!formAlumno.nombre.trim()) { setError('El nombre del alumno es obligatorio.'); return }
    setEnviandoAlumno(true)
    setError('')
    try {
      const res = await crearAlumnoRegistro({
        nombre: formAlumno.nombre.trim(), apellido: formAlumno.apellido.trim(),
        email: formAlumno.email.trim(), telefono: formAlumno.telefono.trim(),
        plan: formAlumno.plan.trim(),
      })
      if (res.data.ok) {
        const r = await getAlumnosRegistro()
        const lista = r.data.alumnos || []
        setAlumnos(lista)
        const creado = [...lista].reverse().find(a =>
          a.nombre === formAlumno.nombre.trim() && a.apellido === formAlumno.apellido.trim()
        )
        if (creado) setForm(v => ({ ...v, alumno_id: String(creado.id) }))
        setFormAlumno({ nombre: '', apellido: '', email: '', telefono: '', plan: '' })
        setNuevoAlumno(false)
      } else {
        setError(res.data.error || 'No se pudo registrar al alumno.')
      }
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { error?: string } } }
      setError(e2.response?.data?.error || 'No se pudo registrar al alumno.')
    } finally {
      setEnviandoAlumno(false)
    }
  }

  return (
    <div className="docente-card">
      <h2 className="docente-card-title">Mi horario</h2>
      <p className="insc-subtitle">
        Tus propios alumnos y horas, con o sin contrato Miraza — no requiere que dirección cree un ramo.
      </p>

      {error && <p className="insc-error">{error}</p>}

      {cargando ? (
        <div className="docente-loading">Cargando…</div>
      ) : (
        <div className="horario-semana-wrap">
          <table className="horario-semana">
            <thead>
              <tr>
                <th className="horario-semana-hora-col" />
                {DIAS.map(d => <th key={d}>{d.slice(0, 3)}</th>)}
              </tr>
            </thead>
            <tbody>
              {SLOTS.map((slot, i) => (
                <tr key={slot}>
                  <td className="horario-semana-hora-col">{slot}</td>
                  {DIAS.map(dia => {
                    const celda = grilla[dia][i]
                    if (celda === 'ocupada') return null
                    if (celda) {
                      const { entrada, span } = celda
                      return (
                        <td key={dia} rowSpan={span} className="horario-semana-ocupada">
                          <div
                            className={
                              arrastrandoId === entrada.id ? 'horario-semana-bloque arrastrando' : 'horario-semana-bloque'
                            }
                            draggable
                            onDragStart={e => iniciarArrastre(e, entrada)}
                            onDragEnd={() => { setArrastrandoId(null); setCeldaHover(null) }}
                            onClick={() => abrirDetalle(entrada)}
                            title="Clic para ver el detalle. Arrástrala a otro día u hora para moverla."
                          >
                            <span className="horario-semana-alumno">{entrada.alumno_nombre} {entrada.alumno_apellido}</span>
                            <span className="horario-semana-hora">
                              {entrada.hora_inicio}–{entrada.hora_fin || aHora(aMinutos(entrada.hora_inicio) + SLOT_MIN)}
                            </span>
                            {entrada.alumno_plan && <span className="horario-plan-chip">{entrada.alumno_plan}</span>}
                            {entrada.nota && <em>{entrada.nota}</em>}
                          </div>
                        </td>
                      )
                    }
                    const activa = form.dia === dia && form.hora_inicio === slot
                    const claveCelda = `${dia}-${slot}`
                    return (
                      <td
                        key={dia}
                        className={
                          celdaHover === claveCelda
                            ? 'horario-semana-libre-celda sobre-destino'
                            : 'horario-semana-libre-celda'
                        }
                        onDragOver={e => e.preventDefault()}
                        onDragEnter={() => setCeldaHover(claveCelda)}
                        onDragLeave={() => setCeldaHover(c => (c === claveCelda ? null : c))}
                        onDrop={e => soltarEnSlot(e, dia, slot)}
                      >
                        <button
                          type="button"
                          className={activa ? 'horario-slot-libre activo' : 'horario-slot-libre'}
                          onClick={() => elegirSlotLibre(dia, slot)}
                        >
                          +
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form className="gestion-form horario-form" onSubmit={agregar}>
        <select
          className="docente-select"
          value={form.dia}
          onChange={e => setForm(v => ({ ...v, dia: e.target.value }))}
        >
          {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          className="docente-select"
          value={form.alumno_id}
          onChange={e => setForm(v => ({ ...v, alumno_id: e.target.value }))}
        >
          <option value="">Elige un alumno…</option>
          {alumnos.map(a => (
            <option key={a.id} value={a.id}>
              {a.nombre} {a.apellido}{a.plan ? ` — ${a.plan}` : ''}
            </option>
          ))}
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
          placeholder="Nota (ej: Contrato Miraza)"
          value={form.nota}
          onChange={e => setForm(v => ({ ...v, nota: e.target.value }))}
        />
        <button className="insc-btn-crear" type="submit" disabled={enviando}>
          {enviando ? 'Agendando…' : `Agendar el ${form.dia}`}
        </button>
        <button type="button" className="gestion-x" onClick={() => setNuevoAlumno(v => !v)}>
          {nuevoAlumno ? 'Cancelar' : '+ Nuevo alumno'}
        </button>
      </form>

      {nuevoAlumno && (
        <form className="gestion-form horario-form-alumno" onSubmit={guardarAlumno}>
          <input
            className="gestion-input"
            placeholder="Nombre"
            value={formAlumno.nombre}
            onChange={e => setFormAlumno(v => ({ ...v, nombre: e.target.value }))}
          />
          <input
            className="gestion-input"
            placeholder="Apellido"
            value={formAlumno.apellido}
            onChange={e => setFormAlumno(v => ({ ...v, apellido: e.target.value }))}
          />
          <select
            className="docente-select"
            value={formAlumno.plan}
            onChange={e => setFormAlumno(v => ({ ...v, plan: e.target.value }))}
          >
            <option value="">Elige el plan…</option>
            {PLANES_TEXTO.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <input
            className="gestion-input"
            placeholder="Correo (opcional)"
            value={formAlumno.email}
            onChange={e => setFormAlumno(v => ({ ...v, email: e.target.value }))}
          />
          <input
            className="gestion-input"
            placeholder="Teléfono (opcional)"
            value={formAlumno.telefono}
            onChange={e => setFormAlumno(v => ({ ...v, telefono: e.target.value }))}
          />
          <button className="insc-btn-crear" type="submit" disabled={enviandoAlumno}>
            {enviandoAlumno ? 'Guardando…' : 'Guardar alumno'}
          </button>
        </form>
      )}

      {editando && (
        <div className="insc-modal-bg" onClick={() => setEditando(null)}>
          <div className="insc-modal" onClick={e => e.stopPropagation()}>
            <h3 className="insc-modal-title">Detalle de la clase</h3>
            <form className="horario-modal-form" onSubmit={guardarEdicion}>
              <select
                className="docente-select"
                value={editando.alumno_id}
                onChange={e => setEditando(v => v && ({ ...v, alumno_id: e.target.value }))}
              >
                {alumnos.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.nombre} {a.apellido}{a.plan ? ` — ${a.plan}` : ''}
                  </option>
                ))}
              </select>
              <div className="horario-modal-fila">
                <select
                  className="docente-select"
                  value={editando.dia}
                  onChange={e => setEditando(v => v && ({ ...v, dia: e.target.value }))}
                >
                  {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select
                  className="docente-select"
                  value={editando.hora_inicio}
                  onChange={e => setEditando(v => v && ({ ...v, hora_inicio: e.target.value }))}
                >
                  {OPCIONES_HORA.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <select
                  className="docente-select"
                  value={editando.hora_fin}
                  onChange={e => setEditando(v => v && ({ ...v, hora_fin: e.target.value }))}
                >
                  <option value="">Término…</option>
                  {OPCIONES_HORA.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <input
                className="gestion-input"
                placeholder="Nota (opcional)"
                value={editando.nota}
                onChange={e => setEditando(v => v && ({ ...v, nota: e.target.value }))}
              />

              <div className="insc-modal-acciones">
                <button className="insc-btn-copiar" type="submit" disabled={guardandoEdicion || eliminando}>
                  {guardandoEdicion ? 'Guardando…' : 'Guardar cambios'}
                </button>
                <button
                  type="button"
                  className="insc-btn-descartar"
                  onClick={eliminarEdicion}
                  disabled={guardandoEdicion || eliminando}
                >
                  {eliminando ? 'Eliminando…' : 'Eliminar'}
                </button>
                <button type="button" className="insc-btn-cerrar" onClick={() => setEditando(null)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
