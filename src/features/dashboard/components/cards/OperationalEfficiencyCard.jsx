/**
 * OperationalEfficiencyCard Component
 * Displays process performance indicators with trends
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const MetricItem = ({ label, value, trend, trendValue }) => {
  const isUp = trend === 'up'
  const isDown = trend === 'down'
  const trendColor = isUp ? 'text-emerald-600' : isDown ? 'text-red-500' : 'text-slate-400'
  const trendBg = isUp ? 'bg-emerald-50' : isDown ? 'bg-red-50' : 'bg-slate-50'
  const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus

  return (
    <div className="bg-white border border-slate-100 rounded-lg p-3 text-center hover:border-slate-200 transition-colors">
      <div className="text-[10px] uppercase tracking-wider mb-1.5 font-semibold text-slate-400">
        {label}
      </div>
      <div className="text-xl font-bold text-slate-800 leading-tight">
        {value}
      </div>
      {(trendValue) && (
        <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium ${trendBg} ${trendColor}`}>
          <TrendIcon size={10} />
          <span>{trendValue}</span>
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
    monthlyVolumeTrend,
  } = metrics

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <h3 className="font-serif text-base font-medium text-slate-900">
          Operational Efficiency
        </h3>
        <p className="text-xs text-slate-500">
          Process performance indicators
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-2.5 mb-3">
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

        <div className="grid grid-cols-2 gap-2.5 mb-3">
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

        {/* Monthly Trend Bars */}
        {monthlyVolumeTrend && monthlyVolumeTrend.length > 0 && (
          <div className="pt-3 border-t border-slate-100">
            <div className="text-[10px] uppercase tracking-wider mb-2.5 font-semibold text-slate-400">
              Monthly Invoice Volume Trend
            </div>
            <div className="flex items-end gap-1 h-12">
              {monthlyVolumeTrend.map((val, idx) => {
                const maxVal = Math.max(...monthlyVolumeTrend)
                const height = maxVal > 0 ? (val / maxVal) * 100 : 0
                const total = monthlyVolumeTrend.length
                const ratio = total > 1 ? idx / (total - 1) : 1
                const r = Math.round(0xC8 + (0x1B - 0xC8) * ratio)
                const g = Math.round(0xDE + (0x52 - 0xDE) * ratio)
                const b = Math.round(0xDE + (0x72 - 0xDE) * ratio)
                const barBg = `rgb(${r},${g},${b})`

                return (
                  <div
                    key={idx}
                    className="flex-1 rounded-sm transition-all cursor-default hover:opacity-80"
                    style={{
                      height: `${Math.max(height, 8)}%`,
                      backgroundColor: barBg,
                    }}
                    title={`${val.toFixed(2)}B`}
                  />
                )
              })}
            </div>

            <div className="flex justify-between mt-1.5">
              <span className="text-[9px] font-medium text-slate-400">6 mo ago</span>
              <span className="text-[9px] font-medium text-slate-400">Latest</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OperationalEfficiencyCard
