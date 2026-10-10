import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Clock,
  Sparkles,
  Bookmark,
  Share2,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Navigation,
  Info,
} from 'lucide-react'
import { ApiClient } from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import type { PersonalizedOffer, RedemptionRecord } from '@/types'
import { formatINR, formatWalkTime, formatDateTime } from '@/utils/formatters'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { OfferExplainabilityBadge } from '@/components/offers/OfferExplainabilityBadge'
import { Skeleton } from '@/components/ui/Skeleton'

export const OfferDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { success, error, toast } = useToast()

  const [offer, setOffer] = useState<PersonalizedOffer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [isRedeemConfirmOpen, setIsRedeemConfirmOpen] = useState(false)
  const [redemptionResult, setRedemptionResult] = useState<RedemptionRecord | null>(null)
  const [isSaved, setIsSaved] = useState(false)

  const fetchOffer = async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const data = await ApiClient.getOfferById(id)
      setOffer(data)
      setIsSaved(data.status === 'saved')
    } catch (err: any) {
      error(err.message || 'Offer not found')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOffer()
  }, [id])

  const handleSaveToggle = async () => {
    if (!offer) return
    try {
      await ApiClient.saveOffer(offer.id)
      setIsSaved(!isSaved)
      toast(!isSaved ? 'Offer saved to bookmarks' : 'Offer removed from bookmarks', 'info')
    } catch {
      error('Failed to update bookmark')
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${offer?.merchant_name} Offer`,
        text: `Get ${Math.round(offer?.discount_pct || 0)}% off at ${offer?.merchant_name}!`,
        url: window.location.href,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast('Offer link copied to clipboard!', 'success')
    }
  }

  const handleRedeemConfirm = async () => {
    if (!offer) return
    setIsRedeeming(true)
    try {
      const res = await ApiClient.redeemOffer(offer.id, user?.id || 'c_001')
      setOffer((prev) => ({ ...(prev || {}), ...(res.offer || {}) } as PersonalizedOffer))
      setRedemptionResult(res.redemption)
      setIsRedeemConfirmOpen(false)
      success(`Offer confirmed! Show verification code ${res.redemption.verification_code} to the merchant.`)
    } catch (err: any) {
      error(err.message || 'Redemption failed. Check merchant status or expiry.')
    } finally {
      setIsRedeeming(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    )
  }

  if (!offer) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 max-w-md mx-auto">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Offer Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">This offer may have expired or been withdrawn.</p>
        <Link to="/customer/offers" className="mt-4 inline-block">
          <Button variant="primary" size="sm">Browse Other Offers</Button>
        </Link>
      </div>
    )
  }

  const isExpired = offer.status === 'expired' || new Date(offer.expires_at).getTime() < Date.now()
  const isRedeemed = offer.status === 'redeemed'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSaveToggle} className="h-8 gap-1.5 text-xs">
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-indigo-600 text-indigo-600' : ''}`} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare} className="h-8 gap-1.5 text-xs">
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </Button>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
        {/* Header Visual Image */}
        {offer.item_image && (
          <div className="relative h-64 sm:h-80 w-full bg-slate-100">
            <img
              src={offer.item_image}
              alt={offer.item_title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white flex items-end justify-between">
              <div>
                <Badge variant="teal" className="mb-2 text-sm font-extrabold shadow-md">
                  {Math.round(offer.discount_pct)}% OFF
                </Badge>
                <h1 className="text-2xl sm:text-3xl font-black text-white">{offer.item_title}</h1>
                <p className="text-sm text-slate-200">{offer.merchant_name} • {offer.merchant_locality}</p>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-8">
          {/* Price Breakdown Banner */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Final Discounted Price
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-3xl font-black text-slate-900">
                  {formatINR(offer.final_price_inr)}
                </span>
                <span className="text-sm line-through text-slate-400 font-semibold">
                  {formatINR(offer.original_price_inr)}
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                Total Saved
              </span>
              <span className="text-2xl font-black text-emerald-700 font-mono mt-0.5 block">
                {formatINR(offer.discount_amount_inr)}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Calculated post-discount contribution
              </span>
            </div>
          </div>

          {/* Redeemed Voucher Callout (if already redeemed) */}
          {isRedeemed && (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-3">
              <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <span>Offer Confirmed & Redeemed</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Show this official verification voucher to the merchant cash counter to apply your discount.
              </p>
              <div className="p-4 rounded-xl bg-white border border-emerald-300 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                    Verification Code
                  </span>
                  <span className="text-2xl font-mono font-black text-slate-900 tracking-wider">
                    {offer.redemption_code || redemptionResult?.verification_code || 'DOS-8821'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                  <QrCode className="w-8 h-8 text-slate-900" />
                  <span>Scan / Verify</span>
                </div>
              </div>
            </div>
          )}

          {/* Context Feasibility & Walking Directions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
              <MapPin className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-bold text-sm">
                  {formatWalkTime(offer.walk_minutes)} away
                </strong>
                <p className="text-slate-500 mt-0.5">
                  Physical distance: {offer.distance_m} meters from your current coordinates.
                </p>
                <a
                  href={`https://maps.google.com/?q=${offer.merchant_name}+${offer.merchant_locality}+Bengaluru`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold text-xs"
                >
                  <Navigation className="w-3 h-3" /> Get Directions
                </a>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
              <Clock className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-bold text-sm">
                  Valid for {offer.valid_minutes} minutes
                </strong>
                <p className="text-slate-500 mt-0.5">
                  Expires at {formatDateTime(offer.expires_at)}. Offer is bound to live table availability.
                </p>
                {offer.weather_note && (
                  <span className="mt-1 inline-block text-[11px] text-teal-700 font-medium">
                    {offer.weather_note}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ML Decision Explainability Component */}
          <OfferExplainabilityBadge offer={offer} />

          {/* Merchant Terms & Conditions */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Merchant Terms & Exclusions
            </h3>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              {offer.terms_and_conditions.map((term, i) => (
                <li key={i}>{term}</li>
              ))}
              <li>Merchant reserves right to substitute equal value item in case of unexpected stockout.</li>
              <li>Must be presented prior to bill settlement.</li>
            </ul>
          </div>

          {/* Actions Bar */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-4">
            {!isRedeemed && !isExpired && (
              <Button
                variant="primary"
                size="lg"
                onClick={() => setIsRedeemConfirmOpen(true)}
                className="w-full sm:w-auto flex-1 h-13 text-base shadow-md"
              >
                Redeem Offer ({formatINR(offer.final_price_inr)})
              </Button>
            )}

            <a
              href={`https://maps.google.com/?q=${offer.merchant_name}+${offer.merchant_locality}+Bengaluru`}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto"
            >
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-13 text-base">
                <Navigation className="w-4 h-4 mr-2 text-indigo-600" />
                Get Directions
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Confirmation Modal Dialog for In-Store Redemption */}
      <Dialog
        isOpen={isRedeemConfirmOpen}
        onClose={() => setIsRedeemConfirmOpen(false)}
        title="Confirm In-Store Redemption"
        description={`Are you currently at or walking to ${offer.merchant_name}?`}
      >
        <div className="space-y-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between font-bold text-slate-900">
              <span>Item:</span>
              <span>{offer.item_title}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Final Bill Amount:</span>
              <span className="font-mono font-bold text-slate-900">{formatINR(offer.final_price_inr)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>You Save:</span>
              <span className="font-mono">{formatINR(offer.discount_amount_inr)}</span>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p>
              Clicking "Confirm & Redeem" communicates with the backend to generate your secure verification code and log the confirmed transaction.
            </p>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsRedeemConfirmOpen(false)} disabled={isRedeeming}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleRedeemConfirm} isLoading={isRedeeming}>
              Confirm & Generate Code
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
