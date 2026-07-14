import { useAuth } from '../../contexts/AuthContext'
import './WelcomeCard.css'

interface Props {
  planLabel: string
  accentColor: string
  icon: string
}

/** Antes esto mostraba "Semana N del período académico", calculada desde una
 *  fecha escrita a mano. No existe ningún período académico en el sistema: era
 *  un número inventado que se le mostraba al alumno como si fuera un hecho. */
export default function WelcomeCard({ planLabel, accentColor, icon }: Props) {
  const { state } = useAuth()
  const user = state.user
  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="welcome-card" style={{ borderLeft: `5px solid ${accentColor}` }}>
      <div className="welcome-icon" style={{ background: accentColor }}>{icon}</div>
      <div className="welcome-text">
        <h2>{saludo}, {user?.nombre}</h2>
        <p>
          <span className="welcome-plan" style={{ color: accentColor }}>{planLabel}</span>
        </p>
      </div>
    </div>
  )
}
