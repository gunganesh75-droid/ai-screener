import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { jobsAPI } from '../services/api'
import { toast } from 'react-hot-toast'
import { Save, ArrowLeft, Tag, X, Loader2 } from 'lucide-react'

export default function EditJob() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', company: '', description: '', salary: '', location: '' })
  const [skills, setSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)

  useEffect(() => {
    jobsAPI.getById(id)
      .then(r => {
        const j = r.data.job
        setForm({ title: j.title, company: j.company, description: j.description, salary: j.salary, location: j.location })
        setSkills(j.skillsRequired || [])
      })
      .catch(() => { toast.error('Failed to load job'); navigate('/hr/dashboard') })
      .finally(() => setFetchLoading(false))
  }, [id])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const addSkill = () => { const s = skillInput.trim(); if (!s || skills.includes(s)) return; setSkills([...skills, s]); setSkillInput('') }
  const removeSkill = (s) => setSkills(skills.filter(sk => sk !== s))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.company || !form.description || !form.salary || !form.location) return toast.error('Please fill all fields')
    if (skills.length === 0) return toast.error('Add at least one required skill')
    setLoading(true)
    try {
      await jobsAPI.update(id, { ...form, skillsRequired: skills })
      toast.success('Job updated successfully!'); navigate('/hr/dashboard')
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed') }
    finally { setLoading(false) }
  }

  if (fetchLoading) return <div className="flex justify-center py-20"><Loader2 size={32} className="text-primary-500 animate-spin" /></div>

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <Link to="/hr/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Edit Job Posting</h1>
        <p className="text-slate-500">Update your job listing details below.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card space-y-5">
          <h2 className="text-white font-semibold border-b border-slate-800 pb-3">Job Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[['title','Job Title','e.g. Senior React Developer'],['company','Company','e.g. Acme Corp'],['location','Location','e.g. Remote'],['salary','Salary','e.g. ₹12-18 LPA']].map(([name, label, ph]) => (
              <div key={name}>
                <label className="block text-sm font-medium text-slate-300 mb-2">{label} *</label>
                <input name={name} value={form[name]} onChange={handleChange} placeholder={ph} className="input-field" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Job Description *</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={6} className="input-field resize-none" />
          </div>
        </div>
        <div className="card space-y-4">
          <h2 className="text-white font-semibold flex items-center gap-2 border-b border-slate-800 pb-3">
            <Tag size={16} className="text-primary-400" /> Required Skills
          </h2>
          <div className="flex gap-2">
            <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
              placeholder="Add a skill..." className="input-field flex-1" />
            <button type="button" onClick={addSkill} className="btn-secondary !px-4">Add</button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {skills.map(s => (
                <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-900/30 border border-primary-700/30 text-primary-300 text-sm rounded-lg font-medium">
                  {s} <button type="button" onClick={() => removeSkill(s)} className="text-primary-500 hover:text-red-400 transition-colors"><X size={13} /></button>
                </span>
              ))}
            </div>
          )}
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5">
          {loading ? <span className="flex items-center gap-2 justify-center"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</span>
            : <><Save size={18} /> Save Changes</>}
        </button>
      </form>
    </div>
  )
}
