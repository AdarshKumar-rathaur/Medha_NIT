import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Users, 
  CheckCircle2, 
  TrendingUp, 
  Sliders, 
  ExternalLink, 
  Clock, 
  MapPin, 
  UserCheck, 
  Percent, 
  ShieldCheck,
  RefreshCw,
  Activity
} from 'lucide-react';

export default function MerchantPortal({
  merchant,
  dashboardData,
  onUpdateSettings,
  onRecordVisit,
  onRefresh,
  isRecording
}) {
  if (!merchant) return null;

  const stats = dashboardData?.stats || {};
  const activeVouchers = dashboardData?.activeVouchers || [];
  const notifiedCustomers = dashboardData?.notifiedCustomers || [];
  const recentRedemptions = dashboardData?.recentRedemptions || [];

  const [occupancyPct, setOccupancyPct] = useState(merchant.occupancy_pct || 25);
  const [maxDiscountPct, setMaxDiscountPct] = useState(merchant.max_discount_pct || 20);

  // CRITICAL: Dynamically synchronize form controls whenever merchant prop updates!
  useEffect(() => {
    if (merchant) {
      setOccupancyPct(merchant.occupancy_pct ?? 25);
      setMaxDiscountPct(merchant.max_discount_pct ?? 20);
    }
  }, [merchant.id, merchant.occupancy_pct, merchant.max_discount_pct, merchant.updated_at]);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    onUpdateSettings({
      occupancy_pct: occupancyPct,
      max_discount_pct: maxDiscountPct,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Merchant Header */}
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
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            color: '#ffffff',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
          }}>
            <Store size={26} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#ffffff', margin: 0 }}>
                {merchant.name}
              </h2>
              <span className="badge badge-send" style={{ fontSize: 11 }}>Merchant Portal</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-muted)' }}>
              <span>Category: <strong style={{ color: '#38bdf8' }}>{merchant.category}</strong></span>
              <span>Locality: <strong>{merchant.locality}</strong></span>
              <span>Capacity: <strong>{merchant.capacity} seats</strong></span>
              <span>Base Item: <strong style={{ color: '#34d399' }}>₹{merchant.base_price_inr}</strong></span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Activity size={14} color="#10b981" /> Live Sync Active
              </span>
            </div>
          </div>
        </div>

        <button onClick={onRefresh} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} />
          Refresh Live Data
        </button>
      </div>

      {/* KPI Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
      }}>
        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
            Customers Notified
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>
            {stats.totalNotified || 0}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Targeted nearby users</div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
            Active Vouchers
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fbbf24', marginTop: 4 }}>
            {activeVouchers.length}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>In circulation right now</div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
            Verified Redemptions
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#34d399', marginTop: 4 }}>
            {stats.totalRedeemed || 0}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Walk-in visits confirmed</div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
            Current Store Occupancy
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#c084fc', marginTop: 4 }}>
            {Math.round(merchant.occupancy_pct)}%
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Dynamically shifts ML discounts</div>
        </div>
      </div>

      {/* Main Grid: Walk-in Redemption Station (Left) & Live Occupancy Sliders (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 24 }}>
        
        {/* Left Column: Walk-in Redemption Station */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          <div className="glass-panel" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UserCheck size={18} color="#10b981" /> Walk-In Redemption Station
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: '4px 0 0 0' }}>
                  When a customer enters the store to redeem their offer, click &ldquo;Confirm Customer Visit&rdquo; to complete the feedback loop!
                </p>
              </div>
              <span className="badge badge-send">
                {activeVouchers.length} Redeemable
              </span>
            </div>

            {activeVouchers.length === 0 ? (
              <div style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px dashed var(--border-subtle)',
                borderRadius: 12,
                padding: 32,
                textAlign: 'center',
              }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
                  No active customer vouchers currently waiting for redemption at this venue.
                </p>
                <p style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 6 }}>
                  (Switch to Customer View or evaluate offers for nearby customers to dispatch vouchers to this store).
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {activeVouchers.map((voucher) => (
                  <div
                    key={voucher.offer_id}
                    style={{
                      background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: 12,
                      padding: 18,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 14,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: '#ffffff' }}>
                          {voucher.customer?.name}
                        </span>
                        <span className="badge badge-send">
                          {voucher.offer?.discount_pct}% OFF
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          [{voucher.offer_id ? voucher.offer_id.substring(0, 12) : 'VOUCHER'}]
                        </span>
                      </div>

                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                        Customer Wallet: ₹{voucher.customer?.wallet_inr} &bull; Final Price: <strong style={{ color: '#34d399' }}>₹{voucher.offer?.final_price_inr}</strong>
                      </div>

                      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                        Notification: &ldquo;{voucher.notification?.title}&rdquo; &bull; Est. Profit: ₹{Math.round(voucher.profit_estimate_inr || 0)}
                      </div>
                    </div>

                    <button
                      onClick={() => onRecordVisit({
                        offerId: voucher.offer_id,
                        merchantId: merchant.id,
                        customerId: voucher.customer?.id,
                      })}
                      disabled={isRecording}
                      className="btn btn-emerald"
                      title="Confirm customer arrived in store and redeemed offer"
                    >
                      <UserCheck size={16} />
                      {isRecording ? 'Confirming...' : 'Confirm Customer Visit'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notified Customers Audit List */}
          <div className="glass-panel" style={{ padding: 22 }}>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 12 }}>
              Nearby Customers Targeted by ML System
            </h4>

            {notifiedCustomers.length === 0 ? (
              <p style={{ color: 'var(--text-dim)', fontSize: 13, margin: 0 }}>
                No nearby customer notifications logged yet for this store.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {notifiedCustomers.map((c, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(15, 23, 42, 0.5)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 10,
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 13,
                    }}
                  >
                    <div>
                      <strong style={{ color: '#ffffff' }}>{c.customer_name}</strong>
                      <span style={{ color: 'var(--text-dim)', marginLeft: 8 }}>
                        ({c.distance_m}m &bull; {c.walk_minutes} min walk)
                      </span>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Offered: {c.discount_pct}% discount &bull; Status: <strong style={{ color: c.status === 'redeemed' ? '#34d399' : '#fbbf24' }}>{c.status}</strong>
                      </div>
                    </div>

                    {c.email_preview_url && (
                      <a
                        href={c.email_preview_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ textDecoration: 'none' }}
                      >
                        <ExternalLink size={12} />
                        View Email
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Operational Controls */}
        <div className="glass-panel" style={{ padding: 24, height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Sliders size={18} color="#10b981" />
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#ffffff', margin: 0 }}>
              Live Capacity & Margins
            </h3>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 18 }}>
            Adjust seat fullness in real time. Low occupancy automatically signals surplus capacity to the ML decision engine!
          </p>

          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Current Occupancy:</span>
                <strong style={{ color: '#34d399' }}>{occupancyPct}% full</strong>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={occupancyPct}
                onChange={e => setOccupancyPct(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: '#10b981' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                <span>0% (Empty seats)</span>
                <span>50% (Balanced)</span>
                <span>100% (Packed)</span>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Max Discount Guardrail:</span>
                <strong style={{ color: '#fbbf24' }}>{maxDiscountPct}%</strong>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="5"
                value={maxDiscountPct}
                onChange={e => setMaxDiscountPct(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: '#f59e0b' }}
              />
            </div>

            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              padding: 12,
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--text-dim)',
            }}>
              Base Item Price: ₹{merchant.base_price_inr} &bull; Unit Cost: ₹{merchant.unit_cost_inr} &bull; Min Margin: {merchant.min_margin_pct}%
            </div>

            <button type="submit" className="btn btn-emerald" style={{ width: '100%' }}>
              Save Operational State
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
