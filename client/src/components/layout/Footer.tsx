import React from 'react'
import { Sparkles, ShieldCheck } from 'lucide-react'

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200 bg-white py-8 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Brand & Methodology Note */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>Decisioned Offer System</span>
          </div>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span>9-Step ML Pipeline with XGBoost & Isotonic Calibration</span>
        </div>

        {/* Center: Legal / Statistical Note */}
        <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-700 shrink-0" />
          <span>Notice: All profit estimates represent statistical expected value, not guaranteed real profit.</span>
        </div>

        {/* Right: Copyright */}
        <div className="text-[11px] text-slate-400">
          © {new Date().getFullYear()} Decisioned Offer System. Bengaluru.
        </div>
      </div>
    </footer>
  )
}
