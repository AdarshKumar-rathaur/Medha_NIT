import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Code, 
  Send, 
  Mail, 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  CloudSun, 
  ShieldAlert, 
  CheckCircle2, 
  User, 
  Store,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

export default function PredictionList({ 
  predictions = [], 
  onSelectForAiDraft, 
  onViewRawJson, 
  onQuickSend,
  loadingScenarioId 
}) {
  const [filterType, setFilterType] = useState('all'); // 'all', 'send', 'skip'
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPredictions = useMemo(() => {
    return predictions.filter(p => {
      // Filter by action
      if (filterType === 'send' && p.action !== 'send') return false;
      if (filterType === 'skip' && p.action !== 'skip') return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const sId = (p.scenario_id || '').toLowerCase();
        const cName = (p.customer?.name || '').toLowerCase();
        const mName = (p.merchant?.name || '').toLowerCase();
        const locality = (p.customer?.locality || '').toLowerCase();
        const title = (p.context?.title || '').toLowerCase();
        const reason = (p.reason || '').toLowerCase();

        return sId.includes(q) || cName.includes(q) || mName.includes(q) || 
               locality.includes(q) || title.includes(q) || reason.includes(q);
      }
      return true;
    });
  }, [predictions, filterType, searchQuery]);

  return (
    <div>
      {/* Filter & Search Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 20
      }}>
        {/* Action Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(15, 23, 42, 0.8)',
          padding: 4,
          borderRadius: 12,
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            onClick={() => setFilterType('all')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              background: filterType === 'all' ? 'var(--accent-primary)' : 'transparent',
              color: filterType === 'all' ? '#ffffff' : 'var(--text-muted)',
              transition: 'all 0.2s'
            }}
          >
            All Predictions ({predictions.length})
          </button>
          <button
            onClick={() => setFilterType('send')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: filterType === 'send' ? '#059669' : 'transparent',
              color: filterType === 'send' ? '#ffffff' : 'var(--text-muted)',
              transition: 'all 0.2s'
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399' }} />
            Send Offers ({predictions.filter(p => p.action === 'send').length})
          </button>
          <button
            onClick={() => setFilterType('skip')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: filterType === 'skip' ? '#dc2626' : 'transparent',
              color: filterType === 'skip' ? '#ffffff' : 'var(--text-muted)',
              transition: 'all 0.2s'
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171' }} />
            Suppressed Skips ({predictions.filter(p => p.action === 'skip').length})
          </button>
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', minWidth: 300, flex: 1, maxWidth: 450 }}>
          <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: 12, top: 12 }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search by customer, merchant, scenario ID, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 38 }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 12,
                top: 10,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Prediction Cards Grid */}
      {filteredPredictions.length === 0 ? (
        <div className="glass-panel" style={{ padding: 48, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>No predictions matching your filters.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 20 }}>
          {filteredPredictions.map((pred) => {
            const isSend = pred.action === 'send';
            const isCurrentLoading = loadingScenarioId === pred.scenario_id;

            return (
              <div 
                key={pred.scenario_id} 
                className="glass-panel"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 20,
                  borderLeft: `4px solid ${isSend ? '#10b981' : '#ef4444'}`,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Card Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ 
                        fontFamily: 'var(--font-mono)', 
                        fontSize: 12, 
                        fontWeight: 700, 
                        color: 'var(--text-muted)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '2px 8px',
                        borderRadius: 6
                      }}>
                        {pred.scenario_id}
                      </span>
                      <span className={`badge ${isSend ? 'badge-send' : 'badge-skip'}`}>
                        {pred.action.toUpperCase()}
                      </span>
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.3 }}>
                      {pred.context?.title || pred.scenario_id}
                    </h3>
                  </div>

                  {/* Profit estimate badge if send */}
                  {isSend && (
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      padding: '6px 10px',
                      borderRadius: 10,
                      textAlign: 'right'
                    }}>
                      <div style={{ fontSize: 10, color: '#6ee7b7', textTransform: 'uppercase', fontWeight: 700 }}>Est. Profit</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#34d399' }}>
                        ₹{Math.round(pred.profit_estimate_inr || 0)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Customer Context Row */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.5)',
                  padding: '10px 12px',
                  borderRadius: 10,
                  marginBottom: 14,
                  fontSize: 13,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-main)' }}>
                    <User size={14} color="#818cf8" />
                    <strong>{pred.customer?.name}</strong>
                    <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>({pred.customer?.locality})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                    <MapPin size={14} color="#06b6d4" />
                    <span>{pred.ui_hints?.walk_minutes || 2} min walk ({pred.ui_hints?.distance_m || 100}m)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                    <CloudSun size={14} color="#fbbf24" />
                    <span>{pred.context?.weather?.temp_c}°C, {pred.context?.weather?.condition}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                    <Clock size={14} color="#a855f7" />
                    <span>{pred.context?.minutes_available}m free &bull; {pred.context?.intent}</span>
                  </div>
                </div>

                {/* Offer Details or Skip Reason */}
                {isSend ? (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.7) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 16
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Store size={15} color="#38bdf8" />
                        <span style={{ fontWeight: 700, color: '#f1f5f9' }}>{pred.merchant?.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>({pred.merchant?.category})</span>
                      </div>
                      <span style={{
                        background: '#065f46',
                        color: '#34d399',
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 800
                      }}>
                        {pred.offer?.discount_pct}% OFF
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 13 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Final Price:</span>
                      <span style={{ fontSize: 18, fontWeight: 800, color: '#34d399' }}>
                        ₹{pred.offer?.final_price_inr}
                      </span>
                    </div>

                    {pred.notification && (
                      <div style={{
                        marginTop: 10,
                        paddingTop: 10,
                        borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
                        fontSize: 12,
                        color: '#94a3b8',
                        fontStyle: 'italic'
                      }}>
                        &ldquo;{pred.notification.body}&rdquo;
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 16,
                    fontSize: 13
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f87171', fontWeight: 600, marginBottom: 4 }}>
                      <ShieldAlert size={15} />
                      Suppression Guardrail
                    </div>
                    <p style={{ color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
                      {pred.reason}
                    </p>
                  </div>
                )}

                {/* Card Action Footer */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  marginTop: 'auto',
                  paddingTop: 12,
                  borderTop: '1px solid var(--border-subtle)'
                }}>
                  <button
                    onClick={() => onViewRawJson(pred)}
                    className="btn btn-secondary btn-sm"
                    title="View Raw ML Prediction Output JSON"
                  >
                    <Code size={13} />
                    Raw JSON
                  </button>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => onSelectForAiDraft(pred)}
                      disabled={isCurrentLoading}
                      className="btn btn-ai btn-sm"
                    >
                      <Sparkles size={13} className={isCurrentLoading ? 'animate-spin' : ''} />
                      {isCurrentLoading ? 'Drafting...' : 'AI Email Draft'}
                    </button>

                    {isSend && (
                      <button
                        onClick={() => onQuickSend(pred)}
                        className="btn btn-emerald btn-sm"
                        title="Send via Nodemailer directly"
                      >
                        <Send size={13} />
                        Send
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
