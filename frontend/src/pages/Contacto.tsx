import { useState, useRef } from 'react'
import { inscribir } from '../services/api'
import './Contacto.css'

const MATERIAS = ['Matemática', 'Lenguaje', 'Historia', 'Ciencias']

function Contacto() {
  const [formData, setFormData] = useState({
    nombre: '', apellido: '', email: '', telefono: '',
    curso: '', materias: [] as string[], mensaje: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [honeypot, setHoneypot] = useState('')
  const loadTime = useRef(Date.now())

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleMateriaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target
    setFormData(prev => ({
      ...prev,
      materias: checked ? [...prev.materias, value] : prev.materias.filter(m => m !== value),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Anti-bot: honeypot debe estar vacío y debe haber pasado > 3s
    if (honeypot !== '' || Date.now() - loadTime.current < 3000) return
    setLoading(true)
    setMessage(null)
    try {
      const res = await inscribir(formData)
      if (res.ok) {
        setMessage({ type: 'success', text: res.mensaje || '¡Inscripción recibida! Te contactamos pronto.' })
        setFormData({ nombre: '', apellido: '', email: '', telefono: '', curso: '', materias: [], mensaje: '' })
      } else {
        setMessage({ type: 'error', text: res.error || 'Hubo un error. Intenta nuevamente.' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="contacto-page">

      {/* LEFT PANEL */}
      <aside className="contacto-panel">
        <div className="contacto-panel-inner">
          <div className="cp-eyebrow">Inscripción 2025</div>
          <h1 className="cp-title">¿Listo para empezar?</h1>
          <p className="cp-sub">Completa el formulario y te contactamos en menos de 24 horas para confirmar tu cupo y resolver todas tus dudas.</p>

          <a
            href="https://wa.me/56933325788?text=Hola%2C%20me%20interesa%20el%20preuniversitario%20Miraza"
            className="cp-wa-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Escríbenos por WhatsApp
          </a>

          <div className="cp-info-list">
            <div className="cp-info-item">
              <div className="cp-info-icon">📧</div>
              <div>
                <div className="cp-info-label">Correo</div>
                <div className="cp-info-val">contacto@miraza.cl</div>
              </div>
            </div>
            <div className="cp-info-item">
              <div className="cp-info-icon">⏱</div>
              <div>
                <div className="cp-info-label">Tiempo de respuesta</div>
                <div className="cp-info-val">Menos de 24 horas</div>
              </div>
            </div>
            <div className="cp-info-item">
              <div className="cp-info-icon">🎓</div>
              <div>
                <div className="cp-info-label">Diagnóstico inicial</div>
                <div className="cp-info-val">100% gratuito</div>
              </div>
            </div>
          </div>

          <div className="cp-trust-row">
            <div className="cp-trust-item"><strong>500+</strong><span>estudiantes</span></div>
            <div className="cp-trust-div" />
            <div className="cp-trust-item"><strong>4.9★</strong><span>calificación</span></div>
            <div className="cp-trust-div" />
            <div className="cp-trust-item"><strong>100%</strong><span>online</span></div>
          </div>
        </div>
      </aside>

      {/* RIGHT FORM */}
      <main className="contacto-form-wrap">
        <div className="contacto-form-card">
          <div className="cfc-header">
            <h2>Formulario de inscripción</h2>
            <p>Todos los campos con <span className="req">*</span> son obligatorios</p>
          </div>

          <form onSubmit={handleSubmit} className="cfc-form" noValidate>
            {/* Honeypot anti-bot — no mostrar a usuarios reales */}
            <input
              type="text"
              name="_hp"
              value={honeypot}
              onChange={e => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0 }}
              aria-hidden="true"
            />
            <div className="cfc-row">
              <div className="cfc-field">
                <label htmlFor="nombre">Nombre <span className="req">*</span></label>
                <input id="nombre" name="nombre" type="text" placeholder="Tu nombre" value={formData.nombre} onChange={handleChange} required />
              </div>
              <div className="cfc-field">
                <label htmlFor="apellido">Apellido <span className="req">*</span></label>
                <input id="apellido" name="apellido" type="text" placeholder="Tu apellido" value={formData.apellido} onChange={handleChange} required />
              </div>
            </div>

            <div className="cfc-row">
              <div className="cfc-field">
                <label htmlFor="email">Correo electrónico <span className="req">*</span></label>
                <input id="email" name="email" type="email" placeholder="correo@ejemplo.com" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="cfc-field">
                <label htmlFor="telefono">Teléfono <span className="req">*</span></label>
                <input id="telefono" name="telefono" type="tel" placeholder="+56 9 XXXX XXXX" value={formData.telefono} onChange={handleChange} required />
              </div>
            </div>

            <div className="cfc-field">
              <label htmlFor="curso">Nivel académico <span className="req">*</span></label>
              <select id="curso" name="curso" value={formData.curso} onChange={handleChange} required>
                <option value="">Selecciona tu nivel</option>
                <option value="1ro Medio">1° Medio</option>
                <option value="2do Medio">2° Medio</option>
                <option value="3ro Medio">3° Medio</option>
                <option value="4to Medio">4° Medio</option>
                <option value="Egresado">Egresado</option>
              </select>
            </div>

            <div className="cfc-field">
              <label>Materias de interés</label>
              <div className="cfc-materias">
                {MATERIAS.map(m => (
                  <label key={m} className={`cfc-chip${formData.materias.includes(m) ? ' selected' : ''}`}>
                    <input type="checkbox" value={m} checked={formData.materias.includes(m)} onChange={handleMateriaChange} />
                    {m}
                  </label>
                ))}
              </div>
            </div>

            <div className="cfc-field">
              <label htmlFor="mensaje">Mensaje adicional</label>
              <textarea id="mensaje" name="mensaje" placeholder="¿Algo más que quieras contarnos? (opcional)" value={formData.mensaje} onChange={handleChange} rows={4} />
            </div>

            {message && (
              <div className={`cfc-message ${message.type}`}>
                {message.type === 'success' ? '✅ ' : '⚠️ '}{message.text}
              </div>
            )}

            <button type="submit" className="cfc-submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar inscripción →'}
            </button>
          </form>
        </div>
      </main>

    </div>
  )
}

export default Contacto
