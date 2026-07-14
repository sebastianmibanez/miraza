import { useState, useEffect, useCallback } from 'react'
import {
  getDashboardAnnouncements, getTeacherRamos, crearAviso, borrarAviso,
  TIPOS_AVISO,
  type Announcement, type TeacherRamo,
} from '../../services/api'

const ETIQUETA_TIPO: Record<string, string> = {
  info:    'Información',
  aviso:   'Aviso',
  urgente: 'Urgente',
}

interface Props {
  esAdmin: boolean
}

export default function AvisosTab({ esAdmin }: Props) {
  const [avisos, setAvisos] = useState<Announcement[]>([])
  const [ramos, setRamos]   = useState<TeacherRamo[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError]   = useState('')
  const [enviando, setEnviando] = useState(false)

  // ramoId '' = aviso general (solo dirección puede)
  const [form, setForm] = useState({ titulo: '', texto: '', tipo: 'info', ramoId: '' })

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const [a, r] = await Promise.all([getDashboardAnnouncements(), getTeacherRamos()])
      setAvisos(a.data.announcements || [])
      setRamos(r.data.ramos || [])
    } catch {
      setError('No pudimos cargar los avisos.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  async function publicar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.titulo.trim() || !form.texto.trim()) {
      setError('El título y el texto son obligatorios.')
      return
    }
    if (!esAdmin && !form.ramoId) {
      setError('Elige uno de tus ramos. Los avisos generales los publica dirección.')
      return
    }

    setEnviando(true)
    setError('')
    try {
      const res = await crearAviso(
        form.titulo.trim(),
        form.texto.trim(),
        form.tipo,
        form.ramoId ? Number(form.ramoId) : null,
      )
      if (res.data.ok) {
        setForm({ titulo: '', texto: '', tipo: 'info', ramoId: '' })
        await cargar()
      } else {
        setError(res.data.error || 'No se pudo publicar.')
      }
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { error?: string } } }
      setError(e2.response?.data?.error || 'No se pudo publicar.')
    } finally {
      setEnviando(false)
    }
  }

  async function quitar(id: number) {
    setError('')
    try {
      await borrarAviso(id)
      await cargar()
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { error?: string } } }
      setError(e2.response?.data?.error || 'No se pudo borrar.')
    }
  }

  return (
    <div className="docente-tab-content">
      {error && <p className="insc-error">{error}</p>}

      <div className="docente-card">
        <h2 className="docente-card-title">Publicar un aviso</h2>
        <p className="insc-subtitle">
          {esAdmin
            ? 'Un aviso general lo ve todo Miraza. Si eliges un ramo, solo lo verán sus alumnos.'
            : 'Puedes publicar en los ramos que dictas. Los avisos generales los publica dirección.'}
        </p>

        <form className="aviso-form" onSubmit={publicar}>
          <input
            className="gestion-input"
            placeholder="Título (ej: Ensayo el jueves)"
            value={form.titulo}
            onChange={e => setForm(v => ({ ...v, titulo: e.target.value }))}
          />
          <textarea
            className="gestion-input aviso-texto"
            placeholder="¿Qué necesitan saber?"
            rows={3}
            value={form.texto}
            onChange={e => setForm(v => ({ ...v, texto: e.target.value }))}
          />
          <div className="gestion-fila">
            <select
              className="docente-select"
              value={form.ramoId}
              onChange={e => setForm(v => ({ ...v, ramoId: e.target.value }))}
            >
              {esAdmin && <option value="">📣 Aviso general (todo Miraza)</option>}
              {!esAdmin && <option value="">Elige un ramo…</option>}
              {ramos.map(r => (
                <option key={r.id} value={r.id}>{r.nombre} ({r.plan})</option>
              ))}
            </select>
            <select
              className="docente-select"
              value={form.tipo}
              onChange={e => setForm(v => ({ ...v, tipo: e.target.value }))}
            >
              {TIPOS_AVISO.map(t => (
                <option key={t} value={t}>{ETIQUETA_TIPO[t]}</option>
              ))}
            </select>
            <button className="insc-btn-crear" type="submit" disabled={enviando}>
              {enviando ? 'Publicando…' : 'Publicar'}
            </button>
          </div>
          {ramos.length === 0 && !esAdmin && (
            <p className="gestion-hint">
              Todavía no tienes ramos asignados, así que no hay dónde publicar.
            </p>
          )}
        </form>
      </div>

      <div className="docente-card">
        <h2 className="docente-card-title">Publicados ({avisos.length})</h2>

        {cargando ? (
          <div className="docente-loading">Cargando…</div>
        ) : avisos.length === 0 ? (
          <p className="docente-empty">
            Todavía no hay avisos. El primero que publiques les aparecerá a tus alumnos en su panel.
          </p>
        ) : (
          <div className="docente-announce-list">
            {avisos.map(a => (
              <div key={a.id} className={`docente-announce-item tipo-${a.tipo}`}>
                <div className="aviso-head">
                  <span className="docente-announce-title">{a.titulo}</span>
                  <span className={`aviso-destino${a.ramo ? '' : ' general'}`}>
                    {a.ramo ? a.ramo : '📣 General'}
                  </span>
                </div>
                <span className="docente-announce-text">{a.texto}</span>
                <div className="aviso-pie">
                  <span className="docente-announce-date">{a.fecha}</span>
                  <button className="gestion-x" onClick={() => quitar(a.id)}>Borrar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
