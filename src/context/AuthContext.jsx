import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getCurrentUser())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Validate session with server on initial mount
    if (user) {
      authService.verifySessionWithServer().then((isValid) => {
        if (!isValid) {
          setUser(null)
        }
      })
    }
  }, [])

  const login = async (username, password) => {
    setLoading(true)
    try {
      const loggedUser = await authService.login(username, password)
      setUser(loggedUser)
      return { success: true, user: loggedUser }
    } catch (err) {
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
