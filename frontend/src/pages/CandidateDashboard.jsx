import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { applicationsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import ScoreRing from '../components/ScoreRing'
import { Briefcase, FileText, CheckCircle, Clock, Loader2, ArrowRight } from 'lucide-react'

export default function CandidateDashboard() {
  const { user } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [isNewUser, setIsNewUser] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('rs_is_new_user') === 'true') {
      setIsNewUser(true)
      localStorage.removeItem('rs_is_new_user')
    }

    applicationsAPI.getMyApplications()
      .then(r => setApplications(r.data.applications || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const stats = [
    { label: 'Total Applied', value: applications.length, icon: Briefcase, color: 'blue' },
    { label: 'Shortlisted', value: applications.filter(a => a.status === 'Shortlisted').length, icon: CheckCircle, color: 'emerald' },
    { label: 'Under Review', value: applications.filter(a => a.status === 'Review').length, icon: Clock, color: 'amber' },
    { label: 'Avg AI Score', value: applications.length ? Math.round(applications.reduce((s, a) => s + a.aiScore, 0) / applications.length) + '%' : 'N/A', icon: FileText, color: 'violet' },
  ]

  const colorMap = { blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20', emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20', violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20' }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">
          {isNewUser ? 'Hello' : 'Welcome back'}, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-slate-500">Track your job applications and AI match scores</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${colorMap[color]}`}>
              <Icon size={18} />
            </div>
            <div className="text-2xl font-bold text-white mb-1">{value}</div>
            <div className="text-slate-500 text-sm">{label}</div>
          </div>
        ))}
      </div>

      {/* Quick Action */}
      <div className="card bg-gradient-to-r from-primary-900/30 to-violet-900/20 border-primary-700/30 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-white font-semibold mb-1">Ready for your next opportunity?</h3>
            <p className="text-slate-400 text-sm">Browse open positions and let AI score your resume instantly.</p>
          </div>
          <Link to="/jobs" className="btn-primary flex-shrink-0">
            Browse Jobs <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-semibold text-lg">Recent Applications</h2>
          <Link to="/candidate/applications" className="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-1 transition-colors">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 size={28} className="text-primary-500 animate-spin" /></div>
        ) : applications.length === 0 ? (
          <div className="text-center py-10">
            <Briefcase size={40} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 font-medium mb-2">No applications yet</p>
            <p className="text-slate-600 text-sm mb-4">Apply for jobs to see your AI match scores here.</p>
            <Link to="/jobs" className="btn-primary !py-2 !px-5 !text-sm">Find Jobs</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.slice(0, 5).map(app => (
              <div key={app._id} className="flex items-center gap-4 p-4 bg-slate-800/40 rounded-xl border border-slate-700/40 hover:border-slate-600/60 transition-all">
                <ScoreRing score={app.aiScore} size={64} />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{app.jobId?.title || 'Unknown Role'}</p>
                  <p className="text-slate-500 text-sm">{app.jobId?.company} · {app.jobId?.location}</p>
                  <p className="text-slate-600 text-xs mt-1">{new Date(app.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={app.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
