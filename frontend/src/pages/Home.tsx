import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Home.css'

const testimonios = [
  { texto: 'Entré con muchísimo miedo a la Matemática y salí con estrategias claras para cada tipo de pregunta. Subí más de 70 puntos en mis ensayos durante el año. Los profes explican diferente, te hacen entender de verdad.', nombre: 'Sofía M.', meta: '4° Medio · Matemática M1 y M2', color: 'linear-gradient(135deg,#1B4DB8,#3A6FD8)', inicial: 'S', badge: 'PAES 2024' },
  { texto: 'El profesor de Lenguaje me cambió completamente la forma de leer. Aprendí que no hay que leer todo, sino leer con intención. Con esa sola estrategia mejoré mucho en los ensayos. Lo recomiendo al 100%.', nombre: 'Diego R.', meta: 'Egresado · Lenguaje y Comunicación', color: 'linear-gradient(135deg,#5B21B6,#7C3AED)', inicial: 'D', badge: 'PAES 2024' },
  { texto: 'Historia era mi punto más débil y gracias a Miraza pude estructurar todo el contenido de una manera que nunca olvidé. El seguimiento personalizado marcó la diferencia: sentí que les importaba mi progreso de verdad.', nombre: 'Valentina P.', meta: '4° Medio · Historia y Ciencias', color: 'linear-gradient(135deg,#065F46,#059669)', inicial: 'V', badge: 'PAES 2024' },
  { texto: 'Lo que más valoro de Miraza es que no eres un número. Te monitorean, te preguntan cómo vas, ajustan el ritmo si necesitas. Los ensayos tipo PAES me prepararon mentalmente para el día de la prueba. ¡Entré sin nervios!', nombre: 'Matías C.', meta: 'Egresado · Todas las materias', color: 'linear-gradient(135deg,#B45309,#D97706)', inicial: 'M', badge: 'PAES 2024' },
  { texto: 'Mi hijo tiene dislexia y siempre había tenido malas experiencias. En Miraza encontramos un equipo que realmente entendió su forma de aprender. Los resultados al final del año fueron increíbles.', nombre: 'Claudia M.', meta: 'Apoderada · Apoyo Sicopedagógico', color: 'linear-gradient(135deg,#5B21B6,#7C3AED)', inicial: 'C', badge: '2024' },
]

interface ProgOpcion { label: string; price: string; bold?: boolean; green?: boolean }
interface Programa { id: string; tipo: string; nombre: string[]; desde: string; icon: string; colorClass: string; backTipo: string; backNombre: string; backDesc: string; opciones: ProgOpcion[]; btnLabel: string }

const programas: Programa[] = [
  { id: 'paes', tipo: 'Plan estrella', nombre: ['Preparación', 'PAES'], desde: 'desde $59.990/mes', icon: '🎯', colorClass: 'prog-azul', backTipo: 'Preparación PAES', backNombre: 'Todas las pruebas, un solo camino', backDesc: 'Preparación integral para la PAES con docentes especializados, ensayos semanales y seguimiento personalizado. Ideal para 4° Medio y egresados.', opciones: [{ label: 'Matemática M1 y M2', price: '$59.990/mes' }, { label: 'Lenguaje', price: '$54.990/mes' }, { label: 'Historia', price: '$54.990/mes' }, { label: 'Ciencias', price: '$54.990/mes' }, { label: 'Pack completo todas las materias', price: '$99.990/mes', bold: true }], btnLabel: 'Inscribirse' },
  { id: 'nem', tipo: 'NEM', nombre: ['Mejora', 'tu NEM'], desde: 'desde $34.990/mes', icon: '📊', colorClass: 'prog-gold', backTipo: 'Mejora tu NEM', backNombre: 'Sube tus notas, sube tu puntaje', backDesc: 'Refuerzo académico durante el año escolar para mejorar tu NEM y aumentar tu puntaje de postulación universitaria.', opciones: [{ label: 'Por materia', price: 'desde $34.990/mes' }, { label: 'Todas las materias', price: '$54.990/mes' }, { label: 'Diagnóstico inicial', price: 'Gratis', green: true }], btnLabel: 'Inscribirse' },
  { id: 'nivel', tipo: 'Nivelación', nombre: ['Nivelación', 'de Estudios'], desde: 'desde $44.990/mes', icon: '📚', colorClass: 'prog-navy', backTipo: 'Nivelación de Estudios', backNombre: 'Recupera la base, avanza con confianza', backDesc: 'Refuerzo académico personalizado para estudiantes que necesitan nivelar sus conocimientos en enseñanza básica o media.', opciones: [{ label: 'Enseñanza Básica', price: '$44.990/mes' }, { label: 'Enseñanza Media', price: '$49.990/mes' }], btnLabel: 'Inscribirse' },
  { id: 'espec', tipo: 'Especializado', nombre: ['Clases', 'Especializadas'], desde: 'Diagnóstico gratuito', icon: '🧩', colorClass: 'prog-teal', backTipo: 'Clases Especializadas', backNombre: 'Apoyo diferenciado, sin etiquetas', backDesc: 'Atención especializada para estudiantes con necesidades de aprendizaje. Diagnóstico inicial, metodología adaptada y plan 100% personalizado.', opciones: [{ label: 'Estudiantes con necesidades de aprendizaje', price: '$74.990/mes' }, { label: 'Diagnóstico inicial', price: 'Gratis', green: true }], btnLabel: 'Solicitar diagnóstico' },
]

