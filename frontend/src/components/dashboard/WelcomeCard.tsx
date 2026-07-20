import { useAuth } from '../../contexts/AuthContext'
import './WelcomeCard.css'

interface Props {
  planLabel: string
}

/** Antes esto mostraba "Semana N del período académico", calculada desde una
 *  fecha escrita a mano. No existe ningún período académico en el sistema: era
 *  un número inventado que se le mostraba al alumno como si fuera un hecho. */
export default function WelcomeCard({ planLabel }: Props) {
  const { state } = useAuth()
  const user = state.user
  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'
  const fecha = new Date().toLocaleDateString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className="welcome-card">
      <div className="welcome-text">
        <h2>{saludo}, {user?.nombre}</h2>
        <p className="welcome-plan">{planLabel}</p>
      </div>
      <span className="welcome-fecha">{fecha}</span>
    </div>
  )
}
