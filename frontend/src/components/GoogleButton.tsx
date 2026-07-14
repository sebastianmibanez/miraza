import { useEffect, useRef, useState } from 'react'
import { getConfig } from '../services/api'
import './GoogleButton.css'

const GSI_SRC = 'https://accounts.google.com/gsi/client'

// El script de Google define window.google. Lo tipamos por encima, lo justo
// para lo que usamos.
interface GoogleAccounts {
  accounts: {
    id: {
      initialize: (o: { client_id: string; callback: (r: { credential: string }) => void }) => void
      renderButton: (el: HTMLElement, o: Record<string, unknown>) => void
    }
  }
}
declare global {
  interface Window { google?: GoogleAccounts }
}

/** Carga el script de Google una sola vez, aunque haya varios botones. */
let cargando: Promise<void> | null = null

function cargarScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (cargando) return cargando

  cargando = new Promise<void>((resolve, reject) => {
    const existente = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`)
    if (existente) {
      existente.addEventListener('load', () => resolve())
      existente.addEventListener('error', () => reject(new Error('No cargó')))
      return
    }
    const s = document.createElement('script')
    s.src = GSI_SRC
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('No cargó el script de Google'))
    document.head.appendChild(s)
  })

  return cargando
}

interface Props {
  /** Recibe el ID token de Google. Lo valida el backend, nunca el navegador. */
  onCredential: (credential: string) => void
  texto?: 'signin_with' | 'continue_with'
  disabled?: boolean
  /** Dibuja un "o" debajo. Va acá dentro para que no quede un separador
   *  huérfano cuando Google está apagado y el botón no se renderiza. */
  separador?: boolean
}

export default function GoogleButton({
  onCredential,
  texto = 'continue_with',
  disabled,
  separador,
}: Props) {
  const contenedor = useRef<HTMLDivElement>(null)
  const [habilitado, setHabilitado] = useState(false)
  const [fallo, setFallo] = useState(false)

  // El callback vive en un ref: Google lo captura una sola vez al inicializar,
  // así que si lo pasáramos directo se quedaría con la primera versión.
  const cb = useRef(onCredential)
  useEffect(() => { cb.current = onCredential }, [onCredential])

  useEffect(() => {
    let vivo = true

    getConfig()
      .then(async r => {
        const { google_habilitado, google_client_id } = r.data
        if (!google_habilitado || !google_client_id) return   // apagado: no mostramos nada

        await cargarScript()
        if (!vivo || !contenedor.current || !window.google) return

        window.google.accounts.id.initialize({
          client_id: google_client_id,
          callback: res => cb.current(res.credential),
        })
        window.google.accounts.id.renderButton(contenedor.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: texto,
          shape: 'rectangular',
          logo_alignment: 'left',
          width: 320,
        })

        setHabilitado(true)
      })
      .catch(() => { if (vivo) setFallo(true) })

    return () => { vivo = false }
  }, [texto])

  if (fallo) {
    return (
      <p className="google-btn-fallo">
        No pudimos cargar el acceso con Google. Usa tu correo y contraseña.
      </p>
    )
  }

  // El contenedor tiene que estar SIEMPRE montado: Google necesita un nodo real
  // donde dibujar su botón. Si lo montáramos solo cuando 'habilitado' es true,
  // el ref estaría vacío justo en el momento de usarlo y nunca se habilitaría
  // — se esperarían mutuamente y el botón no aparecería nunca.
  //
  // Con Google apagado esto queda como dos divs vacíos: alto cero, invisibles.
  return (
    <>
      <div className={habilitado ? `google-btn-wrap${disabled ? ' disabled' : ''}` : undefined}>
        <div ref={contenedor} />
      </div>
      {habilitado && separador && <div className="google-separador">o</div>}
    </>
  )
}
