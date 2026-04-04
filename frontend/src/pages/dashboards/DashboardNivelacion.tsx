import WelcomeCard from '../../components/dashboard/WelcomeCard'
import ScheduleWidget from '../../components/dashboard/ScheduleWidget'
import LiveClassButton from '../../components/dashboard/LiveClassButton'
import AnnouncementsWidget from '../../components/dashboard/AnnouncementsWidget'
import ProgressWidget from '../../components/dashboard/ProgressWidget'
import ChatWidget from '../../components/dashboard/ChatWidget'
import './Dashboard.css'

const COLOR = '#9333ea'

const PROGRESS = [
  { materia: 'Matemática', porcentaje: 55, color: COLOR },
  { materia: 'Lenguaje', porcentaje: 62, color: '#0891b2' },
]

export default function DashboardNivelacion() {
  return (
    <div className="dashboard-page">
      <WelcomeCard planLabel="Nivelación de Estudios" accentColor={COLOR} icon="📙" />

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
