/**
 * AlertCard Component
 * Displays individual alert with severity styling
 */

import { AlertCircle, AlertTriangle } from 'lucide-react'

const AlertCard = ({ alert, onClick }) => {
  const severity = alert.structured_summary?.severity || 'MEDIUM'
  const isCritical = severity === 'CRITICAL'

  return (
    <div
      onClick={() => onClick?.(alert)}
      className={`flex gap-3 p-3 rounded-lg border-l-4 transition-all hover:shadow-sm cursor-pointer ${
        isCritical ? 'bg-red-50/50 border-red-500' : 'bg-amber-50/50 border-amber-500'
      }`}
    >
      <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
        isCritical ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
      }`}>
        {isCritical ? <AlertCircle size={16} /> : <AlertTriangle size={16} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-900 truncate">
          {alert.structured_summary?.alert_title || alert.tool_name}
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">
          {alert.record_count} records · {severity}
        </div>
      </div>
    </div>
  )
}

export default AlertCard
