import './Avatar.css'

// Color estable a partir del nombre: la misma persona siempre sale del mismo
// color, sin guardar nada.
const COLORES = [
  'linear-gradient(135deg,#1B4DB8,#3A6FD8)',
  'linear-gradient(135deg,#5B21B6,#7C3AED)',
  'linear-gradient(135deg,#065F46,#059669)',
  'linear-gradient(135deg,#B45309,#D97706)',
  'linear-gradient(135deg,#0e7490,#0891b2)',
]

function colorDe(texto: string): string {
  let h = 0
  for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) | 0
  return COLORES[Math.abs(h) % COLORES.length]
}

interface Props {
  nombre: string
  apellido?: string
  foto?: string
  size?: number
}

export default function Avatar({ nombre, apellido = '', foto = '', size = 40 }: Props) {
  const dim = { width: size, height: size, fontSize: size * 0.42 }

  if (foto) {
    return (
      <img
        className="avatar avatar-foto"
        src={foto}
        alt={nombre}
        style={dim}
        // Si la URL de la foto está rota, cae al círculo de iniciales.
        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
      />
    )
  }

  const iniciales = (nombre[0] || '') + (apellido[0] || '')
  return (
    <span className="avatar avatar-iniciales" style={{ ...dim, background: colorDe(nombre + apellido) }}>
      {iniciales.toUpperCase()}
    </span>
  )
}
