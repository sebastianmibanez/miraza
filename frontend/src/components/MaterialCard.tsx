import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { type MaterialPublico } from '../services/api'
import Avatar from './Avatar'
import '../pages/Vitrina.css'

/** ID de YouTube desde watch?v=, youtu.be/, shorts/ o embed/. null si no es YouTube. */
export function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)
  return m ? m[1] : null
}

interface Props {
  m: MaterialPublico
  /** El perfil del profe ya muestra su nombre arriba: ahí sobra en cada tarjeta. */
  showAutor?: boolean
}

export default function MaterialCard({ m, showAutor = true }: Props) {
  const yt = m.tipo === 'video' ? youtubeId(m.url) : null

  // Vista theater: el video en grande, centrado, sobre un fondo oscuro. Usamos
  // <dialog> nativo → backdrop y cierre con Escape gratis, sin librería.
  const [theater, setTheater] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (theater && !d.open) d.showModal()
    if (!theater && d.open) d.close()
  }, [theater])

  return (
    <div className="vit-card reveal">
      {yt ? (
        <div className="vit-embed">
          <iframe
            src={`https://www.youtube.com/embed/${yt}`}
            title={m.titulo}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      ) : (
        <a href={m.url} target="_blank" rel="noopener noreferrer" className="vit-linkbox">
          <span className="vit-linkbox-icon">{m.tipo === 'documento' ? '📄' : '▶'}</span>
          <span className="vit-linkbox-text">Ver {m.tipo === 'documento' ? 'documento' : 'video'} ↗</span>
        </a>
      )}

      <div className="vit-card-body">
        <div className="vit-card-head">
          <h3 className="vit-card-title">{m.titulo}</h3>
          {yt && (
            <button className="vit-theater-btn" onClick={() => setTheater(true)} title="Ver en grande">
              ⤢
            </button>
          )}
        </div>
        {m.descripcion && <p className="vit-card-desc">{m.descripcion}</p>}
        {showAutor && (
          <Link to={`/profes/${m.autor_id}`} className="vit-autor-row">
            <Avatar nombre={m.autor_nombre} apellido={m.autor_apellido} foto={m.autor_foto} size={34} />
            <span className="vit-autor-nombre">{m.autor_nombre} {m.autor_apellido}</span>
          </Link>
        )}
      </div>

      {yt && (
        <dialog
          ref={dialogRef}
          className="vit-theater"
          onClose={() => setTheater(false)}
          onClick={e => { if (e.target === dialogRef.current) setTheater(false) }}
        >
          <div className="vit-theater-inner">
            <button className="vit-theater-close" onClick={() => setTheater(false)} aria-label="Cerrar">✕</button>
            {theater && (
              <div className="vit-theater-embed">
                <iframe
                  src={`https://www.youtube.com/embed/${yt}?autoplay=1`}
                  title={m.titulo}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
            <p className="vit-theater-title">{m.titulo}</p>
          </div>
        </dialog>
      )}
    </div>
  )
}
