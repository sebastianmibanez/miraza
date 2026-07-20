import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getVitrina, type MaterialPublico } from '../services/api'
import MaterialCard from '../components/MaterialCard'
import './Vitrina.css'

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
          <div className="vit-grid" aria-busy="true" aria-label="Cargando material">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="vit-skel">
                <div className="vit-skel-embed" />
                <div className="vit-skel-body">
                  <div className="vit-skel-line w70" />
                  <div className="vit-skel-line w40" />
                  <div className="vit-skel-autor">
                    <div className="vit-skel-avatar" />
                    <div className="vit-skel-line w30" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="vit-vacio">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <polygon points="10 9 15 12 10 15 10 9" />
            </svg>
            <p>Pronto encontrarás aquí el material de nuestros profesores.</p>
          </div>
        ) : (
          <div className="vit-grid">
            {items.map(m => <MaterialCard key={m.id} m={m} />)}
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
