import { MapPin, DollarSign, Briefcase, ArrowRight, Building2 } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function JobCard({ job }) {
  const skills = job.skillsRequired?.slice(0, 3) || []
  const extra = (job.skillsRequired?.length || 0) - 3

  return (
    <div className="card-hover group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary-600/15 border border-primary-500/20 flex items-center justify-center flex-shrink-0">
            <Building2 size={20} className="text-primary-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-base leading-tight line-clamp-1 group-hover:text-primary-300 transition-colors">
              {job.title}
            </h3>
            <p className="text-slate-400 text-sm font-medium">{job.company}</p>
          </div>
        </div>
      </div>

      <p className="text-slate-500 text-sm line-clamp-2 mb-4 leading-relaxed">
        {job.description}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {skills.map((s) => (
          <span key={s} className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg font-medium">
            {s}
          </span>
        ))}
        {extra > 0 && (
          <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-500 text-xs rounded-lg font-medium">
            +{extra} more
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <MapPin size={12} className="text-slate-600" /> {job.location}
          </span>
          <span className="flex items-center gap-1.5">
            <DollarSign size={12} className="text-slate-600" /> {job.salary}
          </span>
        </div>
        <Link
          to={`/jobs/${job._id}`}
          className="flex items-center gap-1.5 text-primary-400 text-sm font-semibold hover:text-primary-300 transition-colors"
        >
          View <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}
