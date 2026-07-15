import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('miraza_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On 401 → clear token and redirect to login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('miraza_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Types ─────────────────────────────────────────────────────
export type Rol = 'paes' | 'nem' | 'nivelacion' | 'especial' | 'teacher' | 'admin'

export interface User {
  id: number
  nombre: string
  apellido: string
  email: string
  rol: Rol
}

export interface InscripcionData {
  nombre: string
  apellido: string
  email: string
  telefono: string
  curso: string
  materias: string[]
  mensaje?: string
  /** ID token de Google, si usó "Continuar con Google". El backend lo valida y
   *  toma el correo de ahí, ignorando lo que venga en el campo email. */
  google_credential?: string
}

export interface InscripcionResponse {
  ok: boolean
  mensaje?: string
  error?: string
}

export interface PlanMeta {
  label: string
  color: string
  icon: string
  rol: string
  es_admin: boolean
}

export interface ScheduleItem {
  dia: string
  hora: string
  materia: string
  tipo: string
  plan?: string
  color?: string
  alumnos?: number
}

export interface Announcement {
  id: number
  titulo: string
  texto: string
  fecha: string
  tipo: string
  ramo_id: number | null
  /** null = aviso general, lo ve todo Miraza */
  ramo: string | null
}

export interface ChatResponse {
  ok: boolean
  respuesta?: string
  error?: string
}

export interface TeacherRamo {
  id: number
  nombre: string
  plan: string
  color: string
  meet_url: string
  profesor_id: number | null
  profesor_nombre: string | null
  profesor_apellido: string | null
  alumnos: number
  clases_semana: number
  /** null cuando el ramo todavía no tiene horario cargado */
  proxima: string | null
}

export interface TeacherAlumno {
  id: number
  nombre: string
  apellido: string
  email: string
  ramo: string
  ramo_id: number
  plan: string
  estado: 'activo' | 'inactivo'
}

/** Un ramo visto por el alumno que lo cursa. */
export interface MiRamo {
  id: number
  nombre: string
  plan: string
  color: string
  meet_url: string
  profesor_nombre: string | null
  profesor_apellido: string | null
  clases_semana: number
}

export interface Profesor {
  id: number
  nombre: string
  apellido: string
  email: string
  rol: 'teacher' | 'admin'
  activo: number
}

export interface AlumnoGestion {
  id: number
  nombre: string
  apellido: string
  email: string
  plan: RolAlumno
  estado: 'activo' | 'inactivo'
  ramos: { id: number; nombre: string }[]
}

export interface Clase {
  id: number
  dia: string
  hora: string
  tipo: string
}

export const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const
export const TIPOS_CLASE = ['clase', 'ensayo', 'tutoría', 'apoyo'] as const
export const TIPOS_AVISO = ['info', 'aviso', 'urgente'] as const
export const TIPOS_MATERIAL = ['video', 'documento'] as const

// ── Config pública ────────────────────────────────────────────
export interface ConfigPublica {
  ok: boolean
  google_habilitado: boolean
  google_client_id: string
}

// Se pide al backend en vez de compilarlo en el bundle: así activar Google es
// solo una variable de entorno en Render, sin recompilar el frontend.
export const getConfig = () => api.get<ConfigPublica>('/api/config')

// ── Auth ──────────────────────────────────────────────────────
export const login = (email: string, password: string) =>
  api.post<{ ok: boolean; token?: string; user?: User; error?: string }>(
    '/api/auth/login', { email, password }
  )

export const loginConGoogle = (credential: string) =>
  api.post<{ ok: boolean; token?: string; user?: User; error?: string; sin_cuenta?: boolean }>(
    '/api/auth/google', { credential }
  )

export const getMe = () =>
  api.get<{ ok: boolean; user?: User }>('/api/auth/me')

// ── Dashboard ─────────────────────────────────────────────────
export const getDashboardInfo = () =>
  api.get<{ ok: boolean; plan: PlanMeta }>('/api/dashboard/info')

export const getDashboardSchedule = () =>
  api.get<{ ok: boolean; schedule: ScheduleItem[] }>('/api/dashboard/schedule')

export const getDashboardAnnouncements = () =>
  api.get<{ ok: boolean; announcements: Announcement[] }>('/api/dashboard/announcements')

// ── Teacher ───────────────────────────────────────────────────
export const getTeacherRamos = () =>
  api.get<{ ok: boolean; ramos: TeacherRamo[] }>('/api/dashboard/teacher/ramos')

export const getTeacherAlumnos = (ramo?: string) =>
  api.get<{ ok: boolean; alumnos: TeacherAlumno[] }>('/api/dashboard/teacher/alumnos', {
    params: ramo ? { ramo } : undefined,
  })

// ── Alumno ────────────────────────────────────────────────────
export const getMisRamos = () =>
  api.get<{ ok: boolean; ramos: MiRamo[] }>('/api/dashboard/mis-ramos')

// ── Gestión (solo admin) ──────────────────────────────────────
export interface RamoInput {
  nombre?: string
  plan?: string
  color?: string
  meet_url?: string
  profesor_id?: number | null
}

type Ok = { ok: boolean; error?: string }

export const getProfesores = () =>
  api.get<{ ok: boolean; profesores: Profesor[] }>('/api/admin/profesores')

export interface CuentaProfesoraCreada {
  ok: boolean
  password?: string
  user?: { id: number; nombre: string; apellido: string; email: string; rol: 'teacher' }
  error?: string
}

export const crearProfesora = (nombre: string, apellido: string, email: string) =>
  api.post<CuentaProfesoraCreada>('/api/admin/profesoras', { nombre, apellido, email })

export const cambiarActivoProfesor = (id: number, activo: boolean) =>
  api.patch<Ok>(`/api/admin/profesores/${id}/activo`, { activo })

export const getAlumnosGestion = () =>
  api.get<{ ok: boolean; alumnos: AlumnoGestion[] }>('/api/admin/alumnos')

export const crearRamo = (datos: RamoInput) =>
  api.post<Ok>('/api/admin/ramos', datos)

export const editarRamo = (id: number, datos: RamoInput) =>
  api.patch<Ok>(`/api/admin/ramos/${id}`, datos)

export const borrarRamo = (id: number) =>
  api.delete<Ok>(`/api/admin/ramos/${id}`)

export const getClases = (ramoId: number) =>
  api.get<{ ok: boolean; clases: Clase[] }>(`/api/admin/ramos/${ramoId}/clases`)

export const crearClase = (ramoId: number, dia: string, hora: string, tipo: string) =>
  api.post<Ok>(`/api/admin/ramos/${ramoId}/clases`, { dia, hora, tipo })

export const borrarClase = (claseId: number) =>
  api.delete<Ok>(`/api/admin/clases/${claseId}`)

export const matricular = (ramoId: number, alumnoId: number) =>
  api.post<Ok>(`/api/admin/ramos/${ramoId}/alumnos`, { alumno_id: alumnoId })

export const desmatricular = (ramoId: number, alumnoId: number) =>
  api.delete<Ok>(`/api/admin/ramos/${ramoId}/alumnos/${alumnoId}`)

// ── Avisos ────────────────────────────────────────────────────
export const crearAviso = (titulo: string, texto: string, tipo: string, ramoId: number | null) =>
  api.post<Ok>('/api/avisos', { titulo, texto, tipo, ramo_id: ramoId })

export const borrarAviso = (id: number) =>
  api.delete<Ok>(`/api/avisos/${id}`)

// ── Inscripciones (panel docente) ─────────────────────────────
export type EstadoInscripcion = 'pendiente' | 'aprobada' | 'descartada'
export type RolAlumno = 'paes' | 'nem' | 'nivelacion' | 'especial'

export interface Inscripcion {
  id: number
  nombre: string
  apellido: string
  email: string
  telefono: string
  curso: string
  materias: string
  mensaje: string
  fecha: string
  estado: EstadoInscripcion
  usuario_id: number | null
  /** 1 si se inscribió con Google: el correo está probado, no solo tipeado. */
  email_verificado: number
}

export interface ResumenInscripciones {
  pendiente: number
  aprobada: number
  descartada: number
}

export interface CuentaCreada {
  ok: boolean
  password?: string
  user?: { id: number; nombre: string; apellido: string; email: string; rol: RolAlumno }
  error?: string
}

export const getInscripciones = (estado?: EstadoInscripcion) =>
  api.get<{ ok: boolean; inscripciones: Inscripcion[]; resumen: ResumenInscripciones }>(
    '/api/admin/inscripciones',
    { params: estado ? { estado } : undefined }
  )

export const crearCuentaDesdeInscripcion = (id: number, rol: RolAlumno, ramos: number[] = []) =>
  api.post<CuentaCreada>(`/api/admin/inscripciones/${id}/crear-cuenta`, { rol, ramos })

export const descartarInscripcion = (id: number) =>
  api.post<{ ok: boolean; error?: string }>(`/api/admin/inscripciones/${id}/descartar`)

export const reabrirInscripcion = (id: number) =>
  api.post<{ ok: boolean; error?: string }>(`/api/admin/inscripciones/${id}/reabrir`)

// ── Material / Vitrina ────────────────────────────────────────
export type TipoMaterial = 'video' | 'documento'
export type EstadoMaterial = 'pendiente' | 'aprobado' | 'rechazado'

export interface Material {
  id: number
  titulo: string
  descripcion: string
  tipo: TipoMaterial
  url: string
  creado_en: string
  /** Solo presente en "mi material": pendiente/aprobado/rechazado. */
  estado?: EstadoMaterial
}

/** Material pendiente visto por dirección, con su autor. */
export interface MaterialPendiente {
  id: number
  titulo: string
  descripcion: string
  tipo: TipoMaterial
  url: string
  creado_en: string
  autor_nombre: string
  autor_apellido: string
}

export interface MaterialPublico extends Material {
  autor_id: number
  autor_nombre: string
  autor_apellido: string
  autor_foto: string
}

export interface PerfilProfesor {
  id: number
  nombre: string
  apellido: string
  foto_url: string
  bio: string
}

/** Grilla pública — no requiere sesión. */
export const getVitrina = () =>
  api.get<{ ok: boolean; materiales: MaterialPublico[] }>('/api/materiales')

/** Perfil público de una profesora + su material. No requiere sesión. */
export const getPerfilProfe = (id: number) =>
  api.get<{ ok: boolean; profesor: PerfilProfesor; materiales: Material[]; error?: string }>(
    `/api/profes/${id}`
  )

export const getMisMateriales = () =>
  api.get<{ ok: boolean; materiales: Material[] }>('/api/materiales/mios')

// Mi perfil (foto + bio) — staff edita el suyo
export interface MiPerfil {
  nombre: string
  apellido: string
  foto_url: string
  bio: string
}

export const getMiPerfil = () =>
  api.get<{ ok: boolean; perfil: MiPerfil }>('/api/mi-perfil')

export const guardarMiPerfil = (foto_url: string, bio: string) =>
  api.patch<Ok>('/api/mi-perfil', { foto_url, bio })

export const crearMaterial = (
  titulo: string, descripcion: string, tipo: TipoMaterial, url: string, autorId?: number
) =>
  api.post<{ ok: boolean; estado?: EstadoMaterial; error?: string }>(
    '/api/materiales', { titulo, descripcion, tipo, url, autor_id: autorId }
  )

export const borrarMaterial = (id: number) =>
  api.delete<Ok>(`/api/materiales/${id}`)

// Aprobación (solo dirección)
export const getMaterialesPendientes = () =>
  api.get<{ ok: boolean; materiales: MaterialPendiente[] }>('/api/admin/materiales/pendientes')

export const revisarMaterial = (id: number, estado: 'aprobado' | 'rechazado') =>
  api.post<Ok>(`/api/admin/materiales/${id}/estado`, { estado })

// ── Chat ──────────────────────────────────────────────────────
export const sendChatMessage = (message: string) =>
  api.post<ChatResponse>('/api/chat', { message })

// ── Inscripción ───────────────────────────────────────────────
export const inscribir = async (data: InscripcionData): Promise<InscripcionResponse> => {
  try {
    const response = await api.post('/api/inscripcion', data)
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return { ok: false, error: error.response?.data?.error || 'Error en la inscripción' }
    }
    return { ok: false, error: 'Error desconocido' }
  }
}

export default api
