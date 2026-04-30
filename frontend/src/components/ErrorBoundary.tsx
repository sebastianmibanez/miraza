import { Component, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean }

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
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
