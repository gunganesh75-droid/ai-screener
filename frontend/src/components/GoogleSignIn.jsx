import { useState } from 'react'
import { authAPI } from '../services/api'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Briefcase, Users, CheckCircle, AlertCircle } from 'lucide-react'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../config/firebase'

export default function GoogleSignIn({ mode = 'signin' }) {
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  // Steps state: 'init' | 'role_select'
  const [step, setStep] = useState('init')
  const [pendingAuth, setPendingAuth] = useState(null) // { credential, email, name }
  const [selectedRole, setSelectedRole] = useState('candidate')

  // Complete the login/signup process with the role
  const completeAuthWithRole = async (roleValue) => {
    if (!pendingAuth) return
    setLoading(true)
    try {
      const { data } = await authAPI.googleLogin({
        credential: pendingAuth.credential,
        email: pendingAuth.email,
        name: pendingAuth.name,
        role: roleValue,
      })

      if (data.success) {
        if (data.isNewUser) {
          localStorage.setItem('rs_is_new_user', 'true')
        }
        login(data.user, data.token)
        toast.success(`Welcome to AIScreener, ${data.user.name}!`)
        setStep('init')
        setPendingAuth(null)
        navigate(data.user.role === 'hr' ? '/hr/dashboard' : '/candidate/dashboard')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  // Handle OAuth response
  const handleAuthResponse = async (payload) => {
    setLoading(true)
    try {
      const { data } = await authAPI.googleLogin({
        credential: payload.credential,
        email: payload.email,
        name: payload.name,
      })

      if (data.success) {
        if (data.needsRole) {
          // New user: must pick a role
          setPendingAuth({
            credential: payload.credential,
            email: data.email,
            name: data.name,
          })
          setStep('role_select')
        } else {
          // Existing user: direct login
          if (data.isNewUser) {
            localStorage.setItem('rs_is_new_user', 'true')
          }
          login(data.user, data.token)
          toast.success(`Welcome back, ${data.user.name}!`)
          navigate(data.user.role === 'hr' ? '/hr/dashboard' : '/candidate/dashboard')
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleClick = async () => {
    setLoading(true)
    try {
      // 1. Try real Firebase Google Sign-In Popup
      const userCredential = await signInWithPopup(auth, googleProvider)
      const idToken = await userCredential.user.getIdToken()
      const userEmail = userCredential.user.email
      const userName = userCredential.user.displayName || userEmail.split('@')[0]

      await handleAuthResponse({
        credential: idToken,
        email: userEmail,
        name: userName
      })
    } catch (err) {
      console.error('Firebase Auth popup error:', err)
      
      // Handle user-initiated cancel/blocked popup events without triggering mock fallback
      if (
        err.code === 'auth/popup-closed-by-user' ||
        err.code === 'auth/cancelled-popup-request' ||
        err.code === 'auth/popup-blocked'
      ) {
        toast.error('Sign-in popup was closed or blocked. Please try again.')
        setLoading(false)
        return
      }

      if (err.code === 'auth/account-exists-with-different-credential' || err.code === 'auth/credential-already-in-use') {
        toast.error(
          'This Google email is already linked to another sign-in method. Please sign in with the same account or use your existing password login.',
          { duration: 7000 }
        )
        setLoading(false)
        return
      }
      
      // If Firebase auth fails (e.g. because Google Provider is not enabled in Firebase Console yet)
      // we show a descriptive toast with instructions AND fallback to simulated login so the user is never blocked.
      if (err.code === 'auth/operation-not-allowed') {
        toast.error(
          'Google Auth Provider is not enabled in your Firebase console. Please go to Authentication > Sign-in method and enable Google.',
          { duration: 6000 }
        )
      } else {
        toast.error(`Firebase Auth failed: ${err.message}. Initializing dev fallback...`)
      }

      // Dev Fallback trigger
      const mockEmail = mode === 'signup' ? `new_user_${Date.now()}@gmail.com` : 'candidate@gmail.com'
      const mockName = mode === 'signup' ? 'New Candidate' : 'Google User'
      const mockCredential = `mock_google_${Date.now()}`
      
      await handleAuthResponse({
        credential: mockCredential,
        email: mockEmail,
        name: mockName
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      {/* STEP 1: INITIAL GOOGLE BUTTON */}
      {step === 'init' && (
        <button
          type="button"
          onClick={handleGoogleClick}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-900 font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 text-base border border-slate-200"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-slate-300 border-t-primary-600 rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.49 3.77v3.12h4.02c2.34-2.16 3.69-5.32 3.69-8.74z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-4.02-3.12c-1.12.75-2.54 1.19-3.94 1.19-3.04 0-5.62-2.05-6.54-4.82H1.31v3.22c2.01 4 6.14 6.44 10.69 6.44z"
              />
              <path
                fill="#FBBC05"
                d="M5.46 14.34a7.12 7.12 0 0 1 0-4.68V6.44H1.31a11.97 11.97 0 0 0 0 11.12l4.15-3.22z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.22 0 12 0 7.45 0 3.32 2.44 1.31 6.44l4.15 3.22c.92-2.77 3.5-4.82 6.54-4.82z"
              />
            </svg>
          )}
          <span>{mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}</span>
        </button>
      )}

      {/* STEP 2: INLINE ROLE SELECTION */}
      {step === 'role_select' && (
        <div className="space-y-5 animate-fade-in text-left">
          <div className="text-center mb-1">
            <h2 className="text-lg font-bold text-white mb-1">Choose your role</h2>
            <p className="text-slate-400 text-xs">For profile <span className="text-white font-medium">{pendingAuth?.email}</span></p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Candidate Role Option */}
            <button
              type="button"
              onClick={() => setSelectedRole('candidate')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 text-center transition-all ${
                selectedRole === 'candidate'
                  ? 'bg-primary-600/10 border-primary-500 text-white shadow-lg shadow-primary-500/10'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${selectedRole === 'candidate' ? 'bg-primary-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                <Users size={18} />
              </div>
              <span className="font-bold text-xs">Job Seeker</span>
              <span className="text-[9px] text-slate-500 mt-0.5 block">Find & Apply</span>
            </button>

            {/* HR Role Option */}
            <button
              type="button"
              onClick={() => setSelectedRole('hr')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 text-center transition-all ${
                selectedRole === 'hr'
                  ? 'bg-violet-600/10 border-violet-500 text-white shadow-lg shadow-violet-500/10'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${selectedRole === 'hr' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                <Briefcase size={18} />
              </div>
              <span className="font-bold text-xs">Recruiter</span>
              <span className="text-[9px] text-slate-500 mt-0.5 block">Post & Screen</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => completeAuthWithRole(selectedRole)}
            disabled={loading}
            className="w-full btn-primary !py-2.5 mt-2 flex items-center justify-center gap-2 text-xs"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle size={15} />
                <span>Complete Registration</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
