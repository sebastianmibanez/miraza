import './WidgetCard.css'

interface SubjectProgress {
  materia: string
  porcentaje: number
  color: string
}

interface Props {
  subjects: SubjectProgress[]
}

export default function ProgressWidget({ subjects }: Props) {
  return (
    <div className="widget-card">
      <h3 className="widget-title">📊 Mi progreso</h3>
      <div className="progress-list">
        {subjects.map(s => (
          <div key={s.materia} className="progress-item">
            <div className="progress-header">
              <span className="progress-label">{s.materia}</span>
              <span className="progress-pct" style={{ color: s.color }}>{s.porcentaje}%</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${s.porcentaje}%`, background: s.color }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="widget-note">* Progreso basado en clases asistidas y ejercicios completados.</p>
    </div>
  )
}
