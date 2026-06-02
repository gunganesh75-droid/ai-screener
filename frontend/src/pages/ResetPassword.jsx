import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { authAPI } from '../services/api'
import { toast } from 'react-hot-toast'
import { Lock, Eye, EyeOff, Zap, CheckCircle } from 'lucide-react'

export default function ResetPassword() {
  const location = useLocation()
  const navigate = useNavigate()
  const email = location.state?.email || ''

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  // Guard: if no email passed, send back to forgot-password
  if (!email) {
    navigate('/forgot-password', { replace: true })
    return null
  }

  const handleReset = async (e) => {
    e.preventDefault()

    const { newPassword, confirmPassword } = form

    if (!newPassword) return toast.error('Please enter a new password')
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters')
    if (!confirmPassword) return toast.error('Please confirm your new password')
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match')

    setLoading(true)
    try {
      const { data } = await authAPI.resetPassword({ email, newPassword })
      if (data.success) {
        toast.success('Password reset successfully! Please sign in.')
        navigate('/login', { replace: true })
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 hero-gradient">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white">AI<span className="text-primary-400">Screener</span></span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Set new password</h1>
          <p className="text-slate-400 text-sm">
            Resetting password for <span className="text-white font-semibold">{email}</span>
          </p>
        </div>

        <div className="card border-slate-700/60">
          <form onSubmit={handleReset} className="space-y-5" noValidate>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  placeholder="Min. 6 characters"
                  className="input-field pl-11 pr-12"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="Repeat new password"
                  className="input-field pl-11"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5">
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Resetting...
                </span>
              ) : (
                <><CheckCircle size={18} /> Reset Password</>
              )}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-5">
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
