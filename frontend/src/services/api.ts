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
export interface User {
  id: number
  nombre: string
  apellido: string
  email: string
  rol: 'paes' | 'nem' | 'nivelacion' | 'especial' | 'teacher'
}

export interface InscripcionData {
  nombre: string
  apellido: string
  email: string
  telefono: string
  curso: string
  materias: string[]
  mensaje?: string
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
  materias: string[]
}

export interface ScheduleItem {
  dia: string
  hora: string
  materia: string
  tipo: string
  plan?: string
  alumnos?: number
}

export interface Announcement {
  id: number
  titulo: string
  texto: string
  fecha: string
  tipo: string
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
  alumnos: number
  clases_semana: number
  proxima: string
}

export interface TeacherAlumno {
  id: number
  nombre: string
  apellido: string
  ramo: string
  plan: string
  nivel: string
  estado: 'activo' | 'inactivo'
}

// ── Auth ──────────────────────────────────────────────────────
export const login = (email: string, password: string) =>
  api.post<{ ok: boolean; token?: string; user?: User; error?: string }>(
    '/api/auth/login', { email, password }
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

export const crearCuentaDesdeInscripcion = (id: number, rol: RolAlumno) =>
  api.post<CuentaCreada>(`/api/admin/inscripciones/${id}/crear-cuenta`, { rol })

export const descartarInscripcion = (id: number) =>
  api.post<{ ok: boolean; error?: string }>(`/api/admin/inscripciones/${id}/descartar`)

export const reabrirInscripcion = (id: number) =>
  api.post<{ ok: boolean; error?: string }>(`/api/admin/inscripciones/${id}/reabrir`)

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
