import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Aranceles.css'

interface PricingPlan {
  id: string
  planLabel: string
  name: string
  price: string
  period: string
  note: string
  featured?: boolean
  badge?: string
  features: string[]
  extras: string[]
  btnClass: string
}

function Aranceles() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const plans: PricingPlan[] = [
    {
      id: 'paes',
      planLabel: 'Plan 01',
      name: 'Preparación PAES',
      price: '69.900',
      period: '/mes',
      note: 'por asignatura · IVA incluido',
      features: [
        '3 clases en vivo por semana',
        'Material de estudio completo',
        'Simulacros mensuales corregidos',
        'Banco de +2.000 preguntas',
        'Grupos de máximo 12 alumnos',
        'Chat de consultas con el profe',
      ],
      extras: [
        'Descuento 15% al contratar 2 materias',
        'Descuento 25% al contratar 3 o más materias',
      ],
      btnClass: 'primary',
    },
    {
      id: 'nem',
      planLabel: 'Plan 02',
      name: 'Mejora tu NEM',
      price: '59.900',
      period: '/mes',
      note: 'por materia · IVA incluido',
      featured: true,
      badge: '⭐ Más elegido',
      features: [
        '2 clases de refuerzo por semana',
        'Diagnóstico inicial gratuito',
        'Guías y tareas semanales',
        'Reporte mensual para apoderados',
        'Comunicación directa con el profe',
        'Plan de estudio personalizado',
      ],
      extras: [
        'Pack todas las materias: $149.900/mes',
        'Acceso a diagnóstico sicopedagógico opcional',
      ],
      btnClass: 'gold',
    },
    {
      id: 'nivel',
      planLabel: 'Plan 03',
      name: 'Nivelación de Estudios',
      price: '54.900',
      period: '/mes',
      note: 'por asignatura · IVA incluido',
      features: [
        '2 clases semanales adaptadas',
        'Diagnóstico inicial incluido',
        'Material didáctico personalizado',
        'Informe mensual de avance',
        'Básica y media disponibles',
        'Ritmo ajustado al estudiante',
      ],
      extras: [
        'Apoyo sicopedagógico disponible como complemento',
        'Descuento hermanos: 20% en la segunda inscripción',
      ],
      btnClass: 'primary',
    },
  ]

  const faqs = [
    {
      q: '¿Hay matrícula o cobros de inscripción?',
      a: 'No. No cobramos matrícula ni cuota de inscripción. El primer pago corresponde al primer mes de clases y cubre todos los materiales incluidos en el plan.',
    },
    {
      q: '¿Puedo pedir una clase de prueba antes de pagar?',
      a: 'Sí. Ofrecemos una sesión de orientación gratuita donde conoces al equipo, evaluamos tu nivel y respondemos tus dudas. Así decides con información completa si Miraza es para ti.',
    },
    {
      q: '¿Los precios cambian en el año?',
      a: 'Los precios son fijos durante el año lectivo. Si hay algún ajuste, se avisa con al menos 30 días de anticipación. Los estudiantes activos tienen garantizado su precio por el período vigente.',
    },
    {
      q: '¿Qué pasa si falto a una clase?',
      a: 'Todas las clases quedan grabadas y disponibles en tu canal privado. Puedes recuperarlas cuando quieras. También hay una sesión de consultas semanal adicional para resolver dudas acumuladas.',
    },
  ]

  return (
    <>
      {/* PAGE HERO */}
      <section className="page-hero">
        <div className="page-hero-inner">
          <div className="page-hero-tag">Inversión en tu futuro</div>
          <h1>Aranceles <em>transparentes</em></h1>
          <p>Sin letras chicas ni sorpresas. Todos los valores en pesos chilenos, IVA incluido. Pago mensual, sin contratos de largo plazo.</p>
        </div>
      </section>

      <div className="aranceles-wrap">

        {/* PRICING CARDS */}
        <div className="pricing-grid">
          {plans.map(plan => (
            <div key={plan.id} className={`pricing-card${plan.featured ? ' featured' : ''} reveal`}>
              {plan.badge && <div className="pricing-badge">{plan.badge}</div>}
              <div className="pricing-header">
                <div className="pricing-plan-name">{plan.planLabel}</div>
                <div className="pricing-title">{plan.name}</div>
                <div className="pricing-price">
                  <span className="price-currency">$</span>
                  <span className="price-amount">{plan.price}</span>
                  <span className="price-period">{plan.period}</span>
                </div>
                <div className="price-note">{plan.note}</div>
              </div>
              <div className="pricing-body">
                <ul className="pricing-features">
                  {plan.features.map((f, i) => (
                    <li key={i}><span className="fi"></span>{f}</li>
                  ))}
                </ul>
                <div className="pricing-divider"></div>
                <ul className="pricing-extras">
                  {plan.extras.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
                <Link to="/contacto" className={`btn-pricing ${plan.btnClass}`}>Inscribirme</Link>
              </div>
            </div>
          ))}
        </div>

        {/* PACK ESPECIAL */}
        <div className="pack-egresados reveal">
          <div className="pack-left">
            <span className="pack-tag">Pack Especial</span>
            <h2 className="pack-title">Clases Especializadas<br />& Apoyo Sicopedagógico</h2>
            <p className="pack-desc">
              Diseñado para estudiantes con necesidades educativas especiales o que requieren una intervención profesional.
              Coordinación entre sicopedagoga y docente para un acompañamiento integral.
            </p>
          </div>
          <div className="pack-right">
            <div className="pack-price-box">
              <div className="pack-price-label">Desde</div>
              <div className="pack-price-row">
                <span className="pack-price-curr">$</span>
                <span className="pack-price-num">79.900</span>
                <span className="pack-price-period">/mes</span>
              </div>
              <div className="pack-price-note">Valor según evaluación y plan personalizado · IVA incluido</div>
            </div>
            <ul className="pack-includes">
              <li>Diagnóstico sicopedagógico inicial</li>
              <li>Sesiones individuales o grupos pequeños (máx. 6)</li>
              <li>Plan de intervención personalizado</li>
              <li>Coordinación con colegio si se requiere</li>
              <li>Acompañamiento familiar incluido</li>
            </ul>
            <Link to="/apoyo" className="btn-gold" style={{ display: 'block', textAlign: 'center' }}>Conocer más →</Link>
          </div>
        </div>

        {/* NOTAS */}
        <div className="notas-grid reveal">
          <div className="nota-card">
            <span className="nota-icon">🗓️</span>
            <div>
              <h4>Sin contratos largos</h4>
              <p>Pago mes a mes. Puedes pausar o cancelar con 5 días de aviso, sin penalización.</p>
            </div>
          </div>
          <div className="nota-card">
            <span className="nota-icon">💳</span>
            <div>
              <h4>Medios de pago</h4>
              <p>Transferencia bancaria, WebPay o depósito. El pago se realiza entre el 1° y 5° de cada mes.</p>
            </div>
          </div>
          <div className="nota-card">
            <span className="nota-icon">🎓</span>
            <div>
              <h4>Becas y descuentos</h4>
              <p>Evaluamos casos sociales. Si el costo es un obstáculo, conversemos — siempre buscamos una solución.</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="reveal" style={{ marginBottom: '72px' }}>
          <div className="section-header" style={{ marginBottom: '36px' }}>
            <span className="section-tag">Preguntas frecuentes</span>
            <h2 className="section-title">Dudas sobre los pagos</h2>
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
        <div className="aranceles-cta reveal">
          <h2>¿Listo para empezar?</h2>
          <p>Agenda tu sesión de orientación gratuita hoy mismo.</p>
          <div className="cta-btns">
            <Link to="/contacto" className="btn-gold">Quiero inscribirme</Link>
            <Link to="/planes" className="btn-outline">Ver planes →</Link>
          </div>
        </div>

      </div>
    </>
  )
}

export default Aranceles
