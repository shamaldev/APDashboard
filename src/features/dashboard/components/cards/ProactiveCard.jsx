/**
 * ProactiveCard Component
 * Displays proactive KPI metrics with progress bar
 */

import { CheckCircle, DollarSign, FileText } from 'lucide-react'
import { STATUS_COLORS } from '../../utils/constants'
import { getProactiveCardStatus } from '../../utils/helpers'

const ProactiveCard = ({ card }) => {
  const progress = Math.min(Math.max((card.value || 0) * 100, 0), 100)
  const Icon = card.title.includes('STP') ? CheckCircle : card.title.includes('Discount') ? DollarSign : FileText
  const kpiStatus = getProactiveCardStatus(card)
  const colors = STATUS_COLORS[kpiStatus]

  return (
    <div className={`bg-gradient-to-br ${colors.gradient} border ${colors.border} rounded-lg p-4 transition-all duration-200 hover:shadow-md relative overflow-hidden`}>
      {/* Status indicator bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${colors.indicator}`} />

      {/* Header */}
      <div className="flex justify-between items-start mb-2 gap-2">
        <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${colors.badge}`}>
          <Icon size={14} />
        </div>
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.indicator}`} />
          <div className="text-[9px] font-semibold tracking-wider uppercase text-slate-500 text-right leading-tight" title={card.title}>
            {card.title}
          </div>
        </div>
      </div>

      {/* Value */}
      <div className={`font-serif text-xl font-semibold mb-0.5 ${colors.text}`}>
        {card.formatted_value}
      </div>

      {/* Detail */}
      <div className="text-[10px] text-slate-500 truncate">
        {card.target || card.detail_line_1}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-200 rounded mt-2 overflow-hidden">
        <div
          className={`h-full rounded ${colors.indicator} transition-all duration-500`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export default ProactiveCard
