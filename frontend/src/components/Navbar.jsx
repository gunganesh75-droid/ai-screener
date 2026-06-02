import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Briefcase, LogOut, Menu, X, Zap, User, LayoutDashboard } from 'lucide-react'

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const dashboardPath = user?.role === 'hr' ? '/hr/dashboard' : '/candidate/dashboard'

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-900/50 group-hover:shadow-primary-800/60 transition-all duration-200">
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-white hidden sm:block">
              AI<span className="text-primary-400">Screener</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            <Link to="/jobs" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/jobs' ? 'text-white bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}`}>
              Browse Jobs
            </Link>
            {isAuthenticated ? (
              <>
                <Link to={dashboardPath} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 flex items-center gap-2 transition-colors">
                  <LayoutDashboard size={15} /> Dashboard
                </Link>
                <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-800">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700">
                    <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center">
                      <User size={12} className="text-white" />
                    </div>
                    <span className="text-sm text-slate-300 font-medium max-w-[100px] truncate">{user?.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-md bg-primary-900/60 text-primary-400 font-semibold uppercase">{user?.role}</span>
                  </div>
                  <button onClick={handleLogout} className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-all">
                    <LogOut size={16} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link to="/login" className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-all">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary !py-2 !px-5 !text-sm">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 py-4 space-y-2 animate-fade-in">
          <Link to="/jobs" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all">
            <Briefcase size={16} /> Browse Jobs
          </Link>
          {isAuthenticated ? (
            <>
              <Link to={dashboardPath} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all">
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <button onClick={() => { handleLogout(); setMobileOpen(false) }} className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-red-400 hover:bg-red-900/20 transition-all">
                <LogOut size={16} /> Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 text-center transition-all">Sign In</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary w-full text-center">Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
