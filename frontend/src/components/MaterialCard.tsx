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

const IconPlay = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="6 3 20 12 6 21 6 3" />
  </svg>
)
const IconDoc = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
)
const IconExpand = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
  </svg>
)
const IconClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

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
          <span className="vit-linkbox-icon">{m.tipo === 'documento' ? <IconDoc /> : <IconPlay />}</span>
          <span className="vit-linkbox-text">Ver {m.tipo === 'documento' ? 'documento' : 'video'} ↗</span>
        </a>
      )}

      <div className="vit-card-body">
        <div className="vit-card-head">
          <h3 className="vit-card-title">{m.titulo}</h3>
          {yt && (
            <button className="vit-theater-btn" onClick={() => setTheater(true)} title="Ver en grande">
              <IconExpand />
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
            <button className="vit-theater-close" onClick={() => setTheater(false)} aria-label="Cerrar"><IconClose /></button>
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
