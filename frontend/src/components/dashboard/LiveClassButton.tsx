import './WidgetCard.css'

interface Props {
  meetUrl?: string
  accentColor: string
}

export default function LiveClassButton({ meetUrl, accentColor }: Props) {
  const url = meetUrl || '#'

  return (
    <div className="widget-card live-card">
      <div className="live-pulse-ring" style={{ '--color': accentColor } as React.CSSProperties} />
      <div className="live-content">
        <span className="live-badge">EN VIVO</span>
        <h3>Clase en vivo con tu profesora</h3>
        <p>Ingresa a tu sala de Google Meet cuando comience la clase programada.</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="live-btn"
          style={{ background: accentColor }}
        >
          🎥 Entrar a la clase
        </a>
      </div>
    </div>
  )
}
