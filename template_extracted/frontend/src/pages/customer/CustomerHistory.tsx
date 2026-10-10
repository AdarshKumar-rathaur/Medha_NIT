import React, { useState, useEffect } from 'react'
import {
  History,
  CheckCircle2,
  Bookmark,
  Calendar,
  Clock,
  TrendingUp,
  Tag,
  ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ApiClient } from '@/api/client'
import type { RedemptionRecord, PersonalizedOffer, CustomerInsights } from '@/types'
import { formatINR, formatDateTime } from '@/utils/formatters'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'

export const CustomerHistory: React.FC = () => {
  const { user } = useAuth()
  const [redemptions, setRedemptions] = useState<RedemptionRecord[]>([])
  const [savedOffers, setSavedOffers] = useState<PersonalizedOffer[]>([])
  const [insights, setInsights] = useState<CustomerInsights | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'redemptions' | 'saved'>('redemptions')

  useEffect(() => {
    async function loadHistory() {
      setIsLoading(true)
      try {
        const custId = user?.id || 'c_001'
        const [redData, allOffers, insData] = await Promise.all([
          ApiClient.getCustomerHistory(custId),
          ApiClient.getPersonalizedOffers({ customerId: custId }),
          ApiClient.getCustomerInsights(custId),
        ])
        setRedemptions(redData)
        setSavedOffers(allOffers.filter((o) => o.status === 'saved'))
        setInsights(insData)
      } finally {
        setIsLoading(false)
      }
    }
    loadHistory()
  }, [user?.id])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-7 h-7 text-indigo-600" />
            Offer & Redemption History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track confirmed in-store redemptions, verified savings, and saved bookmarks.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards distinguishing Realized vs Potential */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-5 bg-emerald-50/70 border-emerald-200">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
            Realized Confirmed Savings
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-950 font-mono">
              {formatINR(insights?.realized_savings_inr ?? 0)}
            </span>
            <TrendingUp className="w-5 h-5 text-emerald-700" />
          </div>
          <span className="text-[11px] text-emerald-700 mt-1 block">
            From {redemptions.length} verified in-store redemptions
          </span>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Potential Available Savings
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {formatINR(insights?.potential_available_savings_inr ?? 0)}
            </span>
            <Tag className="w-5 h-5 text-slate-400" />
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Hypothetical if all active offers claimed
          </span>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Saved For Later
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {savedOffers.length}
            </span>
            <Bookmark className="w-5 h-5 text-indigo-500" />
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Bookmarked offers ready to redeem
          </span>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-4">
        <button
          onClick={() => setActiveTab('redemptions')}
          className={`pb-3 text-sm font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-2 ${
            activeTab === 'redemptions'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Confirmed Redemptions ({redemptions.length})
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`pb-3 text-sm font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-2 ${
            activeTab === 'saved'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bookmark className="w-4 h-4 text-indigo-600" />
          Saved Bookmarks ({savedOffers.length})
        </button>
      </div>

      {/* Tab Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-white border border-slate-200 p-4 animate-pulse" />
          ))}
        </div>
      ) : activeTab === 'redemptions' ? (
        redemptions.length > 0 ? (
          <div className="space-y-3">
            {redemptions.map((record) => (
              <Card key={record.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      {record.merchant_name}
                    </span>
                    <Badge variant="success">Confirmed</Badge>
                  </div>
                  <h4 className="text-base font-bold text-slate-900">{record.item_title}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {formatDateTime(record.redeemed_at)}
                    </span>
                    <span>•</span>
                    <span className="font-mono">Voucher: {record.verification_code}</span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-slate-400 block line-through">
                      {formatINR(record.original_price_inr)}
                    </span>
                    <span className="text-lg font-black text-slate-900 font-mono">
                      {formatINR(record.final_price_inr)}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded mt-1">
                    Saved {formatINR(record.realized_savings_inr)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900">No Redemptions Yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              When you redeem an offer in-store, your verified transaction and realized savings will appear here.
            </p>
            <Link to="/customer/offers" className="mt-4 inline-block">
              <Button size="sm">Explore Active Offers</Button>
            </Link>
          </div>
        )
      ) : savedOffers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedOffers.map((offer) => (
            <Card key={offer.id} className="p-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">{offer.merchant_name}</span>
                <h4 className="text-base font-bold text-slate-900 mt-1">{offer.item_title}</h4>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-xl font-black text-slate-900">{formatINR(offer.final_price_inr)}</span>
                  <span className="text-xs text-slate-400 line-through">{formatINR(offer.original_price_inr)}</span>
                  <Badge variant="teal">{Math.round(offer.discount_pct)}% OFF</Badge>
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Save {formatINR(offer.discount_amount_inr)}</span>
                <Link to={`/customer/offer/${offer.id}`}>
                  <Button size="sm" variant="outline" className="gap-1 text-xs">
                    View <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Bookmark className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900">No Saved Offers</h3>
          <p className="text-xs text-slate-500 mt-1">Click the bookmark icon on any offer card to save it for quick access.</p>
        </div>
      )}
    </div>
  )
}
