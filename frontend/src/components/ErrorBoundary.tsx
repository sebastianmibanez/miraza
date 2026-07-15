import { Component, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean }

// Cada deploy cambia el hash de los archivos JS (rutas lazy incluidas). Una
// pestaña abierta desde antes del deploy pide un chunk que ya no existe en el
// servidor: eso revienta como un error de import normal y corriente, y sin
// esta detección se veía como pantalla en blanco (nada más lo atrapaba).
const RELOAD_KEY = 'miraza_chunk_reload_at'
const VENTANA_MS = 15000 // si vuelve a fallar antes de esto, ya no es "recién desplegaron"

function esErrorDeChunk(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error)
  return /dynamically imported module|Loading chunk|Importing a module script failed/i.test(msg)
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    if (!esErrorDeChunk(error)) return

    // Timestamp en vez de un flag simple: así una recarga que sí funcionó no
    // deja nada "pegado" que impida reaccionar a un fallo real más adelante,
    // pero un fallo que se repite enseguida no entra en bucle de recargas.
    const ultimo = Number(sessionStorage.getItem(RELOAD_KEY) || 0)
    if (Date.now() - ultimo > VENTANA_MS) {
      sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '60px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--navy)' }}>Algo salió mal</h2>
          <p style={{ color: 'var(--muted)' }}>Ocurrió un error inesperado. Intenta recargar la página.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{ background: 'var(--gold)', color: 'var(--navy)', border: 'none', padding: '12px 28px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}
          >
            Reintentar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
