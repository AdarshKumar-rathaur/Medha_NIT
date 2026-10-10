import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Sparkles, User, Store, ArrowRight, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import type { UserRole } from '@/types'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export const LoginPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer')
  const { login, isLoading, switchDemoRole } = useAuth()
  const { success, error } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as any)?.from?.pathname || (selectedRole === 'customer' ? '/customer/dashboard' : '/merchant/dashboard')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'priya.sharma@example.com',
      password: 'password123',
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await login(data.email, selectedRole)
      success(`Signed in successfully as ${selectedRole}`)
      navigate(selectedRole === 'customer' ? '/customer/dashboard' : '/merchant/dashboard')
    } catch (err: any) {
      error(err.message || 'Login failed')
    }
  }

  const handleQuickCustomer = async () => {
    setValue('email', 'priya.sharma@example.com')
    setSelectedRole('customer')
    await switchDemoRole('customer')
    success('Logged in as Priya Sharma (Customer)')
    navigate('/customer/dashboard')
  }

  const handleQuickMerchant = async () => {
    setValue('email', 'hello@littleferncafe.in')
    setSelectedRole('merchant')
    await switchDemoRole('merchant')
    success('Logged in as Little Fern Café (Merchant)')
    navigate('/merchant/dashboard')
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-teal-400 flex items-center justify-center mx-auto shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="mt-4 text-2xl font-black text-slate-900 tracking-tight">
            Sign in to Decisioned Offer System
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Access your customer personalized feed or merchant profit dashboard
          </p>
        </div>

        {/* Demo One-Click Sign In Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-teal-50 border border-indigo-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Quick Demo Accounts
            </span>
            <span className="text-[10px] text-teal-700 font-mono font-semibold">1-Click Auth</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleQuickCustomer}
              className="text-xs justify-start h-auto py-2 bg-white"
            >
              <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <div className="text-left">
                <span className="font-bold block">Priya Sharma</span>
                <span className="text-[10px] text-slate-400 block">Customer (c_001)</span>
              </div>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleQuickMerchant}
              className="text-xs justify-start h-auto py-2 bg-white"
            >
              <Store className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <div className="text-left">
                <span className="font-bold block">Little Fern Café</span>
                <span className="text-[10px] text-slate-400 block">Merchant (m_001)</span>
              </div>
            </Button>
          </div>
        </div>

        {/* Login Form */}
        <Card className="p-6 sm:p-8 border-slate-200 shadow-xl">
          {/* Role Switcher Pill */}
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Select Role
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('customer')
                  setValue('email', 'priya.sharma@example.com')
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedRole === 'customer'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Customer
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('merchant')
                  setValue('email', 'hello@littleferncafe.in')
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedRole === 'merchant'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                Merchant
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
              error={errors.email?.message}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              error={errors.password?.message}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2 h-11"
              isLoading={isLoading}
            >
              Sign In to {selectedRole === 'customer' ? 'Customer App' : 'Merchant Portal'}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-800">
              Create an account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
