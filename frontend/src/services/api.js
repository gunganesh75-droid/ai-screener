import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
})

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('rs_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
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
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  googleLogin: (data) => API.post('/auth/google', data),
  forgotPassword: (data) => API.post('/auth/forgot-password', data),
  resetPassword: (data) => API.post('/auth/reset-password', data),
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
      timeout: 60000, // PDF upload + AI analysis can take time
    }),
  getMyApplications: () => API.get('/applications/my-applications'),
  getJobApplications: (jobId) => API.get(`/applications/job/${jobId}`),
  updateStatus: (id, status) => API.put(`/applications/${id}/status`, { status }),
  screenDirect: (formData) =>
    API.post('/applications/screen-direct', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000, // Direct upload + AI analysis
    }),
}

export default API
