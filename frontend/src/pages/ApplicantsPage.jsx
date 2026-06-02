import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { applicationsAPI, jobsAPI } from '../services/api'
import { toast } from 'react-hot-toast'
import StatusBadge from '../components/StatusBadge'
import ScoreRing from '../components/ScoreRing'
import { ArrowLeft, Loader2, Users, Eye, CheckCircle, XCircle, Clock, UploadCloud, X, Plus } from 'lucide-react'

export default function ApplicantsPage() {
  const { jobId } = useParams()
  const navigate = useNavigate()

  const handleViewDetails = (app) => {
    sessionStorage.setItem(`app_${app._id}`, JSON.stringify(app))
    navigate(`/hr/applicants/${app._id}`)
  }
  const [job, setJob] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [updating, setUpdating] = useState(null)

  // Upload modal states
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [cName, setCName] = useState('')
  const [cEmail, setCEmail] = useState('')
  const [file, setFile] = useState(null)
  const [screening, setScreening] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobRes, appRes] = await Promise.all([jobsAPI.getById(jobId), applicationsAPI.getJobApplications(jobId)])
        setJob(jobRes.data.job)
        setApplications(appRes.data.applications || [])
      } catch (err) { toast.error('Failed to load applicants') }
      finally { setLoading(false) }
    }
    fetchData()
  }, [jobId])

  const updateStatus = async (appId, status) => {
    setUpdating(appId)
    try {
      await applicationsAPI.updateStatus(appId, status)
      setApplications(prev => prev.map(a => a._id === appId ? { ...a, status } : a))
      toast.success(`Candidate ${status.toLowerCase()} successfully`)
    } catch { toast.error('Failed to update status') }
    finally { setUpdating(null) }
  }

  const handleScreenDirect = async (e) => {
    e.preventDefault()
    if (!cName || !cEmail || !file) {
      return toast.error('Please fill out all fields and select a PDF resume file.')
    }
    if (file.type !== 'application/pdf') {
      return toast.error('Only PDF files are supported for resume screening.')
    }

    setScreening(true)
    const formData = new FormData()
    formData.append('jobId', jobId)
    formData.append('candidateName', cName)
    formData.append('candidateEmail', cEmail)
    formData.append('resume', file)

    try {
      const { data } = await applicationsAPI.screenDirect(formData)
      // Append the new application, and sort it by AI Score descending
      setApplications(prev => {
        const updated = [data.application, ...prev]
        return updated.sort((a, b) => b.aiScore - a.aiScore)
      })
      toast.success('Resume uploaded and screened by Gemini AI successfully!')
      
      // Reset form & close modal
      setCName('')
      setCEmail('')
      setFile(null)
      setShowUploadModal(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to screen resume.')
    } finally {
      setScreening(false)
    }
  }

  const statuses = ['All', 'Shortlisted', 'Review', 'Rejected', 'Applied']
  const visible = filter === 'All' ? applications : applications.filter(a => a.status === filter)

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={32} className="text-primary-500 animate-spin" /></div>

  return (
    <div className="animate-fade-in relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <Link to="/hr/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn-primary !py-2 !px-4 !text-sm flex items-center gap-2 self-start sm:self-auto shadow-lg shadow-primary-900/40"
        >
          <UploadCloud size={16} /> Upload & Screen Resume
        </button>
      </div>

      <div className="card mb-6 bg-gradient-to-r from-primary-900/20 to-violet-900/10 border-primary-700/30">
        <h1 className="text-xl font-bold text-white mb-1">Applicants for: {job?.title}</h1>
        <p className="text-slate-400 text-sm">{job?.company} · {applications.length} total candidates · Ranked by AI score</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: applications.length, color: 'text-white' },
          { label: 'Shortlisted', value: applications.filter(a => a.status === 'Shortlisted').length, color: 'text-emerald-400' },
          { label: 'Review', value: applications.filter(a => a.status === 'Review').length, color: 'text-amber-400' },
          { label: 'Rejected', value: applications.filter(a => a.status === 'Rejected').length, color: 'text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center !py-4">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-slate-500 text-xs">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === s ? 'bg-primary-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
            {s}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="card text-center py-14">
          <Users size={44} className="text-slate-700 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">No applicants found</p>
          <p className="text-slate-500 text-sm">{filter !== 'All' ? 'No candidates in this category yet.' : 'No applications received yet.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((app, idx) => (
            <div key={app._id} className="card hover:border-slate-600/60 transition-all !p-4">
              <div className="flex items-center gap-4">
                <div className="text-slate-600 text-xs font-bold w-6 text-center">#{idx + 1}</div>
                <ScoreRing score={app.aiScore} size={64} />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold">{app.candidateId?.name || 'Candidate'}</p>
                  <p className="text-slate-500 text-sm">{app.candidateId?.email}</p>
                  <p className="text-slate-600 text-xs mt-0.5">Applied {new Date(app.createdAt).toLocaleDateString()}</p>
                  {app.matchedSkills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {app.matchedSkills.slice(0, 4).map(s => (
                        <span key={s} className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-md">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <StatusBadge status={app.status} />
                  <div className="flex gap-1.5">
                    <button onClick={() => handleViewDetails(app)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all" title="View Details">
                      <Eye size={14} />
                    </button>
                    <button
                      disabled={updating === app._id}
                      onClick={() => updateStatus(app._id, 'Shortlisted')}
                      className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-900/30 transition-all" title="Shortlist"
                    >
                      <CheckCircle size={14} />
                    </button>
                    <button
                      disabled={updating === app._id}
                      onClick={() => updateStatus(app._id, 'Rejected')}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-900/30 transition-all" title="Reject"
                    >
                      <XCircle size={14} />
                    </button>
                    <button
                      disabled={updating === app._id}
                      onClick={() => updateStatus(app._id, 'Review')}
                      className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-900/30 transition-all" title="Mark Review"
                    >
                      <Clock size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom Upload & Screen Resume Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => {
                if (!screening) setShowUploadModal(false)
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              disabled={screening}
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <UploadCloud className="text-primary-500" />
              Upload & Screen Resume
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Upload a local candidate's PDF resume to instantly run Gemini AI screening and match analysis.
            </p>

            <form onSubmit={handleScreenDirect} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Candidate Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  disabled={screening}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Candidate Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. jdoe@gmail.com"
                  value={cEmail}
                  onChange={(e) => setCEmail(e.target.value)}
                  disabled={screening}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Resume File (PDF only)</label>
                <div className="border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-2xl p-6 text-center cursor-pointer relative bg-slate-800/30 transition-all">
                  <input
                    type="file"
                    accept=".pdf"
                    required
                    disabled={screening}
                    onChange={(e) => setFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <UploadCloud size={32} className="mx-auto text-slate-500 mb-2" />
                  <p className="text-slate-300 font-semibold text-sm">
                    {file ? file.name : 'Click or Drag PDF file here'}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">Maximum file size: 5MB</p>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={screening}
                  className="btn-secondary !py-2 !px-4 !text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={screening}
                  className="btn-primary !py-2 !px-5 !text-sm flex items-center gap-2"
                >
                  {screening ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Screening with AI...
                    </>
                  ) : (
                    'Screen Resume'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
