import { useEffect, useState } from 'react'
import { getMisRamos, type MiRamo } from '../../services/api'
import './WidgetCard.css'

/** Reemplaza al viejo ProgressWidget, que mostraba porcentajes inventados:
 *  no existe ningún dato de progreso en el sistema, así que aquello era una
 *  cifra dibujada. Esto sí sale de la base. */
export default function MisRamosWidget() {
  const [ramos, setRamos] = useState<MiRamo[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    getMisRamos()
      .then(r => setRamos(r.data.ramos || []))
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [])

  return (
    <div className="widget-card">
      <h3 className="widget-title">📚 Mis ramos</h3>

      {cargando ? (
        <p className="widget-empty">Cargando…</p>
      ) : ramos.length === 0 ? (
        <p className="widget-empty">
          Todavía no estás matriculado en ningún ramo. Miraza los va a asignar en cuanto
          se defina tu plan.
        </p>
      ) : (
        <ul className="misramos-list">
          {ramos.map(r => (
            <li key={r.id} className="misramos-item" style={{ borderLeftColor: r.color }}>
              <div className="misramos-info">
                <span className="misramos-nombre">{r.nombre}</span>
                <span className="misramos-meta">
                  {r.profesor_nombre
                    ? `${r.profesor_nombre} ${r.profesor_apellido}`
                    : 'Profesora por asignar'}
                  {r.clases_semana > 0 && ` · ${r.clases_semana}×/sem`}
                </span>
              </div>
              <span className="misramos-plan">{r.plan}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
