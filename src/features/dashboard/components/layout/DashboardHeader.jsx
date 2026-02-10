/**
 * DashboardHeader Component
 * Top header with title, view toggle, and actions
 */

import { RefreshCw, LogOut } from 'lucide-react'

const DashboardHeader = ({
  view,
  onViewChange,
  onRefresh,
  onLogout,
  criticalAlertsCount,
  date,
  time
}) => {
  return (
    <header className="flex flex-wrap justify-between items-start mb-4 pb-4 border-b border-slate-200 gap-4">
      <div>
        <div className="flex items-center gap-2 text-[10px] font-mono font-medium tracking-widest uppercase text-amber-700 mb-1">
          <span className="w-2 h-2 bg-amber-600 rounded-full animate-pulse" />
          Live Dashboard
          {criticalAlertsCount > 0 && (
            <span className="bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[9px]">
              {criticalAlertsCount} Critical
            </span>
          )}
        </div>
        <h1 className="font-serif text-2xl font-medium text-slate-900">
          Accounts Payable Command Center
        </h1>
        <p className="text-xs text-slate-500">Enterprise Financial Overview</p>
      </div>

      <div className="flex flex-col items-end gap-2">
        <div className="font-mono text-xs text-slate-500">{date} · {time}</div>

        <div className="flex gap-2 items-center flex-wrap">
          {/* View Toggle */}
          <div className="flex bg-slate-200 p-0.5 rounded-lg gap-0.5">
            <button
              onClick={() => onViewChange('dashboard')}
              className={`px-3 py-1 rounded text-xs font-medium ${
                view === 'dashboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onViewChange('ai-agent')}
              className={`px-3 py-1 rounded text-xs font-medium ${
                view === 'ai-agent' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              AI Agent
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="flex items-center gap-1 px-2 py-1 border border-slate-200 rounded bg-white text-slate-500 text-xs hover:bg-slate-50"
          >
            <RefreshCw size={12} />
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1 px-2 py-1 border border-red-200 rounded bg-white text-red-500 text-xs hover:bg-red-50"
          >
            <LogOut size={12} />
          </button>
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader
