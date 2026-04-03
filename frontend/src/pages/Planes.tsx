import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Planes.css'

interface PlanOption { title: string; desc: string; icon: string }
interface Plan {
  id: string
  num: string
  name: string
  icon: string
  tagline: string
  badge?: string
  options: PlanOption[]
  features: string[]
  ctaPrimary: { label: string; to: string }
  ctaSecondary: { label: string; to: string }
}

function Planes() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const planes: Plan[] = [
    {
      id: 'paes',
      num: '01',
      name: 'Preparación PAES',
      icon: '🎯',
      tagline: 'Maximiza tu puntaje con estrategias probadas y simulacros reales de la prueba nacional.',
      badge: '🔥 Más popular',
      options: [
        { icon: '📐', title: 'M1 — Competencia Matemática', desc: 'Álgebra, geometría, estadística y probabilidad para 3ro y 4to medio.' },
        { icon: '📖', title: 'M2 — Matemática Avanzada', desc: 'Para quienes buscan carreras STEM. Cálculo, álgebra lineal y funciones.' },
        { icon: '✍️', title: 'Comprensión Lectora', desc: 'Técnicas de lectura veloz, comprensión inferencial y tipos de texto.' },
        { icon: '🔬', title: 'Ciencias (Física/Química/Bio)', desc: 'Elige tu electivo y profundiza con guías focalizadas.' },
      ],
      features: [
        'Simulacros mensuales con corrección detallada',
        'Clases en vivo 3 veces por semana',
        'Acceso a banco de más de 2.000 preguntas',
        'Seguimiento de progreso personalizado',
        'Grupos reducidos (máx. 12 estudiantes)',
      ],
      ctaPrimary: { label: 'Inscribirme', to: '/contacto' },
      ctaSecondary: { label: 'Ver aranceles', to: '/aranceles' },
    },
    {
      id: 'nem',
      num: '02',
      name: 'Mejora tu NEM',
      icon: '📈',
      tagline: 'Refuerza tus notas de enseñanza media con apoyo constante y tutorías personalizadas por materia.',
      options: [
        { icon: '📚', title: 'Por Materia', desc: 'Elige una o más asignaturas específicas: Matemática, Lenguaje, Historia o Ciencias.' },
        { icon: '🎒', title: 'Todas las Materias', desc: 'Plan integral que cubre el currículo completo. Ideal para subir el promedio general.' },
        { icon: '🔍', title: 'Diagnóstico Gratuito', desc: 'Evaluación inicial para identificar brechas y diseñar tu plan de estudio a medida.' },
      ],
      features: [
        'Clases de refuerzo 2 veces por semana',
        'Tareas y guías semanales corregidas',
        'Comunicación directa con el profesor',
        'Reportes de avance para apoderados',
        'Compatible con horario escolar',
      ],
      ctaPrimary: { label: 'Inscribirme', to: '/contacto' },
      ctaSecondary: { label: 'Ver aranceles', to: '/aranceles' },
    },
    {
      id: 'nivel',
      num: '03',
      name: 'Nivelación de Estudios',
      icon: '🏗️',
      tagline: 'Llena los vacíos curriculares y avanza con confianza desde básica hasta enseñanza media.',
      options: [
        { icon: '🔢', title: 'Enseñanza Básica', desc: 'Refuerzo en comprensión lectora, matemática básica y habilidades fundamentales (1° a 8° básico).' },
        { icon: '📓', title: 'Enseñanza Media', desc: 'Nivelación curricular para 1° a 4° medio, coordinada con el colegio si es necesario.' },
      ],
      features: [
        'Diagnóstico inicial incluido',
        'Ritmo adaptado al estudiante',
        'Profesores con especialidad en cada nivel',
        'Material didáctico personalizado',
        'Informe mensual de avance',
        'Apoyo sicopedagógico disponible',
      ],
      ctaPrimary: { label: 'Inscribirme', to: '/contacto' },
      ctaSecondary: { label: 'Apoyo Sicoped.', to: '/apoyo' },
    },
    {
      id: 'espec',
      num: '04',
      name: 'Clases Especializadas',
      icon: '💡',
      tagline: 'Metodología diferenciada para estudiantes con necesidades educativas especiales, respaldada por nuestra sicopedagoga.',
      options: [
        { icon: '🧩', title: 'NEE — Necesidades Educativas', desc: 'Clases adaptadas para estudiantes con dislexia, TDAH, TEA u otras dificultades de aprendizaje.' },
        { icon: '🩺', title: 'Diagnóstico Sicopedagógico', desc: 'Evaluación profesional para identificar el perfil de aprendizaje y trazar un plan de intervención.' },
      ],
      features: [
        'Coordinación entre sicopedagoga y docente',
        'Materiales adaptados y accesibles',
        'Sesiones individuales o grupos muy pequeños',
        'Técnicas multisensoriales de aprendizaje',
        'Acompañamiento familiar incluido',
        'Derivación a especialistas si es necesario',
      ],
      ctaPrimary: { label: 'Conocer más', to: '/apoyo' },
      ctaSecondary: { label: 'Solicitar diagnóstico', to: '/contacto' },
    },
  ]

  const faqs = [
    {
      q: '¿Puedo cambiar de plan durante el año?',
      a: 'Sí. Si sientes que necesitas una modalidad diferente, puedes hablar con tu profesor o coordinadora y evaluamos juntos el cambio de plan. No hay penalización por cambio; simplemente se ajusta el contrato mensual.',
    },
    {
      q: '¿Cuántos estudiantes hay por clase?',
      a: 'Trabajamos con grupos reducidos de máximo 12 estudiantes en PAES y NEM, y máximo 6 en Nivelación y Clases Especializadas. Esto asegura atención personalizada y que el profesor pueda resolver las dudas de cada alumno.',
    },
    {
      q: '¿En qué plataforma se realizan las clases?',
      a: 'Usamos Google Meet para las clases en vivo y un canal privado de WhatsApp o Discord para consultas entre sesiones. El material se comparte vía Google Drive o un enlace directo. Solo necesitas un dispositivo con conexión a internet.',
    },
    {
      q: '¿Cuánto tiempo dura cada plan?',
      a: 'Los planes son mensuales y renovables. La Preparación PAES tiene una ruta recomendada de 6 a 9 meses antes del examen. Los demás planes se adaptan al ritmo y objetivos del estudiante, sin plazos mínimos obligatorios.',
    },
    {
      q: '¿Cómo sé qué plan es el mejor para mí?',
      a: 'Te recomendamos empezar con nuestro diagnóstico gratuito. En una sesión de 30 minutos evaluamos tu nivel actual, tus metas y tu disponibilidad horaria, y te orientamos al plan que más te conviene, sin ningún compromiso.',
    },
  ]

  const compareRows = [
    { feature: 'Clases en vivo',          paes: true,  nem: true,  nivel: true,  espec: true  },
    { feature: 'Diagnóstico inicial',      paes: true,  nem: true,  nivel: true,  espec: true  },
    { feature: 'Material de estudio',      paes: true,  nem: true,  nivel: true,  espec: true  },
    { feature: 'Simulacros PAES',          paes: true,  nem: false, nivel: false, espec: false },
    { feature: 'Reporte para apoderados',  paes: false, nem: true,  nivel: true,  espec: true  },
    { feature: 'Apoyo sicopedagógico',     paes: false, nem: false, nivel: 'Opcional', espec: 'Incluido' },
    { feature: 'Plan personalizado',       paes: false, nem: true,  nivel: true,  espec: true  },
    { feature: '100% online',              paes: true,  nem: true,  nivel: true,  espec: true  },
  ]

  return (
    <>
      {/* PAGE HERO */}
      <section className="page-hero">
        <div className="page-hero-inner">
          <div className="page-hero-tag">Formación Personalizada</div>
          <h1>Nuestros <em>Planes</em></h1>
          <p>Desde la preparación PAES hasta la nivelación escolar, tenemos el programa que se adapta a tus metas y ritmo de aprendizaje.</p>
        </div>
      </section>

      <div className="planes-wrap">

        {/* SECTION HEADER */}
        <div className="section-header reveal">
          <span className="section-tag">4 programas disponibles</span>
          <h2 className="section-title">Elige el plan <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>correcto</em> para ti</h2>
          <p className="section-sub">Todos nuestros planes incluyen profesores especializados, clases en vivo y material de apoyo.</p>
        </div>

        {/* PLAN CARDS */}
        <div className="planes-grid">
          {planes.map(plan => (
            <div key={plan.id} className={`plan-card ${plan.id} reveal`}>
              <div className="plan-card-header" style={{ position: 'relative' }}>
                {plan.badge && <span className="plan-badge">{plan.badge}</span>}
                <div className="plan-num">{plan.num}</div>
                <span className="plan-icon">{plan.icon}</span>
                <h2 className="plan-name">{plan.name}</h2>
                <p className="plan-tagline">{plan.tagline}</p>
              </div>
              <div className="plan-card-body">
                <ul className="plan-options">
                  {plan.options.map((opt, idx) => (
                    <li key={idx}>
                      <span className="opt-icon">{opt.icon}</span>
                      <div><strong>{opt.title}</strong>{opt.desc}</div>
                    </li>
                  ))}
                </ul>
                <ul className="plan-features">
                  {plan.features.map((f, idx) => <li key={idx}>{f}</li>)}
                </ul>
                <div className="plan-cta">
                  <Link to={plan.ctaPrimary.to} className="btn-plan primary">{plan.ctaPrimary.label}</Link>
                  <Link to={plan.ctaSecondary.to} className="btn-plan secondary">{plan.ctaSecondary.label}</Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* COMPARISON TABLE */}
        <div className="compare-section reveal">
          <div className="section-header" style={{ marginBottom: '36px' }}>
            <span className="section-tag">Comparación</span>
            <h2 className="section-title">¿Qué incluye cada plan?</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="compare-table">
              <thead>
                <tr>
                  <th style={{ width: '34%' }}>Característica</th>
                  <th>Prep. PAES</th>
                  <th>Mejora NEM</th>
                  <th>Nivelación</th>
                  <th>Especializado</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row, idx) => (
                  <tr key={idx}>
                    <td className="feature-name">{row.feature}</td>
                    {([row.paes, row.nem, row.nivel, row.espec] as (boolean | string)[]).map((val, i) => (
                      <td key={i} className={val === true ? 'check' : val === false ? 'cross' : 'check'}>
                        {val === true ? '✓' : val === false ? '—' : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="planes-faq reveal">
          <div className="section-header" style={{ marginBottom: '36px' }}>
            <span className="section-tag">Preguntas frecuentes</span>
            <h2 className="section-title">Dudas sobre los planes</h2>
          </div>
          {faqs.map((faq, idx) => (
            <div key={idx} className={`faq-item${openFaq === idx ? ' open' : ''}`}>
              <button
                className="faq-question"
                aria-expanded={openFaq === idx}
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                {faq.q}
                <span className="faq-arrow">▼</span>
              </button>
              <div className="faq-answer">{faq.a}</div>
            </div>
          ))}
        </div>

        {/* CTA BANNER */}
        <div className="planes-cta-banner reveal">
          <h2>¿No sabes por dónde empezar?</h2>
          <p>Agenda una sesión de orientación gratuita y te ayudamos a elegir el plan ideal para tus objetivos.</p>
          <div className="cta-btns">
            <Link to="/contacto" className="btn-gold">Quiero orientación gratuita</Link>
            <Link to="/aranceles" className="btn-outline">Ver aranceles →</Link>
          </div>
        </div>

      </div>
    </>
  )
}

export default Planes
