import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import './Testimonios.css'

interface Testimonio {
  nombre: string
  meta: string
  texto: string
  color: string
  inicial: string
  badge: string
}

const testimonios: Testimonio[] = [
  {
    nombre: 'Sofía M.',
    meta: '4° Medio · Matemática M1 y M2',
    texto: 'Entré con muchísimo miedo a la Matemática y salí con estrategias claras para cada tipo de pregunta. Subí más de 70 puntos en mis ensayos durante el año. Los profes explican diferente, te hacen entender de verdad.',
    color: 'linear-gradient(135deg,#1B4DB8,#3A6FD8)',
    inicial: 'S',
    badge: 'PAES 2024',
  },
  {
    nombre: 'Diego R.',
    meta: 'Egresado · Lenguaje y Comunicación',
    texto: 'El profesor de Lenguaje me cambió completamente la forma de leer. Aprendí que no hay que leer todo, sino leer con intención. Con esa sola estrategia mejoré mucho en los ensayos. Lo recomiendo al 100%.',
    color: 'linear-gradient(135deg,#5B21B6,#7C3AED)',
    inicial: 'D',
    badge: 'PAES 2024',
  },
  {
    nombre: 'Valentina P.',
    meta: '4° Medio · Historia y Ciencias',
    texto: 'Historia era mi punto más débil y gracias a Miraza pude estructurar todo el contenido de una manera que nunca olvidé. El seguimiento personalizado marcó la diferencia: sentí que les importaba mi progreso de verdad.',
    color: 'linear-gradient(135deg,#065F46,#059669)',
    inicial: 'V',
    badge: 'PAES 2024',
  },
  {
    nombre: 'Matías C.',
    meta: 'Egresado · Todas las materias',
    texto: 'Lo que más valoro de Miraza es que no eres un número. Te monitorean, te preguntan cómo vas, ajustan el ritmo si necesitas. Los ensayos tipo PAES me prepararon mentalmente para el día de la prueba. ¡Entré sin nervios!',
    color: 'linear-gradient(135deg,#B45309,#D97706)',
    inicial: 'M',
    badge: 'PAES 2024',
  },
  {
    nombre: 'Claudia M.',
    meta: 'Apoderada · Apoyo Sicopedagógico',
    texto: 'Mi hijo tiene dislexia y siempre había tenido malas experiencias en colegios y academias. En Miraza encontramos un equipo que realmente entendió su forma de aprender. Los resultados al final del año fueron increíbles.',
    color: 'linear-gradient(135deg,#5B21B6,#7C3AED)',
    inicial: 'C',
    badge: '2024',
  },
]

function Testimonios() {
  const [current, setCurrent] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  const total = testimonios.length

  const goTo = (idx: number) => {
    setCurrent((idx + total) % total)
  }

  useEffect(() => {
    // Scroll reveal
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target) } }),
      { threshold: 0.1 }
    )
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* Page Hero */}
      <section className="page-hero">
        <div className="page-hero-inner">
          <div className="page-hero-tag">Testimonios</div>
          <h1>Lo que dicen nuestros <em>alumnos</em></h1>
          <p>Experiencias reales de estudiantes que se prepararon con nosotros</p>
        </div>
      </section>

      {/* Rating summary */}
      <section className="testim-summary reveal">
        <div className="testim-rating">
          <span className="stars">★★★★★</span>
          <span className="score">4.9</span>
          <span className="of">/ 5</span>
        </div>
        <div className="testim-sep"></div>
        <span className="testim-stat">Más de <strong>120 alumnos</strong> satisfechos</span>
        <div className="testim-sep"></div>
        <span className="testim-stat">100% recomendaría Miraza</span>
      </section>

      {/* Carousel */}
      <section className="testim-section">
        <div className="carousel-wrapper" ref={trackRef}>
          <div className="carousel-track" style={{ transform: `translateX(-${current * 100}%)` }}>
            {testimonios.map((t, i) => (
              <div className="testim-card" key={i}>
                <div className="testim-inner">
                  <span className="testim-stars">★★★★★</span>
                  <p className="testim-text">{t.texto}</p>
                  <div className="testim-author">
                    <div className="testim-avatar" style={{ background: t.color }}>{t.inicial}</div>
                    <div>
                      <div className="testim-name">{t.nombre}</div>
                      <div className="testim-meta">{t.meta}</div>
                    </div>
                    <div className="testim-badge">{t.badge}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="carousel-btn carousel-prev" onClick={() => goTo(current - 1)} aria-label="Anterior">&#8592;</button>
          <button className="carousel-btn carousel-next" onClick={() => goTo(current + 1)} aria-label="Siguiente">&#8594;</button>
          <div className="carousel-dots">
            {testimonios.map((_, i) => (
              <button
                key={i}
                className={`dot${i === current ? ' active' : ''}`}
                onClick={() => goTo(i)}
                aria-label={`Testimonio ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Grid de todas las tarjetas */}
      <section className="testim-grid-section">
        <div className="section-header reveal">
          <div className="section-tag">Todos los testimonios</div>
          <h2 className="section-title">Historias que nos inspiran</h2>
        </div>
        <div className="testim-grid">
          {testimonios.map((t, i) => (
            <div className="testim-grid-card reveal" key={i}>
              <span className="testim-stars">★★★★★</span>
              <p className="testim-text">{t.texto}</p>
              <div className="testim-author">
                <div className="testim-avatar" style={{ background: t.color }}>{t.inicial}</div>
                <div>
                  <div className="testim-name">{t.nombre}</div>
                  <div className="testim-meta">{t.meta}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="testim-cta reveal">
        <h2>¿Listo para escribir tu propia historia?</h2>
        <p>Únete a los más de 120 alumnos que ya transformaron su rendimiento con Miraza.</p>
        <Link to="/contacto" className="btn-gold">Inscríbete ahora</Link>
      </section>
    </>
  )
}

export default Testimonios
