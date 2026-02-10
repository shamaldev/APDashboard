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

  return (
    <div
      onClick={() => onClick(card)}
      className={`bg-gradient-to-br ${colors.gradient} border ${colors.border} rounded-xl p-5 relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-0.5`}
    >
      {/* Status indicator bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${colors.indicator}`} />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-[10px] font-semibold tracking-wider uppercase text-slate-500">
          <CreditCard size={12} />
          <span className="truncate">{card.title}</span>
        </div>
        <div
          className={`w-2.5 h-2.5 rounded-full ${colors.indicator}`}
          title={`Status: ${kpiStatus}`}
        />
      </div>

      {/* Value */}
      <div className={`font-serif font-semibold tracking-tight leading-tight mb-2 ${isPrimary ? 'text-3xl' : 'text-2xl'} ${colors.text}`}>
        {card.formatted_value}
      </div>

      {/* Comparison badge */}
      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded ${colors.badge}`}>
        {isUp ? <TrendingUp size={10} /> : isDown ? <TrendingDown size={10} /> : <Minus size={10} />}
        {card.formatted_comparison}
      </span>

      {/* Comparison label */}
      <div className="text-[10px] text-slate-500 mt-2 truncate">
        {cleanComparisonLabel(card.comparison_label)}
      </div>
    </div>
  )
}

export default KPICard
