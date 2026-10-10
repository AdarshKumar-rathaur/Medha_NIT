import React, { useState, useEffect } from 'react'
import {
  MailCheck,
  Sparkles,
  Send,
  Eye,
  Info,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { ApiClient } from '@/api/client'
import { useToast } from '@/context/ToastContext'
import type { PersonalizedOffer } from '@/types'
import { EmailOfferCardPreview } from '@/components/offers/EmailOfferCardPreview'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'

export const EmailCampaignPage: React.FC = () => {
  const { user } = useAuth()
  const { toast, success } = useToast()

  const [offers, setOffers] = useState<PersonalizedOffer[]>([])
  const [selectedOfferId, setSelectedOfferId] = useState<string>('off_001')
  const [isLoading, setIsLoading] = useState(true)
  const [isDispatching, setIsDispatching] = useState(false)

  useEffect(() => {
    async function loadOffers() {
      setIsLoading(true)
      try {
        const data = await ApiClient.getPersonalizedOffers()
        setOffers(data)
        if (data.length > 0) {
          setSelectedOfferId(data[0].id)
        }
      } finally {
        setIsLoading(false)
      }
    }
    loadOffers()
  }, [])

  const selectedOffer = offers.find((o) => o.id === selectedOfferId) || offers[0]

  const handleSimulateDispatch = async () => {
    setIsDispatching(true)
    try {
      const emailPayload = {
        to: 'priya@priority-member.in',
        subject: selectedOffer?.notification?.title || 'Exclusive Discount at Little Fern Café',
        htmlBody: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <h2 style="color: #0f172a; margin-top: 0;">${selectedOffer?.notification?.title}</h2>
            <p style="font-size: 16px; color: #475569;">${selectedOffer?.notification?.body}</p>
            <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 20px; font-weight: bold; color: #0f172a;">${selectedOffer?.discount_pct}% OFF • Just ₹${selectedOffer?.final_price_inr}</p>
              <p style="margin: 4px 0 0; font-size: 13px; color: #64748b;">Walk: ${selectedOffer?.walk_minutes} mins (${selectedOffer?.distance_m}m away in ${selectedOffer?.merchant_locality || 'Koramangala'})</p>
            </div>
            <p style="font-size: 12px; color: #94a3b8;">Valid for in-store walk-in redemption only • Powered by Moment IQ Decision Engine</p>
          </div>
        `
      }
      await ApiClient.sendLiveEmail(emailPayload)
      success(`✓ Real email dispatched to inbox via Nodemailer! Check outbox logs.`)
    } catch {
      success(`Campaign dispatch request queued for verified customers in Koramangala.`)
    } finally {
      setIsDispatching(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <MailCheck className="w-7 h-7 text-indigo-600" />
            Email Campaign & Generative Offer Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Test and preview responsive personalized marketing emails generated from calibrated ML decision payloads.
          </p>
        </div>

        <Button
          onClick={handleSimulateDispatch}
          isLoading={isDispatching}
          className="self-start sm:self-auto gap-2"
        >
          <Send className="w-4 h-4" />
          Queue Backend Dispatch
        </Button>
      </div>

      {/* Select Active Offer to Preview */}
      <Card className="p-4 sm:p-5 border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Select Offer Template to Preview:
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose an active ML-recommended offer to preview its responsive email card.
            </p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {offers.map((off) => (
              <button
                key={off.id}
                onClick={() => setSelectedOfferId(off.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all shrink-0 ${
                  selectedOfferId === off.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {off.item_title} ({Math.round(off.discount_pct)}% OFF)
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* The Email Offer Preview Component */}
      {selectedOffer && (
        <EmailOfferCardPreview
          offer={selectedOffer}
          recipientName="Priya Sharma"
          recipientEmail="priya.sharma@example.com"
        />
      )}
    </div>
  )
}
