/**
 * KPIModal Component
 * Detail modal for KPI card drill-down with chart switching via AI
 */

import { useState, useEffect, useCallback } from 'react'
import { X, Send, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cleanComparisonLabel } from '../../utils/helpers'
import { ChartCanvas } from '../charts'
import AIChartQueryModal from './AIChartQueryModal'

const KPIModal = ({ isOpen, onClose, card, onAskQuestion, onSimpleAnswer }) => {
  const [question, setQuestion] = useState('')
  const [aiModalChart, setAiModalChart] = useState(null)
  const [chartData, setChartData] = useState(null)
  const [chartType, setChartType] = useState(null)
  const [chartConfig, setChartConfig] = useState(null)

  // Sync chart data from card when it changes
  useEffect(() => {
    if (card) {
      setChartData(card.chart_data || [])
      setChartType(card.chart_type_ai || card.chart_type || 'line_chart')
      setChartConfig(card.chart_config || {})
    }
  }, [card])

  const handleSend = () => {
    if (question.trim()) {
      onAskQuestion(question, card)
      setQuestion('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Open AI chart query modal for chart switching
  const handleAIClick = useCallback(() => {
    if (!card) return
    setAiModalChart({
      chart_config: chartConfig,
      chart_type: chartType,
      data: chartData,
      title: card.title,
      description: card.description,
      chart_sql: card.chart_sql
    })
  }, [card, chartConfig, chartType, chartData])

  // Handle chart update from AIChartQueryModal
  const handleChartUpdate = useCallback((updatedChart) => {
    if (updatedChart.data) setChartData(updatedChart.data)
    if (updatedChart.chart_type) setChartType(updatedChart.chart_type)
    if (updatedChart.chart_config) setChartConfig(updatedChart.chart_config)
    setAiModalChart(null)
  }, [])

  const suggestedQuestions = [
    `What's driving ${card?.title}?`,
    `Show ${card?.title} by vendor`,
    `Compare to last month`
  ]

  if (!isOpen || !card) return null

  const summary = card.summary
  const trendDirection = card.status
  const comparisonNum = parseFloat(card.comparison_value) || 0
  const comparisonPct = Math.abs(comparisonNum * 100).toFixed(2)

  // Determine trend styling
  const isPositive = trendDirection === 'up'
  const isNegative = trendDirection === 'down'
  const trendColor = isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-slate-500'
  const trendBg = isPositive ? 'bg-emerald-50' : isNegative ? 'bg-red-50' : 'bg-slate-50'

  // For AP metrics, "up" is bad (more outstanding), "down" is good
  const isAPMetric = card.id?.includes('outstanding') || card.id?.includes('overdue')
  const effectiveTrendColor = isAPMetric
    ? (isPositive ? 'text-red-600' : isNegative ? 'text-emerald-600' : 'text-slate-500')
    : trendColor
  const effectiveTrendBg = isAPMetric
    ? (isPositive ? 'bg-red-50' : isNegative ? 'bg-emerald-50' : 'bg-slate-50')
    : trendBg

  // Alert level color
  const alertColors = {
    success: { border: 'border-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    warning: { border: 'border-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
    critical: { border: 'border-red-500', bg: 'bg-red-50', text: 'text-red-700' }
  }
  const alertStyle = alertColors[summary?.alert_level] || alertColors.warning

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white w-full max-w-[900px] max-h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/60"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-gradient-to-r from-slate-50 to-white">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {summary?.title || `${card.title} Analysis`}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">{card.description}</p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-5">
              <div className="grid md:grid-cols-[1.6fr_1fr] gap-6">
                {/* Left Column */}
                <div className="flex flex-col gap-5">
                  {/* Primary Metric */}
                  <div className="flex items-end gap-4 flex-wrap">
                    <div>
                      <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Current</div>
                      <div className="text-4xl font-bold text-slate-900 tracking-tight leading-none">
                        {card.formatted_value}
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${effectiveTrendBg}`}>
                      {isPositive ? (
                        <TrendingUp size={14} className={effectiveTrendColor} />
                      ) : isNegative ? (
                        <TrendingDown size={14} className={effectiveTrendColor} />
                      ) : (
                        <Minus size={14} className={effectiveTrendColor} />
                      )}
                      <span className={`text-sm font-semibold ${effectiveTrendColor}`}>
                        {comparisonNum > 0 ? '+' : ''}{comparisonPct}%
                      </span>
                      <span className="text-xs text-slate-500">
                        {cleanComparisonLabel(card.comparison_label)}
                      </span>
                    </div>
                  </div>

                  {/* Chart with AI button */}
                  <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-4 relative min-h-[260px]">
                    {chartData && chartData.length > 0 ? (
                      <ChartCanvas
                        chartConfig={chartConfig}
                        data={chartData}
                        chartType={chartType}
                        title=""
                        showAIButton={true}
                        onAIClick={handleAIClick}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-sm text-slate-400">
                        No chart data available
                      </div>
                    )}
                  </div>

                  {/* Analysis Drivers */}
                  {summary?.drivers && summary.drivers.length > 0 && (
                    <div className={`rounded-xl border-l-4 ${alertStyle.border} bg-white border border-slate-100 shadow-sm overflow-hidden`}>
                      <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Analysis</span>
                      </div>
                      <div className="p-4 space-y-3">
                        {summary.drivers.map((d, i) => (
                          <div key={i} className="flex gap-3 items-start">
                            <span className="text-base shrink-0 mt-0.5">{d.icon}</span>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-semibold text-slate-800">{d.title}:</span>
                              {' '}
                              <span className="text-sm text-slate-600 leading-relaxed">{d.description}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Sidebar */}
                <div className="flex flex-col gap-5">
                  {/* Breakdown Metrics */}
                  {summary?.current_state?.secondary_metrics && summary.current_state.secondary_metrics.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Breakdown</div>
                      <div className="grid grid-cols-2 gap-2.5">
                        {summary.current_state.secondary_metrics.map((m, i) => (
                          <div
                            key={i}
                            className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">{m.label}</div>
                            <div className="text-sm font-bold text-slate-900 break-all" title={m.value}>{m.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Questions */}
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Quick Questions</div>
                    <div className="flex flex-col gap-2">
                      {suggestedQuestions.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => onAskQuestion(q, card)}
                          className="text-left text-sm px-4 py-2.5 rounded-xl transition-all hover:shadow-sm border"
                          style={{ color: '#1B5272', backgroundColor: '#EDF7F9', borderColor: '#C8DEDE' }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#D7EBEE'; e.currentTarget.style.borderColor = '#7DAAAD' }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#EDF7F9'; e.currentTarget.style.borderColor = '#C8DEDE' }}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Input */}
          <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/80">
            <div className="flex gap-2 items-center bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm focus-within:border-[#7DAAAD] focus-within:ring-2 focus-within:ring-[#D7EBEE] transition-all">
              <input
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="Ask a follow-up question..."
                className="flex-1 bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400"
                onKeyDown={handleKeyDown}
              />
              <button
                onClick={handleSend}
                disabled={!question.trim()}
                className="text-white rounded-lg p-2 disabled:bg-slate-200 disabled:text-slate-400 transition-colors shrink-0"
                style={{ backgroundColor: '#2F5597' }}
                onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#243F7A' }}
                onMouseLeave={e => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#2F5597' }}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chart Query Modal */}
      <AIChartQueryModal
        isOpen={!!aiModalChart}
        onClose={() => setAiModalChart(null)}
        chartData={aiModalChart}
        onChartUpdate={handleChartUpdate}
        onSimpleAnswer={(result) => {
          setAiModalChart(null)
          onClose()
          if (onSimpleAnswer) onSimpleAnswer(result)
        }}
      />
    </>
  )
}

export default KPIModal
