import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Store,
  Clock,
  Sliders,
  Mail,
  ShieldCheck,
  Save,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { ApiClient } from '@/api/client'
import type { MerchantProfile as MerchantProfileType, MerchantCategory } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { LOCALITIES } from '@/utils/constants'

const merchantProfileSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters'),
  category: z.string().min(1, 'Please select category'),
  locality: z.string().min(1, 'Please select locality'),
  contact_email: z.string().email('Please enter a valid email address'),
  open_hour: z.coerce.number().min(0).max(23),
  close_hour: z.coerce.number().min(0).max(24),
  promo_start_hour: z.coerce.number().min(0).max(23),
  promo_end_hour: z.coerce.number().min(0).max(24),
  weekdays_only: z.boolean(),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1 seat'),
  occupancy_pct: z.coerce.number().min(0).max(100),
  max_discount_pct: z.coerce.number().min(0).max(50, 'Max discount capped at 50%'),
  min_margin_pct: z.coerce.number().min(5, 'Minimum margin floor must be at least 5%').max(80),
  objective: z.string().min(5, 'Objective description required'),
})

type MerchantFormValues = z.infer<typeof merchantProfileSchema>

export const MerchantProfile: React.FC = () => {
  const { user } = useAuth()
  const { success, error } = useToast()
  const [profile, setProfile] = useState<MerchantProfileType | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<MerchantFormValues>({
    resolver: zodResolver(merchantProfileSchema),
  })

  const weekdaysOnly = watch('weekdays_only')

  useEffect(() => {
    async function loadData() {
      try {
        const mid = user?.id === 'm_001' ? 'm_001' : 'm_001'
        const data = await ApiClient.getMerchantProfile(mid)
        setProfile(data)
        reset({
          name: data.name,
          category: data.category,
          locality: data.locality,
          contact_email: data.contact_email,
          open_hour: data.open_hour,
          close_hour: data.close_hour,
          promo_start_hour: data.promo_start_hour ?? 13,
          promo_end_hour: data.promo_end_hour ?? 15,
          weekdays_only: data.weekdays_only,
          capacity: data.capacity,
          occupancy_pct: data.occupancy_pct,
          max_discount_pct: data.max_discount_pct,
          min_margin_pct: data.min_margin_pct,
          objective: data.objective,
        })
      } catch {
        error('Failed to load merchant profile')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [user?.id, reset])

  const onSubmit = async (values: MerchantFormValues) => {
    if (!profile) return
    try {
      const updated = await ApiClient.updateMerchantProfile(profile.id, {
        name: values.name,
        category: values.category as MerchantCategory,
        locality: values.locality,
        contact_email: values.contact_email,
        open_hour: values.open_hour,
        close_hour: values.close_hour,
        promo_start_hour: values.promo_start_hour,
        promo_end_hour: values.promo_end_hour,
        weekdays_only: values.weekdays_only,
        capacity: values.capacity,
        occupancy_pct: values.occupancy_pct,
        max_discount_pct: values.max_discount_pct,
        min_margin_pct: values.min_margin_pct,
        objective: values.objective,
      })
      setProfile(updated)
      success('Merchant profile and commercial policies successfully saved!')
    } catch (err: any) {
      error(err.message || 'Failed to save profile changes')
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Store className="w-7 h-7 text-indigo-600" />
            Merchant Profile & Commercial Policies
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure operational hours, capacity, promo windows, and mandatory profit protection floors.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Business Identity */}
        <Card className="p-6">
          <CardHeader className="p-0 pb-4 mb-4 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <Store className="w-4 h-4 text-indigo-600" />
              1. Business Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Business Name" {...register('name')} error={errors.name?.message} />
            <Input label="Contact Email" type="email" {...register('contact_email')} error={errors.contact_email?.message} />
            <Select
              label="Locality"
              options={LOCALITIES.map((loc) => ({ label: `${loc}, Bengaluru`, value: loc }))}
              {...register('locality')}
              error={errors.locality?.message}
            />
            <Select
              label="Primary Category"
              options={[
                { label: 'Cafe', value: 'cafe' },
                { label: 'Restaurant', value: 'restaurant' },
                { label: 'Bakery', value: 'bakery' },
                { label: 'Dessert', value: 'dessert' },
                { label: 'Grocery', value: 'grocery' },
                { label: 'Pharmacy', value: 'pharmacy' },
              ]}
              {...register('category')}
              error={errors.category?.message}
            />
          </CardContent>
        </Card>

        {/* Operating & Promotional Windows */}
        <Card className="p-6">
          <CardHeader className="p-0 pb-4 mb-4 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              2. Operational & Promo Windows
            </CardTitle>
            <CardDescription>
              The ML optimizer checks current scenario time against these hours. No offers are issued when closed.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Opening Hour (24h)"
              type="number"
              {...register('open_hour')}
              error={errors.open_hour?.message}
              helperText="e.g. 8 for 8:00 AM"
            />
            <Input
              label="Closing Hour (24h)"
              type="number"
              {...register('close_hour')}
              error={errors.close_hour?.message}
              helperText="e.g. 21 for 9:00 PM"
            />
            <Input
              label="Promo Window Start (24h)"
              type="number"
              step="0.5"
              {...register('promo_start_hour')}
              error={errors.promo_start_hour?.message}
              helperText="e.g. 13.0 for 1:00 PM"
            />
            <Input
              label="Promo Window End (24h)"
              type="number"
              step="0.5"
              {...register('promo_end_hour')}
              error={errors.promo_end_hour?.message}
              helperText="e.g. 15.0 for 3:00 PM"
            />
            <div className="sm:col-span-2 pt-2">
              <Switch
                checked={weekdaysOnly}
                onChange={(val) => setValue('weekdays_only', val, { shouldDirty: true })}
                label="Apply Promo Window on Weekdays Only"
                description="Simulates the Little Fern Café weekday lunch rule (fill idle seats Monday to Friday)."
              />
            </div>
          </CardContent>
        </Card>

        {/* Capacity & Commercial Policy Rules */}
        <Card className="p-6">
          <CardHeader className="p-0 pb-4 mb-4 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              3. Commercial Margin Guardrails & Capacity
            </CardTitle>
            <CardDescription>
              Hard limits enforced by the decision engine to prevent loss-making promotions.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Maximum Allowed Discount (%)"
              type="number"
              {...register('max_discount_pct')}
              error={errors.max_discount_pct?.message}
              helperText="The ML model will not consider discounts above this ceiling."
            />
            <Input
              label="Minimum Contribution Margin Requirement (%)"
              type="number"
              {...register('min_margin_pct')}
              error={errors.min_margin_pct?.message}
              helperText="Hard floor: (Selling Price - Cost) / Cost must exceed this percentage."
            />
            <Input
              label="Seating / Serving Capacity"
              type="number"
              {...register('capacity')}
              error={errors.capacity?.message}
              helperText="Total customer capacity in store."
            />
            <Input
              label="Current Occupancy Rate (%)"
              type="number"
              {...register('occupancy_pct')}
              error={errors.occupancy_pct?.message}
              helperText="Lower occupancy triggers higher exploration incentive."
            />
            <div className="sm:col-span-2">
              <Input
                label="Business Objective Description"
                {...register('objective')}
                error={errors.objective?.message}
                helperText="Internal rule context displayed on recommendations."
              />
            </div>
          </CardContent>
        </Card>

        {/* Save & Reset Actions */}
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
            Save Policies
          </Button>
        </div>
      </form>
    </div>
  )
}
