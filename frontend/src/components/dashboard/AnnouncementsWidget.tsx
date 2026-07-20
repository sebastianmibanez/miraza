import { useEffect, useState } from 'react'
import { getDashboardAnnouncements, Announcement } from '../../services/api'
import './WidgetCard.css'

const TIPO_BORDER: Record<string, string> = {
  info:  'var(--d-info)',
  aviso: 'var(--d-warn)',
}

export default function AnnouncementsWidget() {
  const [items, setItems] = useState<Announcement[]>([])

  useEffect(() => {
    getDashboardAnnouncements().then(r => setItems(r.data.announcements)).catch(() => {})
  }, [])

  return (
    <div className="widget-card">
      <h3 className="widget-title">Avisos</h3>
      {items.length === 0 ? (
        <p className="widget-empty">Sin avisos recientes.</p>
      ) : (
        <div className="announcements-list">
          {items.map(item => (
            <div
              key={item.id}
              className="announcement-item"
              style={{ borderLeftColor: TIPO_BORDER[item.tipo] ?? 'var(--d-muted)' }}
            >
              <strong>{item.titulo}</strong>
              <p>{item.texto}</p>
              <span className="announcement-date">{item.fecha}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
