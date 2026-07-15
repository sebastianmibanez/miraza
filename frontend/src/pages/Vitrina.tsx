import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getVitrina, type MaterialPublico } from '../services/api'
import './Vitrina.css'

/** ID de YouTube desde watch?v=, youtu.be/, shorts/ o embed/. null si no es YouTube. */
function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)
  return m ? m[1] : null
}

function VideoCard({ m }: { m: MaterialPublico }) {
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
        <span className="vit-card-autor">{m.autor_nombre} {m.autor_apellido}</span>
      </div>
    </div>
  )
}

export default function Vitrina() {
  const [items, setItems]       = useState<MaterialPublico[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    getVitrina()
      .then(r => setItems(r.data.materiales || []))
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target) } }),
      { threshold: 0.1 }
    )
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [items])

  return (
    <>
      <section className="page-hero">
        <div className="page-hero-inner">
          <div className="page-hero-tag">Vitrina</div>
          <h1>Conoce a nuestros <em>profesores</em></h1>
          <p>Clases demo, cursos y material preparado por el equipo de Miraza</p>
        </div>
      </section>

      <section className="vit-section">
        {cargando ? (
          <p className="vit-estado">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="vit-estado">Pronto encontrarás aquí el material de nuestros profesores.</p>
        ) : (
          <div className="vit-grid">
            {items.map(m => <VideoCard key={m.id} m={m} />)}
          </div>
        )}
      </section>

      <section className="testim-cta reveal">
        <h2>¿Quieres clases con nuestro equipo?</h2>
        <p>Escríbenos y te contamos cómo empezar.</p>
        <Link to="/contacto" className="btn-gold">Contáctanos</Link>
      </section>
    </>
  )
}
