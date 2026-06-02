import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { jobsAPI, applicationsAPI } from '../services/api'
import { toast } from 'react-hot-toast'
import { Upload, FileText, CheckCircle, AlertCircle, ArrowLeft, Loader2, Brain } from 'lucide-react'

export default function ApplyJob() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    jobsAPI.getById(jobId)
      .then(r => setJob(r.data.job))
      .catch(() => { toast.error('Job not found'); navigate('/jobs') })
      .finally(() => setFetchLoading(false))
  }, [jobId])

  const handleFile = (f) => {
    if (!f) return
    if (f.type !== 'application/pdf') { toast.error('Only PDF files allowed'); return }
    if (f.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return }
    setFile(f)
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) { toast.error('Please upload your resume PDF'); return }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('jobId', jobId)
      fd.append('resume', file)
      const { data } = await applicationsAPI.apply(fd)
      if (data.success) {
        toast.success('Application submitted! AI is analysing your resume.')
        navigate('/candidate/applications')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Application failed')
    } finally { setLoading(false) }
  }

  if (fetchLoading) return (
    <div className="flex justify-center py-20"><Loader2 size={32} className="text-primary-500 animate-spin" /></div>
  )

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <Link to={`/jobs/${jobId}`} className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to job
      </Link>

      <div className="card mb-5 bg-gradient-to-r from-primary-900/20 to-violet-900/10 border-primary-700/30">
        <h1 className="text-xl font-bold text-white mb-1">Apply for: {job?.title}</h1>
        <p className="text-slate-400">{job?.company} · {job?.location}</p>
      </div>

      {/* AI info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 mb-6">
        <Brain size={20} className="text-primary-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-white font-medium text-sm">AI-powered analysis included</p>
          <p className="text-slate-500 text-xs leading-relaxed mt-0.5">
            After submission, Gemini AI will parse your resume, calculate a match score, and instantly rank your profile among all applicants.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card mb-5">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><FileText size={16} /> Upload Resume</h2>
          {/* Drop Zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('resume-input').click()}
            className={`relative cursor-pointer border-2 border-dashed rounded-xl p-10 text-center transition-all ${
              dragOver ? 'border-primary-500 bg-primary-500/10' :
              file ? 'border-emerald-500/60 bg-emerald-500/5' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/40'
            }`}
          >
            <input id="resume-input" type="file" accept=".pdf" className="hidden" onChange={e => handleFile(e.target.files[0])} />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle size={36} className="text-emerald-400" />
                <p className="text-emerald-400 font-semibold">{file.name}</p>
                <p className="text-slate-500 text-xs">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload size={36} className="text-slate-600" />
                <p className="text-slate-300 font-medium">Drop your PDF here or click to browse</p>
                <p className="text-slate-600 text-xs">PDF only · max 5MB</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 mb-5">
          <AlertCircle size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-amber-300/80 text-xs">Ensure your PDF resume is up to date and contains your latest skills & experience for the best AI score.</p>
        </div>

        <button type="submit" disabled={loading || !file} className="btn-primary w-full !py-3.5">
          {loading ? (
            <span className="flex items-center gap-2 justify-center">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Uploading & Analysing...
            </span>
          ) : (
            <><Brain size={18} /> Submit Application with AI Screening</>
          )}
        </button>
      </form>
    </div>
  )
}
