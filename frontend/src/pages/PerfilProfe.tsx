import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getPerfilProfe, type PerfilProfesor, type MaterialPublico } from '../services/api'
import MaterialCard from '../components/MaterialCard'
import Avatar from '../components/Avatar'
import './Vitrina.css'

export default function PerfilProfe() {
  const { id } = useParams<{ id: string }>()
  const autorId = Number(id)

  const [profesor, setProfesor] = useState<PerfilProfesor | null>(null)
  const [items, setItems]       = useState<MaterialPublico[]>([])
  const [cargando, setCargando] = useState(true)
  const [noExiste, setNoExiste] = useState(false)

  useEffect(() => {
    getPerfilProfe(autorId)
      .then(r => {
        if (!r.data.ok || !r.data.profesor) { setNoExiste(true); return }
        const p = r.data.profesor
        setProfesor(p)
        // El material del endpoint no repite los datos del autor: se los pego acá
        // para que MaterialCard reciba el tipo que espera.
        setItems((r.data.materiales || []).map(mat => ({
          ...mat,
          autor_id: p.id,
          autor_nombre: p.nombre,
          autor_apellido: p.apellido,
          autor_foto: p.foto_url,
        })))
      })
      .catch(() => setNoExiste(true))
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

  if (noExiste) {
    return (
      <section className="vit-section">
        <p className="vit-estado">Este perfil no existe.</p>
        <Link to="/vitrina" className="vit-volver">← Volver a la vitrina</Link>
      </section>
    )
  }

  const nombre = profesor ? `${profesor.nombre} ${profesor.apellido}` : ''

  return (
    <>
      <section className="page-hero perfil-hero">
        <div className="page-hero-inner perfil-hero-inner">
          {profesor && (
            <Avatar nombre={profesor.nombre} apellido={profesor.apellido} foto={profesor.foto_url} size={110} />
          )}
          <div className="page-hero-tag">Profesor</div>
          <h1>{nombre || 'Cargando…'}</h1>
          {profesor?.bio && <p className="perfil-bio">{profesor.bio}</p>}
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
        <h2>¿Quieres clases con {profesor ? profesor.nombre : 'nuestro equipo'}?</h2>
        <p>Escríbenos y te contamos cómo empezar.</p>
        <Link to="/contacto" className="btn-gold">Contáctanos</Link>
      </section>
    </>
  )
}
