import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Public Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import JobListings from './pages/JobListings'
import JobDetails from './pages/JobDetails'

// Candidate Pages
import CandidateDashboard from './pages/CandidateDashboard'
import MyApplications from './pages/MyApplications'
import ApplyJob from './pages/ApplyJob'

// HR Pages
import HRDashboard from './pages/HRDashboard'
import CreateJob from './pages/CreateJob'
import EditJob from './pages/EditJob'
import ApplicantsPage from './pages/ApplicantsPage'
import ApplicantDetails from './pages/ApplicantDetails'

// Layouts
import MainLayout from './layouts/MainLayout'
import DashboardLayout from './layouts/DashboardLayout'

const ProtectedRoute = ({ children, role }) => {
  const { user, isAuthenticated, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role && user?.role !== role) return <Navigate to="/" replace />
  return children
}

const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth()
  if (loading) return null
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'hr' ? '/hr/dashboard' : '/candidate/dashboard'} replace />
  }
  return children
}

export default function App() {
  return (
    <Routes>
      {/* ── Public Routes ─────────────────────────────────── */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/jobs" element={<JobListings />} />
        <Route path="/jobs/:id" element={<JobDetails />} />
      </Route>

      {/* ── Auth Routes (redirect if logged in) ───────────── */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<Navigate to="/login" replace />} />
      <Route path="/reset-password" element={<Navigate to="/login" replace />} />

      {/* ── Candidate Dashboard Routes ─────────────────────── */}
      <Route element={<ProtectedRoute role="candidate"><DashboardLayout /></ProtectedRoute>}>
        <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
        <Route path="/candidate/applications" element={<MyApplications />} />
        <Route path="/candidate/apply/:jobId" element={<ApplyJob />} />
      </Route>

      {/* ── HR Dashboard Routes ────────────────────────────── */}
      <Route element={<ProtectedRoute role="hr"><DashboardLayout /></ProtectedRoute>}>
        <Route path="/hr/dashboard" element={<HRDashboard />} />
        <Route path="/hr/jobs/create" element={<CreateJob />} />
        <Route path="/hr/jobs/edit/:id" element={<EditJob />} />
        <Route path="/hr/jobs/:jobId/applicants" element={<ApplicantsPage />} />
        <Route path="/hr/applicants/:id" element={<ApplicantDetails />} />
      </Route>

      {/* ── Fallback ───────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
