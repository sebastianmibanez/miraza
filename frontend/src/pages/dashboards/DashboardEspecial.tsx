import WelcomeCard from '../../components/dashboard/WelcomeCard'
import ScheduleWidget from '../../components/dashboard/ScheduleWidget'
import LiveClassButton from '../../components/dashboard/LiveClassButton'
import AnnouncementsWidget from '../../components/dashboard/AnnouncementsWidget'
import ProgressWidget from '../../components/dashboard/ProgressWidget'
import ChatWidget from '../../components/dashboard/ChatWidget'
import './Dashboard.css'

const COLOR = '#0e7490'

const PROGRESS = [
  { materia: 'Apoyo sicopedagógico', porcentaje: 80, color: COLOR },
  { materia: 'Tutorías', porcentaje: 70, color: '#7c3aed' },
]

export default function DashboardEspecial() {
  return (
    <div className="dashboard-page">
      <WelcomeCard planLabel="Clases Especializadas" accentColor={COLOR} icon="📓" />

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
