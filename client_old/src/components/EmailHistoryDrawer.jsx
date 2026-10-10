import React from 'react';
import { X, ExternalLink, Mail, CheckCircle2, AlertCircle, RefreshCw, Send } from 'lucide-react';

export default function EmailHistoryDrawer({
  isOpen,
  onClose,
  history = [],
  queue = [],
  onRefresh,
  onProcessQueue,
  isProcessingQueue
}) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(6px)',
      zIndex: 60,
      display: 'flex',
      justifyContent: 'flex-end',
    }}>
      <div style={{
        background: '#0d1527',
        borderLeft: '1px solid var(--border-subtle)',
        width: '100%',
        maxWidth: 540,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.9)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              padding: 8,
              borderRadius: 8,
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
            }}>
              <Mail size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#ffffff' }}>Nodemailer Outbox & Logs</h3>
              <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: 0 }}>
                {history.length} sent &bull; {queue.length} in dispatch queue
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={onRefresh} className="btn btn-secondary btn-sm" title="Refresh outbox logs">
              <RefreshCw size={14} />
            </button>
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
        </div>

        {/* Action Bar for Queued Items */}
        {queue.length > 0 && (
          <div style={{
            padding: '12px 24px',
            background: 'rgba(99, 102, 241, 0.1)',
            borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 13, color: '#c7d2fe' }}>
              <strong>{queue.length}</strong> items awaiting automated send
            </span>
            <button
              onClick={onProcessQueue}
              disabled={isProcessingQueue}
              className="btn btn-primary btn-sm"
            >
              <Send size={13} className={isProcessingQueue ? 'animate-spin' : ''} />
              {isProcessingQueue ? 'Processing...' : 'Process Queue'}
            </button>
          </div>
        )}

        {/* Content Logs */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {history.length === 0 && queue.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
              <Mail size={36} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
              <p style={{ fontSize: 15, color: 'var(--text-muted)' }}>No emails dispatched yet.</p>
              <p style={{ fontSize: 12 }}>Generate an AI draft from any scenario and click &ldquo;Send Email Now&rdquo;.</p>
            </div>
          ) : (
            <>
              {history.map((item) => (
                <div
                  key={item.id}
                  className="glass-panel"
                  style={{
                    padding: 16,
                    borderLeft: `3px solid ${item.status === 'DELIVERED' ? '#10b981' : '#ef4444'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                      {item.scenario_id ? `[${item.scenario_id}] ` : ''}{new Date(item.sentAt).toLocaleTimeString()}
                    </span>
                    <span className="badge" style={{
                      background: item.status === 'DELIVERED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: item.status === 'DELIVERED' ? '#34d399' : '#f87171',
                    }}>
                      {item.status}
                    </span>
                  </div>

                  <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>
                    {item.subject}
                  </h4>

                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                    To: <strong style={{ color: '#cbd5e1' }}>{item.to}</strong>
                  </div>

                  {item.previewUrl && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                      <a
                        href={item.previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ width: '100%', textDecoration: 'none', justifyContent: 'space-between' }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <ExternalLink size={13} color="#34d399" />
                          View Ethereal Web Email
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Inspect &rarr;</span>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
