import WelcomeCard from '../../components/dashboard/WelcomeCard'
import ScheduleWidget from '../../components/dashboard/ScheduleWidget'
import LiveClassButton from '../../components/dashboard/LiveClassButton'
import AnnouncementsWidget from '../../components/dashboard/AnnouncementsWidget'
import MisRamosWidget from '../../components/dashboard/MisRamosWidget'
import './Dashboard.css'

export default function DashboardPaes() {
  return (
    <div className="dashboard-page">
      <WelcomeCard planLabel="Preparación PAES" />

      <div className="dash-grid-2">
        <LiveClassButton />
        <ScheduleWidget />
      </div>

      <div className="dash-grid-2">
        <MisRamosWidget />
        <AnnouncementsWidget />
      </div>
    </div>
  )
}
