import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  Eye, 
  Code2, 
  FileText, 
  Info, 
  CheckCircle, 
  ExternalLink, 
  Clock, 
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';

export default function EmailComposerModal({
  isOpen,
  onClose,
  prediction,
  draftData,
  onRegenerateDraft,
  onSendEmail,
  isSending,
  isRegenerating,
  sendResult
}) {
  if (!isOpen || !prediction) return null;

  const [activeTab, setActiveTab] = useState('preview'); // 'preview', 'raw-prediction', 'html-source', 'plain-text', 'ai-notes'
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  // Initialize form state when draftData arrives
  useEffect(() => {
    if (draftData?.draft) {
      setSubject(draftData.draft.subject || '');
    }
    if (prediction?.customer?.email) {
      setRecipientEmail(prediction.customer.email);
    }
  }, [draftData, prediction]);

  const draft = draftData?.draft || {};

  const handleCopyHtml = () => {
    if (draft.htmlBody) {
      navigator.clipboard.writeText(draft.htmlBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSend = () => {
    onSendEmail({
      to: recipientEmail,
      subject: subject || draft.subject,
      html: draft.htmlBody,
      text: draft.plainText,
      scenario_id: prediction.scenario_id,
      metadata: {
        customer_name: prediction.customer?.name,
        merchant_name: prediction.merchant?.name,
        profit_estimate_inr: prediction.profit_estimate_inr,
      }
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
      zIndex: 50,
      padding: 20
    }}>
      <div style={{
        background: '#0d1527',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 20,
        width: '100%',
        maxWidth: 1100,
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.9)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              padding: 8,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              color: '#ffffff'
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#ffffff' }}>
                  Gemini AI Email Generator & Dispatcher
                </h2>
                <span className={`badge ${prediction.action === 'send' ? 'badge-send' : 'badge-skip'}`}>
                  {prediction.action.toUpperCase()}
                </span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                  [{prediction.scenario_id}]
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                Review ML decision payload, inspect generated draft, and dispatch via Nodemailer
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
              display: 'flex'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* AI Warning or Status Banner */}
        {draft.ai_warning && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            borderBottom: '1px solid rgba(245, 158, 11, 0.25)',
            padding: '8px 24px',
            fontSize: 12,
            color: '#fbbf24',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <Info size={14} />
            <span>{draft.ai_warning}</span>
          </div>
        )}

        {/* Modal Navigation Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '0 24px',
          gap: 8
        }}>
          <button
            onClick={() => setActiveTab('preview')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'preview' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'preview' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Eye size={15} />
            Email Preview (Rendered)
          </button>

          <button
            onClick={() => setActiveTab('raw-prediction')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'raw-prediction' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'raw-prediction' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Code2 size={15} />
            Raw Model Prediction JSON
          </button>

          <button
            onClick={() => setActiveTab('html-source')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'html-source' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'html-source' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Code2 size={15} />
            HTML Source
          </button>

          <button
            onClick={() => setActiveTab('plain-text')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'plain-text' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'plain-text' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <FileText size={15} />
            Plain Text
          </button>

          <button
            onClick={() => setActiveTab('ai-notes')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'ai-notes' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'ai-notes' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Info size={15} />
            AI Rationale & Persona
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {/* Tab 1: Rendered HTML Email Preview */}
          {activeTab === 'preview' && (
            <div>
              {/* Email Envelope Header */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                padding: '14px 18px',
                marginBottom: 20
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Subject:</span>
                  <input
                    type="text"
                    className="input-field"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email Subject Line"
                    style={{ fontSize: 13, padding: '6px 10px' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>To:</span>
                  <input
                    type="email"
                    className="input-field"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="Recipient Email"
                    style={{ fontSize: 13, padding: '6px 10px' }}
                  />
                </div>
                {draft.previewText && (
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8, fontSize: 12 }}>
                    <span style={{ color: 'var(--text-dim)' }}>Preheader:</span>
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>{draft.previewText}</span>
                  </div>
                )}
              </div>

              {/* Rendered Email Card */}
              <div style={{
                background: '#040711',
                padding: 24,
                borderRadius: 16,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)'
              }}>
                {draft.htmlBody ? (
                  <div dangerouslySetInnerHTML={{ __html: draft.htmlBody }} />
                ) : (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    <p>Generating email draft...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Raw Model Prediction JSON */}
          {activeTab === 'raw-prediction' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Direct payload from Python ML Optimization Engine:
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(prediction, null, 2));
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                  {copied ? 'Copied' : 'Copy JSON'}
                </button>
              </div>
              <pre style={{
                background: '#050811',
                padding: 20,
                borderRadius: 12,
                border: '1px solid var(--border-subtle)',
                color: '#38bdf8',
                fontSize: 13,
                lineHeight: 1.5,
                overflowX: 'auto',
                maxHeight: 500
              }}>
                {JSON.stringify(prediction, null, 2)}
              </pre>
            </div>
          )}

          {/* Tab 3: HTML Source Code */}
          {activeTab === 'html-source' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Inline CSS HTML Template generated by Gemini:
                </span>
                <button onClick={handleCopyHtml} className="btn btn-secondary btn-sm">
                  {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                  {copied ? 'Copied' : 'Copy HTML'}
                </button>
              </div>
              <pre style={{
                background: '#050811',
                padding: 20,
                borderRadius: 12,
                border: '1px solid var(--border-subtle)',
                color: '#a7f3d0',
                fontSize: 12,
                lineHeight: 1.5,
                overflowX: 'auto',
                maxHeight: 500,
                whiteSpace: 'pre-wrap'
              }}>
                {draft.htmlBody || 'No HTML body available.'}
              </pre>
            </div>
          )}

          {/* Tab 4: Plain Text Fallback */}
          {activeTab === 'plain-text' && (
            <div>
              <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-muted)' }}>
                Plain-text fallback for terminal, smartwatches, and accessibility clients:
              </div>
              <pre style={{
                background: '#050811',
                padding: 20,
                borderRadius: 12,
                border: '1px solid var(--border-subtle)',
                color: '#f8fafc',
                fontSize: 13,
                lineHeight: 1.6,
                overflowX: 'auto',
                whiteSpace: 'pre-wrap'
              }}>
                {draft.plainText || 'No plain text available.'}
              </pre>
            </div>
          )}

          {/* Tab 5: AI Rationale & Persona */}
          {activeTab === 'ai-notes' && (
            <div style={{ display: 'grid', gap: 16 }}>
              <div className="glass-panel" style={{ padding: 18 }}>
                <h4 style={{ fontSize: 14, color: '#c084fc', marginBottom: 6 }}>Target Audience Persona</h4>
                <p style={{ color: '#f1f5f9', fontSize: 14 }}>{draft.targetAudiencePersona || 'N/A'}</p>
              </div>
              <div className="glass-panel" style={{ padding: 18 }}>
                <h4 style={{ fontSize: 14, color: '#38bdf8', marginBottom: 6 }}>Copywriting Tone</h4>
                <p style={{ color: '#f1f5f9', fontSize: 14 }}>{draft.tone || 'N/A'}</p>
              </div>
              <div className="glass-panel" style={{ padding: 18 }}>
                <h4 style={{ fontSize: 14, color: '#34d399', marginBottom: 6 }}>Feature Grounding & Rationale</h4>
                <p style={{ color: '#f1f5f9', fontSize: 14 }}>{draft.rationale || 'N/A'}</p>
              </div>
              <div className="glass-panel" style={{ padding: 18 }}>
                <h4 style={{ fontSize: 14, color: '#fbbf24', marginBottom: 6 }}>Model Provenance</h4>
                <p style={{ color: '#f1f5f9', fontSize: 13 }}>
                  Generated using: <strong>{draft.model_used}</strong> &bull; Live Gemini: {draft.is_live_gemini ? 'Yes' : 'No'} &bull; Timestamp: {draft.generated_at}
                </p>
              </div>
            </div>
          )}

          {/* Custom Instruction Box for AI Re-generation */}
          <div style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 12,
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#c084fc', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} /> Custom Gemini Instructions (Optional)
              </span>
              <button
                onClick={() => onRegenerateDraft(prediction, customPrompt)}
                disabled={isRegenerating}
                className="btn btn-ai btn-sm"
              >
                <RefreshCw size={13} className={isRegenerating ? 'animate-spin' : ''} />
                {isRegenerating ? 'Regenerating...' : 'Regenerate Draft with Gemini'}
              </button>
            </div>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. 'Make it punchier with a festival discount note' or 'Write in formal corporate tone'..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              style={{ fontSize: 13 }}
            />
          </div>

          {/* Send Success Toast / Ethereal URL preview */}
          {sendResult && (
            <div style={{
              marginTop: 20,
              padding: 16,
              borderRadius: 12,
              background: sendResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${sendResult.success ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle size={20} color={sendResult.success ? '#34d399' : '#f87171'} />
                <div>
                  <div style={{ fontWeight: 700, color: '#ffffff', fontSize: 14 }}>
                    {sendResult.message || 'Email Dispatched via Nodemailer'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Message ID: {sendResult.data?.id} &bull; Delivered to: {sendResult.data?.to}
                  </div>
                </div>
              </div>

              {sendResult.data?.previewUrl && (
                <a
                  href={sendResult.data.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-emerald btn-sm"
                  style={{ textDecoration: 'none' }}
                >
                  <ExternalLink size={14} />
                  Open Live Ethereal Preview &rarr;
                </a>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.9)',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            Recipient: <strong style={{ color: '#ffffff' }}>{recipientEmail}</strong>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onClose} className="btn btn-secondary">
              Close
            </button>
            <button
              onClick={handleSend}
              disabled={isSending || !draft.htmlBody}
              className="btn btn-emerald"
            >
              <Send size={15} className={isSending ? 'animate-spin' : ''} />
              {isSending ? 'Dispatching via Nodemailer...' : 'Send Email Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
