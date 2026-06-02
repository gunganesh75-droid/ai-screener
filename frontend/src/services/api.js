import axios from 'axios'
import { auth } from '../config/firebase'
import { getIdToken } from 'firebase/auth'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
})

// Attach fresh Firebase ID token to every request
API.interceptors.request.use(async (config) => {
  try {
    const currentUser = auth.currentUser
    if (currentUser) {
      // Always get a fresh token (Firebase auto-refreshes if expired)
      const freshToken = await getIdToken(currentUser, false)
      localStorage.setItem('rs_token', freshToken)
      config.headers.Authorization = `Bearer ${freshToken}`
    } else {
      // Fallback to stored token (for mock/dev mode)
      const token = localStorage.getItem('rs_token')
      if (token) config.headers.Authorization = `Bearer ${token}`
    }
  } catch {
    const token = localStorage.getItem('rs_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 globally (auto-logout)
API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('rs_token')
      localStorage.removeItem('rs_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  googleLogin: (data) => API.post('/auth/google', data),
}

// ── Jobs ──────────────────────────────────────────────────────────────────────
export const jobsAPI = {
  getAll: (params) => API.get('/jobs', { params }),
  getById: (id) => API.get(`/jobs/${id}`),
  create: (data) => API.post('/jobs', data),
  update: (id, data) => API.put(`/jobs/${id}`, data),
  delete: (id) => API.delete(`/jobs/${id}`),
}

// ── Applications ──────────────────────────────────────────────────────────────
export const applicationsAPI = {
  apply: (formData) =>
    API.post('/applications/apply', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 90000, // PDF upload + AI analysis can take time
    }),
  getMyApplications: () => API.get('/applications/my-applications'),
  getJobApplications: (jobId) => API.get(`/applications/job/${jobId}`),
  updateStatus: (id, status) => API.put(`/applications/${id}/status`, { status }),
  screenDirect: (formData) =>
    API.post('/applications/screen-direct', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 90000,
    }),
}

export default API
