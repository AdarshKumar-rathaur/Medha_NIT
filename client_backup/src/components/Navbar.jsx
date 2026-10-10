import React from 'react';
import { 
  Sparkles, 
  Mail, 
  Zap, 
  User, 
  Store, 
  LogOut, 
  LogIn, 
  MapPin,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export default function Navbar({
  portalMode, // 'customer' or 'merchant'
  onSelectPortalMode,
  authUser,
  authRole,
  onOpenAuth,
  onLogout,
  onOpenHistory,
  historyCount = 0,
  health,
}) {
  const isGeminiReady = health?.services?.ai?.configured;

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(9, 13, 22, 0.92)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      padding: '12px 24px',
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 14,
      }}>
        {/* Brand & Mode Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)',
            }}>
              <Zap size={20} color="#ffffff" />
            </div>
            <div>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 18,
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.02em',
              }}>
                MOMENT IQ
              </span>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                Real-Time Hyper-Local Intelligence
              </div>
            </div>
          </div>

          {/* Portal Switcher Tabs */}
          <div style={{
            display: 'flex',
            background: 'rgba(15, 23, 42, 0.8)',
            padding: 3,
            borderRadius: 10,
            border: '1px solid var(--border-subtle)',
          }}>
            <button
              onClick={() => onSelectPortalMode('customer')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 7,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 13,
                background: portalMode === 'customer' ? 'var(--accent-primary)' : 'transparent',
                color: portalMode === 'customer' ? '#ffffff' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
            >
              <User size={14} />
              Customer View
            </button>
            <button
              onClick={() => onSelectPortalMode('merchant')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 7,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 13,
                background: portalMode === 'merchant' ? '#059669' : 'transparent',
                color: portalMode === 'merchant' ? '#ffffff' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
            >
              <Store size={14} />
              Merchant View
            </button>
          </div>
        </div>

        {/* Authenticated User Status & Controls (NO DEMO DROPDOWNS!) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {authUser ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: 'rgba(15, 23, 42, 0.7)',
              padding: '6px 14px',
              borderRadius: 12,
              border: '1px solid var(--border-subtle)',
            }}>
              {/* User Avatar & Name */}
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: authRole === 'merchant'
                  ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                  : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 14,
              }}>
                {authUser.name?.charAt(0) || 'U'}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
                    {authUser.name}
                  </span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 6,
                    background: authRole === 'merchant' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                    color: authRole === 'merchant' ? '#34d399' : '#a5b4fc',
                    border: `1px solid ${authRole === 'merchant' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(99, 102, 241, 0.4)'}`,
                  }}>
                    {authRole === 'merchant' ? 'Merchant' : 'Customer'}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>@{authUser.userId || authUser.id}</span>
                  {authUser.locality && (
                    <span>&bull; {authUser.locality}</span>
                  )}
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={onLogout}
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 8px', fontSize: 12, marginLeft: 4 }}
                title="Log Out & Switch User"
              >
                <LogOut size={13} />
                Sign Out
              </button>
            </div>
          ) : (
            <button onClick={onOpenAuth} className="btn btn-primary btn-sm">
              <LogIn size={14} />
              Sign In / Register
            </button>
          )}

          {/* AI Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(15, 23, 42, 0.7)',
            padding: '6px 12px',
            borderRadius: 9999,
            border: '1px solid var(--border-subtle)',
            fontSize: 11,
          }}>
            <Sparkles size={13} color={isGeminiReady ? '#c084fc' : '#fbbf24'} />
            <span style={{ fontWeight: 600, color: isGeminiReady ? '#c084fc' : '#fbbf24' }}>
              {isGeminiReady ? 'Gemini 2.5 Live' : 'Heuristic Engine'}
            </span>
          </div>

          {/* Outbox Logs */}
          <button onClick={onOpenHistory} className="btn btn-secondary btn-sm">
            <Mail size={13} />
            Outbox
            {historyCount > 0 && (
              <span style={{
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '1px 5px',
                borderRadius: 9999,
                fontSize: 10,
              }}>
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
