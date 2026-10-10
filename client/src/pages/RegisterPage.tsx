import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Sparkles, User, Store, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { Switch } from '@/components/ui/Switch'
import { LOCALITIES } from '@/utils/constants'
import type { UserRole } from '@/types'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  locality: z.string().min(1, 'Please select your locality'),
  marketingConsent: z.boolean(),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export const RegisterPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer')
  const { login } = useAuth()
  const { success, error } = useToast()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      locality: 'Koramangala',
      marketingConsent: true,
    },
  })

  const marketingConsent = watch('marketingConsent')

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      // In demo mode, register logs in and creates user context
      await login(data.email, selectedRole)
      success(`Welcome to Decisioned Offer System, ${data.name}!`)
      navigate(selectedRole === 'customer' ? '/customer/dashboard' : '/merchant/dashboard')
    } catch (err: any) {
      error(err.message || 'Registration failed')
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-teal-400 flex items-center justify-center mx-auto shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="mt-4 text-2xl font-black text-slate-900 tracking-tight">
            Create an Account
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Join the ML-powered personalized commerce network
          </p>
        </div>

        <Card className="p-6 sm:p-8 border-slate-200 shadow-xl">
          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Select Your Role
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedRole('customer')}
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
                onClick={() => setSelectedRole('merchant')}
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
              label={selectedRole === 'customer' ? 'Full Name' : 'Business Name'}
              placeholder={selectedRole === 'customer' ? 'e.g. Priya Sharma' : 'e.g. Little Fern Café'}
              {...register('name')}
              error={errors.name?.message}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="you@domain.com"
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

            <Select
              label="Primary Locality"
              options={LOCALITIES.map((loc) => ({ label: `${loc}, Bengaluru`, value: loc }))}
              {...register('locality')}
              error={errors.locality?.message}
            />

            {selectedRole === 'customer' && (
              <div className="pt-2">
                <Switch
                  checked={marketingConsent}
                  onChange={(val) => setValue('marketingConsent', val)}
                  label="Marketing & Offer Consent"
                  description="Required to receive personalized nearby promotional offers. Consent is strictly verified by the ML guardrails."
                />
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-4 h-11"
              isLoading={isSubmitting}
            >
              Register as {selectedRole === 'customer' ? 'Customer' : 'Merchant'}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-800">
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
