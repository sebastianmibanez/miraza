import { useState, useEffect, useCallback, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useVisibleInterval } from '../hooks/useVisibleInterval'
import './Home.css'

const DEADLINE_CV = new Date('2026-05-03T23:59:00')

function getTimeLeft(target: Date) {
  const diff = target.getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

function useCountdown(target: Date) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(target))
  useEffect(() => {
    const t = setInterval(() => setTimeLeft(getTimeLeft(target)), 1000)
    return () => clearInterval(t)
  }, [target])
  return timeLeft
}

function CountBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="cbox">
      <span className="cbox-num">{String(value).padStart(2, '0')}</span>
      <span className="cbox-label">{label}</span>
    </div>
  )
}

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
  { id: 'paes',  icon: '🎯', color: '#1B4DB8', nombre: 'Preparación PAES',     tagline: 'Para 4° Medio y egresados',  desde: 'desde $54.990/mes',    puntos: ['Todas las pruebas PAES 2025', 'Ensayos semanales corregidos', 'Grupos máx. 12 estudiantes'] },
  { id: 'nem',   icon: '📊', color: '#B45309', nombre: 'Mejora tu NEM',         tagline: 'Refuerzo por materia',       desde: 'desde $34.990/mes',    puntos: ['Diagnóstico gratuito incluido', 'Por materia o pack completo', 'Seguimiento de notas'] },
  { id: 'nivel', icon: '📚', color: '#0A1F44', nombre: 'Nivelación',            tagline: 'Básica y Media',             desde: 'desde $44.990/mes',    puntos: ['Enseñanza básica o media', 'Recupera la base académica', 'Avanza a tu ritmo'] },
  { id: 'espec', icon: '🧩', color: '#065F46', nombre: 'Clases Especializadas', tagline: 'Apoyo diferenciado',         desde: 'Diagnóstico gratuito', puntos: ['Para necesidades de aprendizaje', 'Metodología 100% adaptada', 'Apoyo sicopedagógico'] },
]

const faqs = [
  { q: '¿Qué es Preuniversitario Miraza?', a: 'Miraza es un preuniversitario 100% online especializado en preparación PAES, nivelación de estudios y apoyo sicopedagógico. Ofrecemos clases en vivo y grabadas, material actualizado y seguimiento personalizado.' },
  { q: '¿Cuáles son los programas disponibles?', a: 'Contamos con cuatro programas: Preparación PAES, Mejora tu NEM (por materia o todas), Nivelación de Estudios (Básica y Media) y Clases Especializadas para estudiantes con necesidades de aprendizaje. Todos incluyen diagnóstico inicial.' },
  { q: '¿Cómo son las clases? ¿Son en vivo o grabadas?', a: 'Las clases son en vivo a través de Google Meet y quedan grabadas en Google Classroom para que puedas revisarlas cuando quieras. Todo el material, guías y ensayos también están disponibles en la plataforma 24/7.' },
  { q: '¿Cómo me inscribo?', a: 'Completa el formulario de contacto y te contactamos en menos de 24 horas por WhatsApp o correo para confirmar tu cupo y resolver dudas. También puedes escribirnos directamente al WhatsApp si tienes preguntas antes de inscribirte.' },
  { q: '¿Cuántos alumnos hay por clase?', a: 'Trabajamos en grupos reducidos para garantizar atención personalizada. Siempre priorizamos que el docente pueda hacer seguimiento individual a cada estudiante. No somos una clase masiva sin retroalimentación.' },
]

