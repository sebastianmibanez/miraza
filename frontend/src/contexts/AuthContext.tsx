import { createContext, useContext, useEffect, useReducer, ReactNode } from 'react'
import { User, login as apiLogin, loginConGoogle as apiLoginGoogle, getMe } from '../services/api'

// ── Types ─────────────────────────────────────────────────────
interface AuthState {
  token: string | null
  user: User | null
  loading: boolean
}

type AuthAction =
  | { type: 'SET_USER'; token: string; user: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; loading: boolean }

interface Resultado {
  ok: boolean
  error?: string
  /** Se devuelve para poder navegar según el rol sin releer el estado, que
   *  justo después del await todavía es el viejo. */
  user?: User
}

interface AuthContextValue {
  state: AuthState
  login: (email: string, password: string) => Promise<Resultado>
  loginConGoogle: (credential: string) => Promise<Resultado>
  logout: () => void
}

// ── Reducer ───────────────────────────────────────────────────
function reducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, token: action.token, user: action.user, loading: false }
    case 'LOGOUT':
      return { token: null, user: null, loading: false }
    case 'SET_LOADING':
      return { ...state, loading: action.loading }
    default:
      return state
  }
}

// ── Context ───────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    token: localStorage.getItem('miraza_token'),
    user: null,
    loading: true,
  })

  // Rehydrate user from stored token on mount
  useEffect(() => {
    const token = localStorage.getItem('miraza_token')
    if (!token) {
      dispatch({ type: 'SET_LOADING', loading: false })
      return
    }
    getMe()
      .then(res => {
        if (res.data.ok && res.data.user) {
          dispatch({ type: 'SET_USER', token, user: res.data.user })
        } else {
          localStorage.removeItem('miraza_token')
          dispatch({ type: 'LOGOUT' })
        }
      })
      .catch(() => {
        localStorage.removeItem('miraza_token')
        dispatch({ type: 'LOGOUT' })
      })
  }, [])

  /** Guarda el token y publica el usuario. Común a los dos caminos de login. */
  function aceptar(token: string, user: User): Resultado {
    localStorage.setItem('miraza_token', token)
    dispatch({ type: 'SET_USER', token, user })
    return { ok: true, user }
  }

  function fallo(err: unknown, porDefecto: string): Resultado {
    const axiosErr = err as { response?: { data?: { error?: string } } }
    return { ok: false, error: axiosErr.response?.data?.error || porDefecto }
  }

  async function login(email: string, password: string): Promise<Resultado> {
    try {
      const res = await apiLogin(email, password)
      if (res.data.ok && res.data.token && res.data.user) {
        return aceptar(res.data.token, res.data.user)
      }
      return { ok: false, error: res.data.error || 'Error al iniciar sesión' }
    } catch (err: unknown) {
      return fallo(err, 'Error de conexión')
    }
  }

  async function loginConGoogle(credential: string): Promise<Resultado> {
    try {
      const res = await apiLoginGoogle(credential)
      if (res.data.ok && res.data.token && res.data.user) {
        return aceptar(res.data.token, res.data.user)
      }
      return { ok: false, error: res.data.error || 'No pudimos iniciar sesión con Google' }
    } catch (err: unknown) {
      return fallo(err, 'Error de conexión')
    }
  }

  function logout() {
    localStorage.removeItem('miraza_token')
    dispatch({ type: 'LOGOUT' })
  }

  return (
    <AuthContext.Provider value={{ state, login, loginConGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
