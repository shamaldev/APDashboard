/**
 * AlertModal Component
 * Detail modal for alert drill-down with data table
 */

import { X, Table } from 'lucide-react'

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

const AlertModal = ({ isOpen, onClose, alert }) => {
  if (!isOpen || !alert) return null

  const s = alert.structured_summary || {}
  const isCritical = s.severity === 'CRITICAL'
  const rawData = alert.raw_data || []
  const recordCount = alert.record_count || rawData.length

  // Get column headers from first row
  const columns = rawData.length > 0 ? Object.keys(rawData[0]) : []

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-4xl max-h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={`p-4 border-b flex justify-between items-start ${isCritical ? 'bg-red-50' : 'bg-amber-50'}`}>
          <div>
            <div className={`text-[10px] font-semibold uppercase ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>
              {s.severity} Alert • {recordCount} records
            </div>
            <h2 className="font-serif text-lg font-semibold text-slate-900 mt-1">
              {s.alert_title}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {/* Key Findings */}
          <div className="mb-4">
            <div className="text-xs font-semibold uppercase text-slate-500 mb-2">Key Findings</div>
            <div className="text-sm text-slate-700 whitespace-pre-line bg-slate-50 p-3 rounded-lg">
              {s.key_findings}
            </div>
          </div>

          {/* Recommended Actions */}
          <div className="mb-4">
            <div className="text-xs font-semibold uppercase text-slate-500 mb-2">Recommended Actions</div>
            <div className="text-sm text-slate-700 whitespace-pre-line bg-emerald-50 p-3 rounded-lg border-l-4 border-emerald-500">
              {s.recommended_actions}
            </div>
          </div>

          {/* Data Table */}
          {rawData.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500 mb-2">
                <Table size={14} />
                <span>Detailed Data ({rawData.length} of {recordCount} records)</span>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 sticky top-0">
                      <tr>
                        {columns.map(col => (
                          <th key={col} className="px-3 py-2 text-left font-semibold text-slate-700 whitespace-nowrap">
                            {formatColumnHeader(col)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rawData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          {columns.map(col => (
                            <td key={col} className="px-3 py-2 text-slate-600 whitespace-nowrap">
                              {formatCellValue(row[col], col)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AlertModal
