/**
 * KPICard Component
 * Displays key performance indicator with status coloring
 */

import { CreditCard, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { STATUS_COLORS } from '../../utils/constants'
import { getKPIStatus, cleanComparisonLabel } from '../../utils/helpers'

const KPICard = ({ card, onClick }) => {
  const isPrimary = card.id === 'total_ap_outstanding'
  const kpiStatus = getKPIStatus(card)
  const colors = STATUS_COLORS[kpiStatus]
  const comparison = parseFloat(card.comparison_value) || 0
  const isUp = card.status === 'up' || comparison > 0
  const isDown = card.status === 'down' || comparison < 0
  const comparisonPct = Math.abs(comparison * 100).toFixed(1)
  const comparisonDisplay = `${isUp ? '\u2191' : isDown ? '\u2193' : ''} ${isUp ? '+' : ''}${comparisonPct}%`

  return (
    <div
      onClick={() => onClick(card)}
      className={`bg-gradient-to-br ${colors.gradient} border ${colors.border} rounded-xl p-5 relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 flex flex-col`}
    >
      {/* Status indicator bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${colors.indicator}`} />

      {/* Header */}
      <div className="flex items-start justify-between mb-3 min-h-[28px]">
        <div className="flex items-center gap-2 text-[10px] font-semibold tracking-wider uppercase text-slate-500">
          <CreditCard size={12} className="shrink-0" />
          <span>{card.title}</span>
        </div>
        <div
          className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors.indicator}`}
          title={`Status: ${kpiStatus}`}
        />
      </div>

      {/* Value */}
      <div className={`font-semibold tracking-tight leading-tight mb-2 text-2xl ${colors.text}`}>
        {card.formatted_value}
      </div>

      {/* Comparison badge */}
      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded ${colors.badge}`}>
        {isUp ? <TrendingUp size={10} /> : isDown ? <TrendingDown size={10} /> : <Minus size={10} />}
        {comparisonDisplay}
      </span>

      {/* Comparison label */}
      <div className="text-[10px] text-slate-500 mt-2 truncate">
        {cleanComparisonLabel(card.comparison_label)}
      </div>

      {/* Detail context */}
      {card.detail_line_1 && (
        <div className="text-[9px] text-slate-400 mt-1 truncate" title={card.detail_line_1}>
          {card.detail_line_1}
        </div>
      )}
    </div>
  )
}

export default KPICard
