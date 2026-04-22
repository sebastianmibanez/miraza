import { useState, useEffect, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import './Home.css'

const testimonios = [
  { texto: 'Entré con muchísimo miedo a la Matemática y salí con estrategias claras para cada tipo de pregunta. Subí más de 70 puntos en mis ensayos durante el año. Los profes explican diferente, te hacen entender de verdad.', nombre: 'Sofía M.', meta: '4° Medio · Matemática M1 y M2', color: 'linear-gradient(135deg,#1B4DB8,#3A6FD8)', inicial: 'S', badge: 'PAES 2024' },
  { texto: 'El profesor de Lenguaje me cambió completamente la forma de leer. Aprendí que no hay que leer todo, sino leer con intención. Con esa sola estrategia mejoré mucho en los ensayos. Lo recomiendo al 100%.', nombre: 'Diego R.', meta: 'Egresado · Lenguaje y Comunicación', color: 'linear-gradient(135deg,#5B21B6,#7C3AED)', inicial: 'D', badge: 'PAES 2024' },
  { texto: 'Historia era mi punto más débil y gracias a Miraza pude estructurar todo el contenido de una manera que nunca olvidé. El seguimiento personalizado marcó la diferencia: sentí que les importaba mi progreso de verdad.', nombre: 'Valentina P.', meta: '4° Medio · Historia y Ciencias', color: 'linear-gradient(135deg,#065F46,#059669)', inicial: 'V', badge: 'PAES 2024' },
  { texto: 'Lo que más valoro de Miraza es que no eres un número. Te monitorean, te preguntan cómo vas, ajustan el ritmo si necesitas. Los ensayos tipo PAES me prepararon mentalmente para el día de la prueba. ¡Entré sin nervios!', nombre: 'Matías C.', meta: 'Egresado · Todas las materias', color: 'linear-gradient(135deg,#B45309,#D97706)', inicial: 'M', badge: 'PAES 2024' },
  { texto: 'Mi hijo tiene dislexia y siempre había tenido malas experiencias. En Miraza encontramos un equipo que realmente entendió su forma de aprender. Los resultados al final del año fueron increíbles.', nombre: 'Claudia M.', meta: 'Apoderada · Apoyo Sicopedagógico', color: 'linear-gradient(135deg,#5B21B6,#7C3AED)', inicial: 'C', badge: '2024' },
]

const heroSlides = [
  {
    eyebrow: 'Preuniversitario PAES 2025',
    title: 'Máxima preparación para la',
    em: 'PAES 2025',
    sub: 'Docentes especializados que rinden la PAES cada año. Ensayos semanales, grupos reducidos y seguimiento personalizado.',
    tag: '🎯 Plan estrella · desde $54.990/mes',
  },
  {
    eyebrow: 'Mejora tu NEM',
    title: 'Sube tus notas,',
    em: 'sube tu puntaje',
    sub: 'Refuerzo académico por materia durante el año escolar. Diagnóstico inicial gratuito para identificar tus puntos de mejora.',
    tag: '📊 Desde $34.990/mes · Diagnóstico gratis',
  },
  {
    eyebrow: 'Apoyo especializado',
    title: 'Cada estudiante',
    em: 'aprende diferente',
    sub: 'Atención sicopedagógica y metodología adaptada para estudiantes con necesidades de aprendizaje. 100% personalizado.',
    tag: '🧩 Diagnóstico inicial gratuito',
  },
]

const planes = [
  { id: 'paes',  icon: '🎯', color: '#1B4DB8', nombre: 'Preparación PAES',      tagline: 'Para 4° Medio y egresados',  desde: 'desde $54.990/mes',     puntos: ['Todas las pruebas PAES 2025', 'Ensayos semanales corregidos', 'Grupos máx. 12 estudiantes'] },
  { id: 'nem',   icon: '📊', color: '#B45309', nombre: 'Mejora tu NEM',          tagline: 'Refuerzo por materia',       desde: 'desde $34.990/mes',     puntos: ['Diagnóstico gratuito incluido', 'Por materia o pack completo', 'Seguimiento de notas'] },
  { id: 'nivel', icon: '📚', color: '#0A1F44', nombre: 'Nivelación',             tagline: 'Básica y Media',             desde: 'desde $44.990/mes',     puntos: ['Enseñanza básica o media', 'Recupera la base académica', 'Avanza a tu ritmo'] },
  { id: 'espec', icon: '🧩', color: '#065F46', nombre: 'Clases Especializadas',  tagline: 'Apoyo diferenciado',         desde: 'Diagnóstico gratuito',  puntos: ['Para necesidades de aprendizaje', 'Metodología 100% adaptada', 'Apoyo sicopedagógico'] },
]

const faqs = [
  { q: '¿Qué es Preuniversitario Miraza?', a: 'Miraza es un preuniversitario 100% online especializado en preparación PAES, nivelación de estudios y apoyo sicopedagógico. Ofrecemos clases en vivo y grabadas, material actualizado y seguimiento personalizado.' },
  { q: '¿Cuáles son los programas disponibles?', a: 'Contamos con cuatro programas: Preparación PAES, Mejora tu NEM (por materia o todas), Nivelación de Estudios (Básica y Media) y Clases Especializadas para estudiantes con necesidades de aprendizaje. Todos incluyen diagnóstico inicial.' },
  { q: '¿Cómo son las clases? ¿Son en vivo o grabadas?', a: 'Las clases son en vivo a través de Google Meet y quedan grabadas en Google Classroom para que puedas revisarlas cuando quieras. Todo el material, guías y ensayos también están disponibles en la plataforma 24/7.' },
  { q: '¿Cómo me inscribo?', a: 'Completa el formulario de contacto y te contactamos en menos de 24 horas por WhatsApp o correo para confirmar tu cupo y resolver dudas. También puedes escribirnos directamente al WhatsApp si tienes preguntas antes de inscribirte.' },
  { q: '¿Cuántos alumnos hay por clase?', a: 'Trabajamos en grupos reducidos para garantizar atención personalizada. Siempre priorizamos que el docente pueda hacer seguimiento individual a cada estudiante. No somos una clase masiva sin retroalimentación.' },
]

function Home() {
  const [activeSlide, setActiveSlide]   = useState(0)
  const [currentTestim, setCurrentTestim] = useState(0)
  const [openFaq, setOpenFaq]           = useState<number | null>(null)
  const [heroNombre, setHeroNombre] = useState('')
  const [heroPlan, setHeroPlan]     = useState('')

  useEffect(() => {
    const t = setInterval(() => setActiveSlide(p => (p + 1) % 3), 8000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setCurrentTestim(p => (p + 1) % testimonios.length), 5200)
    return () => clearInterval(t)
  }, [])

  function handleHeroForm(e: FormEvent) {
    e.preventDefault()
    const plan = heroPlan || 'uno de los programas'
    const msg  = `Hola, soy ${heroNombre.trim() || 'un estudiante'} y me interesa ${plan}. ¿Me pueden dar más información?`
    window.open(`https://wa.me/56933325788?text=${encodeURIComponent(msg)}`, '_blank')
    setHeroNombre('')
    setHeroPlan('')
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
            <div className="hero-eyebrow">
              <span key={activeSlide} className="hero-eyebrow-text">{heroSlides[activeSlide].eyebrow}</span>
            </div>
            <h1 className="hero-title" key={`title-${activeSlide}`}>
              {heroSlides[activeSlide].title} <em>{heroSlides[activeSlide].em}</em>
            </h1>
            <p className="hero-sub" key={`sub-${activeSlide}`}>{heroSlides[activeSlide].sub}</p>
            <div className="hero-slide-tag" key={`tag-${activeSlide}`}>{heroSlides[activeSlide].tag}</div>
            <div className="hero-btns">
              <Link to="/contacto" className="btn-gold">Inscribirse Ahora</Link>
              <Link to="/planes" className="btn-outline">Ver Planes</Link>
            </div>
          </div>
          <div className="hero-form-card">
            <div className="hero-form-header">
              <div className="hero-form-eyebrow">Cupos 2025 disponibles</div>
              <h3 className="hero-form-title">Consulta sin compromiso</h3>
              <p className="hero-form-sub">Te respondemos en menos de 1 hora por WhatsApp</p>
            </div>
            <form className="hero-quick-form" onSubmit={handleHeroForm} noValidate>
              <input
                type="text"
                className="hero-input"
                placeholder="Tu nombre"
                value={heroNombre}
                onChange={e => setHeroNombre(e.target.value)}
                required
              />
              <select
                className="hero-select"
                value={heroPlan}
                onChange={e => setHeroPlan(e.target.value)}
                required
              >
                <option value="">¿Qué plan te interesa?</option>
                <option value="Preparación PAES">Preparación PAES</option>
                <option value="Mejora tu NEM">Mejora tu NEM</option>
                <option value="Nivelación de Estudios">Nivelación de Estudios</option>
                <option value="Clases Especializadas">Clases Especializadas</option>
              </select>
              <button type="submit" className="hero-form-btn">
                Consultar ahora →
              </button>
            </form>
            <div className="hero-form-stats">
              <div className="hfs-item"><strong>500+</strong><span>estudiantes</span></div>
              <div className="hfs-div" />
              <div className="hfs-item"><strong>4.9★</strong><span>calificación</span></div>
              <div className="hfs-div" />
              <div className="hfs-item"><strong>24/7</strong><span>soporte</span></div>
            </div>
          </div>
        </div>
        <div className="hero-dots">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              className={`hero-dot${activeSlide === i ? ' active' : ''}`}
              onClick={() => setActiveSlide(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
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

      {/* LOGROS */}
      <section className="logros-section reveal">
        <div className="logros-inner">
          <span className="logros-eyebrow">Resultados reales · PAES 2024</span>
          <div className="logros-track">
            {[
              { inicial: 'S', color: '#1B4DB8', nombre: 'Sofía M.',     logro: '+70 puntos en Matemática',          plan: 'PAES' },
              { inicial: 'D', color: '#5B21B6', nombre: 'Diego R.',     logro: 'Ingresó a Ingeniería Civil',         plan: 'PAES' },
              { inicial: 'V', color: '#065F46', nombre: 'Valentina P.', logro: 'Alcanzó 850+ puntos PAES',          plan: 'PAES' },
              { inicial: 'M', color: '#B45309', nombre: 'Matías C.',    logro: 'Puntaje sobre 820 en todas las pruebas', plan: 'PAES' },
              { inicial: 'C', color: '#5B21B6', nombre: 'Claudia M.',   logro: 'Plan especializado para su hijo',   plan: 'Apoyo' },
            ].map((l, i) => (
              <div key={i} className="logro-card">
                <div className="logro-avatar" style={{ background: l.color }}>{l.inicial}</div>
                <div className="logro-info">
                  <div className="logro-nombre">{l.nombre}</div>
                  <div className="logro-texto">{l.logro}</div>
                </div>
                <span className="logro-badge">{l.plan}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="como-funciona reveal">
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="section-header">
            <span className="section-tag">Simple y rápido</span>
            <h2 className="section-title">¿Cómo funciona Miraza?</h2>
            <p className="section-sub">Cuatro pasos para empezar a mejorar</p>
          </div>
          <div className="pasos-grid">
            {[
              { num: '01', icon: '🔍', titulo: 'Diagnóstico gratuito',  desc: 'Evaluamos tu nivel actual en cada materia para conocer tus fortalezas y puntos de mejora.' },
              { num: '02', icon: '📋', titulo: 'Plan personalizado',    desc: 'Diseñamos el programa exacto que necesitas según tu nivel, metas y disponibilidad horaria.' },
              { num: '03', icon: '🎓', titulo: 'Clases en vivo',        desc: 'Grupos reducidos con docentes especializados. Las clases quedan grabadas para repasar cuando quieras.' },
              { num: '04', icon: '📈', titulo: 'Seguimiento continuo',  desc: 'Ensayos semanales tipo PAES, corrección detallada y monitoreo permanente de tu progreso.' },
            ].map((p, i) => (
              <div key={i} className="paso-card">
                <div className="paso-num">{p.num}</div>
                <div className="paso-icon">{p.icon}</div>
                <h3 className="paso-titulo">{p.titulo}</h3>
                <p className="paso-desc">{p.desc}</p>
                {i < 3 && <div className="paso-arrow">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* METODOLOGIA */}
      <section className="metodologia reveal">
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="section-header">
            <span className="section-tag" style={{ color: 'var(--gold)' }}>Nuestro método</span>
            <h2 className="section-title" style={{ color: 'var(--white)' }}>El Método Miraza 360°</h2>
            <p className="section-sub" style={{ color: 'rgba(255,255,255,0.5)' }}>Cuatro pilares que garantizan resultados reales</p>
          </div>
          <div className="metodo-grid">
            {[
              { icon: '📚', color: '#1B4DB8', titulo: 'Contenidos actualizados',  desc: 'Material alineado 100% al currículo PAES 2025, actualizado anualmente por docentes que rinden la prueba cada año.' },
              { icon: '✏️', color: '#B45309', titulo: 'Ejercitación permanente',  desc: 'Banco de más de 2.000 preguntas tipo PAES. Práctica diaria con corrección inmediata y análisis de errores.' },
              { icon: '📊', color: '#065F46', titulo: 'Evaluación y ensayos',     desc: 'Ensayos mensuales que simulan las condiciones reales de la PAES. Ranking y análisis de desempeño por materia.' },
              { icon: '🤝', color: '#5B21B6', titulo: 'Orientación y apoyo',      desc: 'Seguimiento personalizado de cada docente. Cada alumno tiene un plan de mejora y atención individual entre clases.' },
            ].map((m, i) => (
              <div key={i} className="metodo-card">
                <div className="metodo-icon-wrap" style={{ background: m.color }}>
                  <span className="metodo-icon">{m.icon}</span>
                </div>
                <div className="metodo-num">0{i + 1}</div>
                <h3 className="metodo-titulo">{m.titulo}</h3>
                <p className="metodo-desc">{m.desc}</p>
              </div>
            ))}
          </div>
          <div className="metodo-center-badge">
            <span>Método</span>
            <strong>Miraza</strong>
            <span>360°</span>
          </div>
        </div>
      </section>

      {/* PLANES */}
      <section className="planes-section reveal">
        <div className="section-header reveal">
          <span className="section-tag">Nuestros Planes 2025</span>
          <h2 className="section-title">Un programa para cada objetivo</h2>
          <p className="section-sub">Elige el que más se adapta a ti — todos incluyen diagnóstico inicial gratuito</p>
        </div>
        <div className="planes-grid">
          {planes.map((plan, i) => (
            <div key={plan.id} className="plan-card reveal" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="plan-card-top" style={{ background: plan.color }}>
                <span className="plan-icon">{plan.icon}</span>
                <div>
                  <div className="plan-nombre">{plan.nombre}</div>
                  <div className="plan-tagline">{plan.tagline}</div>
                </div>
                <div className="plan-precio">{plan.desde}</div>
              </div>
              <ul className="plan-puntos">
                {plan.puntos.map((p, j) => <li key={j}>{p}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="planes-cta reveal">
          <Link to="/planes" className="btn-planes-full">Ver todos los planes y precios →</Link>
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

    </div>
  )
}

export default Home
