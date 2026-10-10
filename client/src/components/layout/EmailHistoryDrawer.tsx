import React from 'react'
import { X, ExternalLink, Mail, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export interface EmailRecord {
  id?: string
  message_id?: string
  messageId?: string
  to?: string
  recipient?: string
  customer_name?: string
  subject: string
  merchant?: string
  merchant_name?: string
  preview_url?: string
  previewUrl?: string
  status?: string
  timestamp?: string
  sent_at?: string
  html?: string
}

interface EmailHistoryDrawerProps {
  isOpen: boolean
  onClose: () => void
  history: EmailRecord[]
  onRefresh: () => void
  isLoading?: boolean
}

export const EmailHistoryDrawer: React.FC<EmailHistoryDrawerProps> = ({
  isOpen,
  onClose,
  history = [],
  onRefresh,
  isLoading = false,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Nodemailer Live Outbox</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {history.length} dispatched emails • Ethereal SMTP Mailbox
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white p-2"
              title="Refresh outbox logs"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close outbox"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
          {history.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-slate-800 text-sm">No Emails Sent Yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Trigger an offer evaluation in the customer portal or send a campaign preview from the merchant workspace.
              </p>
            </div>
          ) : (
            history.map((record, idx) => {
              const previewUrl = record.preview_url || record.previewUrl
              const timestamp = record.timestamp || record.sent_at
              const recipient = record.to || record.recipient || 'priya@priority-member.in'

              return (
                <div
                  key={record.id || record.message_id || idx}
                  className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                      <span className="text-xs font-bold text-slate-900 line-clamp-1">
                        {record.subject || 'Personalized Offer Dispatch'}
                      </span>
                    </div>
                    <Badge variant="teal" className="text-[10px] shrink-0">
                      DELIVERED
                    </Badge>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Recipient:</span>
                      <span className="font-mono font-medium text-slate-800">{recipient}</span>
                    </div>
                    {record.merchant_name && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Merchant:</span>
                        <span className="font-medium text-slate-800">{record.merchant_name}</span>
                      </div>
                    )}
                    {timestamp && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Timestamp:</span>
                        <span className="text-slate-700">{new Date(timestamp).toLocaleTimeString()}</span>
                      </div>
                    )}
                  </div>

                  {previewUrl && (
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 pt-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Full HTML Email Preview in Browser
                    </a>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-white border-t border-slate-200 text-center text-xs text-slate-500">
          Powered by Nodemailer SMTP & Google Gemini AI Engine
        </div>
      </div>
    </div>
  )
}
