import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { getMe } from '@/api/auth'
import type { Supplier } from '@/types'

interface AuthContextValue {
  supplier: Supplier | null
  token: string | null
  isAdmin: boolean
  isLoading: boolean
  login: (token: string, supplier: Supplier) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('token')
    if (!stored) {
      setIsLoading(false)
      return
    }
    getMe()
      .then((s) => setSupplier(s))
      .catch(() => {
        localStorage.removeItem('token')
        setToken(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback((newToken: string, newSupplier: Supplier) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setSupplier(newSupplier)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setSupplier(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{ supplier, token, isAdmin: supplier?.is_admin ?? false, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
