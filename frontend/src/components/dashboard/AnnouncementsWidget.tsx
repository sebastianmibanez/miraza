import { useEffect, useState } from 'react'
import { getDashboardAnnouncements, Announcement } from '../../services/api'
import './WidgetCard.css'

const TIPO_BG: Record<string, string> = {
  info:  '#eff6ff',
  aviso: '#fefce8',
}
const TIPO_BORDER: Record<string, string> = {
  info:  '#bfdbfe',
  aviso: '#fde68a',
}

export default function AnnouncementsWidget() {
  const [items, setItems] = useState<Announcement[]>([])

  useEffect(() => {
    getDashboardAnnouncements().then(r => setItems(r.data.announcements)).catch(() => {})
  }, [])

  return (
    <div className="widget-card">
      <h3 className="widget-title">📢 Avisos</h3>
      {items.length === 0 ? (
        <p className="widget-empty">Sin avisos recientes.</p>
      ) : (
        <div className="announcements-list">
          {items.map(item => (
            <div
              key={item.id}
              className="announcement-item"
              style={{
                background: TIPO_BG[item.tipo] ?? '#f8fafc',
                borderColor: TIPO_BORDER[item.tipo] ?? '#e2e8f0',
              }}
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
