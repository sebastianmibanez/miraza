import { Link } from 'react-router-dom'

function Apoyo() {
  const services = [
    {
      title: 'Apoyo Sicopedagógico',
      icon: '🧠',
      description: 'Evaluación diagnóstica y estrategias personalizadas para optimizar tu aprendizaje.',
      features: ['Diagnóstico integral', 'Técnicas de estudio', 'Gestión de emociones']
    },
    {
      title: 'Tutorías Especializadas',
      icon: '👨‍🏫',
      description: 'Clases uno a uno con docentes expertos en tu materia de dificultad.',
      features: ['Horario flexible', 'Profundización temática', 'Resolución de dudas']
    },
    {
      title: 'Preparación PAES',
      icon: '📝',
      description: 'Programa intensivo diseñado para maximizar tu puntaje en la prueba de selección.',
      features: ['Ensayos simulados', 'Estrategias de examen', 'Análisis de resultados']
    },
    {
      title: 'Mejora de NEM',
      icon: '📊',
      description: 'Acompañamiento estructurado para aumentar tu promedio de notas.',
      features: ['Seguimiento semanal', 'Evaluaciones parciales', 'Plan de mejora']
    },
    {
      title: 'Nivelación Académica',
      icon: '🎯',
      description: 'Refuerzo de bases y conceptos fundamentales en cualquier asignatura.',
      features: ['Materiales adaptados', 'Ritmo personalizado', 'Evaluación continua']
    },
    {
      title: 'Orientación Vocacional',
      icon: '🚀',
      description: 'Asesoramiento para elegir la carrera y universidad que mejor se adapte a ti.',
      features: ['Test vocacional', 'Exploración de carreras', 'Consejería educativa']
    }
  ]

  return (
    <div style={{ padding: '80px 6vw 100px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span style={{ display: 'inline-block', color: 'var(--blue)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Nuestros Servicios
          </span>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', color: 'var(--navy)', lineHeight: 1.2 }}>
            Apoyo Integral para tu Educación
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '1rem', marginTop: '12px' }}>
            Soluciones personalizadas en cada área de tu desarrollo educativo
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', marginBottom: '80px' }}>
          {services.map((service, idx) => (
            <div key={idx} style={{ background: 'var(--white)', border: '1px solid rgba(10,31,68,0.08)', borderRadius: '20px', padding: '40px 36px', boxShadow: '0 4px 20px rgba(10,31,68,0.06)', transition: 'all 0.3s', cursor: 'pointer' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(10,31,68,0.14)'
                e.currentTarget.style.transform = 'translateY(-4px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(10,31,68,0.06)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{ fontSize: '2.4rem', marginBottom: '16px', display: 'block' }}>
                {service.icon}
              </div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', color: 'var(--navy)', marginBottom: '12px' }}>
                {service.title}
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.78, marginBottom: '16px' }}>
                {service.description}
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {service.features.map((feature, fidx) => (
                  <li key={fidx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--muted)' }}>
                    <span style={{ color: 'var(--blue)', fontWeight: 700 }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* TESTIMONIOS */}
        <section style={{ marginBottom: '80px' }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', color: 'var(--navy)', marginBottom: '48px', textAlign: 'center' }}>
            Lo que dicen nuestros estudiantes
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {[
              {
                name: 'Fernanda López',
                course: '4to Medio',
                text: 'Miraza cambió mi vida. Subí mi promedio en 2 puntos y ahora puedo optar a universidades mejores. Los docentes son increíbles.',
                stars: 5
              },
              {
                name: 'Mateo Rodríguez',
                course: 'Egresado',
                text: 'La preparación PAES fue excelente. Sacué 800 puntos en Matemática. Realmente el acompañamiento personalizado marca la diferencia.',
                stars: 5
              },
              {
                name: 'Catalina García',
                course: '3ro Medio',
                text: 'Las tutorías de Miraza me ayudaron a entender conceptos que me costaban. Ahora estoy mucho más confiada con mis calificaciones.',
                stars: 5
              }
            ].map((testimonial, idx) => (
              <div key={idx} style={{ background: 'var(--light)', border: '1px solid rgba(10,31,68,0.08)', borderRadius: '16px', padding: '32px 28px' }}>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
                  {Array(testimonial.stars).fill(0).map((_, i) => (
                    <span key={i} style={{ color: 'var(--gold)', fontSize: '1.1rem' }}>★</span>
                  ))}
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.75, marginBottom: '16px', fontStyle: 'italic' }}>
                  "{testimonial.text}"
                </p>
                <p style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '0.9rem', marginBottom: '4px' }}>
                  {testimonial.name}
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--blue)' }}>
                  {testimonial.course}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ background: 'linear-gradient(135deg, var(--navy) 0%, #1a3870 100%)', borderRadius: '20px', padding: '60px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'white', fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)', marginBottom: '14px', position: 'relative', zIndex: 1 }}>
            ¿Necesitas ayuda?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1rem', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
            Nuestro equipo está listo para ayudarte a alcanzar tus objetivos educativos
          </p>
          <Link to="/contacto" style={{ display: 'inline-block', background: 'var(--gold)', color: 'var(--navy)', border: 'none', padding: '14px 32px', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.25s', fontFamily: "'Outfit', sans-serif", textDecoration: 'none' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--gold-l)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--gold)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Contáctanos Ahora
          </Link>
        </section>
      </div>
    </div>
  )
}

export default Apoyo