const docentes = [
  { nombre: 'Prof. A. Ramírez', materia: 'Matemática M1 y M2', exp: '8 años preparando para la PAES', inicial: 'A', color: 'linear-gradient(135deg,#1B4DB8,#3A6FD8)', logro: 'Rinde la PAES cada año junto a sus alumnos. Sus grupos promediaron +78 puntos en M2 en 2024.' },
  { nombre: 'Prof. C. Soto', materia: 'Lenguaje y Comprensión Lectora', exp: '6 años preparando para la PAES', inicial: 'C', color: 'linear-gradient(135deg,#065F46,#059669)', logro: 'Método propio de lectura eficiente. Puntaje promedio de sus alumnos: 720+ puntos en Lenguaje.' },
  { nombre: 'Prof. R. Vargas', materia: 'Historia y Ciencias Sociales', exp: '10 años de docencia especializada', inicial: 'R', color: 'linear-gradient(135deg,#B45309,#D97706)', logro: 'Magíster en Educación. Sus alumnos mejoran consistentemente +60 puntos en Historia.' },
]

function Home() {
  const [activeSlide, setActiveSlide]     = useState(0)
  const [openFaq, setOpenFaq]             = useState<number | null>(null)
  const [heroNombre, setHeroNombre]       = useState('')
  const [heroPlan, setHeroPlan]           = useState('')
  const countdown = useCountdown(DEADLINE_CV)
  const advanceSlide = useCallback(() => setActiveSlide(p => (p + 1) % 3), [])
  useVisibleInterval(advanceSlide, 8000)

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
            <div className="hero-social-proof">
              <div className="hero-sp-avatars">
                {['S','D','V','M'].map((l, i) => (
                  <div key={i} className="hero-sp-avatar" style={{ background: ['#1B4DB8','#5B21B6','#065F46','#B45309'][i], zIndex: 4 - i }}>{l}</div>
                ))}
              </div>
              <span className="hero-sp-text"><strong>+500 alumnos</strong> ya confían en Miraza</span>
            </div>

            <div className="hero-countdown">
              <div className="hero-cd-label">🎓 Convocatoria docentes · cierra el 3 de Mayo</div>
              <div className="hero-cd-boxes">
                <CountBox value={countdown.days}    label="Días" />
                <div className="dc-sep">:</div>
                <CountBox value={countdown.hours}   label="Horas" />
                <div className="dc-sep">:</div>
                <CountBox value={countdown.minutes} label="Min" />
                <div className="dc-sep">:</div>
                <CountBox value={countdown.seconds} label="Seg" />
              </div>
            </div>
          </div>

          <div className="hero-form-card">
            <div className="hero-form-header">
              <div className="hero-form-eyebrow">Cupos 2025 disponibles</div>
              <h3 className="hero-form-title">Consulta sin compromiso</h3>
              <p className="hero-form-sub">Te respondemos en menos de 1 hora por WhatsApp</p>
            </div>
            <div className="hero-cupos-wrap">
              <div className="hero-cupos-bar"><div className="hero-cupos-fill" /></div>
              <p className="hero-cupos-text"><strong>8 de 12 cupos</strong> ocupados para el grupo de Mayo</p>
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
            <button key={i} className={`hero-dot${activeSlide === i ? ' active' : ''}`} onClick={() => setActiveSlide(i)} aria-label={`Slide ${i + 1}`} />
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
          <div className="sbar-item"><div className="sbar-num">500<span className="sbar-suffix">+</span></div><span className="sbar-label">Estudiantes formados</span></div>
          <div className="sbar-divider" />
          <div className="sbar-item"><div className="sbar-num">24/7</div><span className="sbar-label">Soporte disponible</span></div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="como-funciona reveal">
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="section-header">
            <span className="section-tag">Simple y rápido</span>
            <h2 className="section-title">¿Cómo funciona Miraza?</h2>
            <p className="section-sub">Cuatro pasos — y en cada uno hacemos las cosas diferente</p>
          </div>
          <div className="pasos-grid">
            {[
              { num: '01', icon: '🔍', titulo: 'Diagnóstico gratuito',  desc: 'Evaluamos tu nivel real en cada materia antes de empezar. Sin costo, sin compromiso.', tag: 'Gratis · Sin compromiso' },
              { num: '02', icon: '📋', titulo: 'Plan personalizado',    desc: 'Diseñamos el programa exacto para ti: materias, horario y ritmo. No hay dos planes iguales.', tag: 'No usamos planes genéricos' },
              { num: '03', icon: '🎓', titulo: 'Clases en vivo',        desc: 'Grupos de máx. 12 alumnos con docentes que rinden la PAES cada año. Quedan grabadas 24/7.', tag: 'Máx. 12 alumnos · Grabadas 24/7' },
              { num: '04', icon: '📈', titulo: 'Seguimiento continuo',  desc: 'Ensayos semanales tipo PAES con corrección individual. Tu profesor ajusta el plan si es necesario.', tag: 'Ensayos semanales · Corrección individual' },
            ].map((p, i) => (
              <div key={i} className="paso-card">
                <div className="paso-num">{p.num}</div>
                <div className="paso-icon">{p.icon}</div>
                <h3 className="paso-titulo">{p.titulo}</h3>
                <p className="paso-desc">{p.desc}</p>
                <div className="paso-tag">{p.tag}</div>
                {i < 3 && <div className="paso-arrow">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DOCENTES */}
      <section className="docentes-section reveal">
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="section-header">
            <span className="section-tag">Nuestro equipo</span>
            <h2 className="section-title">Conoce a tus profesores</h2>
            <p className="section-sub">Especialistas con años de experiencia preparando a los mejores puntajes PAES</p>
          </div>
          <div className="docentes-grid">
            {docentes.map((d, i) => (
              <div key={i} className="docente-card">
                <div className="docente-top">
                  <div className="docente-avatar" style={{ background: d.color }}>{d.inicial}</div>
                  <div className="docente-header-info">
                    <div className="docente-nombre">{d.nombre}</div>
                    <div className="docente-materia">{d.materia}</div>
                    <div className="docente-exp">{d.exp}</div>
                  </div>
                </div>
                <p className="docente-logro">"{d.logro}"</p>
                <div className="docente-stars">★★★★★</div>
              </div>
            ))}
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
              <div className="plan-cta-wrap">
                <Link to="/contacto" className="plan-cta-btn">Empezar diagnóstico gratis</Link>
              </div>
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
        <div className="testim-grid reveal">
          {testimonios.map((t, i) => (
            <div key={i} className="testim-grid-card">
              <span className="testim-stars">★★★★★</span>
              <p className="testim-text">"{t.texto}"</p>
              <div className="testim-author">
                <div className="testim-avatar" style={{ background: t.color }}>{t.inicial}</div>
                <div><div className="testim-name">{t.nombre}</div><div className="testim-meta">{t.meta}</div></div>
                <div className="testim-badge">{t.badge}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <Link to="/testimonios" className="btn-navy">Ver todos los testimonios →</Link>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section className="cta-final reveal">
        <div className="cta-final-inner">
          <div className="cta-final-badge">Cupos limitados · Mayo 2025</div>
          <h2 className="cta-final-title">¿Listo para cambiar tu puntaje?</h2>
          <p className="cta-final-sub">Comienza con un diagnóstico gratuito. Sin compromiso, sin tarjeta de crédito.</p>
          <div className="cta-final-features">
            {['Diagnóstico inicial gratuito', 'Plan personalizado en 24 hrs', 'Primera clase sin costo', 'Grupos reducidos garantizados'].map((f, i) => (
              <div key={i} className="cta-feat-item"><span className="cta-feat-check">✓</span>{f}</div>
            ))}
          </div>
          <a
            href="https://wa.me/56933325788?text=Hola%2C%20quiero%20comenzar%20mi%20diagnóstico%20gratuito%20con%20Miraza"
            target="_blank"
            rel="noreferrer"
            className="btn-wa-big"
          >
            Quiero mi diagnóstico gratuito →
          </a>
          <p className="cta-final-trust">Te respondemos en menos de 1 hora · Lunes a Sábado de 9:00 a 20:00 hrs</p>
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
