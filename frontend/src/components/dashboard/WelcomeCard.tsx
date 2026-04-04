import { useAuth } from '../../contexts/AuthContext'
import './WelcomeCard.css'

const SEMESTER_START = new Date('2026-03-09') // first week of semester

function getCurrentWeek(): number {
  const now = new Date()
  const diff = now.getTime() - SEMESTER_START.getTime()
  const week = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1
  return Math.max(1, Math.min(week, 40))
}

interface Props {
  planLabel: string
  accentColor: string
  icon: string
}

export default function WelcomeCard({ planLabel, accentColor, icon }: Props) {
  const { state } = useAuth()
  const user = state.user
  const week = getCurrentWeek()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="welcome-card" style={{ borderLeft: `5px solid ${accentColor}` }}>
      <div className="welcome-icon" style={{ background: accentColor }}>{icon}</div>
      <div className="welcome-text">
        <h2>{greeting}, {user?.nombre}!</h2>
        <p>
          <span className="welcome-plan" style={{ color: accentColor }}>{planLabel}</span>
          {' · '}Semana {week} del período académico
        </p>
      </div>
    </div>
  )
}