const faqs = [
  { q: '¿Qué es Preuniversitario Miraza?', a: 'Miraza es un preuniversitario 100% online especializado en preparación PAES, nivelación de estudios y apoyo sicopedagógico. Ofrecemos clases en vivo y grabadas, material actualizado y seguimiento personalizado.' },
  { q: '¿Cuáles son los programas disponibles?', a: 'Contamos con cuatro programas: Preparación PAES, Mejora tu NEM (por materia o todas), Nivelación de Estudios (Básica y Media) y Clases Especializadas para estudiantes con necesidades de aprendizaje. Todos incluyen diagnóstico inicial.' },
  { q: '¿Cómo son las clases? ¿Son en vivo o grabadas?', a: 'Las clases son en vivo a través de Google Meet y quedan grabadas en Google Classroom para que puedas revisarlas cuando quieras. Todo el material, guías y ensayos también están disponibles en la plataforma 24/7.' },
  { q: '¿Cómo me inscribo?', a: 'Completa el formulario de contacto y te contactamos en menos de 24 horas por WhatsApp o correo para confirmar tu cupo y resolver dudas. También puedes escribirnos directamente al WhatsApp si tienes preguntas antes de inscribirte.' },
  { q: '¿Cuántos alumnos hay por clase?', a: 'Trabajamos en grupos reducidos para garantizar atención personalizada. Siempre priorizamos que el docente pueda hacer seguimiento individual a cada estudiante. No somos una clase masiva sin retroalimentación.' },
]

