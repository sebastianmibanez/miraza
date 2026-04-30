import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || '';
const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});
// Attach JWT on every request
api.interceptors.request.use(config => {
    const token = localStorage.getItem('miraza_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
// On 401 → clear token and redirect to login
api.interceptors.response.use(res => res, err => {
    if (err.response?.status === 401) {
        localStorage.removeItem('miraza_token');
        window.location.href = '/login';
    }
    return Promise.reject(err);
});
// ── Auth ──────────────────────────────────────────────────────
export const login = (email, password) => api.post('/api/auth/login', { email, password });
export const getMe = () => api.get('/api/auth/me');
// ── Dashboard ─────────────────────────────────────────────────
export const getDashboardInfo = () => api.get('/api/dashboard/info');
export const getDashboardSchedule = () => api.get('/api/dashboard/schedule');
export const getDashboardAnnouncements = () => api.get('/api/dashboard/announcements');
// ── Chat ──────────────────────────────────────────────────────
export const sendChatMessage = (message) => api.post('/api/chat', { message });
// ── Inscripción ───────────────────────────────────────────────
export const inscribir = async (data) => {
    try {
        const response = await api.post('/api/inscripcion', data);
        return response.data;
    }
    catch (error) {
        if (axios.isAxiosError(error)) {
            return { ok: false, error: error.response?.data?.error || 'Error en la inscripción' };
        }
        return { ok: false, error: 'Error desconocido' };
    }
};
export default api;
