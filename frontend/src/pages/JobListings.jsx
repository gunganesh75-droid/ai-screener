import { useState, useEffect } from 'react'
import { jobsAPI } from '../services/api'
import JobCard from '../components/JobCard'
import { Search, MapPin, Loader2, Briefcase, X } from 'lucide-react'

export default function JobListings() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [filtered, setFiltered] = useState([])

  useEffect(() => { fetchJobs() }, [])
  useEffect(() => {
    const q = search.toLowerCase(); const l = location.toLowerCase()
    setFiltered(jobs.filter(j =>
      (!q || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.description.toLowerCase().includes(q)) &&
      (!l || j.location.toLowerCase().includes(l))
    ))
  }, [search, location, jobs])

  const fetchJobs = async () => {
    try {
      const { data } = await jobsAPI.getAll()
      setJobs(data.jobs || [])
      setFiltered(data.jobs || [])
    } catch { } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900/60 border-b border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-3">Browse Open Positions</h1>
          <p className="text-slate-400 mb-8">Find your next opportunity from {jobs.length} active listings</p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto flex gap-3 flex-col sm:flex-row">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search jobs or companies..." className="input-field pl-11 w-full"
              />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X size={14} /></button>}
            </div>
            <div className="relative">
              <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text" value={location} onChange={e => setLocation(e.target.value)}
                placeholder="Location" className="input-field pl-11 w-full sm:w-48"
              />
              {location && <button onClick={() => setLocation('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X size={14} /></button>}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={36} className="text-primary-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase size={48} className="text-slate-700 mx-auto mb-4" />
            <h3 className="text-white font-semibold text-xl mb-2">No jobs found</h3>
            <p className="text-slate-500">{search || location ? 'Try adjusting your search filters.' : 'No job listings available yet.'}</p>
          </div>
        ) : (
          <>
            <p className="text-slate-500 text-sm mb-6">{filtered.length} position{filtered.length !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(job => <JobCard key={job._id} job={job} />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
