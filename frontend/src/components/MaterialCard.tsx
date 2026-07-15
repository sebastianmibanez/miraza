import { Link } from 'react-router-dom'
import { type MaterialPublico } from '../services/api'
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
        <h3 className="vit-card-title">{m.titulo}</h3>
        {m.descripcion && <p className="vit-card-desc">{m.descripcion}</p>}
        {showAutor && (
          <Link to={`/profes/${m.autor_id}`} className="vit-card-autor">
            {m.autor_nombre} {m.autor_apellido}
          </Link>
        )}
      </div>
    </div>
  )
}
