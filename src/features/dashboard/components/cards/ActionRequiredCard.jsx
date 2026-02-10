/**
 * ActionRequiredCard Component
 * Displays action items requiring executive attention with severity indicators
 */

import { AlertTriangle, Clock, DollarSign, FileWarning, Calendar } from 'lucide-react'

const SEVERITY_COLORS = {
  critical: {
    border: 'border-l-red-500',
    bg: 'bg-red-50',
    text: 'text-red-600',
    badge: 'bg-red-100 text-red-700'
  },
  warning: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700'
  },
  info: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700'
  }
}

const getIcon = (type) => {
  switch (type) {
    case 'discount':
      return DollarSign
    case 'approval':
      return Clock
    case 'concentration':
      return AlertTriangle
    case 'month_end':
      return Calendar
    default:
      return FileWarning
  }
}

const ActionRequiredCard = ({ items = [], criticalCount = 0, onItemClick }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-serif text-base font-medium text-slate-900">Action Required</h3>
          <p className="text-xs text-slate-500">Items requiring executive attention</p>
        </div>
        {criticalCount > 0 && (
          <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
            {criticalCount} Critical
          </span>
        )}
      </div>
      <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
        {items.length > 0 ? (
          items.map((item, idx) => {
            const colors = SEVERITY_COLORS[item.severity] || SEVERITY_COLORS.info
            const Icon = getIcon(item.type)
            return (
              <div
                key={idx}
                className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${colors.border} ${colors.bg} ${onItemClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                onClick={() => onItemClick && onItemClick(item, idx)}
              >
                <div className={`p-1.5 rounded ${colors.badge}`}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-900 truncate">
                      {item.title}
                    </span>
                    <span className="text-sm font-semibold text-slate-900 whitespace-nowrap">
                      {item.value}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{item.subtitle}</p>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-4 text-slate-400 text-sm">
            No action items
          </div>
        )}
      </div>
    </div>
  )
}

export default ActionRequiredCard
