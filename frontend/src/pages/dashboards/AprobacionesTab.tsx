import { useState, useEffect, useCallback } from 'react'
import { getMaterialesPendientes, revisarMaterial, type MaterialPendiente } from '../../services/api'
import { youtubeId } from '../../components/MaterialCard'

interface Props {
  onCount?: (n: number) => void
}

export default function AprobacionesTab({ onCount }: Props) {
  const [items, setItems]       = useState<MaterialPendiente[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError]       = useState('')
  const [ocupada, setOcupada]   = useState<number | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const r = await getMaterialesPendientes()
      setItems(r.data.materiales || [])
      onCount?.(r.data.materiales?.length || 0)
    } catch {
      setError('No pudimos cargar el material pendiente.')
    } finally {
      setCargando(false)
    }
  }, [onCount])

  useEffect(() => { cargar() }, [cargar])

  async function revisar(id: number, estado: 'aprobado' | 'rechazado') {
    setOcupada(id)
    setError('')
    try {
      const res = await revisarMaterial(id, estado)
      if (res.data.ok) await cargar()
      else setError(res.data.error || 'No se pudo actualizar.')
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { error?: string } } }
      setError(e2.response?.data?.error || 'No se pudo actualizar.')
    } finally {
      setOcupada(null)
    }
  }

  return (
    <div className="docente-tab-content">
      {error && <p className="insc-error">{error}</p>}

      <div className="docente-card">
        <h2 className="docente-card-title">Material por revisar</h2>
        <p className="insc-subtitle">
          Lo que suben las profesoras queda acá hasta que lo apruebes. Solo lo aprobado
          aparece en la vitrina pública.
        </p>

        {cargando ? (
          <div className="docente-loading">Cargando…</div>
        ) : items.length === 0 ? (
          <p className="docente-empty">No hay material pendiente. Todo al día. ✨</p>
        ) : (
          <div className="aprob-grid">
            {items.map(m => {
              const yt = m.tipo === 'video' ? youtubeId(m.url) : null
              return (
                <div key={m.id} className="aprob-card">
                  {yt ? (
                    <div className="aprob-embed">
                      <iframe
                        src={`https://www.youtube.com/embed/${yt}`}
                        title={m.titulo}
                        allow="encrypted-media; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <a href={m.url} target="_blank" rel="noopener noreferrer" className="aprob-link">
                      {m.tipo === 'documento' ? '📄 Ver documento ↗' : '▶ Ver enlace ↗'}
                    </a>
                  )}
                  <div className="aprob-body">
                    <strong>{m.titulo}</strong>
                    {m.descripcion && <p className="aprob-desc">{m.descripcion}</p>}
                    <span className="aprob-autor">{m.autor_nombre} {m.autor_apellido}</span>
                  </div>
                  <div className="aprob-acciones">
                    <button
                      className="insc-btn-crear"
                      onClick={() => revisar(m.id, 'aprobado')}
                      disabled={ocupada === m.id}
                    >
                      {ocupada === m.id ? '…' : 'Aprobar'}
                    </button>
                    <button
                      className="insc-btn-descartar"
                      onClick={() => revisar(m.id, 'rechazado')}
                      disabled={ocupada === m.id}
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
