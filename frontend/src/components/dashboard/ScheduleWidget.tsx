import { useEffect, useState } from 'react'
import { getDashboardSchedule, ScheduleItem } from '../../services/api'
import './WidgetCard.css'

/* Los colores reales viven en el tema activo (DashboardLayout.css). */
const TIPO_COLOR: Record<string, string> = {
  clase:   'var(--d-tipo-clase)',
  ensayo:  'var(--d-tipo-ensayo)',
  tutoría: 'var(--d-tipo-tutoria)',
  apoyo:   'var(--d-tipo-apoyo)',
}

export default function ScheduleWidget() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])

  useEffect(() => {
    getDashboardSchedule().then(r => setSchedule(r.data.schedule)).catch(() => {})
  }, [])

  return (
    <div className="widget-card">
      <h3 className="widget-title">Horario semanal</h3>
      {schedule.length === 0 ? (
        <p className="widget-empty">Sin clases programadas.</p>
      ) : (
        <ul className="schedule-list">
          {schedule.map((item, i) => (
            <li key={i} className="schedule-item">
              <span
                className="schedule-tipo"
                style={{ background: TIPO_COLOR[item.tipo] ?? 'var(--d-muted)' }}
              >
                {item.tipo}
              </span>
              <div className="schedule-info">
                <span className="schedule-materia">{item.materia}</span>
                <span className="schedule-time">{item.dia} · {item.hora}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
