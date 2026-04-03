import { useState } from 'react'
import { inscribir } from '../services/api'
import './Contacto.css'

function Contacto() {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    curso: '',
    materias: [] as string[],
    mensaje: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleMateriaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target
    setFormData(prev => ({
      ...prev,
      materias: checked
        ? [...prev.materias, value]
        : prev.materias.filter(m => m !== value)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const response = await inscribir(formData)
      if (response.ok) {
        setMessage({ type: 'success', text: response.mensaje || '¡Inscripción recibida!' })
        setFormData({ nombre: '', apellido: '', email: '', telefono: '', curso: '', materias: [] as string[], mensaje: '' })
      } else {
        setMessage({ type: 'error', text: response.error || 'Error en la inscripción' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="contacto-container">
      <h1>Contacto & Inscripción</h1>
      <form onSubmit={handleSubmit} className="contacto-form">
        <div className="form-row">
          <input
            type="text"
            name="nombre"
            placeholder="Nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="apellido"
            placeholder="Apellido"
            value={formData.apellido}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-row">
          <input
            type="email"
            name="email"
            placeholder="Correo electrónico"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="tel"
            name="telefono"
            placeholder="Teléfono"
            value={formData.telefono}
            onChange={handleChange}
            required
          />
        </div>
        <select name="curso" value={formData.curso} onChange={handleChange} required>
          <option value="">Selecciona un curso</option>
          <option value="3ro Medio">3ro Medio</option>
          <option value="4to Medio">4to Medio</option>
          <option value="Egresado">Egresado</option>
        </select>

        <div className="materias-group">
          <label>Selecciona materias de interés:</label>
          {['Matemática', 'Lenguaje', 'Historia', 'Ciencias'].map(materia => (
            <label key={materia} className="checkbox">
              <input
                type="checkbox"
                value={materia}
                checked={formData.materias.includes(materia)}
                onChange={handleMateriaChange}
              />
              {materia}
            </label>
          ))}
        </div>

        <textarea
          name="mensaje"
          placeholder="Mensaje (opcional)"
          value={formData.mensaje}
          onChange={handleChange}
          rows={5}
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Inscribirse'}
        </button>

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
      </form>
    </div>
  )
}

export default Contacto
