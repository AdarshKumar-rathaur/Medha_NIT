import React, { createContext, useContext, useState, useEffect } from 'react'
import type { User, UserRole } from '@/types'
import { ApiClient } from '@/api/client'

interface AuthContextType {
  user: User | null
  role: UserRole
  isLoading: boolean
  login: (email: string, role: UserRole) => Promise<void>
  logout: () => Promise<void>
  switchDemoRole: (role: UserRole) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function initUser() {
      try {
        const stored = await ApiClient.getStoredUser()
        setUser(stored)
      } catch (err) {
        console.error('Failed to load user session', err)
      } finally {
        setIsLoading(false)
      }
    }
    initUser()
  }, [])

  const login = async (email: string, role: UserRole) => {
    setIsLoading(true)
    try {
      const loggedIn = await ApiClient.login(email, role === 'admin' ? 'merchant' : role)
      setUser(loggedIn)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await ApiClient.logout()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const switchDemoRole = async (targetRole: UserRole) => {
    if (targetRole === 'customer') {
      await login('priya.sharma@example.com', 'customer')
    } else {
      await login('hello@littleferncafe.in', 'merchant')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'customer',
        isLoading,
        login,
        logout,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
