import WelcomeCard from '../../components/dashboard/WelcomeCard'
import ScheduleWidget from '../../components/dashboard/ScheduleWidget'
import LiveClassButton from '../../components/dashboard/LiveClassButton'
import AnnouncementsWidget from '../../components/dashboard/AnnouncementsWidget'
import MisRamosWidget from '../../components/dashboard/MisRamosWidget'
import ChatWidget from '../../components/dashboard/ChatWidget'
import './Dashboard.css'

const COLOR = '#2563eb'

export default function DashboardPaes() {
  return (
    <div className="dashboard-page">
      <WelcomeCard planLabel="Preparación PAES" accentColor={COLOR} icon="📘" />

      <div className="dash-grid-2">
        <LiveClassButton accentColor={COLOR} />
        <ScheduleWidget />
      </div>

      <div className="dash-grid-2">
        <MisRamosWidget />
        <AnnouncementsWidget />
      </div>

      <ChatWidget accentColor={COLOR} />
    </div>
  )
}
