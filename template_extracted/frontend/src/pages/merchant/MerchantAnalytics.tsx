import React, { useState, useEffect } from 'react'
import {
  BarChart3,
  TrendingUp,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  PieChart as PieIcon,
  ShieldCheck,
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
  BarChart,
  AreaChart,
  Area,
} from 'recharts'
import { useAuth } from '@/context/AuthContext'
import { ApiClient } from '@/api/client'
import type { MerchantAnalytics as MerchantAnalyticsType } from '@/types'
import { formatINR, formatPercent } from '@/utils/formatters'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'

export const MerchantAnalytics: React.FC = () => {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<MerchantAnalyticsType | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadAnalytics() {
      setIsLoading(true)
      try {
        const mid = user?.id === 'm_001' ? 'm_001' : 'm_001'
        const data = await ApiClient.getMerchantAnalytics(mid)
        setAnalytics(data)
      } finally {
        setIsLoading(false)
      }
    }
    loadAnalytics()
  }, [user?.id])

  if (isLoading || !analytics) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-indigo-600" />
            Profit & Conversion Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Realized merchant profits, predicted conversion accuracy, and funnel drop-off audit.
          </p>
        </div>

        <Badge variant="teal" className="self-start sm:self-auto py-1 px-3">
          Calibrated XGBoost Audit
        </Badge>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-emerald-50/70 border-emerald-200">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
            Realized Contribution Margin
          </span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-950 font-mono mt-1 block">
            {formatINR(analytics.realized_contribution_profit_inr)}
          </span>
          <span className="text-[11px] text-emerald-700 mt-1 block">
            Actual rupees added from {analytics.offers_redeemed_count} redemptions
          </span>
        </Card>

        <Card className="p-5 bg-indigo-50/70 border-indigo-200">
          <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider block">
            Predicted Expected Profit E[P]
          </span>
          <span className="text-2xl sm:text-3xl font-black text-indigo-950 font-mono mt-1 block">
            {formatINR(analytics.predicted_expected_profit_inr)}
          </span>
          <span className="text-[11px] text-indigo-700 mt-1 block font-mono">
            Model target across distributed offers
          </span>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Confirmed Redemptions
          </span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block">
            {analytics.offers_redeemed_count}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Verified in-store vouchers
          </span>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Current Occupancy
          </span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block">
            {analytics.current_occupancy_pct}%
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {analytics.available_inventory_units} units in stock
          </span>
        </Card>
      </div>

      {/* Chart 1: Daily Profit Trends (Predicted vs Realized) */}
      <Card className="p-6 border-slate-200">
        <CardHeader className="p-0 pb-4 mb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Daily Margin Realization vs. Predicted Expected Profit
            </CardTitle>
            <CardDescription>
              Green bars represent actual money in the till; purple line represents the ML expected value curve.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={analytics.daily_performance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `₹${v}`} axisLine={{ stroke: '#cbd5e1' }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload
                    return (
                      <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xl text-xs space-y-1">
                        <div className="font-bold border-b border-slate-700 pb-1">{d.date}</div>
                        <div className="text-teal-300">Predicted E[Profit]: {formatINR(d.predicted_expected_profit)}</div>
                        <div className="text-emerald-400">Realized Margin: {formatINR(d.realized_profit)}</div>
                        <div className="text-slate-400">{d.redemptions} redemptions / {d.offers_shown} sent</div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }} />
              <Bar dataKey="realized_profit" name="Realized Margin (₹)" fill="#10b981" barSize={26} radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="predicted_expected_profit" name="Predicted E[Profit] (₹)" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Row 2 Charts: Predicted vs Realized Conversion & Redemption Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Comparison Chart */}
        <Card className="p-6 border-slate-200">
          <CardHeader className="p-0 pb-4 mb-4 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-600" />
              Predicted vs. Realized Acceptance Probability
            </CardTitle>
            <CardDescription>
              Isotonic calibration ensures predicted P(Accept) tracks empirical conversion rates.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.conversion_comparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `${v}%`} axisLine={{ stroke: '#cbd5e1' }} />
                <Tooltip />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }} />
                <Bar dataKey="predicted_conversion_pct" name="Predicted P(Accept) %" fill="#818cf8" barSize={20} radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual_realized_conversion_pct" name="Empirical Conversion %" fill="#0d9488" barSize={20} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Redemption Funnel Chart */}
        <Card className="p-6 border-slate-200">
          <CardHeader className="p-0 pb-4 mb-4 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-5 h-5 text-indigo-600" />
              Offer Decision & Conversion Funnel
            </CardTitle>
            <CardDescription>
              Step-by-step attrition through consent, guardrails, and store visits.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-3 pt-2">
            {analytics.funnel_stages.map((stage, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-800">{stage.stage}</span>
                  <span className="font-mono text-slate-600">
                    {stage.count} users ({stage.rate_pct}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${stage.rate_pct}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Product Economics & Performance Table */}
      <Card className="p-6 border-slate-200">
        <CardHeader className="p-0 pb-4 mb-4 border-b border-slate-100">
          <CardTitle className="text-base">Product Performance & Profit Realization</CardTitle>
          <CardDescription>
            Performance broken down by catalog items active in recent offer campaigns.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Catalog Item</th>
                <th className="py-3 px-2">Discount</th>
                <th className="py-3 px-2">Distributed</th>
                <th className="py-3 px-2">Redeemed</th>
                <th className="py-3 px-2">Conversion</th>
                <th className="py-3 px-2">Realized Profit</th>
                <th className="py-3 px-3 text-right">Expected Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {analytics.product_performance.map((item) => (
                <tr key={item.item_id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-bold text-slate-900">{item.item_title}</td>
                  <td className="py-3 px-2 font-mono font-semibold text-teal-700">{item.discount_pct}%</td>
                  <td className="py-3 px-2">{item.total_distributed} offers</td>
                  <td className="py-3 px-2 font-bold text-slate-900">{item.total_redeemed}</td>
                  <td className="py-3 px-2 font-mono">{item.conversion_rate_pct}%</td>
                  <td className="py-3 px-2 font-mono font-bold text-emerald-800">
                    {formatINR(item.realized_profit_inr)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-indigo-900">
                    {formatINR(item.expected_profit_inr)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
