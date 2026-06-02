import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { applicationsAPI } from '../services/api'
import { toast } from 'react-hot-toast'
import StatusBadge from '../components/StatusBadge'
import ScoreRing from '../components/ScoreRing'
import { ArrowLeft, Loader2, CheckCircle, XCircle, Clock, Download, User, Brain, Tag, ThumbsUp, ThumbsDown, FileText } from 'lucide-react'

export default function ApplicantDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    // We fetch via job applications – but if coming from direct link, use a stored ID approach.
    // For now, we get all my applications won't work for HR — store app in state from ApplicantsPage
    // Instead, let's make a generic approach by using the applicants list — stored in sessionStorage
    const stored = sessionStorage.getItem(`app_${id}`)
    if (stored) {
      setApp(JSON.parse(stored))
      setLoading(false)
    } else {
      toast.error('Please navigate from the Applicants page.')
      navigate(-1)
    }
  }, [id])

  const updateStatus = async (status) => {
    setUpdating(true)
    try {
      await applicationsAPI.updateStatus(id, status)
      setApp(prev => ({ ...prev, status }))
      toast.success(`Status updated to ${status}`)
    } catch { toast.error('Failed to update') }
    finally { setUpdating(false) }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={32} className="text-primary-500 animate-spin" /></div>
  if (!app) return null

  const scoreTextColor = app.aiScore >= 70 ? 'text-emerald-400' : app.aiScore >= 50 ? 'text-amber-400' : 'text-red-400'

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to Applicants
      </button>

      {/* Header card */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <ScoreRing score={app.aiScore} size={100} />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">{app.candidateId?.name}</h1>
              <StatusBadge status={app.status} />
            </div>
            <p className="text-slate-400 mb-1">{app.candidateId?.email}</p>
            <p className="text-slate-500 text-sm">Applied {new Date(app.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-sm font-semibold ${scoreTextColor}`}>AI Recommendation: {app.recommendation}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 self-start">
            <button onClick={() => updateStatus('Shortlisted')} disabled={updating} className="btn-success !py-2 !px-4 !text-sm">
              <CheckCircle size={14} /> Shortlist
            </button>
            <button onClick={() => updateStatus('Review')} disabled={updating} className="px-4 py-2 rounded-xl text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-sm font-semibold flex items-center gap-1.5 transition-all">
              <Clock size={14} /> Review
            </button>
            <button onClick={() => updateStatus('Rejected')} disabled={updating} className="btn-danger !py-2 !px-4 !text-sm">
              <XCircle size={14} /> Reject
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — AI Analysis */}
        <div className="lg:col-span-2 space-y-5">
          {/* Summary */}
          {app.aiSummary && (
            <div className="card">
              <h2 className="text-white font-semibold mb-3 flex items-center gap-2"><Brain size={16} className="text-primary-400" /> AI Analysis Summary</h2>
              <p className="text-slate-400 text-sm leading-relaxed">{app.aiSummary}</p>
            </div>
          )}

          {/* Skills */}
          <div className="card">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><Tag size={16} className="text-primary-400" /> Skills Assessment</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {app.matchedSkills?.length > 0 && (
                <div>
                  <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wide mb-2">✅ Matched Skills ({app.matchedSkills.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {app.matchedSkills.map(s => (
                      <span key={s} className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {app.missingSkills?.length > 0 && (
                <div>
                  <p className="text-red-400 text-xs font-semibold uppercase tracking-wide mb-2">❌ Missing Skills ({app.missingSkills.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {app.missingSkills.map(s => (
                      <span key={s} className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          {(app.strengths?.length > 0 || app.weaknesses?.length > 0) && (
            <div className="card">
              <h2 className="text-white font-semibold mb-4">Strengths & Weaknesses</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {app.strengths?.length > 0 && (
                  <div>
                    <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1"><ThumbsUp size={12} /> Strengths</p>
                    <ul className="space-y-2">
                      {app.strengths.map((s, i) => (
                        <li key={i} className="text-slate-400 text-sm flex items-start gap-2">
                          <CheckCircle size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" /> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {app.weaknesses?.length > 0 && (
                  <div>
                    <p className="text-red-400 text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1"><ThumbsDown size={12} /> Weaknesses</p>
                    <ul className="space-y-2">
                      {app.weaknesses.map((s, i) => (
                        <li key={i} className="text-slate-400 text-sm flex items-start gap-2">
                          <XCircle size={13} className="text-red-500 mt-0.5 flex-shrink-0" /> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right — Info & Actions */}
        <div className="space-y-5">
          <div className="card">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><User size={15} className="text-primary-400" /> Candidate Info</h3>
            <dl className="space-y-3 text-sm">
              {[['Name', app.candidateId?.name], ['Email', app.candidateId?.email], ['Applied', new Date(app.createdAt).toLocaleDateString()], ['AI Score', `${app.aiScore}%`], ['Recommendation', app.recommendation]].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <dt className="text-slate-600 font-medium">{k}</dt>
                  <dd className="text-slate-300 text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="card">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><FileText size={15} className="text-primary-400" /> Resume</h3>
            <div className="flex flex-col gap-2">
              <a
                href={app.resumeUrl ? (app.resumeUrl.startsWith('http') ? app.resumeUrl : `${(import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '')}${app.resumeUrl}`) : '#'}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary w-full justify-center !text-sm !py-2.5"
              >
                <FileText size={14} /> View PDF
              </a>
              <a
                href={app.resumeUrl ? (app.resumeUrl.startsWith('http') ? app.resumeUrl : `${(import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '')}${app.resumeUrl}`) : '#'}
                download
                className="btn-secondary w-full justify-center !text-sm !py-2.5 !bg-slate-700/50"
              >
                <Download size={14} /> Download PDF
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
