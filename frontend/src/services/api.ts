import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

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

export const inscribir = async (data: InscripcionData): Promise<InscripcionResponse> => {
  try {
    const response = await api.post('/inscripcion', data)
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        ok: false,
        error: error.response?.data?.error || 'Error en la inscripción'
      }
    }
    return {
      ok: false,
      error: 'Error desconocido'
    }
  }
}

export default api
