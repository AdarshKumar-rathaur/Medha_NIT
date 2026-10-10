import React, { useState } from 'react'
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Info,
  CheckCircle,
} from 'lucide-react'
import { formatPercent, formatINR } from '@/utils/formatters'
import type { PersonalizedOffer } from '@/types'

interface OfferExplainabilityBadgeProps {
  offer: PersonalizedOffer
}

export const OfferExplainabilityBadge: React.FC<OfferExplainabilityBadgeProps> = ({ offer }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/70 to-slate-50 p-4 sm:p-5 text-slate-800 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5 text-teal-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-900">
                Machine Learning Decision Breakdown
              </h4>
              <span className="text-[11px] font-mono bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-semibold">
                XGBoost + Isotonic Calibrated
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Why this exact {Math.round(offer.discount_pct)}% discount was selected: maximizes merchant expected contribution profit under strict customer & operational constraints.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors cursor-pointer shrink-0"
          aria-label={isOpen ? 'Collapse explainability' : 'Expand explainability'}
        >
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Primary Mathematical KPI Row */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div className="bg-white p-3 rounded-xl border border-indigo-100/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Predicted P(Accept)
          </span>
          <span className="text-base sm:text-lg font-extrabold text-slate-900 block mt-0.5">
            {formatPercent(offer.predicted_p_accept, true)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Calibrated acceptance chance</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-indigo-100/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Post-Discount Margin
          </span>
          <span className="text-base sm:text-lg font-extrabold text-slate-900 block mt-0.5">
            {formatINR(offer.post_discount_margin_inr)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Final price minus unit cost</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-indigo-100/80 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-teal-600" /> Expected Profit E[P]
          </span>
          <span className="text-base sm:text-lg font-extrabold text-indigo-950 block mt-0.5">
            {formatINR(offer.expected_profit_inr)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">P(Accept) × Margin</span>
        </div>
      </div>

      {/* Expandable Deep Dive */}
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-indigo-200/60 space-y-3 animate-in fade-in-0 duration-200">
          <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Verified Operational & Commercial Guardrails
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200/80">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>Marketing Consent:</strong> Customer opted-in to offers</span>
            </div>
            <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200/80">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>Distance Feasibility:</strong> {offer.distance_m}m walk within lunch break</span>
            </div>
            <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200/80">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>Margin Floor:</strong> Unit price protects minimum margin</span>
            </div>
            <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200/80">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>Wallet Affordability:</strong> {formatINR(offer.final_price_inr)} fits budget</span>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-amber-50/80 border border-amber-200/70 p-3 rounded-xl text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Statistical Model Notice:</strong> Expected profit is an optimization target representing the probability-weighted average outcome across multiple visits, not guaranteed revenue for a single transaction.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
