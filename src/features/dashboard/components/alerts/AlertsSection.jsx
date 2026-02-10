/**
 * AlertsSection Component
 * Displays alerts list and summary grid
 */

import AlertCard from './AlertCard'

const AlertsSection = ({ alerts, onAlertClick }) => {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      {/* Alerts List */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-serif text-base font-medium text-slate-900">Proactive Alerts</h3>
          <p className="text-[10px] text-slate-500">{alerts.length} findings</p>
        </div>
        <div className="p-3 flex flex-col gap-2 max-h-64 overflow-y-auto">
          {alerts.slice(0, 5).map((alert, i) => (
            <AlertCard key={i} alert={alert} onClick={onAlertClick} />
          ))}
        </div>
      </div>

      {/* Alert Summary Grid */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-serif text-base font-medium text-slate-900">Alert Summary</h3>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          {alerts.slice(0, 4).map((a, i) => (
            <div
              key={i}
              onClick={() => onAlertClick?.(a)}
              className="bg-slate-50 p-3 rounded-lg cursor-pointer hover:bg-slate-100"
            >
              <div className={`text-[9px] font-semibold uppercase ${
                a.structured_summary?.severity === 'CRITICAL' ? 'text-red-600' : 'text-amber-600'
              }`}>
                {a.structured_summary?.severity}
              </div>
              <div className="text-xs font-medium text-slate-900 truncate mt-1">
                {a.tool_name?.replace(/_/g, ' ')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default AlertsSection
