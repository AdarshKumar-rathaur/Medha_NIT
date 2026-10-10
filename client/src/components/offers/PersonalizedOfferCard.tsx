import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin,
  Clock,
  Bookmark,
  Sparkles,
  ArrowRight,
  EyeOff,
  Percent,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import type { PersonalizedOffer } from '@/types'
import { formatINR, formatWalkTime } from '@/utils/formatters'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/context/ToastContext'
import { ApiClient } from '@/api/client'

interface PersonalizedOfferCardProps {
  offer: PersonalizedOffer
  onSaveToggle?: (offerId: string) => void
  onDismiss?: (offerId: string) => void
  variant?: 'compact' | 'standard' | 'detailed' | 'email'
}

export const PersonalizedOfferCard: React.FC<PersonalizedOfferCardProps> = ({
  offer,
  onSaveToggle,
  onDismiss,
  variant = 'standard',
}) => {
  const [isSaved, setIsSaved] = useState(offer.status === 'saved')
  const [isDismissed, setIsDismissed] = useState(offer.status === 'dismissed')
  const { toast } = useToast()

  if (isDismissed) return null

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await ApiClient.saveOffer(offer.id)
      const nextSaved = !isSaved
      setIsSaved(nextSaved)
      toast(nextSaved ? 'Offer saved to bookmarks' : 'Offer removed from bookmarks', 'info')
      if (onSaveToggle) onSaveToggle(offer.id)
    } catch {
      toast('Failed to update bookmark', 'error')
    }
  }

  const handleDismiss = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await ApiClient.dismissOffer(offer.id)
      setIsDismissed(true)
      toast('Offer dismissed', 'info')
      if (onDismiss) onDismiss(offer.id)
    } catch {
      toast('Failed to dismiss offer', 'error')
    }
  }

  const isExpired = offer.status === 'expired' || new Date(offer.expires_at).getTime() < Date.now()
  const isRedeemed = offer.status === 'redeemed'

  return (
    <Card className="group overflow-hidden rounded-2xl border border-slate-200/90 bg-white transition-all duration-200 hover:shadow-lg hover:border-slate-300 flex flex-col justify-between">
      <div>
        {/* Top Header: Merchant category, distance & action buttons */}
        <div className="p-4 pb-3 flex items-start justify-between gap-2 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              {offer.merchant_name}
            </span>
            <span className="text-[11px] text-slate-400 capitalize">({offer.merchant_category})</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleSave}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isSaved ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
              title={isSaved ? 'Saved offer' : 'Save offer'}
              aria-label="Save offer"
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-indigo-600' : ''}`} />
            </button>

            {onDismiss && (
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Hide this offer"
                aria-label="Dismiss offer"
              >
                <EyeOff className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Product Visual & Pricing */}
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-4">
            {offer.item_image ? (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                <img
                  src={offer.item_image}
                  alt={offer.item_title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                <Percent className="w-8 h-8" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="teal" className="font-bold text-xs py-0.5 px-2">
                  {Math.round(offer.discount_pct)}% OFF
                </Badge>
                {offer.is_demo && (
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    Demo Offer
                  </span>
                )}
                {isRedeemed && (
                  <Badge variant="success">
                    <CheckCircle2 className="w-3 h-3" /> Redeemed
                  </Badge>
                )}
                {isExpired && !isRedeemed && (
                  <Badge variant="destructive">
                    <AlertTriangle className="w-3 h-3" /> Expired
                  </Badge>
                )}
              </div>

              <h4 className="text-base font-bold text-slate-900 mt-1 truncate leading-tight">
                {offer.item_title}
              </h4>

              {/* Price Breakdown */}
              <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                <span className="text-xl font-extrabold text-slate-900">
                  {formatINR(offer.final_price_inr)}
                </span>
                <span className="text-xs text-slate-400 line-through">
                  {formatINR(offer.original_price_inr)}
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  Save {formatINR(offer.discount_amount_inr)}
                </span>
              </div>
            </div>
          </div>

          {/* Contextual Distance & Expiry Pills */}
          <div className="mt-4 flex items-center gap-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex-wrap">
            <div className="flex items-center gap-1 font-medium text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>{formatWalkTime(offer.walk_minutes)} ({offer.distance_m}m)</span>
            </div>

            <span className="text-slate-300">•</span>

            <div className="flex items-center gap-1 text-slate-600">
              <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>Valid {offer.valid_minutes}m</span>
            </div>

            {offer.weather_note && (
              <>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="text-[11px] text-slate-500 truncate hidden sm:inline">
                  {offer.weather_note}
                </span>
              </>
            )}
          </div>

          {/* AI Grounded Reason */}
          <div className="mt-3 flex items-start gap-2 p-2.5 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-slate-700">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p className="line-clamp-2 leading-relaxed">
              <strong className="text-indigo-950 font-semibold">Why this offer: </strong>
              {offer.reason}
            </p>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="p-4 pt-0">
        <Link to={`/customer/offer/${offer.id}`}>
          <Button
            variant={isRedeemed || isExpired ? 'secondary' : 'primary'}
            className="w-full justify-between group-hover:bg-slate-800"
          >
            <span>{isRedeemed ? 'View Receipt' : isExpired ? 'View Details' : 'View Offer'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </Card>
  )
}
