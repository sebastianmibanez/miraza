import { createContext, useContext, useEffect, useReducer, ReactNode } from 'react'
import { User, login as apiLogin, getMe } from '../services/api'

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

interface AuthContextValue {
  state: AuthState
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
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

  async function login(email: string, password: string) {
    try {
      const res = await apiLogin(email, password)
      if (res.data.ok && res.data.token && res.data.user) {
        localStorage.setItem('miraza_token', res.data.token)
        dispatch({ type: 'SET_USER', token: res.data.token, user: res.data.user })
        return { ok: true }
      }
      return { ok: false, error: res.data.error || 'Error al iniciar sesión' }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      return { ok: false, error: axiosErr.response?.data?.error || 'Error de conexión' }
    }
  }

  function logout() {
    localStorage.removeItem('miraza_token')
    dispatch({ type: 'LOGOUT' })
  }

  return (
    <AuthContext.Provider value={{ state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
