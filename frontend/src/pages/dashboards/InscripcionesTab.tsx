import { useState, useEffect, useCallback } from 'react'
import {
  getInscripciones,
  crearCuentaDesdeInscripcion,
  descartarInscripcion,
  reabrirInscripcion,
  type Inscripcion,
  type EstadoInscripcion,
  type ResumenInscripciones,
  type RolAlumno,
  type CuentaCreada,
} from '../../services/api'

const PLANES: { valor: RolAlumno; label: string }[] = [
  { valor: 'paes',       label: 'Preparación PAES' },
  { valor: 'nem',        label: 'Mejora tu NEM' },
  { valor: 'nivelacion', label: 'Nivelación' },
  { valor: 'especial',   label: 'Clases Especializadas' },
]

const FILTROS: { valor: EstadoInscripcion | 'todas'; label: string }[] = [
  { valor: 'pendiente',  label: 'Pendientes' },
  { valor: 'aprobada',   label: 'Con cuenta' },
  { valor: 'descartada', label: 'Descartadas' },
  { valor: 'todas',      label: 'Todas' },
]

interface Props {
  onResumen?: (r: ResumenInscripciones) => void
}

export default function InscripcionesTab({ onResumen }: Props) {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([])
  const [filtro, setFiltro]   = useState<EstadoInscripcion | 'todas'>('pendiente')
  const [cargando, setCargando] = useState(true)
  const [error, setError]     = useState('')

  // Plan elegido por fila, antes de crear la cuenta.
  const [planes, setPlanes] = useState<Record<number, RolAlumno>>({})
  // Fila con una acción en curso, para no permitir doble click.
  const [ocupada, setOcupada] = useState<number | null>(null)
  // Credenciales recién creadas. Se muestran UNA vez y no se pueden recuperar.
  const [credencial, setCredencial] = useState<CuentaCreada | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [falloCopia, setFalloCopia] = useState(false)

  const cargar = useCallback(() => {
    setCargando(true)
    setError('')
    getInscripciones(filtro === 'todas' ? undefined : filtro)
      .then(r => {
        setInscripciones(r.data.inscripciones || [])
        if (r.data.resumen) onResumen?.(r.data.resumen)
      })
      .catch(() => setError('No pudimos cargar las inscripciones.'))
      .finally(() => setCargando(false))
  }, [filtro, onResumen])

  useEffect(() => { cargar() }, [cargar])

  async function crearCuenta(insc: Inscripcion) {
    const rol = planes[insc.id]
    if (!rol) {
      setError(`Elige un plan para ${insc.nombre} antes de crear la cuenta.`)
      return
    }

    setOcupada(insc.id)
    setError('')
    try {
      const res = await crearCuentaDesdeInscripcion(insc.id, rol)
      if (res.data.ok) {
        setCredencial(res.data)
        setCopiado(false)
        cargar()
      } else {
        setError(res.data.error || 'No se pudo crear la cuenta.')
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      setError(err.response?.data?.error || 'No se pudo crear la cuenta.')
    } finally {
      setOcupada(null)
    }
  }

  async function cambiarEstado(insc: Inscripcion, accion: 'descartar' | 'reabrir') {
    setOcupada(insc.id)
    setError('')
    try {
      const res = accion === 'descartar'
        ? await descartarInscripcion(insc.id)
        : await reabrirInscripcion(insc.id)
      if (res.data.ok) cargar()
      else setError(res.data.error || 'No se pudo actualizar.')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      setError(err.response?.data?.error || 'No se pudo actualizar.')
    } finally {
      setOcupada(null)
    }
  }

  function copiar() {
    if (!credencial?.user || !credencial.password) return
    const texto =
      `Hola ${credencial.user.nombre}, tu acceso a Miraza:\n` +
      `Sitio: https://miraza.cl/login\n` +
      `Correo: ${credencial.user.email}\n` +
      `Contraseña: ${credencial.password}`

    // El portapapeles puede fallar (permisos, contexto no seguro, navegador
    // viejo). Si se cae en silencio, ella pierde la contraseña: no se puede
    // volver a ver. Por eso avisamos y la dejamos copiarla a mano.
    const copia = navigator.clipboard?.writeText(texto)
    if (!copia) {
      setFalloCopia(true)
      return
    }
    copia
      .then(() => { setCopiado(true); setFalloCopia(false) })
      .catch(() => setFalloCopia(true))
  }

  return (
    <div className="docente-tab-content">
      <div className="docente-card">
        <div className="docente-alumnos-toolbar">
          <div>
            <h2 className="docente-card-title" style={{ margin: 0 }}>Inscripciones</h2>
            <p className="insc-subtitle">
              Las que llegan por el formulario del sitio. Al crear la cuenta, el alumno
              queda habilitado para entrar con el correo que él mismo escribió.
            </p>
          </div>
          <div className="docente-estado-btns">
            {FILTROS.map(f => (
              <button
                key={f.valor}
                className={`docente-estado-btn${filtro === f.valor ? ' active' : ''}`}
                onClick={() => setFiltro(f.valor)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="insc-error">{error}</p>}

        {cargando ? (
          <div className="docente-loading">Cargando...</div>
        ) : inscripciones.length === 0 ? (
          <p className="docente-empty">
            {filtro === 'pendiente'
              ? 'No hay inscripciones pendientes. Cuando alguien complete el formulario del sitio, aparecerá acá.'
              : 'No hay inscripciones con ese filtro.'}
          </p>
        ) : (
          <div className="docente-alumnos-table-wrap">
            <table className="docente-alumnos-table insc-table">
              <thead>
                <tr>
                  <th>Alumno</th>
                  <th>Contacto</th>
                  <th>Curso / Materias</th>
                  <th>Fecha</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {inscripciones.map(i => (
                  <tr key={i.id}>
                    <td className="docente-alumno-nombre">
                      {i.nombre} {i.apellido}
                      {i.mensaje && <span className="insc-mensaje" title={i.mensaje}>💬</span>}
                    </td>
                    <td className="insc-contacto">
                      <span>{i.email}</span>
                      <span className="insc-tel">{i.telefono}</span>
                    </td>
                    <td>
                      <span className="docente-plan-chip">{i.curso}</span>
                      {i.materias && <span className="insc-materias">{i.materias}</span>}
                    </td>
                    <td className="insc-fecha">{i.fecha?.slice(0, 10)}</td>
                    <td>
                      {i.estado === 'pendiente' && (
                        <div className="insc-acciones">
                          <select
                            className="docente-select insc-select"
                            value={planes[i.id] || ''}
                            onChange={e =>
                              setPlanes(p => ({ ...p, [i.id]: e.target.value as RolAlumno }))
                            }
                            disabled={ocupada === i.id}
                          >
                            <option value="">Elige el plan…</option>
                            {PLANES.map(p => (
                              <option key={p.valor} value={p.valor}>{p.label}</option>
                            ))}
                          </select>
                          <button
                            className="insc-btn-crear"
                            onClick={() => crearCuenta(i)}
                            disabled={ocupada === i.id}
                          >
                            {ocupada === i.id ? 'Creando…' : 'Crear cuenta'}
                          </button>
                          <button
                            className="insc-btn-descartar"
                            onClick={() => cambiarEstado(i, 'descartar')}
                            disabled={ocupada === i.id}
                            title="Descartar esta inscripción"
                          >
                            Descartar
                          </button>
                        </div>
                      )}

                      {i.estado === 'aprobada' && (
                        <span className="docente-estado-chip activo">Cuenta creada</span>
                      )}

                      {i.estado === 'descartada' && (
                        <div className="insc-acciones">
                          <span className="docente-estado-chip inactivo">Descartada</span>
                          <button
                            className="insc-btn-descartar"
                            onClick={() => cambiarEstado(i, 'reabrir')}
                            disabled={ocupada === i.id}
                          >
                            Reabrir
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="docente-alumnos-count">
          {inscripciones.length} inscripci{inscripciones.length !== 1 ? 'ones' : 'ón'}
        </p>
      </div>

      {/* La contraseña se muestra una sola vez: en la BD solo queda el hash. */}
      {credencial?.user && credencial.password && (
        <div className="insc-modal-bg" onClick={() => setCredencial(null)}>
          <div className="insc-modal" onClick={e => e.stopPropagation()}>
            <h3 className="insc-modal-title">Cuenta creada ✅</h3>
            <p className="insc-modal-sub">
              Copia estos datos y envíaselos a {credencial.user.nombre} por WhatsApp.
              <strong> La contraseña no se puede volver a ver.</strong>
            </p>

            <div className="insc-cred">
              <div className="insc-cred-row">
                <span className="insc-cred-label">Correo</span>
                <span className="insc-cred-valor">{credencial.user.email}</span>
              </div>
              <div className="insc-cred-row">
                <span className="insc-cred-label">Contraseña</span>
                <span className="insc-cred-valor insc-cred-pass">{credencial.password}</span>
              </div>
            </div>

            {falloCopia && (
              <p className="insc-error insc-error-copia">
                Tu navegador no nos dejó copiar. Selecciona los datos de arriba y cópialos a mano
                antes de cerrar — la contraseña no se puede volver a ver.
              </p>
            )}

            <div className="insc-modal-acciones">
              <button className="insc-btn-copiar" onClick={copiar}>
                {copiado ? '¡Copiado!' : 'Copiar mensaje'}
              </button>
              <button className="insc-btn-cerrar" onClick={() => setCredencial(null)}>
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
