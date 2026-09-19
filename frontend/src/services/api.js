// VaaniStock API Service
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Auto-attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vaanistock_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle auth errors globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('vaanistock_token')
      localStorage.removeItem('vaanistock_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me'),
}

// ── Products ────────────────────────────────────────────
export const productsAPI = {
  list: (params) => api.get('/api/products', { params }),
  get: (id) => api.get(`/api/products/${id}`),
  create: (data) => api.post('/api/products', data),
  update: (id, data) => api.patch(`/api/products/${id}`, data),
  delete: (id) => api.delete(`/api/products/${id}`),
  history: (id, params) => api.get(`/api/products/${id}/history`, { params }),
}

// ── Inventory ───────────────────────────────────────────
export const inventoryAPI = {
  dashboard: () => api.get('/api/inventory/dashboard'),
  summary: () => api.get('/api/inventory/summary'),
  lowStock: () => api.get('/api/inventory/low-stock'),
  stockIn: (data) => api.post('/api/inventory/stock-in', data),
  stockOut: (data) => api.post('/api/inventory/stock-out', data),
  mutate: (data) => api.post('/api/inventory/mutate', data),
  query: (q) => api.get('/api/inventory/query', { params: { q } }),
}

// ── Voice ───────────────────────────────────────────────
export const voiceAPI = {
  parse: (transcript, language) =>
    api.post('/api/voice/parse', { transcript, language }),
  confirm: (data) => api.post('/api/voice/confirm', data),
  query: (data) => api.post('/api/voice/query', data),
  provider: () => api.get('/api/voice/provider'),
}

// ── Transactions ─────────────────────────────────────────
export const transactionsAPI = {
  list: (params) => api.get('/api/transactions', { params }),
  exportCSV: () =>
    api.get('/api/transactions/export/csv', { responseType: 'blob' }),
}

// ── Alerts ──────────────────────────────────────────────
export const alertsAPI = {
  list: () => api.get('/api/alerts'),
}

// ── Settings ─────────────────────────────────────────────
export const settingsAPI = {
  get: () => api.get('/api/settings'),
  update: (data) => api.patch('/api/settings', data),
}

// ── Health ──────────────────────────────────────────────
export const healthAPI = {
  check: () => api.get('/api/health'),
}

export default api
