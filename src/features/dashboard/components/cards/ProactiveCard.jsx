/**
 * ProactiveCard Component
 * Displays proactive KPI metrics with progress bar
 */

import { CheckCircle, DollarSign, FileText, ArrowRightLeft, Receipt, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { STATUS_COLORS } from '../../utils/constants'
import { getProactiveCardStatus, cleanComparisonLabel } from '../../utils/helpers'

const getProactiveIcon = (title) => {
  const t = (title || '').toLowerCase()
  if (t.includes('stp') || t.includes('straight')) return CheckCircle
  if (t.includes('discount')) return DollarSign
  if (t.includes('first') && t.includes('match')) return ArrowRightLeft
  if (t.includes('e-invoice') || t.includes('einvoice')) return Receipt
  if (t.includes('cost')) return Receipt
  if (t.includes('exception')) return AlertCircle
  return FileText
}

const computeProgress = (card) => {
  const value = card.value || 0
  const titleLower = (card.title || '').toLowerCase()

  // Value is already a 0-1 ratio (percentage metrics like STP, Discount, etc.)
  if (value >= 0 && value <= 1) {
    return Math.min(Math.max(value * 100, 0), 100)
  }

  // Value is absolute (e.g., cost per invoice = 70 rupees)
  // Try to extract a numeric target from card.target
  const targetMatch = (card.target || '').match(/[\d.]+/)
  const targetValue = targetMatch ? parseFloat(targetMatch[0]) : null

  if (targetValue && targetValue > 0) {
    // For cost-type metrics (lower is better), invert: progress = target/value
    if (titleLower.includes('cost')) {
      return Math.min(Math.max((targetValue / value) * 100, 0), 100)
    }
    // For other absolute metrics (higher is better): progress = value/target
    return Math.min(Math.max((value / targetValue) * 100, 0), 100)
  }

  // Fallback: use card status for qualitative progress
  if (card.status === 'success') return 85
  if (card.status === 'warning') return 55
  return 25
}

const ProactiveCard = ({ card, onClick }) => {
  const progress = computeProgress(card)
  const Icon = getProactiveIcon(card.title)
  const kpiStatus = getProactiveCardStatus(card)
  const colors = STATUS_COLORS[kpiStatus]

  const comparison = parseFloat(card.comparison_value) || 0
  const hasComparison = card.comparison_value !== undefined && card.comparison_value !== null && card.comparison_value !== 0
  const isUp = comparison > 0
  const isDown = comparison < 0
  const comparisonPct = Math.abs(comparison * 100).toFixed(1)

  return (
    <div
      onClick={() => onClick && onClick(card)}
      className={`bg-gradient-to-br ${colors.gradient} border ${colors.border} rounded-lg p-4 transition-all duration-200 hover:shadow-md relative overflow-hidden flex flex-col ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}
    >
      {/* Status indicator bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${colors.indicator}`} />

      {/* Header */}
      <div className="flex justify-between items-start mb-2 gap-2 min-h-[44px]">
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

      {/* Comparison badge */}
      {hasComparison && (
        <div className="flex items-center gap-1 mb-0.5">
          <span className={`inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded ${colors.badge}`}>
            {isUp ? <TrendingUp size={8} /> : isDown ? <TrendingDown size={8} /> : <Minus size={8} />}
            {isUp ? '+' : ''}{comparisonPct}%
          </span>
          {card.comparison_label && (
            <span className="text-[8px] text-slate-400 truncate">
              {cleanComparisonLabel(card.comparison_label)}
            </span>
          )}
        </div>
      )}

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
