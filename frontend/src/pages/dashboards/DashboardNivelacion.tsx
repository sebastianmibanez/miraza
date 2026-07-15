import WelcomeCard from '../../components/dashboard/WelcomeCard'
import ScheduleWidget from '../../components/dashboard/ScheduleWidget'
import LiveClassButton from '../../components/dashboard/LiveClassButton'
import AnnouncementsWidget from '../../components/dashboard/AnnouncementsWidget'
import MisRamosWidget from '../../components/dashboard/MisRamosWidget'
import './Dashboard.css'

const COLOR = '#9333ea'

export default function DashboardNivelacion() {
  return (
    <div className="dashboard-page">
      <WelcomeCard planLabel="Nivelación de Estudios" accentColor={COLOR} icon="📙" />

      <div className="dash-grid-2">
        <LiveClassButton accentColor={COLOR} />
        <ScheduleWidget />
      </div>

      <div className="dash-grid-2">
        <MisRamosWidget />
        <AnnouncementsWidget />
      </div>
    </div>
  )
}
