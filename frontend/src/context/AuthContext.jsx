// VaaniStock — Auth Context
import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('vaanistock_user')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('vaanistock_token')
    if (token && !user) {
      authAPI.me()
        .then((res) => setUser(res.data.data))
        .catch(() => {
          localStorage.removeItem('vaanistock_token')
          localStorage.removeItem('vaanistock_user')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [user])

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password })
    const { token, user: userData } = res.data
    localStorage.setItem('vaanistock_token', token)
    localStorage.setItem('vaanistock_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const register = async (data) => {
    const res = await authAPI.register(data)
    const { token, user: userData } = res.data
    localStorage.setItem('vaanistock_token', token)
    localStorage.setItem('vaanistock_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const logout = () => {
    localStorage.removeItem('vaanistock_token')
    localStorage.removeItem('vaanistock_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
