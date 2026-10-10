import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  User, 
  Store, 
  Lock, 
  Mail, 
  MapPin, 
  Wallet, 
  Clock, 
  Tag, 
  ShieldCheck, 
  KeyRound,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

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

export default function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  api,
  canClose = false,
}) {
  if (!isOpen) return null;

  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [role, setRole] = useState('customer'); // 'customer' or 'merchant'
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Login form state
  const [loginForm, setLoginForm] = useState({
    userId: 'c_001',
    password: 'password123',
  });

  // Register customer state
  const [custRegisterForm, setCustRegisterForm] = useState({
    userId: '',
    name: '',
    email: '',
    password: '',
    locality: 'Koramangala',
    wallet_inr: 500,
    minutes_available: 25,
    intent: 'quick coffee & snack',
    preferences: ['Cafe', 'Cold Brew & Iced Coffee'],
  });

  // Register merchant state
  const [merchRegisterForm, setMerchRegisterForm] = useState({
    userId: '',
    name: '',
    email: '',
    password: '',
    category: 'cafe',
    locality: 'Koramangala',
    capacity: 35,
    base_price_inr: 220,
    occupancy_pct: 30,
  });

  const toggleCustPreference = (pref) => {
    setCustRegisterForm(prev => {
      const exists = prev.preferences.includes(pref);
      return {
        ...prev,
        preferences: exists
          ? prev.preferences.filter(p => p !== pref)
          : [...prev.preferences, pref],
      };
    });
  };

  const setDemoCredentials = (targetRole, userId, password) => {
    setRole(targetRole);
    setLoginForm({ userId, password });
    setError(null);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await api.login({
        userId: loginForm.userId.trim(),
        password: loginForm.password.trim(),
        role,
      });

      if (res.success && res.user) {
        onLoginSuccess(res.user, role);
      } else {
        setError(res.error || 'Login failed.');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      let payload;
      if (role === 'customer') {
        if (!custRegisterForm.userId || !custRegisterForm.password || !custRegisterForm.name) {
          setError('User ID, Password, and Full Name are required.');
          setIsLoading(false);
          return;
        }

        payload = {
          role: 'customer',
          userId: custRegisterForm.userId.trim(),
          name: custRegisterForm.name.trim(),
          email: custRegisterForm.email.trim() || `${custRegisterForm.userId.trim()}@priority-member.in`,
          password: custRegisterForm.password.trim(),
          locality: custRegisterForm.locality,
          wallet_inr: custRegisterForm.wallet_inr,
          minutes_available: custRegisterForm.minutes_available,
          intent: custRegisterForm.intent,
          declared_preferences: custRegisterForm.preferences.join(', ').toLowerCase(),
        };
      } else {
        if (!merchRegisterForm.userId || !merchRegisterForm.password || !merchRegisterForm.name) {
          setError('Merchant User ID, Password, and Store Name are required.');
          setIsLoading(false);
          return;
        }

        payload = {
          role: 'merchant',
          userId: merchRegisterForm.userId.trim(),
          name: merchRegisterForm.name.trim(),
          email: merchRegisterForm.email.trim() || `${merchRegisterForm.userId.trim()}@merchant-portal.in`,
          password: merchRegisterForm.password.trim(),
          category: merchRegisterForm.category,
          locality: merchRegisterForm.locality,
          capacity: merchRegisterForm.capacity,
          base_price_inr: merchRegisterForm.base_price_inr,
          occupancy_pct: merchRegisterForm.occupancy_pct,
        };
      }

      const res = await api.register(payload);
      if (res.success && res.user) {
        onLoginSuccess(res.user, role);
      } else {
        setError(res.error || 'Registration failed.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 8, 16, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: 16,
    }}>
      <div style={{
        background: '#0d1527',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 24,
        width: '100%',
        maxWidth: 580,
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 26px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.9)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: role === 'customer'
                ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)'
                : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}>
              {role === 'customer' ? <User size={20} /> : <Store size={20} />}
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', margin: 0 }}>
                {mode === 'login' ? 'Moment IQ • Portal Sign In' : 'Moment IQ • Create Account'}
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: 0 }}>
                {role === 'customer' ? 'Customer Hyper-Local Offers' : 'Merchant Venue Management'}
              </p>
            </div>
          </div>

          {canClose && (
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
          )}
        </div>

        {/* Tab Switchers: Role & Mode */}
        <div style={{ padding: '16px 26px 0 26px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Role Switcher */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'rgba(15, 23, 42, 0.8)',
            padding: 4,
            borderRadius: 12,
            border: '1px solid var(--border-subtle)',
          }}>
            <button
              type="button"
              onClick={() => {
                setRole('customer');
                setError(null);
                if (mode === 'login') setLoginForm(prev => ({ ...prev, userId: 'c_001' }));
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 16px',
                borderRadius: 9,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 13,
                background: role === 'customer' ? 'var(--accent-primary)' : 'transparent',
                color: role === 'customer' ? '#ffffff' : 'var(--text-muted)',
                transition: 'all 0.15s ease',
              }}
            >
              <User size={15} />
              Customer Portal
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('merchant');
                setError(null);
                if (mode === 'login') setLoginForm(prev => ({ ...prev, userId: 'm_001' }));
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 16px',
                borderRadius: 9,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 13,
                background: role === 'merchant' ? '#059669' : 'transparent',
                color: role === 'merchant' ? '#ffffff' : 'var(--text-muted)',
                transition: 'all 0.15s ease',
              }}
            >
              <Store size={15} />
              Merchant Portal
            </button>
          </div>

          {/* Mode Switcher (Sign In vs Register) */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              style={{
                background: 'none',
                border: 'none',
                color: mode === 'login' ? '#ffffff' : 'var(--text-dim)',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                padding: '4px 8px',
                borderBottom: mode === 'login' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              }}
            >
              Sign In with User ID
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              style={{
                background: 'none',
                border: 'none',
                color: mode === 'register' ? '#ffffff' : 'var(--text-dim)',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                padding: '4px 8px',
                borderBottom: mode === 'register' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              }}
            >
              Create New Account
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div style={{
            margin: '16px 26px 0 26px',
            padding: '10px 14px',
            borderRadius: 10,
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* MODE 1: LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} style={{ padding: 26, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Quick Fill Credentials Helper */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              padding: '12px 14px',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <KeyRound size={12} color="#fbbf24" /> Quick Test Credentials (Click to Fill)
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setDemoCredentials('customer', 'c_001', 'password123')}
                  style={{
                    background: (role === 'customer' && loginForm.userId === 'c_001') ? 'rgba(99, 102, 241, 0.3)' : 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid var(--border-subtle)',
                    color: '#c7d2fe',
                    padding: '4px 10px',
                    borderRadius: 8,
                    fontSize: 11,
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Customer: <strong>c_001</strong> (Priya)
                </button>
                <button
                  type="button"
                  onClick={() => setDemoCredentials('merchant', 'm_001', 'password123')}
                  style={{
                    background: (role === 'merchant' && loginForm.userId === 'm_001') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid var(--border-subtle)',
                    color: '#a7f3d0',
                    padding: '4px 10px',
                    borderRadius: 8,
                    fontSize: 11,
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Merchant: <strong>m_001</strong> (The Roast Room)
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={14} color="#818cf8" /> {role === 'customer' ? 'Customer User ID or Email' : 'Merchant User ID or Email'}
              </label>
              <input
                type="text"
                required
                className="input-field"
                placeholder={role === 'customer' ? 'e.g. c_001 or priya@priority-member.in' : 'e.g. m_001 or roast@merchant-portal.in'}
                value={loginForm.userId}
                onChange={e => setLoginForm({ ...loginForm, userId: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={14} color="#f59e0b" /> Password
              </label>
              <input
                type="password"
                required
                className="input-field"
                placeholder="Enter password (default: password123)"
                value={loginForm.password}
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`btn ${role === 'merchant' ? 'btn-emerald' : 'btn-primary'}`}
              style={{ width: '100%', marginTop: 6, padding: '12px 18px', fontSize: 14 }}
            >
              {isLoading ? 'Verifying...' : `Sign In as ${role === 'customer' ? 'Customer' : 'Merchant'}`}
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* MODE 2: REGISTER CUSTOMER */}
        {mode === 'register' && role === 'customer' && (
          <form onSubmit={handleRegister} style={{ padding: 26, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Choose User ID
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. c_priya_blr"
                  value={custRegisterForm.userId}
                  onChange={e => setCustRegisterForm({ ...custRegisterForm, userId: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Priya Sharma"
                  value={custRegisterForm.name}
                  onChange={e => setCustRegisterForm({ ...custRegisterForm, name: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="priya@example.com"
                  value={custRegisterForm.email}
                  onChange={e => setCustRegisterForm({ ...custRegisterForm, email: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  className="input-field"
                  placeholder="Choose password"
                  value={custRegisterForm.password}
                  onChange={e => setCustRegisterForm({ ...custRegisterForm, password: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Locality
                </label>
                <select
                  className="input-field"
                  value={custRegisterForm.locality}
                  onChange={e => setCustRegisterForm({ ...custRegisterForm, locality: e.target.value })}
                >
                  <option value="Koramangala">Koramangala</option>
                  <option value="Indiranagar">Indiranagar</option>
                  <option value="HSR Layout">HSR Layout</option>
                  <option value="MG Road">MG Road</option>
                  <option value="Whitefield">Whitefield</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Wallet Budget (₹)
                </label>
                <input
                  type="number"
                  min="50"
                  max="5000"
                  step="50"
                  className="input-field"
                  value={custRegisterForm.wallet_inr}
                  onChange={e => setCustRegisterForm({ ...custRegisterForm, wallet_inr: parseFloat(e.target.value) || 500 })}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                Current Craving / Intent
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. quick coffee, afternoon snack"
                value={custRegisterForm.intent}
                onChange={e => setCustRegisterForm({ ...custRegisterForm, intent: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Tag size={13} color="#a855f7" /> Declared Preferences
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {PREFERENCE_OPTIONS.map(pref => {
                  const isSelected = custRegisterForm.preferences.includes(pref);
                  return (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => toggleCustPreference(pref)}
                      style={{
                        background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                        border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                        color: isSelected ? '#c7d2fe' : 'var(--text-muted)',
                        padding: '4px 10px',
                        borderRadius: 9999,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {isSelected ? '✓ ' : '+ '}{pref}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 6, padding: '12px 18px' }}
            >
              <Sparkles size={16} />
              {isLoading ? 'Creating Account...' : 'Register Customer & Scan Live ML Radar'}
            </button>
          </form>
        )}

        {/* MODE 2: REGISTER MERCHANT */}
        {mode === 'register' && role === 'merchant' && (
          <form onSubmit={handleRegister} style={{ padding: 26, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Merchant ID
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. m_brew_studio"
                  value={merchRegisterForm.userId}
                  onChange={e => setMerchRegisterForm({ ...merchRegisterForm, userId: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Venue / Store Name
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Artisan Brew Studio"
                  value={merchRegisterForm.name}
                  onChange={e => setMerchRegisterForm({ ...merchRegisterForm, name: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Category
                </label>
                <select
                  className="input-field"
                  value={merchRegisterForm.category}
                  onChange={e => setMerchRegisterForm({ ...merchRegisterForm, category: e.target.value })}
                >
                  <option value="cafe">Cafe & Coffee</option>
                  <option value="bakery">Bakery & Desserts</option>
                  <option value="continental">Continental & Bistro</option>
                  <option value="south_indian">South Indian</option>
                  <option value="fast_food">Fast Casual</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  className="input-field"
                  placeholder="Choose password"
                  value={merchRegisterForm.password}
                  onChange={e => setMerchRegisterForm({ ...merchRegisterForm, password: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Locality
                </label>
                <select
                  className="input-field"
                  value={merchRegisterForm.locality}
                  onChange={e => setMerchRegisterForm({ ...merchRegisterForm, locality: e.target.value })}
                >
                  <option value="Koramangala">Koramangala</option>
                  <option value="Indiranagar">Indiranagar</option>
                  <option value="HSR Layout">HSR Layout</option>
                  <option value="MG Road">MG Road</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Base Item Price (₹)
                </label>
                <input
                  type="number"
                  min="50"
                  max="2000"
                  className="input-field"
                  value={merchRegisterForm.base_price_inr}
                  onChange={e => setMerchRegisterForm({ ...merchRegisterForm, base_price_inr: parseFloat(e.target.value) || 200 })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Seating Capacity
                </label>
                <input
                  type="number"
                  min="5"
                  max="200"
                  className="input-field"
                  value={merchRegisterForm.capacity}
                  onChange={e => setMerchRegisterForm({ ...merchRegisterForm, capacity: parseInt(e.target.value, 10) || 30 })}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Current Occupancy (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="input-field"
                  value={merchRegisterForm.occupancy_pct}
                  onChange={e => setMerchRegisterForm({ ...merchRegisterForm, occupancy_pct: parseFloat(e.target.value) || 25 })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-emerald"
              style={{ width: '100%', marginTop: 6, padding: '12px 18px' }}
            >
              <Store size={16} />
              {isLoading ? 'Creating Merchant...' : 'Register Merchant & Open Dashboard'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
