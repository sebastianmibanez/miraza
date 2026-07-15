import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getVitrina, type MaterialPublico } from '../services/api'
import MaterialCard from '../components/MaterialCard'
import './Vitrina.css'

// ponytail: filtra la vitrina completa en el cliente. Con miles de materiales,
// cambiar a GET /api/materiales?autor=<id>. Trivial: el filtro ya está aislado acá.
export default function PerfilProfe() {
  const { id } = useParams<{ id: string }>()
  const autorId = Number(id)

  const [items, setItems]       = useState<MaterialPublico[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    getVitrina()
      .then(r => setItems((r.data.materiales || []).filter(m => m.autor_id === autorId)))
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [autorId])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target) } }),
      { threshold: 0.1 }
    )
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [items])

  const autor = items[0]
  const nombre = autor ? `${autor.autor_nombre} ${autor.autor_apellido}` : 'Profesor'

  return (
    <>
      <section className="page-hero">
        <div className="page-hero-inner">
          <div className="page-hero-tag">Profesor</div>
          <h1>{nombre}</h1>
          <p>Material y clases demo de {autor ? autor.autor_nombre : 'este profesor'}</p>
        </div>
      </section>

      <section className="vit-section">
        <Link to="/vitrina" className="vit-volver">← Volver a la vitrina</Link>

        {cargando ? (
          <p className="vit-estado">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="vit-estado">Este profesor todavía no ha publicado material.</p>
        ) : (
          <div className="vit-grid">
            {items.map(m => <MaterialCard key={m.id} m={m} showAutor={false} />)}
          </div>
        )}
      </section>

      <section className="testim-cta reveal">
        <h2>¿Quieres clases con {autor ? autor.autor_nombre : 'nuestro equipo'}?</h2>
        <p>Escríbenos y te contamos cómo empezar.</p>
        <Link to="/contacto" className="btn-gold">Contáctanos</Link>
      </section>
    </>
  )
}
