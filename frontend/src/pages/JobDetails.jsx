import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { jobsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { MapPin, DollarSign, Building2, Calendar, Tag, ArrowLeft, Briefcase, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function JobDetails() {
  const { id } = useParams()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await jobsAPI.getById(id)
        setJob(data.job)
      } catch { toast.error('Failed to load job details') } finally { setLoading(false) }
    }
    fetch()
  }, [id])

  const handleApply = () => {
    if (!isAuthenticated) { toast.error('Please login to apply'); navigate('/login'); return }
    if (user?.role !== 'candidate') { toast.error('Only candidates can apply for jobs'); return }
    navigate(`/candidate/apply/${id}`)
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 size={36} className="text-primary-500 animate-spin" />
    </div>
  )

  if (!job) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-center px-4">
      <div>
        <Briefcase size={48} className="text-slate-700 mx-auto mb-4" />
        <h2 className="text-white text-2xl font-bold mb-2">Job not found</h2>
        <Link to="/jobs" className="text-primary-400 hover:text-primary-300">← Back to listings</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/jobs" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to listings
        </Link>

        <div className="card mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-primary-600/15 border border-primary-500/20 flex items-center justify-center flex-shrink-0">
              <Building2 size={26} className="text-primary-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-1">{job.title}</h1>
              <p className="text-slate-400 font-medium">{job.company}</p>
            </div>
            <button onClick={handleApply} className="btn-primary hidden sm:flex">
              Apply Now
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 p-4 bg-slate-800/40 rounded-xl border border-slate-700/40">
            {[
              { icon: MapPin, label: 'Location', value: job.location },
              { icon: DollarSign, label: 'Salary', value: job.salary },
              { icon: Calendar, label: 'Posted', value: new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label}>
                <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
                <div className="flex items-center gap-1.5 text-slate-300 font-medium text-sm">
                  <Icon size={13} className="text-slate-500" /> {value}
                </div>
              </div>
            ))}
          </div>

          <button onClick={handleApply} className="btn-primary w-full sm:hidden mb-4">Apply Now</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card">
            <h2 className="text-white font-semibold mb-4">Job Description</h2>
            <div className="text-slate-400 leading-relaxed whitespace-pre-line text-sm">{job.description}</div>
          </div>
          <div className="space-y-5">
            <div className="card">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><Tag size={16} className="text-primary-400" /> Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.skillsRequired.map(skill => (
                  <span key={skill} className="px-3 py-1.5 bg-primary-900/30 border border-primary-700/30 text-primary-300 text-xs font-medium rounded-lg">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="text-white font-semibold mb-3">Posted by</h3>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-sm">
                  {job.createdBy?.name?.charAt(0).toUpperCase() || 'H'}
                </div>
                <div>
                  <p className="text-slate-300 font-medium text-sm">{job.createdBy?.name || 'Recruiter'}</p>
                  <p className="text-slate-600 text-xs">Hiring Manager</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
