import { useState } from 'react'
import './QuienesSomos.css'

interface Person {
  initial: string
  name: string
  role: string
  bio: string
}

function QuienesSomos() {
  const [flipped, setFlipped] = useState<{ [key: string]: boolean }>({})

  const fundadoras: Person[] = [
    {
      initial: 'A',
      name: 'Andrea López',
      role: 'Co-Fundadora',
      bio: 'Licenciada en Educación, especialista en pedagogía diferenciada con 12 años de experiencia.'
    },
    {
      initial: 'C',
      name: 'Carla Sánchez',
      role: 'Co-Fundadora',
      bio: 'Magíster en Didáctica, experta en diseño curricular y evaluación educativa.'
    }
  ]

  const staff: Person[] = [
    { initial: 'M', name: 'Marco Ruiz', role: 'Profesor de Matemática', bio: 'Especialista en PAES' },
    { initial: 'S', name: 'Sofía García', role: 'Profesora de Lenguaje', bio: 'Experta en análisis textual' },
    { initial: 'R', name: 'Roberto Valle', role: 'Profesor de Historia', bio: 'Docente de proceso histórico' },
    { initial: 'V', name: 'Valentina Díaz', role: 'Profesora de Ciencias', bio: 'Especialista en metodología' },
  ]

  const toggleFlip = (id: string) => {
    setFlipped(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="qs-page">
      <div className="qs-inner">
        {/* MISIÓN Y VALORES */}
        <div className="mision-grid" style={{ marginBottom: '100px' }}>
          <div className="mision-card">
            <span style={{ fontSize: '2.4rem', marginBottom: '16px', display: 'block' }}>🎯</span>
            <h3>Nuestra Misión</h3>
            <p>
              Transformar la educación estudiantil mediante acompañamiento personalizado, 
              estrategias innovadoras y docentes comprometidos con el éxito de cada alumno.
            </p>
          </div>
          <div className="mision-card">
            <span style={{ fontSize: '2.4rem', marginBottom: '16px', display: 'block' }}>✨</span>
            <h3>Nuestra Visión</h3>
            <p>
              Ser el referente de educación online en Chile, brindando oportunidades 
              equitativas de aprendizaje a estudiantes de todas las regiones.
            </p>
          </div>
          <div className="mision-card dark">
            <span style={{ fontSize: '2.4rem', marginBottom: '16px', display: 'block' }}>💪</span>
            <h3>Nuestros Valores</h3>
            <p>
              Excelencia, empatía, innovación y compromiso social. Cada estudiante merece 
              educación de calidad sin importar su contexto socioeconómico.
            </p>
          </div>
          <div className="mision-card dark">
            <span style={{ fontSize: '2.4rem', marginBottom: '16px', display: 'block' }}>🌟</span>
            <h3>Nuestro Diferencial</h3>
            <p>
              Combinamos metodología pedagógica probada con tecnología educativa de punta, 
              asegurando resultados medibles y satisfacción estudiantil.
            </p>
          </div>
        </div>

        {/* ORIGEN / HISTORIA */}
        <div className="origen-section" style={{ marginBottom: '100px' }}>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--navy)', marginBottom: '48px', textAlign: 'center' }}>
            Nuestra Historia
          </h2>
          <div className="origen-grid">
            <div className="origen-visual">
              <div className="origen-visual-tag">Desde 2015</div>
              <h3>Un viaje de transformación educativa</h3>
              <p>
                Miraza nació de la convicción de que la educación de calidad es un derecho, 
                no un privilegio. Hoy, cientos de estudiantes confían en nosotros para cumplir 
                sus sueños universitarios.
              </p>
              <p>
                Cada alumno es único, y nuestros docentes adaptan el acompañamiento a sus 
                necesidades específicas, propiciando aprendizajes significativos y duraderos.
              </p>
            </div>
            <div className="origen-values">
              <div className="origen-value">
                <div className="origen-value-num">1</div>
                <div>
                  <h4>Pedagogía Personalizada</h4>
                  <p>Cada estudiante recibe un plan de estudios diseñado específicamente para él.</p>
                </div>
              </div>
              <div className="origen-value">
                <div className="origen-value-num">2</div>
                <div>
                  <h4>Docentes Especializados</h4>
                  <p>Nuestros profesores son expertos con años de experiencia en su disciplina.</p>
                </div>
              </div>
              <div className="origen-value">
                <div className="origen-value-num">3</div>
                <div>
                  <h4>Tecnología Educativa</h4>
                  <p>Plataforma moderna que facilita el aprendizaje asincrónico y sincrónico.</p>
                </div>
              </div>
              <div className="origen-value">
                <div className="origen-value-num">4</div>
                <div>
                  <h4>Resultados Comprobables</h4>
                  <p>Seguimiento continuo y evaluaciones que demuestran progreso real.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FUNDADORAS */}
        <div className="fundadoras-section" style={{ marginBottom: '100px' }}>
          <h3 className="sphere-section-title">Nuestras Fundadoras</h3>
          <div className="spheres-row">
            {fundadoras.map((person, idx) => (
              <div key={idx} className="sphere-wrap">
                <div
                  className={`sphere-lg ${flipped[`fund-${idx}`] ? 'flipped' : ''}`}
                  onClick={() => toggleFlip(`fund-${idx}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="sphere-lg-front" style={{ background: 'linear-gradient(135deg, #F5A623, #FFD07A)', color: 'white' }}>
                    <span className="sphere-lg-initial">{person.initial}</span>
                    <p className="sphere-lg-hint">Toca para más</p>
                  </div>
                  <div className="sphere-lg-back">
                    <span className="sphere-back-name">{person.name}</span>
                    <span className="sphere-back-role">{person.role}</span>
                    <p className="sphere-back-bio">{person.bio}</p>
                  </div>
                </div>
                <span className="sphere-label-name">{person.name}</span>
                <span className="sphere-label-role">{person.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* EQUIPO DOCENTE */}
        <div className="staff-section" style={{ background: 'var(--light)', borderRadius: '24px', padding: '60px 48px' }}>
          <h3 className="sphere-section-title" style={{ color: 'var(--navy)' }}>Equipo Docente</h3>
          <div className="spheres-row" style={{ gap: '32px' }}>
            {staff.map((person, idx) => (
              <div key={idx} className="sphere-wrap" style={{ gap: '8px' }}>
                <div
                  className={`sphere-sm ${flipped[`staff-${idx}`] ? 'flipped' : ''}`}
                  onClick={() => toggleFlip(`staff-${idx}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="sphere-sm-front">
                    <span className="sphere-sm-initial">{person.initial}</span>
                    <p className="sphere-sm-hint">Toca para más</p>
                  </div>
                  <div className="sphere-sm-back">
                    <span className="sphere-sm-back-name">{person.name}</span>
                    <span className="sphere-sm-back-subj">{person.role}</span>
                  </div>
                </div>
                <span className="sphere-sm-label-name">{person.name}</span>
                <span className="sphere-sm-label-subj" style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{person.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuienesSomos
