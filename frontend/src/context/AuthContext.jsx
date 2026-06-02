import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged, signOut, getIdToken } from 'firebase/auth'
import { auth } from '../config/firebase'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Listen for Firebase auth state changes (handles token refresh automatically)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get fresh ID token (Firebase refreshes it automatically if expired)
          const freshToken = await getIdToken(firebaseUser, /* forceRefresh */ false)

          // Check if we have stored user profile
          const storedUser = localStorage.getItem('rs_user')
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser)
              setUser(parsedUser)
              setToken(freshToken)
              localStorage.setItem('rs_token', freshToken)
            } catch {
              localStorage.removeItem('rs_user')
            }
          }
          // If no stored user profile (e.g. new sign-up), wait for the backend response to set it
        } catch (err) {
          console.warn('Failed to get fresh token:', err.message)
          // Try from localStorage as fallback
          const storedToken = localStorage.getItem('rs_token')
          const storedUser = localStorage.getItem('rs_user')
          if (storedToken && storedUser) {
            try {
              setToken(storedToken)
              setUser(JSON.parse(storedUser))
            } catch {
              localStorage.removeItem('rs_token')
              localStorage.removeItem('rs_user')
            }
          }
        }
      } else {
        // No Firebase user — clear everything
        setUser(null)
        setToken(null)
        localStorage.removeItem('rs_token')
        localStorage.removeItem('rs_user')
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = (userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem('rs_token', authToken)
    localStorage.setItem('rs_user', JSON.stringify(userData))
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (err) {
      console.warn('Firebase sign out error:', err.message)
    }
    setUser(null)
    setToken(null)
    localStorage.removeItem('rs_token')
    localStorage.removeItem('rs_user')
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('rs_user', JSON.stringify(updatedUser))
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser, isAuthenticated: !!user && !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
