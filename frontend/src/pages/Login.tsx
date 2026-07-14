import { useState, FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import GoogleButton from '../components/GoogleButton'
import type { User } from '../services/api'
import './Login.css'

const ROLE_ROUTES: Record<string, string> = {
  paes:       '/dashboard/paes',
  nem:        '/dashboard/nem',
  nivelacion: '/dashboard/nivelacion',
  especial:   '/dashboard/especial',
  teacher:    '/dashboard/docente',
}

export default function Login() {
  const { login, loginConGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  function entrar(user: User) {
    navigate(from || ROLE_ROUTES[user.rol] || '/dashboard/paes', { replace: true })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(email.trim().toLowerCase(), password)
    setLoading(false)

    if (result.ok && result.user) entrar(result.user)
    else setError(result.error || 'Error al iniciar sesión')
  }

  async function handleGoogle(credential: string) {
    setError('')
    setLoading(true)

    const result = await loginConGoogle(credential)
    setLoading(false)

    if (result.ok && result.user) entrar(result.user)
    else setError(result.error || 'No pudimos iniciar sesión con Google')
  }

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-text">miraza</span>
          <span className="login-logo-dot">.</span>
        </div>
        <p className="login-subtitle">Accede a tu panel de estudiante</p>

        {/* Si Google no está configurado, este bloque no renderiza nada. */}
        <GoogleButton
          onCredential={handleGoogle}
          texto="signin_with"
          disabled={loading}
          separador
        />

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
