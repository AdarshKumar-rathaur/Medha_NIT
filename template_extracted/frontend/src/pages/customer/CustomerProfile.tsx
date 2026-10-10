import React, { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User,
  MapPin,
  Wallet,
  Clock,
  Languages,
  Bell,
  ShieldCheck,
  Heart,
  Save,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { ApiClient } from '@/api/client'
import type { CustomerProfile as CustomerProfileType, SupportedLanguage } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Switch } from '@/components/ui/Switch'
import { Badge } from '@/components/ui/Badge'
import { LOCALITIES } from '@/utils/constants'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  age: z.coerce.number().min(16, 'Minimum age is 16').max(100, 'Maximum age is 100'),
  locality: z.string().min(1, 'Please select a locality'),
  wallet_inr: z.coerce.number().min(50, 'Minimum budget is ₹50').max(10000, 'Maximum budget is ₹10,000'),
  price_sensitivity: z.coerce.number().min(0).max(1),
  declared_preferences: z.string(), // comma separated
  dietary_preferences: z.string(), // comma separated
  max_travel_distance_m: z.coerce.number().min(100, 'Minimum 100m').max(3000, 'Maximum 3000m'),
  minutes_available: z.coerce.number().min(10, 'Minimum 10 mins').max(120, 'Maximum 120 mins'),
  language: z.enum(['en', 'hi-en', 'kn-en', 'te-en', 'ta-en', 'hi']),
  notification_email: z.boolean(),
  notification_sms: z.boolean(),
  notification_push: z.boolean(),
  marketing_consent: z.boolean(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export const CustomerProfile: React.FC = () => {
  const { user } = useAuth()
  const { success, error } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<CustomerProfileType | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  })

  const marketingConsent = watch('marketing_consent')

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await ApiClient.getCustomerProfile(user?.id || 'c_001')
        setProfile(data)
        reset({
          name: data.name,
          email: data.email,
          age: data.age,
          locality: data.locality,
          wallet_inr: data.wallet_inr,
          price_sensitivity: data.price_sensitivity,
          declared_preferences: data.declared_preferences.join(', '),
          dietary_preferences: data.dietary_preferences.join(', '),
          max_travel_distance_m: data.max_travel_distance_m,
          minutes_available: data.minutes_available,
          language: data.language,
          notification_email: data.notification_email,
          notification_sms: data.notification_sms,
          notification_push: data.notification_push,
          marketing_consent: data.marketing_consent,
        })
      } catch {
        error('Failed to load profile')
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfile()
  }, [user?.id, reset])

  const onSubmit = async (values: ProfileFormValues) => {
    if (!profile) return
    try {
      const updated = await ApiClient.updateCustomerProfile(profile.id, {
        name: values.name,
        email: values.email,
        age: values.age,
        locality: values.locality,
        wallet_inr: values.wallet_inr,
        price_sensitivity: values.price_sensitivity,
        declared_preferences: values.declared_preferences
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean),
        dietary_preferences: values.dietary_preferences
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        max_travel_distance_m: values.max_travel_distance_m,
        minutes_available: values.minutes_available,
        language: values.language as SupportedLanguage,
        notification_email: values.notification_email,
        notification_sms: values.notification_sms,
        notification_push: values.notification_push,
        marketing_consent: values.marketing_consent,
      })
      setProfile(updated)
      success('Preferences and context profile successfully updated!')
    } catch (err: any) {
      error(err.message || 'Failed to save changes')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-96 bg-white rounded-2xl border border-slate-200 p-6 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Customer Profile & ML Context
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your personal preferences, dietary needs, budget constraints, and marketing consent.
          </p>
        </div>

        <Badge variant="teal" className="self-start sm:self-auto py-1 px-3">
          Account ID: {profile?.id || 'c_001'}
        </Badge>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Section 1: Basic Profile & Locality */}
        <Card className="p-6">
          <CardHeader className="p-0 pb-4 mb-4 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              1. Basic Profile & Location
            </CardTitle>
            <CardDescription>
              Essential demographic attributes used for age-appropriate recommendations and geo-pinning.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name" {...register('name')} error={errors.name?.message} />
            <Input label="Email Address" type="email" {...register('email')} error={errors.email?.message} />
            <Input label="Age" type="number" {...register('age')} error={errors.age?.message} />
            <Select
              label="Current Locality"
              options={LOCALITIES.map((loc) => ({ label: `${loc}, Bengaluru`, value: loc }))}
              {...register('locality')}
              error={errors.locality?.message}
            />
          </CardContent>
        </Card>

        {/* Section 2: Budget & Sensitivity */}
        <Card className="p-6">
          <CardHeader className="p-0 pb-4 mb-4 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="w-5 h-5 text-teal-600" />
              2. Budget & Price Sensitivity
            </CardTitle>
            <CardDescription>
              Sets hard affordability limits. Offers priced higher than your available wallet are automatically suppressed.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Available Wallet (₹ INR)"
              type="number"
              {...register('wallet_inr')}
              error={errors.wallet_inr?.message}
              helperText="Offers will never exceed this final price."
            />
            <Input
              label="Price Sensitivity (0.0 to 1.0)"
              type="number"
              step="0.05"
              {...register('price_sensitivity')}
              error={errors.price_sensitivity?.message}
              helperText="0.0 = Premium seeker, 1.0 = Highly discount-driven."
            />
          </CardContent>
        </Card>

        {/* Section 3 & 4: Categories & Dietary Preferences */}
        <Card className="p-6">
          <CardHeader className="p-0 pb-4 mb-4 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              3. Preferences & Dietary Requirements
            </CardTitle>
            <CardDescription>
              Customizes which merchant types and menu items appear in your recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Preferred Categories (Comma-separated)"
              placeholder="cafe, bakery, dessert, lunch"
              {...register('declared_preferences')}
              error={errors.declared_preferences?.message}
              helperText="Examples: cafe, lunch, bakery, healthy"
            />
            <Input
              label="Dietary Preferences (Comma-separated)"
              placeholder="Vegetarian, Jain, Vegan, No Restrictions"
              {...register('dietary_preferences')}
              error={errors.dietary_preferences?.message}
              helperText="Strictly honored by item vegetarian tags."
            />
          </CardContent>
        </Card>

        {/* Section 5: Travel & Time Constraints */}
        <Card className="p-6">
          <CardHeader className="p-0 pb-4 mb-4 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              4. Travel Distance & Time Constraints
            </CardTitle>
            <CardDescription>
              Guarantees you have enough time to walk, receive food, and return within your break.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Max Walking Distance (Meters)"
              type="number"
              {...register('max_travel_distance_m')}
              error={errors.max_travel_distance_m?.message}
              helperText="Typical: 400m (5 mins) to 1000m (12 mins)."
            />
            <Input
              label="Available Break Time (Minutes)"
              type="number"
              {...register('minutes_available')}
              error={errors.minutes_available?.message}
              helperText="2 × Walk Time + Prep Time must fit in this duration."
            />
          </CardContent>
        </Card>

        {/* Section 6: Language Preferences */}
        <Card className="p-6">
          <CardHeader className="p-0 pb-4 mb-4 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <Languages className="w-5 h-5 text-teal-700" />
              5. Language Preference
            </CardTitle>
            <CardDescription>
              Select your preferred language for push notifications, email campaigns, and offer cards.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Select
              label="Notification & Copy Language"
              options={[
                { label: 'Hinglish (Hindi in English Script - hi-en)', value: 'hi-en' },
                { label: 'English (en)', value: 'en' },
                { label: 'Kannada-English (kn-en)', value: 'kn-en' },
                { label: 'Telugu-English (te-en)', value: 'te-en' },
                { label: 'Tamil-English (ta-en)', value: 'ta-en' },
                { label: 'Pure Hindi (hi)', value: 'hi' },
              ]}
              {...register('language')}
              error={errors.language?.message}
            />
          </CardContent>
        </Card>

        {/* Section 7 & 8: Notifications & Marketing Consent */}
        <Card className="p-6">
          <CardHeader className="p-0 pb-4 mb-4 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-600" />
              6. Communication & Marketing Consent
            </CardTitle>
            <CardDescription>
              Control notification channels and verify legal promotional consent.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <Controller
              name="marketing_consent"
              control={control}
              render={({ field }) => (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <Switch
                    checked={field.value}
                    onChange={field.onChange}
                    label="Promotional Marketing Consent (Mandatory for Offers)"
                    description="When disabled, the Decision Engine hard-stops all promotional offers immediately. No offers will be generated or dispatched."
                  />
                  {!marketingConsent && (
                    <div className="mt-2 text-xs font-semibold text-rose-600">
                      ⚠️ Warning: With consent disabled, you will not receive any personalized offers in the app or via email.
                    </div>
                  )}
                </div>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <Controller
                name="notification_email"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onChange={field.onChange}
                    label="Email Alerts"
                    description="Curated offer campaigns"
                  />
                )}
              />

              <Controller
                name="notification_sms"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onChange={field.onChange}
                    label="SMS Alerts"
                    description="Time-sensitive discount codes"
                  />
                )}
              />

              <Controller
                name="notification_push"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onChange={field.onChange}
                    label="In-App Push"
                    description="Proximity alerts when nearby"
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.location.reload()}
            disabled={isSubmitting || !isDirty}
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Discard Changes
          </Button>

          <Button type="submit" variant="primary" isLoading={isSubmitting} className="min-w-36">
            <Save className="w-4 h-4 mr-1.5" />
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  )
}
