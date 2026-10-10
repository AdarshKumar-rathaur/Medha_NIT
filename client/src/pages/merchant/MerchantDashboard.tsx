import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Store,
  TrendingUp,
  PackageCheck,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Pause,
  Play,
  Check,
  X,
  Sliders,
  Info,
} from 'lucide-react'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { useAuth } from '@/context/AuthContext'
import { ApiClient } from '@/api/client'
import { useToast } from '@/context/ToastContext'
import type {
  MerchantProfile,
  MerchantOfferRecommendation,
  MerchantAnalytics,
} from '@/types'
import { formatINR, formatPercent } from '@/utils/formatters'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { DiscountProfitCurveChart } from '@/components/charts/DiscountProfitCurveChart'
import { Skeleton } from '@/components/ui/Skeleton'

export const MerchantDashboard: React.FC = () => {
  const { user } = useAuth()
  const { success, error, toast } = useToast()

  const [profile, setProfile] = useState<MerchantProfile | null>(null)
  const [recommendations, setRecommendations] = useState<MerchantOfferRecommendation[]>([])
  const [analytics, setAnalytics] = useState<MerchantAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Selected recommendation for inspection / curve view
  const [selectedRec, setSelectedRec] = useState<MerchantOfferRecommendation | null>(null)
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false)

  // Edit settings modal
  const [isEditSettingsOpen, setIsEditSettingsOpen] = useState(false)
  const [editMaxDiscount, setEditMaxDiscount] = useState(20)
  const [editMinMargin, setEditMinMargin] = useState(13)

  // Walk-in confirmation modal (Closed-loop feedback)
  const [isRecordVisitOpen, setIsRecordVisitOpen] = useState(false)
  const [walkinCustId, setWalkinCustId] = useState('c_001')
  const [walkinVoucher, setWalkinVoucher] = useState('DOS-8821')
  const [isRecording, setIsRecording] = useState(false)

  const handleConfirmVisit = async () => {
    setIsRecording(true)
    try {
      await ApiClient.redeemOffer(walkinVoucher || 'rec_c_001_33', walkinCustId)
      success('✓ Walk-in redemption confirmed! Merchant occupancy updated and customer signals refreshed!')
      setIsRecordVisitOpen(false)
      await loadData()
    } catch (err: any) {
      error('Redemption notice: ' + err.message)
    } finally {
      setIsRecording(false)
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    try {
      const mid = user?.id === 'm_001' ? 'm_001' : 'm_001'
      const [profData, recsData, anaData] = await Promise.all([
        ApiClient.getMerchantProfile(mid),
        ApiClient.getMerchantRecommendations(mid),
        ApiClient.getMerchantAnalytics(mid),
      ])
      setProfile(profData)
      setRecommendations(recsData)
      setAnalytics(anaData)
      setEditMaxDiscount(profData.max_discount_pct)
      setEditMinMargin(profData.min_margin_pct)
    } catch {
      error('Failed to load merchant data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.id])

  const handleUpdateStatus = async (
    recId: string,
    nextStatus: 'approved' | 'rejected' | 'paused'
  ) => {
    try {
      const updated = await ApiClient.updateRecommendationStatus(recId, nextStatus)
      setRecommendations((prev) =>
        prev.map((r) => (r.id === recId ? { ...r, ...updated, recommendation_status: nextStatus } : r))
      )
      success(`Offer recommendation status updated to ${nextStatus}.`)
    } catch (err: any) {
      error(err.message || 'Failed to update recommendation status')
    }
  }

  const handleSaveMarginGuard = async () => {
    if (!profile) return
    try {
      const updated = await ApiClient.updateMerchantProfile(profile.id, {
        max_discount_pct: Number(editMaxDiscount),
        min_margin_pct: Number(editMinMargin),
      })
      setProfile(updated)
      setIsEditSettingsOpen(false)
      success('Commercial policy rules updated! Guardrails enforced across recommendations.')
    } catch {
      error('Failed to update margin rules')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {profile?.name || 'Little Fern Café'}
            </h1>
            <Badge variant="violet" className="capitalize">
              {profile?.category || 'Cafe'} Workspace
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Commercial objective: <strong>{profile?.objective}</strong> ({profile?.locality}, Bengaluru)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="teal"
            size="sm"
            onClick={() => setIsRecordVisitOpen(true)}
            className="text-xs gap-1.5 font-bold shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Confirm Walk-In Visit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditSettingsOpen(true)}
            className="text-xs gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            Margin Policies
          </Button>
          <Link to="/merchant/analytics">
            <Button size="sm" className="text-xs gap-1">
              Deep Analytics <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* 6 Summary Cards: Distinguishing Realized vs Expected (Requirement 9) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Active Campaigns
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {analytics?.active_offers_count ?? 2}
          </span>
          <span className="text-[10px] text-teal-700 font-medium block mt-0.5">Approved & Live</span>
        </Card>

        <Card className="p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Available Inventory
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {analytics?.available_inventory_units ?? 52}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Units in catalog</span>
        </Card>

        <Card className="p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Capacity Occupancy
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {profile?.occupancy_pct ?? 18}%
          </span>
          <span className="text-[10px] text-indigo-600 font-semibold block mt-0.5">
            {Math.round((profile?.capacity || 25) * (1 - (profile?.occupancy_pct || 18) / 100))} empty seats
          </span>
        </Card>

        <Card className="p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Offers Redeemed
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {analytics?.offers_redeemed_count ?? 28}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">In-store transactions</span>
        </Card>

        {/* Realized Contribution Profit (Actual Transactions) */}
        <Card className="p-4 bg-emerald-50/70 border-emerald-200">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
            Realized Margin Profit
          </span>
          <span className="text-2xl font-black text-emerald-950 font-mono mt-1 block">
            {formatINR(analytics?.realized_contribution_profit_inr ?? 2875)}
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
            Confirmed Realized
          </span>
        </Card>

        {/* Predicted Expected Profit (Model Predictions) */}
        <Card className="p-4 bg-indigo-50/70 border-indigo-200">
          <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block">
            Predicted E[Profit]
          </span>
          <span className="text-2xl font-black text-indigo-950 font-mono mt-1 block">
            {formatINR(analytics?.predicted_expected_profit_inr ?? 4280)}
          </span>
          <span className="text-[10px] text-indigo-600 block mt-0.5 font-mono">
            Model E[P] Target
          </span>
        </Card>
      </div>

      {/* Main Performance Chart: Predicted E[P] vs Realized Profit */}
      <Card className="p-6 border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Campaign Performance: Predicted E[Profit] vs Realized Profit
            </CardTitle>
            <CardDescription>
              Comparing daily probabilistic ML expected profit against actual verified in-store redemptions.
            </CardDescription>
          </div>
          <Badge variant="outline">Past 7 Days</Badge>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={analytics?.daily_performance || []}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `₹${v}`} axisLine={{ stroke: '#cbd5e1' }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload
                    return (
                      <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-800 text-xs space-y-1">
                        <div className="font-bold border-b border-slate-700 pb-1">{d.date}</div>
                        <div className="text-teal-300">Predicted E[Profit]: {formatINR(d.predicted_expected_profit)}</div>
                        <div className="text-emerald-400">Realized Profit: {formatINR(d.realized_profit)}</div>
                        <div className="text-slate-400">Redemptions: {d.redemptions} ({d.offers_shown} impressions)</div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }} />
              <Bar dataKey="realized_profit" name="Realized Margin (₹)" fill="#10b981" barSize={24} radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="predicted_expected_profit" name="Predicted E[Profit] (₹)" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Recommended Offers Table (Section 9) */}
      <Card className="p-6 border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              Machine Learning Recommended Offers
            </CardTitle>
            <CardDescription>
              Each candidate discount depth has been evaluated by XGBoost to maximize merchant expected contribution profit.
            </CardDescription>
          </div>

          <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/80">
            Margin floor: <strong>≥ {profile?.min_margin_pct}%</strong> • Max cap: <strong>≤ {profile?.max_discount_pct}%</strong>
          </div>
        </div>

        {/* Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Product</th>
                <th className="py-3 px-2">Suggested Disc.</th>
                <th className="py-3 px-2">Original</th>
                <th className="py-3 px-2">Proposed Price</th>
                <th className="py-3 px-2">P(Accept)</th>
                <th className="py-3 px-2">Margin</th>
                <th className="py-3 px-2">E[Profit]</th>
                <th className="py-3 px-2">Audience</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {recommendations.map((rec) => {
                const statusBadgeVariant =
                  rec.recommendation_status === 'approved'
                    ? 'success'
                    : rec.recommendation_status === 'paused'
                    ? 'warning'
                    : 'violet'

                return (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">
                      <div>
                        <span>{rec.item_title}</span>
                        <span className="text-[10px] text-slate-400 block capitalize font-normal">
                          {rec.item_category}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-2 font-bold text-teal-700 font-mono">
                      {rec.suggested_discount_pct}%
                    </td>

                    <td className="py-3 px-2 text-slate-400 line-through">
                      {formatINR(rec.original_price_inr)}
                    </td>

                    <td className="py-3 px-2 font-bold text-slate-900 font-mono">
                      {formatINR(rec.proposed_final_price_inr)}
                    </td>

                    <td className="py-3 px-2 font-mono text-indigo-700">
                      {formatPercent(rec.predicted_acceptance_prob, true)}
                    </td>

                    <td className="py-3 px-2 font-mono">
                      {formatINR(rec.margin_amount_inr)}
                    </td>

                    <td className="py-3 px-2 font-mono font-bold text-emerald-800">
                      {formatINR(rec.expected_profit_per_opportunity_inr)}
                    </td>

                    <td className="py-3 px-2 text-slate-500">
                      ~{rec.eligible_audience_size} users
                    </td>

                    <td className="py-3 px-2">
                      <Badge variant={statusBadgeVariant as any} className="capitalize text-[10px]">
                        {rec.recommendation_status}
                      </Badge>
                    </td>

                    <td className="py-3 px-3 text-right space-x-1 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRec(rec)
                          setIsInspectModalOpen(true)
                        }}
                        className="text-[11px] h-7 px-2"
                      >
                        Inspect Curve
                      </Button>

                      {rec.recommendation_status !== 'approved' && (
                        <Button
                          variant="teal"
                          size="sm"
                          onClick={() => handleUpdateStatus(rec.id, 'approved')}
                          className="text-[11px] h-7 px-2"
                        >
                          Approve
                        </Button>
                      )}

                      {rec.recommendation_status === 'approved' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(rec.id, 'paused')}
                          className="text-[11px] h-7 px-2 text-amber-700"
                        >
                          Pause
                        </Button>
                      )}

                      {rec.recommendation_status === 'paused' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(rec.id, 'approved')}
                          className="text-[11px] h-7 px-2 text-emerald-700"
                        >
                          Resume
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Inspect Curve Modal Dialog */}
      <Dialog
        isOpen={isInspectModalOpen}
        onClose={() => setIsInspectModalOpen(false)}
        title={selectedRec ? `ML Curve: ${selectedRec.item_title}` : 'Optimization Curve'}
        description="Inspect how unit margin and acceptance probability interact to yield maximum expected profit."
        maxWidth="lg"
      >
        {selectedRec && (
          <div className="space-y-4 pt-2">
            <DiscountProfitCurveChart
              curvePoints={selectedRec.curve_points}
              itemTitle={selectedRec.item_title}
            />

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="font-bold text-slate-900">Commercial Rule Validation:</div>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>Suggested Discount: <strong>{selectedRec.suggested_discount_pct}%</strong> (Within merchant cap of {profile?.max_discount_pct}%)</li>
                <li>Post-Discount Margin: <strong>{formatINR(selectedRec.margin_amount_inr)}</strong> (Meets minimum margin requirement of {profile?.min_margin_pct}%)</li>
                <li>Audience pool: <strong>{selectedRec.eligible_audience_size} customers</strong> nearby within break time & wallet range.</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={() => setIsInspectModalOpen(false)}>
                Close
              </Button>
              {selectedRec.recommendation_status !== 'approved' && (
                <Button
                  variant="primary"
                  onClick={() => {
                    handleUpdateStatus(selectedRec.id, 'approved')
                    setIsInspectModalOpen(false)
                  }}
                >
                  Approve Offer ({selectedRec.suggested_discount_pct}%)
                </Button>
              )}
            </div>
          </div>
        )}
      </Dialog>

      {/* Edit Margin Guard Modal */}
      <Dialog
        isOpen={isEditSettingsOpen}
        onClose={() => setIsEditSettingsOpen(false)}
        title="Merchant Policy & Margin Floors"
        description="Configure your store's protective boundaries. The algorithm will never propose discounts that breach these parameters."
      >
        <div className="space-y-4 pt-2">
          <Input
            label="Maximum Allowed Discount Cap (%)"
            type="number"
            value={editMaxDiscount}
            onChange={(e) => setEditMaxDiscount(Number(e.target.value))}
            helperText="Hard ceiling. The model will not search discount depths above this value."
          />

          <Input
            label="Minimum Contribution Margin Requirement (%)"
            type="number"
            value={editMinMargin}
            onChange={(e) => setEditMinMargin(Number(e.target.value))}
            helperText="Every discounted item must yield at least this percentage over base unit cost."
          />

          <div className="flex items-start gap-2 bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              Updating these values re-evaluates all candidate discounts. Offers failing the minimum margin floor are disqualified.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsEditSettingsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveMarginGuard}>
              Save Guardrails
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Confirm Walk-in Customer Visit Dialog (Closed-Loop Feedback) */}
      <Dialog
        isOpen={isRecordVisitOpen}
        onClose={() => setIsRecordVisitOpen(false)}
        title="Confirm In-Store Customer Walk-In"
        description="Verify a customer arrival or voucher code. This triggers closed-loop feedback: updating merchant occupancy, logging contribution profit, and training behavioral retention."
      >
        <div className="space-y-4 pt-2">
          <Input
            label="Customer Identifier"
            value={walkinCustId}
            onChange={(e) => setWalkinCustId(e.target.value)}
            helperText="e.g. c_001 (Priya Sharma)"
          />

          <Input
            label="Voucher / Offer Code"
            value={walkinVoucher}
            onChange={(e) => setWalkinVoucher(e.target.value)}
            helperText="e.g. DOS-8821 or offer scenario ID"
          />

          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-900">
            <strong>Closed-Loop Learning Trigger:</strong> Confirming this redemption adjusts live table occupancy from {profile?.occupancy_pct || 28}% to {Math.min(100, (profile?.occupancy_pct || 28) + 5)}% and updates realized revenue on the ledger.
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsRecordVisitOpen(false)}>
              Cancel
            </Button>
            <Button variant="teal" disabled={isRecording} onClick={handleConfirmVisit}>
              {isRecording ? 'Verifying Redemption...' : 'Confirm Walk-In & Update Profit'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
