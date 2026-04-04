import WelcomeCard from '../../components/dashboard/WelcomeCard'
import ScheduleWidget from '../../components/dashboard/ScheduleWidget'
import LiveClassButton from '../../components/dashboard/LiveClassButton'
import AnnouncementsWidget from '../../components/dashboard/AnnouncementsWidget'
import ProgressWidget from '../../components/dashboard/ProgressWidget'
import ChatWidget from '../../components/dashboard/ChatWidget'
import './Dashboard.css'

const COLOR = '#16a34a'

const PROGRESS = [
  { materia: 'Matemática', porcentaje: 68, color: COLOR },
  { materia: 'Lenguaje', porcentaje: 78, color: '#0891b2' },
  { materia: 'Historia', porcentaje: 71, color: '#7c3aed' },
  { materia: 'Ciencias', porcentaje: 63, color: '#dc2626' },
]

export default function DashboardNem() {
  return (
    <div className="dashboard-page">
      <WelcomeCard planLabel="Mejora tu NEM" accentColor={COLOR} icon="📗" />

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
