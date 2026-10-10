import React, { useState } from 'react';
import { X, Copy, Check, Code } from 'lucide-react';

export default function RawJsonViewerModal({ isOpen, onClose, prediction }) {
  if (!isOpen || !prediction) return null;

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(prediction, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      zIndex: 55,
      padding: 20
    }}>
      <div style={{
        background: '#0d1527',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 18,
        width: '100%',
        maxWidth: 800,
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.9)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              padding: 6,
              borderRadius: 8,
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8'
            }}>
              <Code size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Raw Prediction Payload: {prediction.scenario_id}
              </h3>
              <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                Action: {prediction.action.toUpperCase()} &bull; Grounded Reason: {prediction.reason}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={handleCopy} className="btn btn-secondary btn-sm">
              {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy JSON'}
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
                display: 'flex'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <pre style={{
            background: '#040711',
            padding: 18,
            borderRadius: 12,
            border: '1px solid var(--border-subtle)',
            color: '#38bdf8',
            fontSize: 13,
            lineHeight: 1.5,
            overflowX: 'auto',
            margin: 0
          }}>
            {JSON.stringify(prediction, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
