import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  MapPin, 
  Clock, 
  Wallet, 
  ExternalLink, 
  Store, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Coffee, 
  Edit3, 
  Mail, 
  History, 
  Sliders, 
  CloudSun, 
  ShieldAlert,
  ArrowRight,
  Activity
} from 'lucide-react';
import { api } from '../services/api';

export default function CustomerPortal({
  customer,
  offers = [],
  onUpdatePreferences,
  onOpenOnboarding,
  onEvaluateNow,
  isEvaluating,
}) {
  if (!customer) return null;

  // Local state for interactive craving & context adjustments
  const [cravingInput, setCravingInput] = useState(customer.intent || 'quick lunch');
  const [minutesAvailable, setMinutesAvailable] = useState(customer.minutes_available || 25);
  const [walletBudget, setWalletBudget] = useState(customer.wallet_inr || 400);
  const [preferencesStr, setPreferencesStr] = useState(customer.declared_preferences || 'cafe, bakery');

  // CRITICAL: Dynamically synchronize form controls whenever customer prop updates!
  useEffect(() => {
    if (customer) {
      setCravingInput(customer.intent || '');
      setMinutesAvailable(customer.minutes_available ?? 25);
      setWalletBudget(customer.wallet_inr ?? 0);
      setPreferencesStr(customer.declared_preferences || '');
    }
  }, [
    customer.id, 
    customer.updated_at, 
    customer.wallet_inr, 
    customer.intent, 
    customer.minutes_available, 
    customer.declared_preferences
  ]);

  // Automatic Environmental Telemetry
  const [telemetry, setTelemetry] = useState(null);
  const [isSimulatingWeather, setIsSimulatingWeather] = useState(false);
  const [simulatedTemp, setSimulatedTemp] = useState(30.0);
  const [simulatedCondition, setSimulatedCondition] = useState('sunny');

  useEffect(() => {
    api.getLiveTelemetry(customer.current_lat, customer.current_lng)
      .then(res => {
        if (res.success && res.data) {
          setTelemetry(res.data);
          setSimulatedTemp(res.data.temp_c);
          setSimulatedCondition(res.data.condition);
        }
      })
      .catch(console.warn);
  }, [customer.current_lat, customer.current_lng]);

  // Offers Analysis: Latest decision & Active Offer
  const latestDecision = offers.length > 0 ? offers[0] : null;
  const activeOffer = offers.find(o => o.status === 'active' && o.action === 'send') || null;
  const visitHistory = customer.visit_history || [];

  const handleApplyPreferences = (e) => {
    e.preventDefault();
    const payload = {
      intent: cravingInput,
      minutes_available: minutesAvailable,
      wallet_inr: walletBudget,
      declared_preferences: preferencesStr,
    };

    if (isSimulatingWeather) {
      payload.temp_c = simulatedTemp;
      payload.condition = simulatedCondition;
    }

    onUpdatePreferences(payload);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Customer Header / Profile Banner */}
      <div className="glass-panel" style={{
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            fontWeight: 800,
            color: '#ffffff',
            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
          }}>
            {customer.name?.charAt(0) || 'U'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Welcome, {customer.name}!
              </h2>
              <span className="badge badge-ai" style={{ fontSize: 11 }}>Customer Portal</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={14} color="#06b6d4" /> {customer.locality}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Wallet size={14} color="#10b981" /> Dining Wallet: <strong style={{ color: '#34d399' }}>₹{customer.wallet_inr}</strong>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <History size={14} color="#a855f7" /> Verified Visits: <strong>{visitHistory.length}</strong>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Activity size={14} color="#38bdf8" /> ML Status: <strong style={{ color: activeOffer ? '#34d399' : '#fbbf24' }}>{activeOffer ? 'Active Offer Live' : 'Monitoring Radar'}</strong>
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            onClick={onEvaluateNow} 
            disabled={isEvaluating} 
            className="btn btn-primary btn-sm"
          >
            <RefreshCw size={14} className={isEvaluating ? 'animate-spin' : ''} />
            {isEvaluating ? 'Running ML Engine...' : 'Scan Nearby Offers Now'}
          </button>
        </div>
      </div>

      {/* Automatic Environmental Telemetry Banner */}
      <div className="glass-panel" style={{
        padding: '14px 22px',
        background: 'rgba(15, 23, 42, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        border: '1px solid rgba(56, 189, 248, 0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: 6, borderRadius: 8, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
            <CloudSun size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>
                Live Environmental Telemetry (Auto-Synchronized)
              </span>
              <span className="badge badge-ai" style={{ fontSize: 9 }}>Auto-Fetched</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
              Real-time weather & time dynamically feeding the XGBoost + ProfitOptimizer pipeline
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', fontSize: 13 }}>
          <div>
            🌡️ <strong style={{ color: '#38bdf8' }}>{telemetry?.temp_c ?? 31}°C</strong>
            <span style={{ color: 'var(--text-dim)', marginLeft: 4 }}>({telemetry?.condition ?? 'sunny'})</span>
          </div>
          <div>
            🌧️ Rain: <strong style={{ color: '#34d399' }}>{telemetry?.rain_mm ?? 0} mm</strong>
          </div>
          <div>
            🕒 <strong style={{ color: '#fbbf24' }}>{telemetry?.time_formatted ?? 'Live Time'}</strong>
            <span style={{ color: 'var(--text-dim)', marginLeft: 4 }}>&bull; {telemetry?.window_label ?? 'Operating Window'}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Offer Radar on Left, Live Context Adjuster on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 24 }}>
        
        {/* Left Column: Real-Time ML Decision Radar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* STATE A: ACTIVE GROUNDED OFFER */}
          {activeOffer ? (
            <div className="glass-panel" style={{
              padding: 24,
              border: '2px solid rgba(16, 185, 129, 0.5)',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0.9) 100%)',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.15)',
            }}>
              {/* Top Banner */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span className="badge badge-send" style={{ fontSize: 12, padding: '5px 12px' }}>
                  🎯 Active Grounded Offer Detected!
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  Evaluated: {new Date(activeOffer.created_at || Date.now()).toLocaleTimeString()}
                </span>
              </div>

              {/* Offer Hero */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#38bdf8', marginBottom: 4 }}>
                    <Store size={18} />
                    <span style={{ fontSize: 18, fontWeight: 800 }}>{activeOffer.merchant?.name || 'Featured Merchant'}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>({activeOffer.merchant?.category})</span>
                  </div>

                  <h3 style={{ fontSize: 22, fontWeight: 800, color: '#ffffff', margin: '4px 0 8px 0' }}>
                    {activeOffer.notification?.title || 'Special Proximity Discount'}
                  </h3>

                  <p style={{ color: '#cbd5e1', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                    {activeOffer.notification?.body}
                  </p>
                </div>

                <div style={{
                  background: '#065f46',
                  color: '#34d399',
                  padding: '12px 18px',
                  borderRadius: 14,
                  textAlign: 'center',
                  minWidth: 105,
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                }}>
                  <div style={{ fontSize: 26, fontWeight: 800 }}>{activeOffer.offer?.discount_pct}%</div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>DISCOUNT</div>
                </div>
              </div>

              {/* Price & Proximity Bar */}
              <div style={{
                marginTop: 18,
                padding: '14px 18px',
                borderRadius: 12,
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Exclusive Final Price</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#34d399' }}>
                    ₹{activeOffer.offer?.final_price_inr}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-muted)' }}>
                  <div>
                    <MapPin size={14} color="#06b6d4" style={{ display: 'inline', marginRight: 4 }} />
                    <strong>{activeOffer.ui_hints?.distance_m}m</strong> ({activeOffer.ui_hints?.walk_minutes} min walk)
                  </div>
                  <div>
                    <Clock size={14} color="#f59e0b" style={{ display: 'inline', marginRight: 4 }} />
                    Valid <strong>{activeOffer.offer?.valid_minutes}m</strong>
                  </div>
                </div>
              </div>

              {/* ML Telemetry Confidence Metrics */}
              <div style={{
                marginTop: 14,
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(15, 23, 42, 0.5)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                color: 'var(--text-dim)',
              }}>
                <span>ML P(Conversion): <strong style={{ color: '#38bdf8' }}>{Math.round((activeOffer.conversion_prob || 0.65) * 100)}%</strong></span>
                <span>Expected Profit: <strong style={{ color: '#34d399' }}>₹{Math.round(activeOffer.profit_estimate_inr || 45)}</strong></span>
                <span>Algorithm: <strong style={{ color: '#c084fc' }}>XGBoost + ProfitOptimizer</strong></span>
              </div>

              {/* Automated Email Delivery Notice */}
              {activeOffer.email_delivery && (
                <div style={{
                  marginTop: 14,
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Mail size={16} color="#818cf8" />
                    <span style={{ fontSize: 13, color: '#e0e7ff' }}>
                      Notification drafted by <strong>Gemini 2.5 Flash</strong> sent to your inbox!
                    </span>
                  </div>

                  {activeOffer.email_delivery.preview_url && (
                    <a
                      href={activeOffer.email_delivery.preview_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                      style={{ textDecoration: 'none' }}
                    >
                      <ExternalLink size={13} />
                      View Sent Email in Inbox &rarr;
                    </a>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* STATE B: LATEST ML EVALUATION WAS SUPPRESSED / SKIPPED */
            <div className="glass-panel" style={{
              padding: 26,
              border: '1px solid rgba(251, 191, 36, 0.3)',
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.05) 0%, rgba(15, 23, 42, 0.85) 100%)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span className="badge badge-skip" style={{ fontSize: 11, padding: '4px 10px' }}>
                  ⚡ ML Radar Active: Suppression / Skip Decision
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  Evaluated: {latestDecision ? new Date(latestDecision.created_at).toLocaleTimeString() : 'Just now'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginTop: 8 }}>
                <div style={{
                  padding: 10,
                  borderRadius: 12,
                  background: 'rgba(251, 191, 36, 0.15)',
                  color: '#fbbf24',
                }}>
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', margin: '0 0 6px 0' }}>
                    Model Action: SUPPRESS_COMMERCIAL_OFFER
                  </h4>
                  <p style={{ color: '#cbd5e1', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                    <strong>Reason:</strong> {latestDecision?.reason || latestDecision?.decision?.reason || 'Commercial margins or walking time constraints make no candidate offer economically viable for this time slot.'}
                  </p>
                </div>
              </div>

              {/* Dynamic Hints to Trigger an Offer */}
              <div style={{
                marginTop: 18,
                padding: '12px 16px',
                borderRadius: 10,
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-subtle)',
                fontSize: 12,
                color: 'var(--text-muted)',
              }}>
                <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
                  💡 How to trigger an active offer:
                </div>
                <div>
                  &bull; Increase your Available Time Window on the right (e.g. 25-35 mins)<br />
                  &bull; Ensure your Dining Wallet is at least ₹250 (current: ₹{customer.wallet_inr})<br />
                  &bull; Set craving to &ldquo;coffee&rdquo;, &ldquo;bakery&rdquo;, or &ldquo;lunch&rdquo;
                </div>
              </div>

              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={onEvaluateNow} disabled={isEvaluating} className="btn btn-secondary btn-sm">
                  <RefreshCw size={13} className={isEvaluating ? 'animate-spin' : ''} />
                  Re-evaluate Surrounding Merchants
                </button>
              </div>
            </div>
          )}

          {/* Past Visits & Feedback Loop Timeline */}
          <div className="glass-panel" style={{ padding: 22 }}>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <History size={16} color="#a855f7" /> My Verified Visit History & Merchant Loyalty
            </h4>

            {visitHistory.length === 0 ? (
              <p style={{ color: 'var(--text-dim)', fontSize: 13, margin: 0 }}>
                No store visits yet. When you visit a merchant and redeem an offer, they will confirm your visit in their portal, 
                which automatically updates your preferences and unlocks higher loyalty discounts!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {visitHistory.map((visit, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 10,
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#ffffff', fontSize: 14 }}>
                        {visit.merchant_name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                        {visit.category} &bull; Redeemed {visit.discount_pct}% off &bull; Spent ₹{visit.amount_spent_inr}
                      </div>
                    </div>
                    <span className="badge badge-send" style={{ fontSize: 11 }}>
                      Verified Visit
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent ML Radar Evaluation Stream */}
          {offers.length > 0 && (
            <div className="glass-panel" style={{ padding: 20 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendingUp size={15} color="#38bdf8" /> Real-Time ML Decision Audit Stream
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                {offers.slice(0, 5).map((o, idx) => (
                  <div key={idx} style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'rgba(15, 23, 42, 0.4)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`badge ${o.action === 'send' ? 'badge-send' : 'badge-skip'}`} style={{ fontSize: 10 }}>
                        {o.action === 'send' ? 'SENT' : 'SUPPRESSED'}
                      </span>
                      <span style={{ color: '#e2e8f0' }}>
                        {o.action === 'send' ? `${o.offer?.discount_pct}% at ${o.merchant?.name}` : (o.reason || 'No positive-margin offer')}
                      </span>
                    </div>
                    <span style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      {o.created_at ? new Date(o.created_at).toLocaleTimeString() : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Interactive Live Craving & Context Adjuster */}
        <div className="glass-panel" style={{ padding: 24, height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Edit3 size={18} color="#818cf8" />
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#ffffff', margin: 0 }}>
              Live Mood & Craving Control
            </h3>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 18 }}>
            Tweak your craving or budget below &mdash; clicking save <strong>immediately re-evaluates the Python ML engine</strong>!
          </p>

          <form onSubmit={handleApplyPreferences} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                Current Craving / Intent
              </label>
              <input
                type="text"
                className="input-field"
                value={cravingInput}
                onChange={e => setCravingInput(e.target.value)}
                placeholder="e.g. craving cold brew, quick lunch"
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                Available Window: <strong>{minutesAvailable} minutes</strong>
              </label>
              <input
                type="range"
                min="10"
                max="60"
                step="5"
                value={minutesAvailable}
                onChange={e => setMinutesAvailable(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                Wallet Budget (₹)
              </label>
              <input
                type="number"
                className="input-field"
                value={walletBudget}
                onChange={e => setWalletBudget(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                Declared Preferences (comma separated)
              </label>
              <input
                type="text"
                className="input-field"
                value={preferencesStr}
                onChange={e => setPreferencesStr(e.target.value)}
              />
            </div>

            {/* Optional Weather Simulation Mode */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              padding: 12,
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sliders size={13} color="#06b6d4" /> Simulate Extreme Weather
                </span>
                <input
                  type="checkbox"
                  id="sim_toggle"
                  checked={isSimulatingWeather}
                  onChange={e => setIsSimulatingWeather(e.target.checked)}
                  style={{ accentColor: '#06b6d4', width: 16, height: 16 }}
                />
              </div>

              {isSimulatingWeather && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Temp (°C)</label>
                    <input
                      type="number"
                      className="input-field"
                      style={{ padding: '6px 10px', fontSize: 12 }}
                      value={simulatedTemp}
                      onChange={e => setSimulatedTemp(parseFloat(e.target.value) || 30)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Condition</label>
                    <select
                      className="input-field"
                      style={{ padding: '6px 10px', fontSize: 12 }}
                      value={simulatedCondition}
                      onChange={e => setSimulatedCondition(e.target.value)}
                    >
                      <option value="sunny">Sunny / Clear</option>
                      <option value="rain">Heavy Monsoon Rain</option>
                      <option value="cloudy">Cloudy</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isEvaluating}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 4 }}
            >
              <Sparkles size={16} className={isEvaluating ? 'animate-spin' : ''} />
              {isEvaluating ? 'Re-evaluating with ML...' : 'Save & Re-run ML Decisions'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
