/**
 * ChatMessage Component
 * Renders individual chat message with charts, follow-ups, and rich formatting
 * Supports: greeting, out_of_scope, simple, complex_why query types
 */

import { useState } from 'react'
import { AlertTriangle, Database, ChevronDown, ChevronUp, Volume2, VolumeX, Pause, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import { ChartCanvas } from '../charts'
import AIChartQueryModal from '../modals/AIChartQueryModal'

const ChatMessage = ({
  message,
  messageIndex,
  activeCard,
  onKPICardChat,
  onGeneralChat,
  isChatLoading,
  onSpeak,
  isSpeaking,
  isPaused,
  currentSpeakingId
}) => {
  const isUser = message.sender === 'user'
  const [showSql, setShowSql] = useState(false)
  const [aiModalChart, setAiModalChart] = useState(null)
  const [charts, setCharts] = useState(message.charts || [])

  // Check if this message is currently being spoken
  const isThisMessageSpeaking = currentSpeakingId === messageIndex && isSpeaking

  const handleFollowUp = (followUp) => {
    if (activeCard) {
      onKPICardChat(followUp, activeCard)
    } else {
      onGeneralChat(followUp)
    }
  }

  const handleAIClick = (chart) => {
    setAiModalChart(chart)
  }

  const handleChartUpdate = (updatedChart) => {
    // Update the chart in the local state
    const updatedCharts = charts.map(c =>
      c === aiModalChart ? updatedChart : c
    )
    setCharts(updatedCharts)

    // Also update in message if possible (for re-renders)
    if (message.charts) {
      message.charts = updatedCharts
    }
  }

  // Format text with markdown-like bold syntax
  const formatText = (text) => {
    if (!text) return null

    // Split by **text** pattern for bold
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>
      }
      // Handle italic with single *
      if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
        return <em key={i} className="text-slate-500">{part.slice(1, -1)}</em>
      }
      return part
    })
  }

  return (
    <div className={`flex flex-col gap-1 max-w-[85%] ${isUser ? 'self-end items-end' : 'self-start'}`}>
      {/* Card context indicator */}
      {message.cardTitle && isUser && (
        <div className="text-[9px] text-slate-400 mb-0.5">Re: {message.cardTitle}</div>
      )}

      {/* Message bubble */}
      <div className={`px-4 py-3 rounded-2xl text-sm ${
        isUser
          ? 'bg-amber-600 text-white rounded-br-sm'
          : 'bg-slate-100 text-slate-900 rounded-bl-sm'
      }`}>
        {/* Query type badge for AI messages */}
        {!isUser && message.queryType && message.queryType !== 'simple' && (
          <div className="mb-2">
            <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full ${
              message.queryType === 'greeting' ? 'bg-blue-100 text-blue-700' :
              message.queryType === 'out_of_scope' ? 'bg-slate-200 text-slate-600' :
              message.queryType === 'complex_why' ? 'bg-purple-100 text-purple-700' :
              'bg-slate-200 text-slate-600'
            }`}>
              {message.queryType === 'greeting' && 'Welcome'}
              {message.queryType === 'out_of_scope' && 'Info'}
              {message.queryType === 'complex_why' && 'Deep Analysis'}
            </span>
          </div>
        )}

        {/* Diagnostic result - structured professional card */}
        {!isUser && message.diagnosticResult ? (() => {
          const diag = message.diagnosticResult
          const assessmentStyles = {
            critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: <AlertCircle size={14} />, label: 'Critical' },
            warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: <AlertTriangle size={14} />, label: 'Warning' },
            ok: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: <CheckCircle size={14} />, label: 'Healthy' }
          }
          const style = assessmentStyles[diag.assessment] || assessmentStyles.warning
          return (
            <div className="space-y-3">
              {/* Headline */}
              <div className="text-[13px] font-bold text-slate-900 leading-snug">
                {diag.headline}
              </div>

              {/* Assessment badge */}
              <div className={`flex items-start gap-2 p-2.5 rounded-lg border ${style.bg} ${style.border}`}>
                <span className={`mt-0.5 ${style.text}`}>{style.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className={`text-[10px] font-bold uppercase ${style.text}`}>{style.label}</span>
                  <div className="text-[11px] text-slate-700 mt-0.5 leading-relaxed">{diag.assessment_text}</div>
                </div>
              </div>

              {/* Key Metrics */}
              {diag.key_metrics && diag.key_metrics.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {diag.key_metrics.map((m, i) => (
                    <div key={i} className="bg-white rounded-lg p-2 border border-slate-200 text-center">
                      <div className="text-[9px] text-slate-500 uppercase font-medium">{m.label}</div>
                      <div className="text-[13px] font-bold text-slate-900 mt-0.5">{m.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Narrative body */}
              <div className="text-[11.5px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                {message.text}
              </div>

              {/* Root Causes */}
              {diag.root_causes && diag.root_causes.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold uppercase text-slate-500 mb-1.5">Root Causes</div>
                  <div className="space-y-1.5">
                    {diag.root_causes.map((rc, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white rounded-lg p-2 border border-slate-200">
                        <div className="shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${
                            rc.classification === 'Strategic' ? 'bg-blue-500' : 'bg-amber-500'
                          }`}>
                            {rc.percentage}%
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-semibold text-slate-800">{rc.category}</div>
                          <div className="text-[10px] text-slate-500">{rc.description}</div>
                          {rc.amount && <div className="text-[10px] font-medium text-slate-600 mt-0.5">{rc.amount}</div>}
                        </div>
                        <TrendingUp size={14} className={rc.classification === 'Strategic' ? 'text-blue-400' : 'text-amber-400'} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })() : (
          <>
            {/* Message text — split first paragraph as summary for AI simple results */}
            {!isUser && message.text && message.text.includes('\n\n') ? (() => {
              const firstBreak = message.text.indexOf('\n\n')
              const summary = message.text.slice(0, firstBreak)
              const rest = message.text.slice(firstBreak + 2)
              return (
                <div className="space-y-2">
                  <div className="text-[12.5px] font-semibold text-slate-900 leading-snug">{formatText(summary)}</div>
                  {rest && <div className="text-[11.5px] text-slate-700 leading-relaxed whitespace-pre-wrap">{formatText(rest)}</div>}
                </div>
              )
            })() : (
              <div className="whitespace-pre-wrap">{formatText(message.text)}</div>
            )}
          </>
        )}

        {/* Read aloud button for AI messages */}
        {!isUser && message.text && onSpeak && (
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => onSpeak(message.text, messageIndex)}
              className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded transition-colors ${
                isThisMessageSpeaking
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
              title={isThisMessageSpeaking ? (isPaused ? 'Resume' : 'Pause') : 'Read aloud'}
            >
              {isThisMessageSpeaking ? (
                isPaused ? (
                  <>
                    <Volume2 size={12} />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Pause size={12} />
                    <span>Pause</span>
                  </>
                )
              ) : (
                <>
                  <Volume2 size={12} />
                  <span>Read aloud</span>
                </>
              )}
            </button>
            {isThisMessageSpeaking && (
              <button
                onClick={() => onSpeak(null, null)}
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                title="Stop"
              >
                <VolumeX size={12} />
                <span>Stop</span>
              </button>
            )}
          </div>
        )}

        {/* Data quality alert */}
        {message.dataQualityAlert && (
          <div className={`mt-3 p-3 rounded-lg border-l-4 ${
            message.dataQualityAlert.severity === 'high'
              ? 'bg-red-50 border-red-500'
              : 'bg-amber-50 border-amber-500'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={12} className={message.dataQualityAlert.severity === 'high' ? 'text-red-600' : 'text-amber-600'} />
              <span className={`text-[10px] font-semibold ${message.dataQualityAlert.severity === 'high' ? 'text-red-700' : 'text-amber-700'}`}>
                {message.dataQualityAlert.headline}
              </span>
            </div>
            <div className="text-[9px] text-slate-600">
              {message.dataQualityAlert.details}
            </div>
            {message.dataQualityAlert.recommendation && (
              <div className="text-[9px] text-slate-700 mt-1 font-medium">
                Recommendation: {message.dataQualityAlert.recommendation}
              </div>
            )}
          </div>
        )}

        {/* SQL Query (collapsible) */}
        {message.sqlQuery && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <button
              onClick={() => setShowSql(!showSql)}
              className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-700"
            >
              <Database size={10} />
              <span>SQL Query</span>
              {showSql ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>
            {showSql && (
              <pre className="mt-2 p-2 bg-slate-800 text-slate-200 rounded text-[9px] overflow-x-auto">
                <code>{message.sqlQuery}</code>
              </pre>
            )}
          </div>
        )}

        {/* Confidence indicator for complex analysis */}
        {message.overallConfidence && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  message.overallConfidence >= 70 ? 'bg-emerald-500' :
                  message.overallConfidence >= 50 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${message.overallConfidence}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-500">
              {message.overallConfidence}% confidence
            </span>
          </div>
        )}

        {/* Charts */}
        {charts && charts.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="text-[10px] font-semibold uppercase text-slate-500 mb-2">
              {message.queryType === 'complex_why' ? `Analysis (${charts.length} charts)` : 'Visualization'}
            </div>
            <div className={`grid gap-3 ${charts.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
              {charts.map((chart, idx) => (
                <div key={idx} className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
                  <div className="text-[11px] font-semibold text-slate-800 mb-2 leading-tight">
                    {chart.chart_config?.title || chart.title}
                  </div>
                  {chart.data && chart.data.length > 0 ? (
                    <ChartCanvas
                      chartConfig={chart.chart_config}
                      data={chart.data}
                      chartType={chart.chart_type}
                      title=""
                      showAIButton={true}
                      onAIClick={() => handleAIClick(chart)}
                    />
                  ) : (
                    <div className="h-20 flex items-center justify-center text-[10px] text-slate-400">
                      No data available
                    </div>
                  )}
                  {chart.row_count !== undefined && (
                    <div className="text-[9px] text-slate-400 mt-1 text-right">
                      {chart.row_count} rows
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Chart Query Modal */}
        <AIChartQueryModal
          isOpen={!!aiModalChart}
          onClose={() => setAiModalChart(null)}
          chartData={aiModalChart}
          onChartUpdate={handleChartUpdate}
        />

        {/* Strategic Recommendations (for complex_why) */}
        {message.strategicRecommendations && message.strategicRecommendations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="text-[10px] font-semibold uppercase text-slate-500 mb-2">
              Strategic Recommendations
            </div>
            <div className="space-y-2">
              {message.strategicRecommendations.slice(0, 3).map((rec, i) => (
                <div key={i} className="bg-emerald-50 p-2 rounded-lg border-l-2 border-emerald-500">
                  <div className="text-[10px] font-medium text-slate-800">{rec.action}</div>
                  {rec.rationale && (
                    <div className="text-[9px] text-slate-600 mt-0.5">{rec.rationale}</div>
                  )}
                  <div className="flex gap-2 mt-1">
                    {rec.urgency && (
                      <span className={`text-[8px] px-1.5 py-0.5 rounded ${
                        rec.urgency === 'immediate' ? 'bg-red-100 text-red-700' :
                        rec.urgency === 'high' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {rec.urgency}
                      </span>
                    )}
                    {rec.expected_impact && (
                      <span className="text-[8px] text-slate-500">
                        Impact: {rec.expected_impact}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Follow-up questions/suggestions */}
        {message.followups && message.followups.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="text-[10px] text-slate-500 mb-1.5">
              {message.queryType === 'complex_why' ? 'Next Steps:' :
               message.queryType === 'out_of_scope' ? 'Try asking:' :
               'Suggested questions:'}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {message.followups.slice(0, 5).map((f, j) => (
                <button
                  key={j}
                  onClick={() => handleFollowUp(f)}
                  disabled={isChatLoading}
                  className="text-[10px] text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded disabled:opacity-50 text-left transition-colors"
                >
                  {f.length > 50 ? f.substring(0, 50) + '...' : f}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatMessage
