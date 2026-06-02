import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Briefcase, FileText, PlusCircle, Users, LogOut, Zap, X, BarChart3
} from 'lucide-react'

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isHR = user?.role === 'hr'

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const candidateLinks = [
    { to: '/candidate/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/jobs', icon: Briefcase, label: 'Browse Jobs' },
    { to: '/candidate/applications', icon: FileText, label: 'My Applications' },
  ]

  const hrLinks = [
    { to: '/hr/dashboard', icon: Briefcase, label: 'Posted Jobs' },
    { to: '/hr/jobs/create', icon: PlusCircle, label: 'Post a Job' },
  ]

  const links = isHR ? hrLinks : candidateLinks

  return (
    <>
      {/* Backdrop for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:flex md:z-auto
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-white text-sm">AI<span className="text-primary-400">Screener</span></span>
          </div>
          <button onClick={onClose} className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X size={16} />
          </button>
        </div>

        {/* User Info */}
        <div className="px-4 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60">
            <div className="w-10 h-10 rounded-full bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-primary-400 font-bold text-sm flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Role Badge */}
        <div className="px-4 pt-3 pb-1">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
            {isHR ? '🏢 Recruiter Panel' : '👤 Candidate Panel'}
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
