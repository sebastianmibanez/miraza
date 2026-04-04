import { useState, FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Login.css'

const ROLE_ROUTES: Record<string, string> = {
  paes:       '/dashboard/paes',
  nem:        '/dashboard/nem',
  nivelacion: '/dashboard/nivelacion',
  especial:   '/dashboard/especial',
  teacher:    '/dashboard/paes',
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(email.trim().toLowerCase(), password)
    setLoading(false)

    if (result.ok) {
      // Need to read the user rol from auth state — re-read from localStorage via a small trick
      // The context has already set the user; we need to get the rol
      // We'll navigate after a tick to let state settle
      setTimeout(() => {
        const token = localStorage.getItem('miraza_token')
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]))
            const dest = from || ROLE_ROUTES[payload.rol as string] || '/dashboard/paes'
            navigate(dest, { replace: true })
          } catch {
            navigate('/dashboard/paes', { replace: true })
          }
        }
      }, 50)
    } else {
      setError(result.error || 'Error al iniciar sesión')
    }
  }

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-text">miraza</span>
          <span className="login-logo-dot">.</span>
        </div>
        <p className="login-subtitle">Accede a tu panel de estudiante</p>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="login-help">
          ¿Problemas para acceder?{' '}
          <a
            href="https://wa.me/56912345678?text=Hola%2C+tengo+problemas+para+acceder+a+mi+panel"
            target="_blank"
            rel="noopener noreferrer"
          >
            Escríbenos por WhatsApp
          </a>
        </p>

        <a className="login-back" href="/">← Volver al sitio</a>
      </div>
    </div>
  )
}
