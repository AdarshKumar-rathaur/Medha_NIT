import React, { useState } from 'react'
import {
  Smartphone,
  Monitor,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  Check,
  Copy,
} from 'lucide-react'
import type { PersonalizedOffer, SupportedLanguage } from '@/types'
import { formatINR, formatWalkTime } from '@/utils/formatters'
import { ApiClient } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/context/ToastContext'

interface EmailOfferCardPreviewProps {
  offer: PersonalizedOffer
  recipientName?: string
  recipientEmail?: string
}

export const EmailOfferCardPreview: React.FC<EmailOfferCardPreviewProps> = ({
  offer,
  recipientName = 'Priya',
  recipientEmail = 'priya.sharma@example.com',
}) => {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop')
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('hi-en')
  const [isCopied, setIsCopied] = useState(false)
  const { toast } = useToast()

  // Generate localized grounded copy
  const localizedCopy = ApiClient.getLocalizedNotificationCopy(
    offer.merchant_name,
    offer.item_title,
    offer.discount_pct,
    offer.final_price_inr,
    offer.walk_minutes,
    selectedLanguage
  )

  const subjectLine = `${offer.merchant_name}: Picked for you, just around the corner (${Math.round(offer.discount_pct)}% OFF)`
  const preheaderText = `Only a ${formatWalkTime(offer.walk_minutes)} away. Handcrafted offer tailored to your lunch break.`

  const copyEmailHtml = () => {
    setIsCopied(true)
    toast('HTML template code copied to clipboard', 'success')
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Controls Bar: Device toggle & Language selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Preview Mode:</span>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              onClick={() => setDeviceMode('desktop')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                deviceMode === 'desktop' ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" /> Desktop
            </button>
            <button
              onClick={() => setDeviceMode('mobile')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                deviceMode === 'mobile' ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" /> Mobile
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Language:</span>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value as SupportedLanguage)}
            className="text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1 bg-white text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="hi-en">Hinglish (hi-en)</option>
            <option value="en">English (en)</option>
            <option value="kn-en">Kannada-English (kn-en)</option>
            <option value="te-en">Telugu-English (te-en)</option>
            <option value="ta-en">Tamil-English (ta-en)</option>
            <option value="hi">Pure Hindi (hi)</option>
          </select>

          <Button variant="outline" size="sm" onClick={copyEmailHtml} className="h-7 text-xs gap-1">
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Template</span>
          </Button>
        </div>
      </div>

      {/* Simulated Email Client Envelope */}
      <div
        className={`mx-auto transition-all duration-300 ${
          deviceMode === 'mobile' ? 'max-w-sm' : 'max-w-2xl'
        }`}
      >
        <div className="rounded-2xl border border-slate-300 shadow-xl overflow-hidden bg-slate-100">
          {/* Email Client Header Chrome */}
          <div className="bg-slate-800 text-slate-300 px-4 py-3 text-xs border-b border-slate-700 space-y-1 font-mono">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>To: {recipientName} &lt;{recipientEmail}&gt;</span>
              <span className="text-teal-400 font-semibold">Verified Merchant Send</span>
            </div>
            <div className="text-white font-sans font-semibold text-sm truncate">
              {subjectLine}
            </div>
            <div className="text-slate-400 text-[11px] truncate">
              Preheader: {preheaderText}
            </div>
          </div>

          {/* Email Body Canvas */}
          <div className="p-4 sm:p-6 bg-slate-100">
            {/* The Actual Marketing Card Container */}
            <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-md border border-slate-200/90 overflow-hidden">
              {/* Brand Top Header */}
              <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-teal-400 block">
                    Picked for you, just around the corner
                  </span>
                  <h3 className="text-lg font-bold tracking-tight text-white mt-0.5">
                    {offer.merchant_name}
                  </h3>
                  <p className="text-xs text-slate-300 capitalize">
                    Freshly prepared {offer.merchant_category} favorites in {offer.merchant_locality}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center justify-center font-bold text-sm">
                  {Math.round(offer.discount_pct)}%
                </div>
              </div>

              {/* Product Imagery & Badge */}
              {offer.item_image && (
                <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={offer.item_image}
                    alt={offer.item_title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge variant="teal" className="shadow-md font-bold">
                      {Math.round(offer.discount_pct)}% OFF TODAY
                    </Badge>
                  </div>
                </div>
              )}

              {/* Content Body */}
              <div className="p-5 sm:p-6 space-y-4">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">{offer.item_title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                    "{localizedCopy.body}"
                  </p>
                </div>

                {/* Price Breakdown Banner */}
                <div className="bg-gradient-to-r from-teal-50/70 via-indigo-50/50 to-slate-50 p-4 rounded-xl border border-teal-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Original Price
                      </span>
                      <span className="text-sm line-through text-slate-400 font-semibold">
                        {formatINR(offer.original_price_inr)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-teal-800 block">
                        Your Offer Price
                      </span>
                      <span className="text-2xl font-black text-slate-900">
                        {formatINR(offer.final_price_inr)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-teal-200/50 flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-800">You Save:</span>
                    <span className="font-extrabold text-emerald-800 font-mono">
                      {formatINR(offer.discount_amount_inr)}
                    </span>
                  </div>
                </div>

                {/* Distance & Time Callout */}
                <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 font-medium text-slate-800">
                    <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Only a {formatWalkTime(offer.walk_minutes)} ({offer.distance_m}m)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-indigo-700 font-medium">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>Valid for {offer.valid_minutes} minutes</span>
                  </div>
                </div>

                {/* Main CTA Button */}
                <div className="pt-2">
                  <Button
                    variant="primary"
                    className="w-full py-3 h-12 text-base font-bold bg-slate-900 hover:bg-slate-800 shadow-md text-white justify-center gap-2"
                  >
                    <span>{localizedCopy.cta || 'View My Offer'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Terms and Conditions Note */}
                <div className="text-[11px] text-slate-500 space-y-1 pt-2 border-t border-slate-100">
                  <p className="font-semibold text-slate-700">Terms & Conditions:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {offer.terms_and_conditions.slice(0, 2).map((t, idx) => (
                      <li key={idx}>{t}</li>
                    ))}
                    <li>Valid subject to real-time merchant inventory & capacity.</li>
                  </ul>
                </div>
              </div>

              {/* Email Footer & Unsubscribe */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-[10px] text-slate-400 space-y-1">
                <p>
                  Sent by Decisioned Offer System on behalf of {offer.merchant_name}.
                </p>
                <p>
                  You received this because marketing consent was enabled in your profile. You can{' '}
                  <span className="text-indigo-600 underline cursor-pointer">
                    update notification preferences
                  </span>{' '}
                  or unsubscribe at any time.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Backend Execution Disclaimer */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 bg-white p-3 rounded-xl border border-slate-200">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Frontend Campaign Preview. Actual email delivery & ESP dispatch is handled by backend.</span>
          </div>
          <Badge variant="outline">RFC 5322 Preview</Badge>
        </div>
      </div>
    </div>
  )
}
