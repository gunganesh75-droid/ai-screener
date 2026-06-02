import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { jobsAPI, applicationsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { PlusCircle, Briefcase, Users, TrendingUp, BarChart3, ArrowRight, Loader2, Edit, Trash2, Eye, XCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function HRDashboard() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalApplicants: 0,
    suitedCandidates: 0,
    reviewCandidates: 0,
    rejectedCandidates: 0,
  })

  const [isNewUser, setIsNewUser] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('rs_is_new_user') === 'true') {
      setIsNewUser(true)
      localStorage.removeItem('rs_is_new_user')
    }
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const { data } = await jobsAPI.getAll()
      // Filter only jobs by this HR
      const myJobs = (data.jobs || []).filter(j => j.createdBy?._id === user?.id || j.createdBy === user?.id)
      setJobs(myJobs)

      // Fetch applicants for each job to calculate total stats
      if (myJobs.length > 0) {
        const appsPromises = myJobs.map(job => applicationsAPI.getJobApplications(job._id))
        const appsResults = await Promise.all(appsPromises)
        
        let total = 0
        let suited = 0
        let review = 0
        let rejected = 0

        appsResults.forEach(res => {
          const apps = res.data.applications || []
          total += apps.length
          suited += apps.filter(a => a.aiScore >= 70).length
          review += apps.filter(a => a.aiScore >= 50 && a.aiScore < 70).length
          rejected += apps.filter(a => a.status === 'Rejected' || a.aiScore < 50).length
        })

        setStats({
          totalApplicants: total,
          suitedCandidates: suited,
          reviewCandidates: review,
          rejectedCandidates: rejected,
        })
      }
    } catch {} finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this job posting? All applications will also be deleted.')) return
    try {
      await jobsAPI.delete(id)
      toast.success('Job deleted successfully')
      setJobs(prev => prev.filter(j => j._id !== id))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete job')
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">
            {isNewUser ? `Hello, ${user?.name?.split(' ')[0]}! 👋` : 'HR Dashboard 🏢'}
          </h1>
          <p className="text-slate-500">
            {isNewUser ? 'Welcome to your recruiter dashboard! Start by posting your first job.' : 'Manage job postings and view AI-screened applicants'}
          </p>
        </div>
        <Link to="/hr/jobs/create" className="btn-primary flex-shrink-0">
          <PlusCircle size={18} /> Post New Job
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <div className="card">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
            <Briefcase size={18} className="text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">{jobs.length}</div>
          <div className="text-slate-500 text-sm">Active Jobs</div>
        </div>
        <div className="card">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
            <Users size={18} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">{stats.totalApplicants}</div>
          <div className="text-slate-500 text-sm">Total Candidates</div>
        </div>
        <div className="card">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-3">
            <TrendingUp size={18} className="text-violet-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mb-1">{stats.suitedCandidates}</div>
          <div className="text-slate-500 text-sm">Suited (Score ≥70)</div>
        </div>
        <div className="card">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
            <BarChart3 size={18} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mb-1">{stats.reviewCandidates}</div>
          <div className="text-slate-500 text-sm">In Review (50-69)</div>
        </div>
        <div className="card">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-3">
            <XCircle size={18} className="text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 mb-1">{stats.rejectedCandidates}</div>
          <div className="text-slate-500 text-sm">Rejected</div>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-semibold text-lg">Your Job Postings</h2>
          <Link to="/hr/jobs/create" className="btn-secondary !py-2 !px-4 !text-sm">
            <PlusCircle size={14} /> New Job
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 size={28} className="text-primary-500 animate-spin" /></div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase size={44} className="text-slate-700 mx-auto mb-3" />
            <p className="text-white font-semibold mb-1">No job postings yet</p>
            <p className="text-slate-500 text-sm mb-4">Create your first job posting to start receiving AI-screened applicants.</p>
            <Link to="/hr/jobs/create" className="btn-primary !py-2 !px-5 !text-sm"><PlusCircle size={15} /> Post First Job</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map(job => (
              <div key={job._id} className="flex items-center gap-4 p-4 bg-slate-800/40 rounded-xl border border-slate-700/40 hover:border-slate-600/60 transition-all">
                <div className="w-10 h-10 rounded-xl bg-primary-600/15 border border-primary-500/20 flex items-center justify-center flex-shrink-0">
                  <Briefcase size={16} className="text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{job.title}</p>
                  <p className="text-slate-500 text-sm">{job.company} · {job.location} · {job.salary}</p>
                  <p className="text-slate-600 text-xs mt-0.5">Posted {new Date(job.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link to={`/hr/jobs/${job._id}/applicants`} className="btn-success !py-1.5 !px-3 !text-xs">
                    <Eye size={13} /> Applicants
                  </Link>
                  <Link to={`/hr/jobs/edit/${job._id}`} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
                    <Edit size={15} />
                  </Link>
                  <button onClick={() => handleDelete(job._id)} className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-all">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
