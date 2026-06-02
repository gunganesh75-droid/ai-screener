import { useState, useEffect } from 'react'
import { applicationsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import ScoreRing from '../components/ScoreRing'
import { resolveResumeUrl, downloadResumeFile } from '../utils/resumeUrl'
import { toast } from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { Briefcase, Loader2, ChevronDown, ChevronUp, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

function SkillPill({ label, type }) {
  const cls = type === 'matched'
    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
    : 'bg-red-500/10 border-red-500/20 text-red-400'
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium ${cls}`}>{type === 'matched' ? <CheckCircle size={10} /> : <XCircle size={10} />}{label}</span>
}

function ApplicationRow({ app }) {
  const [expanded, setExpanded] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    if (!app.resumeUrl) return
    setDownloading(true)
    try {
      await downloadResumeFile(app.resumeUrl)
    } catch (err) {
      console.error('Download Resume Error:', err)
      toast.error(err.message || 'Failed to download resume')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="bg-slate-800/30 rounded-xl border border-slate-700/40 hover:border-slate-600/50 transition-all overflow-hidden">
      <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <ScoreRing score={app.aiScore} size={60} />
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold truncate">{app.jobId?.title || 'Unknown Role'}</p>
          <p className="text-slate-400 text-sm">{app.jobId?.company} · {app.jobId?.location}</p>
          <p className="text-slate-600 text-xs mt-0.5">{new Date(app.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={app.status} />
          {expanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-700/40 pt-4 animate-fade-in space-y-4">
          {app.aiSummary && (
            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700/40">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1">AI Summary</p>
              <p className="text-slate-300 text-sm leading-relaxed">{app.aiSummary}</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {app.matchedSkills?.length > 0 && (
              <div>
                <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wide mb-2">✅ Matched Skills</p>
                <div className="flex flex-wrap gap-1.5">{app.matchedSkills.map(s => <SkillPill key={s} label={s} type="matched" />)}</div>
              </div>
            )}
            {app.missingSkills?.length > 0 && (
              <div>
                <p className="text-red-400 text-xs font-semibold uppercase tracking-wide mb-2">❌ Missing Skills</p>
                <div className="flex flex-wrap gap-1.5">{app.missingSkills.map(s => <SkillPill key={s} label={s} type="missing" />)}</div>
              </div>
            )}
          </div>
          {app.strengths?.length > 0 && (
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Strengths</p>
              <ul className="space-y-1">{app.strengths.map((s, i) => <li key={i} className="text-slate-400 text-sm flex items-start gap-2"><CheckCircle size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />{s}</li>)}</ul>
            </div>
          )}
          {app.weaknesses?.length > 0 && (
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Weaknesses</p>
              <ul className="space-y-1">{app.weaknesses.map((s, i) => <li key={i} className="text-slate-400 text-sm flex items-start gap-2"><AlertCircle size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />{s}</li>)}</ul>
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            <a
              href={resolveResumeUrl(app.resumeUrl)}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary !py-2 !px-4 !text-sm inline-flex"
            >
              View Resume PDF
            </a>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="btn-secondary !py-2 !px-4 !text-sm inline-flex !bg-slate-700/50"
            >
              {downloading ? 'Downloading...' : 'Download PDF'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MyApplications() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    applicationsAPI.getMyApplications()
      .then(r => setApplications(r.data.applications || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const statuses = ['All', 'Shortlisted', 'Review', 'Rejected', 'Applied']
  const visible = filter === 'All' ? applications : applications.filter(a => a.status === filter)

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">My Applications</h1>
        <p className="text-slate-500">Track all your job applications and AI analysis results</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === s ? 'bg-primary-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
            {s} {s === 'All' ? `(${applications.length})` : `(${applications.filter(a => a.status === s).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={32} className="text-primary-500 animate-spin" /></div>
      ) : visible.length === 0 ? (
        <div className="card text-center py-16">
          <Briefcase size={44} className="text-slate-700 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">No applications found</p>
          <p className="text-slate-500 text-sm mb-4">{filter !== 'All' ? 'No applications in this category.' : 'Start applying for jobs!'}</p>
          <Link to="/jobs" className="btn-primary !py-2 !px-5 !text-sm">Find Jobs</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(app => <ApplicationRow key={app._id} app={app} />)}
        </div>
      )}
    </div>
  )
}
