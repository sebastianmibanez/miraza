import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
  getMisMateriales, crearMaterial, borrarMaterial,
  type Material, type TipoMaterial, type EstadoMaterial,
} from '../../services/api'

const ETIQUETA_TIPO: Record<TipoMaterial, string> = {
  video:     'Video',
  documento: 'Documento',
}

const ETIQUETA_ESTADO: Record<EstadoMaterial, string> = {
  pendiente: 'En revisión',
  aprobado:  'Publicado',
  rechazado: 'Rechazado',
}

export default function MaterialTab() {
  const { state } = useAuth()
  const esAdmin = state.user?.rol === 'admin'

  const [items, setItems]       = useState<Material[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError]       = useState('')
  const [aviso, setAviso]       = useState('')
  const [enviando, setEnviando] = useState(false)

  const [form, setForm] = useState({ titulo: '', descripcion: '', tipo: 'video' as TipoMaterial, url: '' })

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const r = await getMisMateriales()
      setItems(r.data.materiales || [])
    } catch {
      setError('No pudimos cargar tu material.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  async function publicar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.titulo.trim()) {
      setError('El título es obligatorio.')
      return
    }
    const url = form.url.trim()
    if (!/^https?:\/\//.test(url)) {
      setError('Pega el enlace completo (empieza con https://). El video va en YouTube, Vimeo o Drive.')
      return
    }

    setEnviando(true)
    setError('')
    setAviso('')
    try {
      const res = await crearMaterial(form.titulo.trim(), form.descripcion.trim(), form.tipo, url)
      if (res.data.ok) {
        setForm({ titulo: '', descripcion: '', tipo: 'video', url: '' })
        setAviso(res.data.estado === 'pendiente'
          ? 'Subido. Queda en revisión: dirección lo aprueba y ahí aparece en la vitrina.'
          : 'Subido y publicado en la vitrina.')
        await cargar()
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
      await borrarMaterial(id)
      await cargar()
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { error?: string } } }
      setError(e2.response?.data?.error || 'No se pudo borrar.')
    }
  }

  return (
    <div className="docente-tab-content">
      {error && <p className="insc-error">{error}</p>}

      {aviso && <p className="insc-subtitle" style={{ color: 'var(--d-ok)', fontWeight: 600 }}>{aviso}</p>}

      <div className="docente-card">
        <h2 className="docente-card-title">Subir material</h2>
        <p className="insc-subtitle">
          Sube tus videos demo, cursos o shorts para mostrarte. El video no se aloja
          en Miraza: súbelo a <strong>YouTube</strong> (sin listar, si es privado),
          Vimeo o Drive, y pega el enlace acá.
          {!esAdmin && ' Tu material pasa por una revisión antes de aparecer en la vitrina.'}
        </p>

        <form className="aviso-form" onSubmit={publicar}>
          <input
            className="gestion-input"
            placeholder="Título (ej: Clase demo — Factorización)"
            value={form.titulo}
            onChange={e => setForm(v => ({ ...v, titulo: e.target.value }))}
          />
          <textarea
            className="gestion-input aviso-texto"
            placeholder="Descripción breve (opcional)"
            rows={2}
            value={form.descripcion}
            onChange={e => setForm(v => ({ ...v, descripcion: e.target.value }))}
          />
          <input
            className="gestion-input"
            placeholder="https://youtube.com/watch?v=…"
            value={form.url}
            onChange={e => setForm(v => ({ ...v, url: e.target.value }))}
          />
          <div className="gestion-fila">
            <select
              className="docente-select"
              value={form.tipo}
              onChange={e => setForm(v => ({ ...v, tipo: e.target.value as TipoMaterial }))}
            >
              <option value="video">Video</option>
              <option value="documento">Documento</option>
            </select>
            <button className="insc-btn-crear" type="submit" disabled={enviando}>
              {enviando ? 'Guardando…' : 'Subir'}
            </button>
          </div>
        </form>
      </div>

      <div className="docente-card">
        <h2 className="docente-card-title">Mi material ({items.length})</h2>

        {cargando ? (
          <div className="docente-loading">Cargando…</div>
        ) : items.length === 0 ? (
          <p className="docente-empty">
            Todavía no has subido nada. Empieza con un video demo: es tu carta de presentación.
          </p>
        ) : (
          <div className="docente-announce-list">
            {items.map(m => (
              <div key={m.id} className="docente-announce-item">
                <div className="aviso-head">
                  <span className="docente-announce-title">{m.titulo}</span>
                  <span className="aviso-destino">{ETIQUETA_TIPO[m.tipo]}</span>
                </div>
                {m.descripcion && <span className="docente-announce-text">{m.descripcion}</span>}
                <div className="aviso-pie">
                  <a href={m.url} target="_blank" rel="noopener noreferrer" className="docente-announce-date">
                    Ver enlace ↗
                  </a>
                  {m.estado && (
                    <span className={`mat-estado mat-estado-${m.estado}`}>
                      {ETIQUETA_ESTADO[m.estado]}
                    </span>
                  )}
                  <button className="gestion-x" onClick={() => quitar(m.id)}>Borrar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
