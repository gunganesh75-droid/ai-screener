import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { applicationsAPI, jobsAPI } from '../services/api'
import { toast } from 'react-hot-toast'
import StatusBadge from '../components/StatusBadge'
import ScoreRing from '../components/ScoreRing'
import { ArrowLeft, Loader2, Users, Eye, CheckCircle, XCircle, Clock, UploadCloud, X } from 'lucide-react'

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
      setApplications(prev => {
        const updated = [data.application, ...prev]
        return updated.sort((a, b) => b.aiScore - a.aiScore)
      })
      toast.success('Resume uploaded and screened by Gemini AI successfully!')
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
  const visible = filter === 'All'
    ? applications.filter(a => a.status !== 'Rejected')
    : applications.filter(a => a.status === filter)

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={32} className="text-primary-500 animate-spin" /></div>

  return (
    <div className="animate-fade-in relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <Link to="/hr/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn-primary !py-2 !px-4 !text-sm flex items-center gap-2 w-full sm:w-auto justify-center shadow-lg shadow-primary-900/40"
        >
          <UploadCloud size={16} /> Upload & Screen Resume
        </button>
      </div>

      {/* Job title card */}
      <div className="card mb-6 bg-gradient-to-r from-primary-900/20 to-violet-900/10 border-primary-700/30">
        <h1 className="text-lg sm:text-xl font-bold text-white mb-1 break-words">Applicants for: {job?.title}</h1>
        <p className="text-slate-400 text-sm">{job?.company} · {applications.filter(a => a.status !== 'Rejected').length} active candidates · Ranked by AI score</p>
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

      {/* Filter tabs — scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 no-scrollbar">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all ${filter === s ? 'bg-primary-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
            {s}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="card text-center py-14">
          <Users size={44} className="text-slate-700 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">No applicants found</p>
          <p className="text-slate-500 text-sm">
            {filter === 'All' ? 'No active applications received yet.' :
             filter === 'Rejected' ? 'No rejected candidates.' :
             `No candidates with status "${filter}" yet.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((app, idx) => (
            <div key={app._id} className="card hover:border-slate-600/60 transition-all !p-4">
              {/* Top row: rank + score + info */}
              <div className="flex items-start gap-3">
                <div className="text-slate-600 text-xs font-bold w-5 text-center pt-1 flex-shrink-0">#{idx + 1}</div>
                <ScoreRing score={app.aiScore} size={56} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-white font-semibold text-sm">{app.candidateId?.name || 'Candidate'}</p>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="text-slate-500 text-xs truncate">{app.candidateId?.email}</p>
                  <p className="text-slate-600 text-xs mt-0.5">Applied {new Date(app.createdAt).toLocaleDateString()}</p>
                  {app.matchedSkills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {app.matchedSkills.slice(0, 3).map(s => (
                        <span key={s} className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-md">{s}</span>
                      ))}
                      {app.matchedSkills.length > 3 && (
                        <span className="px-2 py-0.5 bg-slate-700 text-slate-400 text-xs rounded-md">+{app.matchedSkills.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom action row — wrap buttons on mobile */}
              <div className="flex flex-wrap items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-800/60">
                <button
                  onClick={() => handleViewDetails(app)}
                  className="flex w-full sm:w-auto items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 text-xs font-medium transition-all"
                  title="View Details"
                >
                  <Eye size={13} /> View
                </button>
                <button
                  disabled={updating === app._id}
                  onClick={() => updateStatus(app._id, 'Shortlisted')}
                  className="flex w-full sm:w-auto items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-medium transition-all"
                  title="Shortlist"
                >
                  <CheckCircle size={13} /> Shortlist
                </button>
                <button
                  disabled={updating === app._id}
                  onClick={() => updateStatus(app._id, 'Review')}
                  className="flex w-full sm:w-auto items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-medium transition-all"
                  title="Mark Review"
                >
                  <Clock size={13} /> Review
                </button>
                <button
                  disabled={updating === app._id}
                  onClick={() => updateStatus(app._id, 'Rejected')}
                  className="flex w-full sm:w-auto items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-red-400 bg-red-500/10 hover:bg-red-500/20 text-xs font-medium transition-all"
                  title="Reject"
                >
                  <XCircle size={13} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload & Screen Resume Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full sm:max-w-lg bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => { if (!screening) setShowUploadModal(false) }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              disabled={screening}
            >
              <X size={20} />
            </button>

            <h2 className="text-lg sm:text-xl font-bold text-white mb-1 flex items-center gap-2">
              <UploadCloud className="text-primary-500" />
              Upload & Screen Resume
            </h2>
            <p className="text-slate-400 text-sm mb-5">
              Upload a candidate's PDF resume to run instant Gemini AI screening and match analysis.
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
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors text-sm"
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
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Resume File (PDF only)</label>
                <div className="border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-2xl p-5 text-center cursor-pointer relative bg-slate-800/30 transition-all">
                  <input
                    type="file"
                    accept=".pdf"
                    required
                    disabled={screening}
                    onChange={(e) => setFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <UploadCloud size={28} className="mx-auto text-slate-500 mb-2" />
                  <p className="text-slate-300 font-semibold text-sm">
                    {file ? file.name : 'Tap to select PDF file'}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">Maximum file size: 5MB</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={screening}
                  className="btn-secondary !py-2.5 !px-4 !text-sm flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={screening}
                  className="btn-primary !py-2.5 !px-5 !text-sm flex items-center justify-center gap-2 flex-1"
                >
                  {screening ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Screening...
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
