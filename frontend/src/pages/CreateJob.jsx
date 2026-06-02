import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { jobsAPI } from '../services/api'
import { toast } from 'react-hot-toast'
import { PlusCircle, ArrowLeft, Tag, X } from 'lucide-react'

export default function CreateJob() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', company: '', description: '', salary: '', location: '' })
  const [skills, setSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const addSkill = () => {
    const s = skillInput.trim()
    if (!s || skills.includes(s)) return
    setSkills([...skills, s])
    setSkillInput('')
  }

  const removeSkill = (s) => setSkills(skills.filter(sk => sk !== s))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.company || !form.description || !form.salary || !form.location)
      return toast.error('Please fill in all required fields')
    if (skills.length === 0) return toast.error('Add at least one required skill')
    setLoading(true)
    try {
      const { data } = await jobsAPI.create({ ...form, skillsRequired: skills })
      if (data.success) {
        toast.success('Job posted successfully!')
        navigate('/hr/dashboard')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create job')
    } finally { setLoading(false) }
  }

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <Link to="/hr/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Create Job Posting</h1>
        <p className="text-slate-500">Candidates will apply and their resumes will be AI-screened automatically.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card space-y-5">
          <h2 className="text-white font-semibold border-b border-slate-800 pb-3">Job Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Job Title *</label>
              <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Senior React Developer" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Company Name *</label>
              <input name="company" value={form.company} onChange={handleChange} placeholder="e.g. Acme Corp" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Location *</label>
              <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Remote / Bangalore" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Salary / Package *</label>
              <input name="salary" value={form.salary} onChange={handleChange} placeholder="e.g. ₹12-18 LPA" className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Job Description *</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              placeholder="Describe the role, responsibilities, and expectations in detail. A more detailed description improves AI matching accuracy."
              rows={6} className="input-field resize-none" />
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="text-white font-semibold flex items-center gap-2 border-b border-slate-800 pb-3">
            <Tag size={16} className="text-primary-400" /> Required Skills
          </h2>
          <div className="flex gap-2">
            <input
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
              placeholder="Type a skill and press Enter or Add"
              className="input-field flex-1"
            />
            <button type="button" onClick={addSkill} className="btn-secondary !px-4 flex-shrink-0">Add</button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {skills.map(s => (
                <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-900/30 border border-primary-700/30 text-primary-300 text-sm rounded-lg font-medium">
                  {s}
                  <button type="button" onClick={() => removeSkill(s)} className="text-primary-500 hover:text-red-400 transition-colors">
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <p className="text-slate-600 text-xs">These skills will be used by the AI to compute candidate match scores.</p>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5">
          {loading
            ? <span className="flex items-center gap-2 justify-center"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Publishing...</span>
            : <><PlusCircle size={18} /> Publish Job Posting</>}
        </button>
      </form>
    </div>
  )
}
