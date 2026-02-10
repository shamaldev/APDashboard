/**
 * OperationalEfficiencyCard Component
 * Displays process performance indicators with trends
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const MetricItem = ({ label, value, subValue, trend, trendValue }) => {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp size={10} className="text-emerald-600" />
    if (trend === 'down') return <TrendingDown size={10} className="text-red-600" />
    return <Minus size={10} className="text-slate-400" />
  }

  const getTrendColor = () => {
    if (trend === 'up') return 'text-emerald-600'
    if (trend === 'down') return 'text-red-600'
    return 'text-slate-500'
  }

  return (
    <div className="bg-slate-50 rounded-lg p-3 text-center">
      <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1 truncate">
        {label}
      </div>
      <div className="font-serif text-xl font-semibold text-slate-900">
        {value}
      </div>
      {(trendValue || subValue) && (
        <div className={`flex items-center justify-center gap-1 text-[10px] mt-1 ${getTrendColor()}`}>
          {trend && getTrendIcon()}
          <span>{trendValue || subValue}</span>
        </div>
      )}
    </div>
  )
}

const OperationalEfficiencyCard = ({ metrics = {} }) => {
  const {
    avgProcessingTime,
    invoicePerFTE,
    eInvoiceRate,
    onTimePayment,
    monthlyVolumeTrend
  } = metrics

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <h3 className="font-serif text-base font-medium text-slate-900">Operational Efficiency</h3>
        <p className="text-xs text-slate-500">Process performance indicators</p>
      </div>
      <div className="p-4">
        {/* Top row - 2 metrics */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <MetricItem
            label="Avg. Processing Time"
            value={avgProcessingTime?.value || '—'}
            trend={avgProcessingTime?.trend}
            trendValue={avgProcessingTime?.trendValue}
          />
          <MetricItem
            label="Invoice per FTE"
            value={invoicePerFTE?.value || '—'}
            trend={invoicePerFTE?.trend}
            trendValue={invoicePerFTE?.trendValue}
          />
        </div>

        {/* Bottom row - 2 metrics */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <MetricItem
            label="E-Invoice Rate"
            value={eInvoiceRate?.value || '—'}
            trend={eInvoiceRate?.trend}
            trendValue={eInvoiceRate?.trendValue}
          />
          <MetricItem
            label="On-Time Payment"
            value={onTimePayment?.value || '—'}
            trend={onTimePayment?.trend}
            trendValue={onTimePayment?.trendValue}
          />
        </div>

        {/* Mini trend line */}
        {monthlyVolumeTrend && monthlyVolumeTrend.length > 0 && (
          <div className="pt-3 border-t border-slate-100">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-2">
              Monthly Invoice Volume Trend
            </div>
            <div className="flex items-end gap-1 h-8">
              {monthlyVolumeTrend.map((val, idx) => {
                const maxVal = Math.max(...monthlyVolumeTrend)
                const height = maxVal > 0 ? (val / maxVal) * 100 : 0
                return (
                  <div
                    key={idx}
                    className="flex-1 bg-amber-400 rounded-t transition-all hover:bg-amber-500"
                    style={{ height: `${Math.max(height, 5)}%` }}
                    title={`${val}`}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OperationalEfficiencyCard
