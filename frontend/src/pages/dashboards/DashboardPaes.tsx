import WelcomeCard from '../../components/dashboard/WelcomeCard'
import ScheduleWidget from '../../components/dashboard/ScheduleWidget'
import LiveClassButton from '../../components/dashboard/LiveClassButton'
import AnnouncementsWidget from '../../components/dashboard/AnnouncementsWidget'
import ProgressWidget from '../../components/dashboard/ProgressWidget'
import ChatWidget from '../../components/dashboard/ChatWidget'
import './Dashboard.css'

const COLOR = '#2563eb'

const PROGRESS = [
  { materia: 'Matemática M1', porcentaje: 72, color: COLOR },
  { materia: 'Comprensión Lectora', porcentaje: 85, color: '#0891b2' },
  { materia: 'Historia y Cs. Sociales', porcentaje: 60, color: '#7c3aed' },
  { materia: 'Ciencias', porcentaje: 55, color: '#16a34a' },
]

export default function DashboardPaes() {
  return (
    <div className="dashboard-page">
      <WelcomeCard planLabel="Preparación PAES" accentColor={COLOR} icon="📘" />

      <div className="dash-grid-2">
        <LiveClassButton accentColor={COLOR} />
        <ScheduleWidget />
      </div>

      <div className="dash-grid-2">
        <ProgressWidget subjects={PROGRESS} />
        <AnnouncementsWidget />
      </div>

      <ChatWidget accentColor={COLOR} />
    </div>
  )
}
