/**
 * EmailModal Component
 * Sends alert details via email using the backend send-email endpoint
 */

import { useState } from 'react'
import { X, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { sendEmail } from '@shared/services/api.service'

const formatCellValue = (value, key) => {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'number') {
    if (key.includes('amount') || key.includes('inr') || key.includes('discount')) {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
    }
    if (key.includes('pct') || key.includes('percent')) {
      return `${value.toFixed(1)}%`
    }
    return value.toLocaleString()
  }
  return String(value)
}

const formatColumnHeader = (key) => {
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const buildEmailBody = (alert) => {
  const s = alert.structured_summary || {}
  const rawData = alert.raw_data || []
  const recordCount = alert.record_count || rawData.length
  const columns = rawData.length > 0 ? Object.keys(rawData[0]) : []

  let html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto;">
      <div style="background: ${s.severity === 'CRITICAL' ? '#fef2f2' : '#fffbeb'}; padding: 16px 20px; border-radius: 8px 8px 0 0; border-bottom: 2px solid ${s.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b'};">
        <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: ${s.severity === 'CRITICAL' ? '#dc2626' : '#d97706'};">
          ${s.severity || 'WARNING'} Alert &bull; ${recordCount} records
        </span>
        <h2 style="margin: 6px 0 0; font-size: 18px; color: #1e293b;">${s.alert_title || 'Alert'}</h2>
      </div>

      <div style="padding: 20px; background: #fff; border: 1px solid #e2e8f0; border-top: none;">
        <div style="margin-bottom: 16px;">
          <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 8px;">Key Findings</div>
          <div style="font-size: 14px; color: #334155; background: #f8fafc; padding: 12px; border-radius: 6px; white-space: pre-line;">${s.key_findings || 'N/A'}</div>
        </div>

        <div style="margin-bottom: 16px;">
          <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 8px;">Recommended Actions</div>
          <div style="font-size: 14px; color: #334155; background: #ecfdf5; padding: 12px; border-radius: 6px; border-left: 4px solid #10b981; white-space: pre-line;">${s.recommended_actions || 'N/A'}</div>
        </div>`

  if (rawData.length > 0) {
    html += `
        <div style="margin-bottom: 16px;">
          <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 8px;">Detailed Data (${rawData.length} of ${recordCount} records)</div>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <thead>
                <tr style="background: #f1f5f9;">
                  ${columns.map(col => `<th style="padding: 8px 12px; text-align: left; font-weight: 600; color: #334155; white-space: nowrap; border-bottom: 2px solid #e2e8f0;">${formatColumnHeader(col)}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${rawData.map((row, idx) => `
                <tr style="background: ${idx % 2 === 0 ? '#fff' : '#f8fafc'};">
                  ${columns.map(col => `<td style="padding: 6px 12px; color: #475569; white-space: nowrap; border-bottom: 1px solid #f1f5f9;">${formatCellValue(row[col], col)}</td>`).join('')}
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>`
  }

  html += `
      </div>
      <div style="padding: 12px 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; font-size: 11px; color: #94a3b8;">
        Sent from AP Dashboard &bull; ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>`

  return html
}

const EmailModal = ({ isOpen, onClose, alert }) => {
  const [toEmail, setToEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState(null) // 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('')

  // Reset state when alert changes
  const s = alert?.structured_summary || {}
  const defaultSubject = `[${s.severity || 'ALERT'}] ${s.alert_title || 'Dashboard Alert'} - ${alert?.record_count || 0} records`

  if (!isOpen || !alert) return null

  const handleSend = async () => {
    if (!toEmail.trim()) return

    setSending(true)
    setStatus(null)
    setErrorMsg('')

    try {
      await sendEmail({
        to_email: toEmail.trim(),
        subject: subject.trim() || defaultSubject,
        body: buildEmailBody(alert),
      })
      setStatus('success')
      setTimeout(() => {
        onClose()
        setToEmail('')
        setSubject('')
        setStatus(null)
      }, 1500)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message || 'Failed to send email')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="font-serif text-base font-semibold text-slate-900">Send Alert via Email</h2>
            <p className="text-xs text-slate-500 mt-0.5">Share this alert with your team</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          {/* To */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Recipient Email</label>
            <input
              type="email"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="recipient@company.com"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              disabled={sending}
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={defaultSubject}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              disabled={sending}
            />
          </div>

          {/* Preview */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Content Preview</label>
            <div className={`p-3 rounded-lg border text-xs text-slate-600 max-h-32 overflow-y-auto ${s.severity === 'CRITICAL' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="font-semibold text-slate-900 mb-1">{s.alert_title}</div>
              <div className="text-slate-500 mb-1">{s.severity} &bull; {alert.record_count || 0} records</div>
              <div className="whitespace-pre-line line-clamp-3">{s.key_findings}</div>
              {(alert.raw_data || []).length > 0 && (
                <div className="mt-1 text-slate-400">+ Data table with {alert.raw_data.length} rows</div>
              )}
            </div>
          </div>

          {/* Status Messages */}
          {status === 'success' && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg">
              <CheckCircle size={16} />
              Email sent successfully!
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            disabled={sending}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!toEmail.trim() || sending || status === 'success'}
            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {sending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send size={14} />
                Send Email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EmailModal
