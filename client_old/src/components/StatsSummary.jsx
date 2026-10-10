import React from 'react';
import { TrendingUp, Send, Ban, Percent, DollarSign, Layers } from 'lucide-react';

export default function StatsSummary({ summary = {}, onBatchGenerate, isBatching }) {
  const {
    total = 0,
    sendCount = 0,
    skipCount = 0,
    sendRatio = 0,
    totalProfitInr = 0,
    averageDiscountPct = 0
  } = summary;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: 16,
      marginBottom: 24
    }}>
      {/* Total Scenarios */}
      <div className="glass-panel" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Scenarios
          </span>
          <div style={{ padding: 6, borderRadius: 8, background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <Layers size={18} />
          </div>
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
          {total}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
          Public evaluation dataset scenarios
        </div>
      </div>

      {/* Sends / Acceptance */}
      <div className="glass-panel" style={{ padding: '18px 20px', borderColor: 'var(--border-emerald)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Offers Generated (SEND)
          </span>
          <div style={{ padding: 6, borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <Send size={18} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-heading)' }}>
            {sendCount}
          </div>
          <div style={{ fontSize: 13, color: '#6ee7b7', fontWeight: 600 }}>
            ({Math.round(sendRatio)}% send rate)
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
          High-affinity, commercial rule validated
        </div>
      </div>

      {/* Skips / Guardrails */}
      <div className="glass-panel" style={{ padding: '18px 20px', borderColor: 'var(--border-rose)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Suppressed (SKIP)
          </span>
          <div style={{ padding: 6, borderRadius: 8, background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
            <Ban size={18} />
          </div>
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#f87171', fontFamily: 'var(--font-heading)' }}>
          {skipCount}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
          Consent protection & margin guardrails
        </div>
      </div>

      {/* Total Expected Profit */}
      <div className="glass-panel" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Expected Merchant Profit
          </span>
          <div style={{ padding: 6, borderRadius: 8, background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}>
            <DollarSign size={18} />
          </div>
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#22d3ee', fontFamily: 'var(--font-heading)' }}>
          ₹{totalProfitInr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
          Calculated via calibrated ML p(conversion)
        </div>
      </div>

      {/* Average Discount */}
      <div className="glass-panel" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Optimal Grounded Discount
          </span>
          <div style={{ padding: 6, borderRadius: 8, background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <Percent size={18} />
          </div>
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-heading)' }}>
          {averageDiscountPct}%
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
          Protects merchant margin floors
        </div>
      </div>
    </div>
  );
}
