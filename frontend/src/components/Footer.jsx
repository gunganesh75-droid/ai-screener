import { Zap, Github, Twitter, Linkedin } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
                <Zap size={18} className="text-white" />
              </div>
              <span className="text-lg font-bold text-white">AI<span className="text-primary-400">Screener</span></span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              AI-powered recruitment platform that automatically ranks candidates using Gemini AI. Reduce HR workload and hire smarter.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Platform</h4>
            <ul className="space-y-2.5">
              {[['Browse Jobs', '/jobs'], ['Register', '/register'], ['Login', '/login']].map(([label, to]) => (
                <li key={label}>
                  <Link to={to} className="text-slate-400 hover:text-white text-sm transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">For Recruiters</h4>
            <ul className="space-y-2.5">
              {[['Post a Job', '/register'], ['View Applicants', '/register'], ['AI Screening', '/register']].map(([label, to]) => (
                <li key={label}>
                  <Link to={to} className="text-slate-400 hover:text-white text-sm transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-600 text-xs">&copy; {new Date().getFullYear()} AI Resume Screener. All rights reserved.</p>
          <div className="flex items-center gap-3">
            {[Github, Twitter, Linkedin].map((Icon, i) => (
              <a key={i} href="#" className="p-2 rounded-lg text-slate-600 hover:text-white hover:bg-slate-800 transition-all">
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
