import React, { useState } from 'react';
import { X, Sparkles, User, MapPin, Wallet, Clock, Tag, ShieldCheck } from 'lucide-react';

const PREFERENCE_OPTIONS = [
  'Cafe',
  'Cold Brew & Iced Coffee',
  'Bakery & Pastries',
  'South Indian Dosa',
  'Continental',
  'Healthy & Salads',
  'Desserts & Ice Cream',
  'Fast Casual Lunch',
  'Tea & Snacks',
];

export default function OnboardingModal({ isOpen, onClose, onRegister, isLoading }) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    locality: 'Koramangala',
    wallet_inr: 500,
    minutes_available: 25,
    intent: 'quick lunch with coffee',
    preferences: ['Cafe', 'Cold Brew & Iced Coffee'],
    marketing_consent: true,
  });

  const togglePreference = (pref) => {
    setFormData(prev => {
      const exists = prev.preferences.includes(pref);
      return {
        ...prev,
        preferences: exists
          ? prev.preferences.filter(p => p !== pref)
          : [...prev.preferences, pref],
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    onRegister({
      name: formData.name,
      email: formData.email,
      locality: formData.locality,
      wallet_inr: formData.wallet_inr,
      minutes_available: formData.minutes_available,
      intent: formData.intent,
      declared_preferences: formData.preferences.join(', ').toLowerCase(),
      marketing_consent: formData.marketing_consent,
    });
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 60,
      padding: 20,
    }}>
      <div style={{
        background: '#0d1527',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 20,
        width: '100%',
        maxWidth: 580,
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.85)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              padding: 8,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              color: '#ffffff',
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Customer Onboarding & Smart Profile
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: 0 }}>
                Set your preferences to receive grounded, real-time hyper-local offers
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              borderRadius: 8,
              padding: 6,
              display: 'flex',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Name & Email */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={14} color="#818cf8" /> Full Name
              </label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="e.g. Priya Sharma"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                className="input-field"
                placeholder="priya@example.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          {/* Locality & Budget */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={14} color="#06b6d4" /> Locality (Bengaluru)
              </label>
              <select
                className="input-field"
                value={formData.locality}
                onChange={e => setFormData({ ...formData, locality: e.target.value })}
              >
                <option value="Koramangala">Koramangala</option>
                <option value="Indiranagar">Indiranagar</option>
                <option value="HSR Layout">HSR Layout</option>
                <option value="MG Road">MG Road</option>
                <option value="Marathahalli">Marathahalli</option>
                <option value="Whitefield">Whitefield</option>
                <option value="Electronic City">Electronic City</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Wallet size={14} color="#10b981" /> Dining Wallet Budget (₹)
              </label>
              <input
                type="number"
                min="100"
                max="5000"
                step="50"
                className="input-field"
                value={formData.wallet_inr}
                onChange={e => setFormData({ ...formData, wallet_inr: parseFloat(e.target.value) || 500 })}
              />
            </div>
          </div>

          {/* Free Time & Current Craving */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={14} color="#f59e0b" /> Available Time Window: <strong>{formData.minutes_available} mins</strong>
              </label>
              <input
                type="range"
                min="10"
                max="60"
                step="5"
                value={formData.minutes_available}
                onChange={e => setFormData({ ...formData, minutes_available: parseInt(e.target.value, 10) })}
                style={{ width: '100%', accentColor: 'var(--accent-primary)', marginTop: 8 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                Current Intent / Craving
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. quick lunch, cool drink"
                value={formData.intent}
                onChange={e => setFormData({ ...formData, intent: e.target.value })}
              />
            </div>
          </div>

          {/* Preferences Pills */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Tag size={14} color="#a855f7" /> Select Food & Place Preferences
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PREFERENCE_OPTIONS.map(pref => {
                const isSelected = formData.preferences.includes(pref);
                return (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => togglePreference(pref)}
                    style={{
                      background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                      border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                      color: isSelected ? '#c7d2fe' : 'var(--text-muted)',
                      padding: '6px 12px',
                      borderRadius: 9999,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isSelected ? '✓ ' : '+ '}{pref}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Marketing Consent */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '12px 16px',
            borderRadius: 10,
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <input
              type="checkbox"
              id="mkt_consent"
              checked={formData.marketing_consent}
              onChange={e => setFormData({ ...formData, marketing_consent: e.target.checked })}
              style={{ width: 18, height: 18, accentColor: '#10b981' }}
            />
            <label htmlFor="mkt_consent" style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }}>
              <strong>Promotional Consent:</strong> I agree to receive real-time hyper-local offers & email notifications when within walking distance.
            </label>
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.name || !formData.email}
              className="btn btn-primary"
            >
              <Sparkles size={16} />
              {isLoading ? 'Creating Profile...' : 'Save Profile & Run ML Radar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
