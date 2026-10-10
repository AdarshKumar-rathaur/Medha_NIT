import React, { useState, useEffect } from 'react'
import {
  Bell,
  Mail,
  Smartphone,
  Languages,
  Moon,
  ShieldCheck,
  Save,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { ApiClient } from '@/api/client'
import { useToast } from '@/context/ToastContext'
import type { NotificationPreferences, SupportedLanguage } from '@/types'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'

export const NotificationSettingsPage: React.FC = () => {
  const { user } = useAuth()
  const { success, error } = useToast()

  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function loadPrefs() {
      setIsLoading(true)
      try {
        const data = await ApiClient.getNotificationPreferences(user?.id || 'c_001')
        setPrefs(data)
      } finally {
        setIsLoading(false)
      }
    }
    loadPrefs()
  }, [user?.id])

  const handleSave = async () => {
    if (!prefs) return
    setIsSaving(true)
    try {
      await ApiClient.updateNotificationPreferences(user?.id || 'c_001', prefs)
      success('Notification preferences updated!')
    } catch {
      error('Failed to update notification preferences')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !prefs) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-7 h-7 text-indigo-600" />
            Notification & Delivery Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure how and when the Decision Engine delivers personalized offer alerts.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Communication Channels */}
        <Card className="p-6">
          <CardHeader className="p-0 pb-4 mb-4 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-600" />
              Delivery Channels
            </CardTitle>
            <CardDescription>
              Select active notification delivery vectors.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <Switch
              checked={prefs.email_marketing}
              onChange={(val) => setPrefs({ ...prefs, email_marketing: val })}
              label="Email Marketing Campaigns"
              description="Receive responsive, beautifully formatted email cards with localized offers."
            />

            <Switch
              checked={prefs.push_notifications}
              onChange={(val) => setPrefs({ ...prefs, push_notifications: val })}
              label="In-App Real-time Push"
              description="Receive proximity alerts when you are within walking distance of participating stores."
            />

            <Switch
              checked={prefs.sms_alerts}
              onChange={(val) => setPrefs({ ...prefs, sms_alerts: val })}
              label="SMS Urgent Vouchers"
              description="Receive quick SMS voucher codes when lunch break is nearing end."
            />

            <Switch
              checked={prefs.offer_expiry_alerts}
              onChange={(val) => setPrefs({ ...prefs, offer_expiry_alerts: val })}
              label="Offer Expiry Reminders"
              description="Get a notification 5 minutes before your personalized discount expires."
            />
          </CardContent>
        </Card>

        {/* Language & Localized Content */}
        <Card className="p-6">
          <CardHeader className="p-0 pb-4 mb-4 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <Languages className="w-4 h-4 text-teal-600" />
              Preferred Language for Offers
            </CardTitle>
            <CardDescription>
              Personalize generated titles, descriptions, and call-to-action buttons.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Select
              label="Notification Copy Language"
              value={prefs.preferred_language}
              onChange={(e) =>
                setPrefs({ ...prefs, preferred_language: e.target.value as SupportedLanguage })
              }
              options={[
                { label: 'Hinglish (Hindi in English Script - hi-en)', value: 'hi-en' },
                { label: 'English (en)', value: 'en' },
                { label: 'Kannada-English (kn-en)', value: 'kn-en' },
                { label: 'Telugu-English (te-en)', value: 'te-en' },
                { label: 'Tamil-English (ta-en)', value: 'ta-en' },
                { label: 'Pure Hindi (hi)', value: 'hi' },
              ]}
            />
          </CardContent>
        </Card>

        {/* Quiet Hours */}
        <Card className="p-6">
          <CardHeader className="p-0 pb-4 mb-4 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <Moon className="w-4 h-4 text-indigo-600" />
              Quiet Hours
            </CardTitle>
            <CardDescription>
              Suppress non-urgent offer notifications during restful hours.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Quiet Hours Start"
              type="time"
              value={prefs.quiet_hours_start}
              onChange={(e) => setPrefs({ ...prefs, quiet_hours_start: e.target.value })}
            />
            <Input
              label="Quiet Hours End"
              type="time"
              value={prefs.quiet_hours_end}
              onChange={(e) => setPrefs({ ...prefs, quiet_hours_end: e.target.value })}
            />
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-slate-200">
          <Button onClick={handleSave} isLoading={isSaving} className="min-w-36 gap-2">
            <Save className="w-4 h-4" />
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  )
}
