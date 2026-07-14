import { useEffect, useState } from 'react'
import { getMisRamos, type MiRamo } from '../../services/api'
import './WidgetCard.css'

interface Props {
  accentColor: string
}

/** Antes esto decía "EN VIVO" siempre y el botón apuntaba a '#': no llevaba a
 *  ninguna parte. Ahora muestra las salas de Meet reales de los ramos del
 *  alumno, y si nadie ha cargado ningún enlace, lo dice en vez de fingir. */
export default function LiveClassButton({ accentColor }: Props) {
  const [ramos, setRamos] = useState<MiRamo[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    getMisRamos()
      .then(r => setRamos(r.data.ramos || []))
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [])

  const conSala = ramos.filter(r => r.meet_url)

  return (
    <div className="widget-card live-card">
      <div className="live-pulse-ring" style={{ '--color': accentColor } as React.CSSProperties} />
      <div className="live-content">
        <h3>Clases en vivo</h3>

        {cargando ? (
          <p>Cargando tus salas…</p>
        ) : conSala.length === 0 ? (
          <p>
            {ramos.length === 0
              ? 'Cuando te matriculen en un ramo, acá va a aparecer tu sala de clases.'
              : 'Tus ramos todavía no tienen sala configurada. Miraza te avisará cuando esté lista.'}
          </p>
        ) : (
          <>
            <p>Entra a la sala de tu clase cuando comience el horario.</p>
            <div className="live-salas">
              {conSala.map(r => (
                <a
                  key={r.id}
                  href={r.meet_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="live-btn"
                  style={{ background: accentColor }}
                >
                  🎥 {r.nombre}
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
