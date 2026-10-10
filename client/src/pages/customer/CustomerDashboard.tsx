import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  MapPin,
  Clock,
  Wallet,
  Compass,
  ArrowRight,
  TrendingUp,
  Tag,
  CheckCircle2,
  Bookmark,
  Sliders,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useDemo } from '@/context/DemoContext'
import { ApiClient } from '@/api/client'
import type { CustomerProfile, PersonalizedOffer, CustomerInsights } from '@/types'
import { formatINR } from '@/utils/formatters'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { PersonalizedOfferCard } from '@/components/offers/PersonalizedOfferCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { useToast } from '@/context/ToastContext'

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth()
  const { locality } = useDemo()
  const { success, error } = useToast()

  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [offers, setOffers] = useState<PersonalizedOffer[]>([])
  const [insights, setInsights] = useState<CustomerInsights | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<'best_match' | 'nearby' | 'highest_savings' | 'expiring_soon'>('best_match')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [isEditContextOpen, setIsEditContextOpen] = useState(false)

  // Quick edit context state
  const [editMinutes, setEditMinutes] = useState(20)
  const [editWallet, setEditWallet] = useState(400)
  const [editMarketingConsent, setEditMarketingConsent] = useState(true)
  const [isEvaluating, setIsEvaluating] = useState(false)

  const handleEvaluateNow = async () => {
    if (!profile) return
    setIsEvaluating(true)
    try {
      const res = await ApiClient.evaluateOffers(profile.id)
      if (res?.decision?.action === 'send') {
        success(`🎯 Grounded Offer Generated! ${res.decision.offer?.discount_pct}% off at ${res.decision.merchant_details?.name || 'Local Merchant'}.`)
      } else {
        success('ML Decision Engine evaluated: Constraints verified.')
      }
      await loadData()
    } catch (err: any) {
      error('Evaluation notice: ' + err.message)
    } finally {
      setIsEvaluating(false)
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    try {
      const custId = user?.id || 'c_001'
      const [profData, offersData, insightsData] = await Promise.all([
        ApiClient.getCustomerProfile(custId),
        ApiClient.getPersonalizedOffers({
          customerId: custId,
          locality,
          category: activeCategory,
          sortBy: activeFilter,
        }),
        ApiClient.getCustomerInsights(custId),
      ])

      setProfile(profData)
      setOffers(offersData)
      setInsights(insightsData)
      setEditMinutes(profData.minutes_available)
      setEditWallet(profData.wallet_inr)
      setEditMarketingConsent(profData.marketing_consent)
    } catch (err: any) {
      error('Failed to load customer offers and profile data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [locality, activeFilter, activeCategory, user?.id])

  const handleUpdateQuickContext = async () => {
    if (!profile) return
    try {
      const updated = await ApiClient.updateCustomerProfile(profile.id, {
        minutes_available: Number(editMinutes),
        wallet_inr: Number(editWallet),
        marketing_consent: editMarketingConsent,
      })
      setProfile(updated)
      setIsEditContextOpen(false)
      success('Context signals updated! Decision engine recalculated.')
      loadData()
    } catch {
      error('Failed to update context signals')
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Match Engine • {locality}, Bengaluru</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Hello, {profile?.name || user?.name || 'Priya'} 👋
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Offers are calculated in real time matching your available break ({profile?.minutes_available || 20}m), ₹{profile?.wallet_inr || 400} wallet, and eligible merchants within walking distance.
          </p>

          <div className="pt-2 flex items-center gap-3 text-xs text-slate-300 flex-wrap">
            <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-teal-400" /> Break: {profile?.minutes_available} mins
            </span>
            <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg">
              <Wallet className="w-3.5 h-3.5 text-teal-400" /> Budget: {formatINR(profile?.wallet_inr || 400)}
            </span>
            <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg">
              <MapPin className="w-3.5 h-3.5 text-teal-400" /> Max walk: {profile?.max_travel_distance_m || 600}m
            </span>

            <Button
              size="sm"
              variant="teal"
              disabled={isEvaluating}
              onClick={handleEvaluateNow}
              className="font-bold text-xs shadow-md"
            >
              <Sparkles className={`w-3.5 h-3.5 mr-1.5 ${isEvaluating ? 'animate-spin' : ''}`} />
              {isEvaluating ? 'Evaluating ML Decisions...' : 'Re-Run Live ML Inference'}
            </Button>
          </div>
        </div>

        {/* Background accent glow */}
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
      </div>

      {/* Customer Insights KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Active Offers
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">
              {insights?.active_offers_count ?? 3}
            </span>
            <Badge variant="teal">Nearby</Badge>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Within walking radius</span>
        </Card>

        <Card className="p-4 sm:p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Saved Bookmarks
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">
              {insights?.saved_offers_count ?? 1}
            </span>
            <Bookmark className="w-4 h-4 text-indigo-500" />
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Offers kept for later</span>
        </Card>

        <Card className="p-4 sm:p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Redeemed Offers
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">
              {insights?.redeemed_offers_count ?? 2}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Confirmed in-store</span>
        </Card>

        <Card className="p-4 sm:p-5 bg-emerald-50/50 border-emerald-200/80">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
            Realized Savings
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-950 font-mono">
              {formatINR(insights?.realized_savings_inr ?? 36.6)}
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-700" />
          </div>
          <span className="text-[11px] text-emerald-700 mt-1 block">
            Actual recorded wallet savings
          </span>
        </Card>
      </div>

      {/* Customer Context Card (Section 6) */}
      <Card className="p-6 border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-600" />
              Active Customer Context Signals
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              These signals drive XGBoost feature extraction. No sensitive data is collected or shared.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditContextOpen(true)}
              className="gap-1.5 text-xs"
            >
              <Sliders className="w-3.5 h-3.5" />
              Quick Adjust Context
            </Button>
            <Link to="/customer/profile">
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                Full Profile <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Context Grid with Explicit Explainers */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Wallet & Sensitivity
            </span>
            <p className="font-bold text-slate-900 text-sm">{formatINR(profile?.wallet_inr || 400)}</p>
            <p className="text-[11px] text-slate-500">
              Sensitivity: {(profile?.price_sensitivity || 0.65) * 100}% • Used to prevent recommending offers exceeding your budget.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Available Break Time
            </span>
            <p className="font-bold text-slate-900 text-sm">{profile?.minutes_available || 20} Minutes</p>
            <p className="text-[11px] text-slate-500">
              Used to calculate walking + prep time feasibility so you never return late.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Dietary & Preferences
            </span>
            <p className="font-bold text-slate-900 text-sm">
              {profile?.dietary_preferences?.join(', ') || 'Vegetarian'}
            </p>
            <p className="text-[11px] text-slate-500">
              Filters out non-matching food categories and respects personal dietary choices.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Marketing & Consent
            </span>
            <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  profile?.marketing_consent ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
              {profile?.marketing_consent ? 'Consent Granted' : 'Promotions Blocked'}
            </p>
            <p className="text-[11px] text-slate-500">
              Strict ML guardrail: If disabled, zero promotional offers will be dispatched.
            </p>
          </div>
        </div>
      </Card>

      {/* Personalized Offers Section */}
      <div className="space-y-4">
        {/* Filters and Ranking Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Personalized Offers for You</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked by expected relevance and mutual merchant-customer value. Never ranked solely by discount %.
            </p>
          </div>

          {/* Sort / Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveFilter('best_match')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                activeFilter === 'best_match'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              ★ Best Match (ML)
            </button>
            <button
              onClick={() => setActiveFilter('nearby')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                activeFilter === 'nearby'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Nearby (Walking)
            </button>
            <button
              onClick={() => setActiveFilter('highest_savings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                activeFilter === 'highest_savings'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Highest Savings (₹)
            </button>
            <button
              onClick={() => setActiveFilter('expiring_soon')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                activeFilter === 'expiring_soon'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Expiring Soon
            </button>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {['all', 'cafe', 'bakery', 'restaurant'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize cursor-pointer transition-colors ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        {/* Offers Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 rounded-2xl bg-white border border-slate-200 p-4 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : offers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer) => (
              <PersonalizedOfferCard
                key={offer.id}
                offer={offer}
                onSaveToggle={() => loadData()}
                onDismiss={() => loadData()}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <Tag className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No active offers match filters</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Current commercial constraints or category filters yielded no viable offers. Try selecting "All Categories" or expanding your walking radius.
            </p>
            <Button variant="outline" size="sm" onClick={() => { setActiveCategory('all'); setActiveFilter('best_match'); }} className="mt-4">
              Reset Filters
            </Button>
          </div>
        )}
      </div>

      {/* Quick Adjust Context Modal */}
      <Dialog
        isOpen={isEditContextOpen}
        onClose={() => setIsEditContextOpen(false)}
        title="Adjust Context Signals"
        description="Simulate changes in your time availability, wallet, and marketing consent to see how ML offers adjust."
      >
        <div className="space-y-4 pt-2">
          <Input
            label="Available Break Time (Minutes)"
            type="number"
            value={editMinutes}
            onChange={(e) => setEditMinutes(Number(e.target.value))}
            helperText="Walking time + prep time must not exceed this duration."
          />

          <Input
            label="Wallet Balance (₹ INR)"
            type="number"
            value={editWallet}
            onChange={(e) => setEditWallet(Number(e.target.value))}
            helperText="The decision engine will not show offers priced above this threshold."
          />

          <div className="pt-2">
            <Switch
              checked={editMarketingConsent}
              onChange={setEditMarketingConsent}
              label="Marketing Consent"
              description="When disabled, the hard ML guardrail immediately blocks promotional offers."
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsEditContextOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdateQuickContext}>
              Apply & Re-score Offers
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
