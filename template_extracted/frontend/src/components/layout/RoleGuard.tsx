import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface RoleGuardProps {
  allowedRoles: Array<'customer' | 'merchant' | 'admin'>
  children: React.ReactNode
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { user, role, isLoading, switchDemoRole } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!allowedRoles.includes(role)) {
    const requiredRole = allowedRoles[0]
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            This workspace is reserved for <strong className="capitalize">{requiredRole}</strong> accounts. You are currently browsing in <strong className="capitalize">{role}</strong> mode.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="primary"
              onClick={() => switchDemoRole(requiredRole)}
            >
              Switch to {requiredRole.charAt(0).toUpperCase() + requiredRole.slice(1)} Mode
            </Button>
            <Button
              variant="outline"
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
