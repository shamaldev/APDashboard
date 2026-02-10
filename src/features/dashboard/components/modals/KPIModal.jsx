/**
 * KPIModal Component
 * Detail modal for KPI card drill-down
 */

import { useState, useRef, useEffect } from 'react'
import { X, Send } from 'lucide-react'
import { CHART_COLORS } from '../../utils/constants'
import { cleanComparisonLabel } from '../../utils/helpers'

const KPIModal = ({ isOpen, onClose, card, onAskQuestion }) => {
  const [question, setQuestion] = useState('')
  const canvasRef = useRef(null)

  useEffect(() => {
    if (isOpen && card && canvasRef.current) {
      renderChart()
    }
  }, [isOpen, card])

  const renderChart = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.parentElement.offsetWidth
    canvas.height = canvas.parentElement.offsetHeight

    const chartData = card.chart_data || []
    const config = card.chart_config || {}
    const w = canvas.width
    const h = canvas.height
    const pad = { t: 30, r: 20, b: 50, l: 70 }

    ctx.clearRect(0, 0, w, h)

    if (chartData.length === 0) {
      ctx.fillStyle = '#94a3b8'
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('No chart data available', w / 2, h / 2)
      return
    }

    const xCol = config.x_axis_col_name || Object.keys(chartData[0])[0]
    const yCol = (config.y_axis_col_name || [])[0] || Object.keys(chartData[0]).find(k => typeof chartData[0][k] === 'number')
    const values = chartData.map(d => d[yCol] || 0)
    const labels = chartData.map(d => d[xCol] || '')
    const max = Math.max(...values) * 1.1 || 1

    // Grid lines
    ctx.strokeStyle = 'rgba(0,0,0,0.05)'
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (i / 4) * (h - pad.t - pad.b)
      ctx.beginPath()
      ctx.moveTo(pad.l, y)
      ctx.lineTo(w - pad.r, y)
      ctx.stroke()
    }

    // Line
    ctx.strokeStyle = CHART_COLORS[0]
    ctx.lineWidth = 2
    ctx.beginPath()
    values.forEach((v, i) => {
      const x = pad.l + (i / (values.length - 1 || 1)) * (w - pad.l - pad.r)
      const y = pad.t + (h - pad.t - pad.b) - (v / max) * (h - pad.t - pad.b)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke()

    // Fill area
    ctx.lineTo(w - pad.r, h - pad.b)
    ctx.lineTo(pad.l, h - pad.b)
    ctx.closePath()
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, 'rgba(180,134,46,0.2)')
    grad.addColorStop(1, 'rgba(180,134,46,0)')
    ctx.fillStyle = grad
    ctx.fill()

    // Points
    ctx.fillStyle = CHART_COLORS[0]
    values.forEach((v, i) => {
      const x = pad.l + (i / (values.length - 1 || 1)) * (w - pad.l - pad.r)
      const y = pad.t + (h - pad.t - pad.b) - (v / max) * (h - pad.t - pad.b)
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fill()
    })

    // X-axis labels
    ctx.fillStyle = '#64748b'
    ctx.font = '9px sans-serif'
    ctx.textAlign = 'center'
    labels.forEach((l, i) => {
      if (i % Math.ceil(labels.length / 6) === 0 || labels.length <= 6) {
        const x = pad.l + (i / (labels.length - 1 || 1)) * (w - pad.l - pad.r)
        ctx.fillText(typeof l === 'string' ? l.substring(0, 10) : l, x, h - pad.b + 15)
      }
    })

    // Y-axis labels
    ctx.textAlign = 'right'
    for (let i = 0; i <= 4; i++) {
      const v = max - (i / 4) * max
      const label = v >= 1e9 ? (v / 1e9).toFixed(1) + 'B' : v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(1) + 'K' : v.toFixed(0)
      ctx.fillText(label, pad.l - 8, pad.t + (i / 4) * (h - pad.t - pad.b) + 4)
    }
  }

  const handleSend = () => {
    if (question.trim()) {
      onAskQuestion(question, card)
      setQuestion('')
    }
  }

  const suggestedQuestions = [
    `What's driving ${card?.title}?`,
    `Show ${card?.title} by vendor`,
    `Compare to last month`
  ]

  if (!isOpen || !card) return null

  const summary = card.summary

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-start bg-slate-50">
          <div>
            <h2 className="font-serif text-lg font-semibold text-slate-900">
              {summary?.title || card.title}
            </h2>
            <p className="text-xs text-slate-500">{card.description}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 grid md:grid-cols-[2fr_1fr] gap-5">
          <div className="flex flex-col gap-4">
            {/* Values */}
            <div className="flex gap-4 items-end flex-wrap">
              <div>
                <div className="text-[9px] text-slate-500 uppercase">Current</div>
                <div className="font-serif text-3xl font-semibold text-slate-900">{card.formatted_value}</div>
              </div>
              <div>
                <div className={`font-semibold text-sm ${card.status === 'up' ? 'text-red-600' : 'text-emerald-600'}`}>
                  {card.formatted_comparison}
                </div>
                <div className="text-[10px] text-slate-500">{cleanComparisonLabel(card.comparison_label)}</div>
              </div>
            </div>

            {/* Chart */}
            <div className="h-56 bg-slate-50 border border-slate-100 rounded-lg p-3 relative">
              <canvas ref={canvasRef} className="w-full h-full" />
            </div>

            {/* Analysis */}
            {summary?.drivers && (
              <div className="bg-slate-100 p-3 rounded-lg border-l-4 border-amber-600">
                <div className="text-[9px] font-semibold uppercase text-slate-500 mb-2">Analysis</div>
                {summary.drivers.map((d, i) => (
                  <div key={i} className="flex gap-2 mb-1.5 text-xs text-slate-700">
                    <span className="shrink-0">{d.icon}</span>
                    <span><strong>{d.title}:</strong> {d.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">
            {summary?.current_state?.secondary_metrics && (
              <div>
                <div className="text-[9px] font-semibold uppercase text-slate-500 mb-2">Breakdown</div>
                <div className="grid grid-cols-2 gap-2">
                  {summary.current_state.secondary_metrics.map((m, i) => (
                    <div key={i} className="bg-slate-50 p-2 rounded text-center">
                      <div className="text-[9px] text-slate-500 uppercase truncate">{m.label}</div>
                      <div className="font-mono text-sm font-semibold text-slate-900 truncate">{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="text-[9px] font-semibold uppercase text-slate-500 mb-2">Quick Questions</div>
              <div className="flex flex-col gap-1.5">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => onAskQuestion(q, card)}
                    className="text-left text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-2 rounded-lg transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer input */}
        <div className="p-3 border-t border-slate-100 bg-slate-50">
          <div className="flex gap-2 items-center bg-white border border-slate-200 rounded-lg px-3 py-2">
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Ask a follow-up question..."
              className="flex-1 bg-transparent outline-none text-sm"
              onKeyPress={e => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} className="bg-amber-600 text-white rounded p-1.5 hover:bg-amber-700">
              <Send size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default KPIModal
