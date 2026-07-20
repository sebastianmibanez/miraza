import { useState, useEffect, useCallback } from 'react'
import { getMiPerfil, guardarMiPerfil } from '../../services/api'
import Avatar from '../../components/Avatar'

export default function PerfilTab() {
  const [nombre, setNombre]     = useState('')
  const [apellido, setApellido] = useState('')
  const [fotoUrl, setFotoUrl]   = useState('')
  const [bio, setBio]           = useState('')
  const [estudios, setEstudios]           = useState('')
  const [especialidades, setEspecialidades] = useState('')
  const [intereses, setIntereses]         = useState('')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg]           = useState('')
  const [error, setError]       = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const r = await getMiPerfil()
      const p = r.data.perfil
      setNombre(p.nombre); setApellido(p.apellido)
      setFotoUrl(p.foto_url || ''); setBio(p.bio || '')
      setEstudios(p.estudios || ''); setEspecialidades(p.especialidades || ''); setIntereses(p.intereses || '')
    } catch {
      setError('No pudimos cargar tu perfil.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setMsg('')
    const url = fotoUrl.trim()
    if (url && !/^https?:\/\//.test(url)) {
      setError('El enlace de la foto debe empezar con https://')
      return
    }
    setGuardando(true)
    try {
      const res = await guardarMiPerfil({
        foto_url: url, bio: bio.trim(),
        estudios: estudios.trim(), especialidades: especialidades.trim(), intereses: intereses.trim(),
      })
      if (res.data.ok) setMsg('Perfil guardado. Así te verán en la vitrina.')
      else setError(res.data.error || 'No se pudo guardar.')
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { error?: string } } }
      setError(e2.response?.data?.error || 'No se pudo guardar.')
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return <div className="docente-tab-content"><div className="docente-card"><div className="docente-loading">Cargando…</div></div></div>
  }

  return (
    <div className="docente-tab-content">
      {error && <p className="insc-error">{error}</p>}

      <div className="docente-card">
        <h2 className="docente-card-title">Mi perfil público</h2>
        <p className="insc-subtitle">
          Así te ven los visitantes en la vitrina. La foto no se aloja en Miraza:
          pega el enlace a una imagen tuya (Google, Drive, etc.).
        </p>

        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', margin: '0.5rem 0 1.25rem' }}>
          <Avatar nombre={nombre} apellido={apellido} foto={fotoUrl.trim()} size={72} />
          <div>
            <strong>{nombre} {apellido}</strong>
            <div className="gestion-hint" style={{ margin: 0 }}>Vista previa</div>
          </div>
        </div>

        <form className="aviso-form" onSubmit={guardar}>
          <input
            className="gestion-input"
            placeholder="URL de tu foto (https://…)"
            value={fotoUrl}
            onChange={e => setFotoUrl(e.target.value)}
          />
          <textarea
            className="gestion-input aviso-texto"
            placeholder="Bio corta: quién eres, qué enseñas, tu experiencia…"
            rows={4}
            maxLength={600}
            value={bio}
            onChange={e => setBio(e.target.value)}
          />
          <input
            className="gestion-input"
            placeholder="Formación: ej. Licenciada en Educación Matemática, U. de Chile"
            maxLength={300}
            value={estudios}
            onChange={e => setEstudios(e.target.value)}
          />
          <input
            className="gestion-input"
            placeholder="Especialidades separadas por coma: ej. PAES, Álgebra, Geometría"
            maxLength={200}
            value={especialidades}
            onChange={e => setEspecialidades(e.target.value)}
          />
          <input
            className="gestion-input"
            placeholder="Qué te gusta: ej. Ajedrez, series de misterio, trekking"
            maxLength={200}
            value={intereses}
            onChange={e => setIntereses(e.target.value)}
          />
          <div className="gestion-fila">
            <button className="insc-btn-crear" type="submit" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar perfil'}
            </button>
            {msg && <span style={{ color: 'var(--d-ok)', fontWeight: 600, alignSelf: 'center' }}>{msg}</span>}
          </div>
        </form>
      </div>
    </div>
  )
}