function Home() {
  const [activeSlide, setActiveSlide] = useState(0)
  const [currentTestim, setCurrentTestim] = useState(0)
  const [flippedCard, setFlippedCard] = useState<string | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    const t = setInterval(() => setActiveSlide(p => (p + 1) % 3), 8000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setCurrentTestim(p => (p + 1) % testimonios.length), 5200)
    return () => clearInterval(t)
  }, [])

  const progBg: Record<string, string> = {
    'prog-azul': 'linear-gradient(135deg,rgba(27,77,184,0.6),rgba(43,96,212,0.9))',
    'prog-gold': 'linear-gradient(135deg,rgba(184,112,10,0.6),rgba(212,137,26,0.9))',
    'prog-navy': 'linear-gradient(135deg,rgba(10,31,68,0.7),rgba(27,77,184,0.9))',
    'prog-teal': 'linear-gradient(135deg,rgba(6,95,70,0.7),rgba(13,144,101,0.9))',
  }

  return (
    <div className="home">

      {/* HERO */}
      <section className="hero">
        <div className={`hero-slide hero-slide-1${activeSlide === 0 ? ' active' : ''}`} />
        <div className={`hero-slide hero-slide-2${activeSlide === 1 ? ' active' : ''}`} />
        <div className={`hero-slide hero-slide-3${activeSlide === 2 ? ' active' : ''}`} />
        <div className="cloud cloud-1" /><div className="cloud cloud-2" />
        <div className="cloud cloud-3" /><div className="cloud cloud-4" /><div className="cloud cloud-5" />
        <div className="hero-grid">
          <div className="hero-content">
            <div className="hero-eyebrow"><span>Preuniversitario PAES 2025</span></div>
            <h1 className="hero-title">Preparación PAES <em>y Apoyo Educativo</em></h1>
            <p className="hero-sub">Acompañamiento personalizado de docentes especializados. Mejora tu NEM, prepárate para la PAES o accede a apoyo sicopedagógico en todos tus cursos.</p>
            <div className="hero-btns">
              <Link to="/contacto" className="btn-gold">Inscribirse Ahora</Link>
              <Link to="/planes" className="btn-outline">Ver Planes</Link>
            </div>
          </div>
          <div className="hero-stats">
            <div className="stat-card"><div><span className="stat-number">500+</span><p className="stat-label">Estudiantes capacitados</p></div></div>
            <div className="stat-card"><div><span className="stat-number">95%</span><p className="stat-label">Satisfacción estudiantil</p></div></div>
            <div className="stat-card"><div><span className="stat-number">4.8★</span><p className="stat-label">Calificación promedio</p></div></div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="stats-bar">
        <div className="stats-bar-inner">
          <div className="sbar-item"><div className="sbar-num">98<span className="sbar-suffix">%</span></div><span className="sbar-label">Aprobación en PAES</span></div>
          <div className="sbar-divider" />
          <div className="sbar-item"><div className="sbar-num">12<span className="sbar-suffix">+</span></div><span className="sbar-label">Años de experiencia</span></div>
          <div className="sbar-divider" />
          <div className="sbar-item"><div className="sbar-num">24/7</div><span className="sbar-label">Soporte disponible</span></div>
        </div>
      </section>

      {/* MATERIAS */}
      <section className="materias">
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="section-header">
            <span className="section-tag">Especialidades</span>
            <h2 className="section-title">Materias & Disciplinas</h2>
            <p className="section-sub">Preparación integral en las principales asignaturas</p>
          </div>
          <div className="materias-grid">
            {[
              { name: 'Matemática', icon: '📐', desc: 'Álgebra, geometría, probabilidad y estadística. Estrategias de resolución rápida.' },
              { name: 'Lenguaje', icon: '📖', desc: 'Comprensión lectora, análisis textual y expresión escrita. Técnicas avanzadas.' },
              { name: 'Historia', icon: '📜', desc: 'Historia de Chile y universal. Contextos y procesos históricos clave.' },
              { name: 'Ciencias', icon: '🔬', desc: 'Biología, física y química. Conceptos, modelos y aplicaciones prácticas.' },
            ].map((materia, idx) => (
              <div key={idx} className="materia-card" onClick={e => (e.currentTarget as HTMLElement).classList.toggle('flipped')}>
                <div className="materia-front">
                  <div className="materia-icon-bg" style={{ background: 'linear-gradient(135deg, var(--blue), #2B60D4)' }}>
                    <span className="materia-big-icon">{materia.icon}</span>
                  </div>
                  <h3 className="materia-name">{materia.name}</h3>
                  <p className="materia-hint">Clic para más</p>
                </div>
                <div className="materia-back">
                  <span className="materia-icon-sm">{materia.icon}</span>
                  <h3 className="materia-name">{materia.name}</h3>
                  <p className="materia-desc">{materia.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROGRAMAS */}
      <section className="programas">
        <div className="section-header reveal">
          <span className="section-tag">Nuestros Planes 2025</span>
          <h2 className="section-title">Elige el camino que te impulsa</h2>
          <p className="section-sub">Haz clic en cada plan para ver opciones y valores</p>
        </div>
        <div className="programas-grid">
          {programas.map(prog => (
            <div key={prog.id} className="prog-wrap reveal">
              <div
                className={`prog-card${flippedCard === prog.id ? ' flipped' : ''}`}
                onClick={() => setFlippedCard(flippedCard === prog.id ? null : prog.id)}
                role="button" tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlippedCard(flippedCard === prog.id ? null : prog.id) } }}
                aria-label={`${prog.backTipo} — clic para ver detalles`}
              >
                <div className="prog-front">
                  <div className={`prog-info ${prog.colorClass}`}>
                    <div className="prog-icon">{prog.icon}</div>
                    <div className="prog-tipo">{prog.tipo}</div>
                    <div className="prog-nombre">{prog.nombre[0]}<br />{prog.nombre[1]}</div>
                    <div className="prog-fecha">{prog.desde}</div>
                    <div className="prog-hint">Clic para ver opciones →</div>
                  </div>
                  <div className="prog-photo" style={{ background: progBg[prog.colorClass] }}>
                    <span style={{ fontSize: '5rem' }}>{prog.icon}</span>
                  </div>
                </div>
                <div className="prog-back">
                  <div className="prog-back-icon">{prog.icon}</div>
                  <div className="prog-back-tipo">{prog.backTipo}</div>
                  <div className="prog-back-nombre">{prog.backNombre}</div>
                  <div className="prog-back-desc">{prog.backDesc}</div>
                  <div className="prog-back-options">
                    {prog.opciones.map((op, i) => (
                      <div key={i} className="prog-back-option">
                        {op.bold ? <strong>{op.label}</strong> : op.label}
                        <span className="prog-back-price" style={op.green ? { color: '#4ade80' } : {}}>{op.price}</span>
                      </div>
                    ))}
                  </div>
                  <div className="prog-back-actions">
                    <Link to="/contacto" className="prog-back-btn" onClick={e => e.stopPropagation()}>{prog.btnLabel}</Link>
                    <button className="prog-back-close" onClick={e => { e.stopPropagation(); setFlippedCard(null) }}>← Volver</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="home-testimonios">
        <div className="section-header reveal">
          <span className="section-tag">Testimonios</span>
          <h2 className="section-title">Lo que dicen nuestros alumnos</h2>
          <p className="section-sub">Experiencias reales de estudiantes que se prepararon con nosotros</p>
          <div className="testim-rating-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1.3rem', color: 'var(--gold)', letterSpacing: '2px' }}>★★★★★</span>
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.5rem', fontWeight: 900, color: 'var(--navy)' }}>4.9</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>/ 5</span>
            </div>
            <div className="testim-sep" />
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Más de <strong style={{ color: 'var(--navy)' }}>120 alumnos</strong> satisfechos</span>
          </div>
        </div>
        <div className="carousel-wrapper">
          <div className="carousel-track" style={{ transform: `translateX(-${currentTestim * 100}%)` }}>
            {testimonios.map((t, i) => (
              <div key={i} className="testim-card">
                <div className="testim-inner">
                  <span className="testim-stars">★★★★★</span>
                  <p className="testim-text">{t.texto}</p>
                  <div className="testim-author">
                    <div className="testim-avatar" style={{ background: t.color }}>{t.inicial}</div>
                    <div><div className="testim-name">{t.nombre}</div><div className="testim-meta">{t.meta}</div></div>
                    <div className="testim-badge">{t.badge}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="carousel-btn carousel-prev" onClick={() => setCurrentTestim(p => (p - 1 + testimonios.length) % testimonios.length)} aria-label="Anterior">&#8592;</button>
          <button className="carousel-btn carousel-next" onClick={() => setCurrentTestim(p => (p + 1) % testimonios.length)} aria-label="Siguiente">&#8594;</button>
          <div className="carousel-dots">
            {testimonios.map((_, i) => (
              <button key={i} className={`dot${i === currentTestim ? ' active' : ''}`} onClick={() => setCurrentTestim(i)} aria-label={`Testimonio ${i + 1}`} />
            ))}
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <Link to="/testimonios" className="btn-navy">Ver todos los testimonios →</Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="home-faq">
        <div className="section-header reveal">
          <span className="section-tag">Preguntas frecuentes</span>
          <h2 className="section-title">Resolvemos tus dudas</h2>
        </div>
        <div className="faq-list reveal" style={{ maxWidth: '800px', margin: '0 auto' }}>
          {faqs.map((faq, idx) => (
            <div key={idx} className={`faq-item${openFaq === idx ? ' open' : ''}`}>
              <button className="faq-question" aria-expanded={openFaq === idx} onClick={() => setOpenFaq(openFaq === idx ? null : idx)}>
                {faq.q}<span className="faq-arrow">▼</span>
              </button>
              <div className="faq-answer">{faq.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="home-cta reveal">
        <div className="home-cta-inner">
          <div className="promo-badge">Cupos limitados</div>
          <h2>¿Por qué inscribirte hoy?</h2>
          <div className="promo-list">
            {['Docentes especializados que rinden la PAES anualmente', 'Clases grabadas disponibles 24/7 para repasar cuando quieras', 'Ensayos tipo PAES con corrección detallada', 'Seguimiento personalizado del progreso de tu hijo', '100% online — sin importar dónde estés en Chile'].map((item, i) => (
              <div key={i} className="promo-item">{item}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '32px' }}>
            <Link to="/contacto" className="btn-gold">Inscribirme ahora</Link>
            <a href="https://wa.me/56933325788?text=Hola,%20me%20interesa%20el%20preuniversitario%20Miraza" className="btn-wa" target="_blank" rel="noopener noreferrer">💬 Escribir por WhatsApp</a>
          </div>
        </div>
      </section>

    </div>
  )
}

export default Home
