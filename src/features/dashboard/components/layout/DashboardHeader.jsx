/**
 * DashboardHeader Component
 * CrescentOne branded top header — logo, live indicator, view toggle, actions
 */

import { RefreshCw, LogOut } from 'lucide-react'

/* ─── Brand tokens ─────────────────────────────────────────────── */
const CO = {
  primary:    '#1B5272',
  secondary:  '#7DAAAD',
  activeBg:   '#1B5272',
  toggleBg:   '#E4F0F3',
  border:     '#D0E8EC',
}

const DashboardHeader = ({
  view,
  onViewChange,
  onRefresh,
  onLogout,
  criticalAlertsCount,
  date,
  time,
}) => {
  return (
    <header
      className="flex flex-wrap justify-between items-center mb-5 pb-4 gap-4"
      style={{ borderBottom: `1px solid ${CO.border}` }}
    >
      {/* ── Left: Logo + Title ──────────────────────────────────── */}
      <div className="flex items-center gap-4 min-w-0">
        {/* Real CrescentOne logo image */}
        <img
          src="/crescent-logo.jpg"
          alt="CrescentOne"
          style={{ height: 36, objectFit: 'contain', flexShrink: 0, mixBlendMode: 'multiply' }}
        />

        <div
          className="border-l pl-4 min-w-0"
          style={{ borderColor: CO.border }}
        >
          <div
            className="flex items-center gap-2 mb-0.5"
            style={{
              fontSize: 10,
              fontFamily: 'monospace',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: CO.secondary,
            }}
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: CO.secondary, flexShrink: 0 }}
            />
            Live Dashboard
            {criticalAlertsCount > 0 && (
              <span
                className="text-white px-1.5 py-0.5 rounded-full"
                style={{ fontSize: 9, backgroundColor: '#DC2626' }}
              >
                {criticalAlertsCount} Critical
              </span>
            )}
          </div>

          <h1
            className="font-semibold truncate"
            style={{ fontSize: 18, color: CO.primary, lineHeight: 1.25 }}
          >
            Accounts Payable Command Center
          </h1>
          <p style={{ fontSize: 11, color: CO.secondary, marginTop: 1 }}>
            Enterprise Financial Overview
          </p>
        </div>
      </div>

      {/* ── Right: Date / Controls ──────────────────────────────── */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: 11,
            color: '#6B9BAA',
          }}
        >
          {date} · {time}
        </div>

        <div className="flex gap-2 items-center flex-wrap justify-end">
          {/* View Toggle */}
          <div
            className="flex p-0.5 rounded-lg gap-0.5"
            style={{ backgroundColor: CO.toggleBg }}
          >
            {['dashboard', 'ai-agent'].map(v => (
              <button
                key={v}
                onClick={() => onViewChange(v)}
                className="px-3 py-1 rounded text-xs font-semibold transition-all"
                style={
                  view === v
                    ? { backgroundColor: CO.activeBg, color: '#ffffff' }
                    : { color: CO.primary }
                }
              >
                {v === 'dashboard' ? 'Dashboard' : 'AI Agent'}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            title="Refresh data"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-white text-xs font-medium transition-colors hover:bg-slate-50"
            style={{ border: `1px solid ${CO.border}`, color: '#6B9BAA' }}
          >
            <RefreshCw size={12} />
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            title="Log out"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-white text-xs font-medium transition-colors hover:bg-red-50"
            style={{ border: '1px solid #FCA5A5', color: '#EF4444' }}
          >
            <LogOut size={12} />
          </button>
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader
