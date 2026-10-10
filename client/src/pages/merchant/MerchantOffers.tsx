import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  CheckCircle,
  Pause,
  Play,
  XCircle,
  Clock,
  TrendingUp,
  Percent,
  Sliders,
  Filter,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { ApiClient } from '@/api/client'
import type { MerchantOfferRecommendation } from '@/types'
import { formatINR, formatPercent } from '@/utils/formatters'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { DiscountProfitCurveChart } from '@/components/charts/DiscountProfitCurveChart'
import { Skeleton } from '@/components/ui/Skeleton'

export const MerchantOffers: React.FC = () => {
  const { user } = useAuth()
  const { success, error } = useToast()

  const [recommendations, setRecommendations] = useState<MerchantOfferRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'recommended' | 'paused'>('all')
  const [inspectRec, setInspectRec] = useState<MerchantOfferRecommendation | null>(null)

  const fetchRecommendations = async () => {
    setIsLoading(true)
    try {
      const mid = user?.id === 'm_001' ? 'm_001' : 'm_001'
      const data = await ApiClient.getMerchantRecommendations(mid)
      setRecommendations(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [user?.id])

  const handleStatusChange = async (recId: string, status: 'approved' | 'rejected' | 'paused') => {
    try {
      const updated = await ApiClient.updateRecommendationStatus(recId, status)
      setRecommendations((prev) => prev.map((r) => (r.id === recId ? { ...r, ...updated, recommendation_status: status } : r)))
      success(`Campaign status set to ${status}.`)
    } catch {
      error('Failed to update status')
    }
  }

  const filtered = recommendations.filter((r) => {
    if (filterStatus === 'all') return true
    return r.recommendation_status === filterStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-teal-600" />
            Offer Recommendations & Campaigns
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review algorithmic recommendations, inspect discount profit curves, and approve live campaigns.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 text-xs">
          {(['all', 'approved', 'recommended', 'paused'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold capitalize cursor-pointer transition-colors ${
                filterStatus === st ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Campaign Recommendations */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 rounded-2xl bg-white border border-slate-200 p-6 animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((rec) => {
            const isApproved = rec.recommendation_status === 'approved'
            const isPaused = rec.recommendation_status === 'paused'

            return (
              <Card key={rec.id} className="p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Badge variant="teal" className="text-xs font-bold">
                      {rec.suggested_discount_pct}% Optimal Discount
                    </Badge>
                    <Badge
                      variant={isApproved ? 'success' : isPaused ? 'warning' : 'violet'}
                      className="capitalize"
                    >
                      {rec.recommendation_status}
                    </Badge>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 leading-tight">{rec.item_title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 capitalize">{rec.item_category} item</p>

                  {/* Financial Breakdown */}
                  <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Base Catalog Price:</span>
                      <span className="font-mono text-slate-700">{formatINR(rec.original_price_inr)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>Proposed Offer Price:</span>
                      <span className="font-mono">{formatINR(rec.proposed_final_price_inr)}</span>
                    </div>
                    <div className="flex justify-between text-teal-700">
                      <span>Post-Discount Margin:</span>
                      <span className="font-mono font-semibold">{formatINR(rec.margin_amount_inr)}</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold text-indigo-950">
                      <span>Expected Profit E[P]:</span>
                      <span className="font-mono font-extrabold text-sm">{formatINR(rec.expected_profit_per_opportunity_inr)}</span>
                    </div>
                  </div>

                  {/* ML Context Note */}
                  <div className="mt-3 p-2.5 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-slate-700">
                    <span className="font-semibold text-indigo-900">ML Justification: </span>
                    {rec.reason}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setInspectRec(rec)}
                    className="text-xs"
                  >
                    View Curve
                  </Button>

                  <div className="flex items-center gap-1.5">
                    {rec.recommendation_status !== 'approved' && (
                      <Button
                        variant="teal"
                        size="sm"
                        onClick={() => handleStatusChange(rec.id, 'approved')}
                        className="text-xs"
                      >
                        Approve
                      </Button>
                    )}

                    {isApproved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(rec.id, 'paused')}
                        className="text-xs text-amber-700"
                      >
                        Pause
                      </Button>
                    )}

                    {isPaused && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(rec.id, 'approved')}
                        className="text-xs text-emerald-700"
                      >
                        Resume
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <p className="text-sm text-slate-500">No offer recommendations in this status filter.</p>
        </div>
      )}

      {/* Inspect Curve Modal */}
      <Dialog
        isOpen={!!inspectRec}
        onClose={() => setInspectRec(null)}
        title={inspectRec ? `Optimization Curve: ${inspectRec.item_title}` : ''}
        description="Discrete discount depth search showing Expected Profit = P(Accept) × Margin"
        maxWidth="lg"
      >
        {inspectRec && (
          <div className="space-y-4 pt-2">
            <DiscountProfitCurveChart
              curvePoints={inspectRec.curve_points}
              itemTitle={inspectRec.item_title}
            />
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={() => setInspectRec(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
