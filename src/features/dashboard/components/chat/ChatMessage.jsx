/**
 * ChatMessage Component
 * Renders individual chat message with charts, follow-ups, and rich formatting
 * Supports: greeting, out_of_scope, simple, complex_why query types
 */

import { useState, useEffect } from 'react'
import { AlertTriangle, Database, ChevronDown, ChevronUp, Volume2, VolumeX, Pause, TrendingUp } from 'lucide-react'
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
  currentSpeakingId,
  onSimpleAnswer
}) => {
  const isUser = message.sender === 'user'
  const [showSql, setShowSql] = useState(false)
  const [aiModalChart, setAiModalChart] = useState(null)
  const [charts, setCharts] = useState(message.charts || [])

  // Sync charts state when message.charts changes (e.g., loading a different conversation)
  useEffect(() => {
    setCharts(message.charts || [])
  }, [message.charts])

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

  // Format inline text: **bold** and *italic*
  const formatText = (text) => {
    if (!text) return null
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-slate-800">{part.slice(2, -2)}</strong>
      }
      if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
        return <em key={i} className="text-slate-500">{part.slice(1, -1)}</em>
      }
      return part
    })
  }

  // Parse markdown-like narrative into styled React blocks
  const renderNarrative = (text) => {
    if (!text) return null

    const lines = text.split('\n')
    const blocks = []
    let current = null

    const flush = () => {
      if (current && current.items.length > 0) blocks.push(current)
      current = null
    }

    lines.forEach((line) => {
      const trimmed = line.trim()

      if (!trimmed) { flush(); return }

      // ### Section header
      if (trimmed.startsWith('### ')) {
        flush()
        blocks.push({ type: 'heading', text: trimmed.slice(4) })
        return
      }

      // Nested bullet (2+ spaces before -)
      if (/^\s{2,}-\s/.test(line)) {
        if (!current || current.type !== 'list') { flush(); current = { type: 'list', items: [] } }
        current.items.push({ text: trimmed.slice(2), nested: true })
        return
      }

      // Top-level bullet
      if (trimmed.startsWith('- ')) {
        if (!current || current.type !== 'list') { flush(); current = { type: 'list', items: [] } }
        current.items.push({ text: trimmed.slice(2), nested: false })
        return
      }

      // Numbered list (1. text)
      const numMatch = trimmed.match(/^(\d+)\.\s+(.+)/)
      if (numMatch) {
        if (!current || current.type !== 'numbered') { flush(); current = { type: 'numbered', items: [] } }
        current.items.push({ num: numMatch[1], text: numMatch[2] })
        return
      }

      // Regular paragraph
      if (!current || current.type !== 'paragraph') { flush(); current = { type: 'paragraph', items: [] } }
      current.items.push(trimmed)
    })

    flush()

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {blocks.map((block, idx) => {
          switch (block.type) {
            case 'heading':
              return (
                <div key={idx}>
                  {idx > 0 && <div style={{ borderTop: '1px solid #e2e8f0', marginBottom: '12px' }} />}
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', lineHeight: 1.4, margin: 0 }}>
                    {formatText(block.text)}
                  </h4>
                </div>
              )
            case 'list':
              return (
                <ul key={idx} style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {block.items.map((item, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginLeft: item.nested ? '20px' : '0' }}>
                      <span style={{
                        marginTop: '7px', width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0,
                        backgroundColor: item.nested ? '#cbd5e1' : '#94a3b8'
                      }} />
                      <span style={{ fontSize: '13px', color: '#475569', lineHeight: 1.7 }}>
                        {formatText(item.text)}
                      </span>
                    </li>
                  ))}
                </ul>
              )
            case 'numbered':
              return (
                <ol key={idx} style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {block.items.map((item, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginTop: '1px', flexShrink: 0, width: '16px', textAlign: 'right' }}>
                        {item.num}.
                      </span>
                      <span style={{ fontSize: '13px', color: '#475569', lineHeight: 1.7 }}>
                        {formatText(item.text)}
                      </span>
                    </li>
                  ))}
                </ol>
              )
            case 'paragraph':
              return (
                <p key={idx} style={{ fontSize: '13px', color: '#475569', lineHeight: 1.7, margin: 0 }}>
                  {formatText(block.items.join(' '))}
                </p>
              )
            default:
              return null
          }
        })}
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-1 max-w-[85%] ${isUser ? 'self-end items-end' : 'self-start'}`}>
      {/* Card context indicator */}
      {message.cardTitle && isUser && (
        <div className="text-[9px] text-slate-400 mb-0.5">Re: {message.cardTitle}</div>
      )}

      {/* Message bubble */}
      <div
        className={`px-4 py-3 rounded-2xl text-sm ${
          isUser ? 'text-white rounded-br-sm' : 'bg-slate-100 text-slate-900 rounded-bl-sm'
        }`}
        style={isUser ? { backgroundColor: '#2F5597' } : {}}
      >
        {/* Query type badge for AI messages */}
        {!isUser && message.queryType && message.queryType !== 'simple' && (
          <div className="mb-2">
            <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full ${
              message.queryType === 'greeting' ? 'bg-blue-100 text-blue-700' :
              message.queryType === 'out_of_scope' ? 'bg-slate-200 text-slate-600' :
              message.queryType === 'complex_why' ? 'bg-purple-100 text-purple-700' :
              message.queryType === 'kpi_card_explain' ? 'bg-teal-100 text-teal-700' :
              'bg-slate-200 text-slate-600'
            }`}>
              {message.queryType === 'greeting' && 'Welcome'}
              {message.queryType === 'out_of_scope' && 'Info'}
              {message.queryType === 'complex_why' && 'Deep Analysis'}
              {message.queryType === 'kpi_card_explain' && 'KPI Analysis'}
            </span>
          </div>
        )}

        {/* Diagnostic result - structured professional card */}
        {!isUser && message.diagnosticResult ? (() => {
          const diag = message.diagnosticResult
          const assessmentStyles = {
            critical: { label: 'Critical', pill: 'bg-red-100 text-red-700', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
            warning: { label: 'Warning', pill: 'bg-amber-100 text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
            ok: { label: 'Healthy', pill: 'bg-emerald-100 text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
            info: { label: 'Info', pill: 'bg-blue-100 text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' }
          }
          const style = assessmentStyles[diag.assessment] || assessmentStyles.warning

          // Fix truncated headlines: if headline doesn't end at a natural sentence boundary,
          // reconstruct from the full narrative to avoid mid-word splits
          let displayHeadline = diag.headline || ''
          let displayBody = message.text || ''
          const headlineEndsClean = !displayHeadline || /[.!?:;)\]—"]$/.test(displayHeadline.trim())

          if (!headlineEndsClean && (diag.narrative || displayBody)) {
            const fullNarrative = diag.narrative || (displayHeadline + displayBody)
            const paraBreak = fullNarrative.indexOf('\n\n')
            if (paraBreak > 0) {
              displayHeadline = fullNarrative.slice(0, paraBreak)
              displayBody = fullNarrative.slice(paraBreak + 2)
            } else {
              displayHeadline = fullNarrative
              displayBody = ''
            }
          }

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Headline + Assessment pill (top-right) */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ fontSize: '16px', fontWeight: 500, color: '#0f172a', lineHeight: 1.45, letterSpacing: '-0.01em', flex: 1 }}>
                  {formatText(displayHeadline)}
                </div>
                {diag.assessment && (
                  <span
                    className={`${style.pill}`}
                    style={{ flexShrink: 0, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', padding: '4px 10px', borderRadius: '9999px', marginTop: '2px', letterSpacing: '0.05em' }}
                  >
                    {style.label}
                  </span>
                )}
              </div>

              {/* Follow-up reuse indicator */}
              {diag.diagnostic_type === 'followup_partial' && diag.metadata?.reuse_type && (
                <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '-12px' }}>
                  {diag.metadata.reused_charts > 0
                    ? `Building on ${diag.metadata.reused_charts} previous chart(s)`
                    : 'Follow-up analysis'}
                  {diag.metadata.new_queries > 0 && ` + ${diag.metadata.new_queries} new`}
                </div>
              )}

              {/* Assessment text (only if non-empty) */}
              {diag.assessment_text && (
                <div className={`${style.bg} ${style.border}`} style={{ padding: '12px', borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid' }}>
                  <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6 }}>{diag.assessment_text}</div>
                </div>
              )}

              {/* Key Metrics */}
              {diag.key_metrics && diag.key_metrics.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {diag.key_metrics.map((m, i) => (
                    <div key={i} style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 500, letterSpacing: '0.05em' }}>{m.label}</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Narrative body — rendered with proper markdown formatting */}
              {renderNarrative(displayBody)}

              {/* Root Causes */}
              {diag.root_causes && diag.root_causes.length > 0 && (
                <div style={{ paddingTop: '4px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#64748b', marginBottom: '10px', letterSpacing: '0.05em' }}>Root Causes</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {diag.root_causes.map((rc, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#fff', borderRadius: '10px', padding: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ flexShrink: 0 }}>
                          <div
                            style={{
                              width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '11px', fontWeight: 700, color: '#fff',
                              backgroundColor: rc.classification === 'Strategic' ? '#2F5597' : '#7DAAAD'
                            }}
                          >
                            {rc.percentage}%
                          </div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{rc.category}</div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{rc.description}</div>
                          {rc.amount && <div style={{ fontSize: '12px', fontWeight: 500, color: '#475569', marginTop: '2px' }}>{rc.amount}</div>}
                        </div>
                        <TrendingUp size={14} style={{ flexShrink: 0, color: rc.classification === 'Strategic' ? '#6B8FC4' : '#7DAAAD' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })() : (
          <>
            {/* Message text — split first paragraph as summary, render rest with markdown support */}
            {!isUser && message.text && message.text.includes('\n\n') ? (() => {
              const firstBreak = message.text.indexOf('\n\n')
              const summary = message.text.slice(0, firstBreak)
              const rest = message.text.slice(firstBreak + 2)
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a', lineHeight: 1.45 }}>{formatText(summary)}</div>
                  {rest && renderNarrative(rest)}
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
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded transition-colors"
              style={
                isThisMessageSpeaking
                  ? { backgroundColor: '#D7EBEE', color: '#1B5272' }
                  : { backgroundColor: '#E2E8F0', color: '#475569' }
              }
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
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '12px', letterSpacing: '0.05em' }}>
              {message.queryType === 'complex_why' ? `Analysis (${charts.length} charts)` : 'Visualization'}
            </div>
            <div className={`grid gap-3 ${charts.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
              {charts.map((chart, idx) => (
                <div key={idx} style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b', marginBottom: '10px', lineHeight: 1.4 }}>
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
          onSimpleAnswer={onSimpleAnswer}
        />

        {/* Strategic Recommendations (for complex_why) */}
        {message.strategicRecommendations && message.strategicRecommendations.length > 0 && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '10px', letterSpacing: '0.05em' }}>
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
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '8px' }}>
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
                  className="text-[10px] px-2 py-1 rounded disabled:opacity-50 text-left transition-colors"
                  style={{ color: '#1B5272', backgroundColor: '#EDF7F9' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#D7EBEE')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#EDF7F9')}
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
