import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'
import GoogleSignIn from '../components/GoogleSignIn'

export default function Register() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 hero-gradient animate-fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Zap size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white">AI<span className="text-primary-400">Screener</span></span>
          </Link>
          <h1 className="text-3xl font-extrabold text-white mb-2">Create Account</h1>
          <p className="text-slate-400 text-sm">Join recruiters and job seekers using Google Sign-Up</p>
        </div>

        <div className="card border-slate-700/60 p-8 shadow-2xl relative overflow-hidden backdrop-blur-md bg-slate-900/50">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary-500 to-violet-500" />
          
          <div className="space-y-6">
            <GoogleSignIn mode="signup" />

            <div className="text-center text-sm text-slate-400 mt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-400 hover:text-primary-300 font-bold transition-colors">
                Sign in with Google
              </Link>
            </div>

            <div className="text-center text-xs text-slate-500 mt-6 leading-relaxed border-t border-slate-800/60 pt-4">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-slate-400 hover:text-white transition-colors underline">Terms of Service</a>{' '}
              and{' '}
              <a href="#" className="text-slate-400 hover:text-white transition-colors underline">Privacy Policy</a>.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
