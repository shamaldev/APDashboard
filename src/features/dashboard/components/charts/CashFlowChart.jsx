/**
 * CashFlowChart Component
 * Dynamic chart for monthly cash outflows with time filter
 * Fetches data from /api/v1/cash-outflow/forecast/{period_type}
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Sparkles } from 'lucide-react'
import { CHART_COLORS } from '../../utils/constants'
import AIChartQueryModal from '../modals/AIChartQueryModal'
import ChartCanvas from './ChartCanvas'
import { authFetch } from '../../utils/auth'

const TIME_FILTERS = [
  { key: '30_DAY', label: '30 Days' },
  { key: '90_DAY', label: '90 Days' },
  { key: 'YTD', label: 'YTD' }
]

const LINE_COLORS = {
  actual: '#b4862e',     // amber - actual payments
  projected: '#60a5fa',  // blue - projected payments
  budget: '#94a3b8'      // slate - budget target
}

// Format large numbers (defined outside component to avoid stale closures)
const formatUSD = (val) => {
  if (val == null || isNaN(val)) return '$0'
  if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`
  if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`
  return `$${val.toFixed(0)}`
}


const CashFlowChart = ({ loading: initialLoading }) => {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [activeFilter, setActiveFilter] = useState('YTD')
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, lines: [] })
  const pointsRef = useRef([])
  const [showAIModal, setShowAIModal] = useState(false)
  const [chartType, setChartType] = useState('line_chart')
  const [chartConfig, setChartConfig] = useState({
    x_axis_col_name: 'date_label',
    y_axis_col_name: ['cumulative_actual_usd', 'cumulative_projected_usd', 'cumulative_budget_usd'],
    title: 'Monthly Cash Outflows'
  })

  // API data state
  const [forecastData, setForecastData] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch forecast data from backend
  const fetchForecast = useCallback(async (periodType) => {
    setLoading(true)
    setError(null)
    try {
      const response = await authFetch(`/cash-outflow/forecast/${periodType}`)
      const result = await response.json()
      if (result.success) {
        setForecastData(result.data)
        setSummary(result.summary)
      } else {
        setError(result.error || 'Failed to fetch forecast')
        setForecastData([])
        setSummary(null)
      }
    } catch (err) {
      console.error('Cash outflow fetch error:', err)
      setError(err.message || 'Failed to fetch forecast')
      setForecastData([])
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch on mount and filter change
  useEffect(() => {
    fetchForecast(activeFilter)
  }, [activeFilter, fetchForecast])

  // Handle chart updates from AI
  const handleChartUpdate = (updatedChart) => {
    if (updatedChart.chart_type) setChartType(updatedChart.chart_type)
    if (updatedChart.chart_config) setChartConfig(updatedChart.chart_config)
    if (updatedChart.data) setForecastData(updatedChart.data)
  }

  // Draw multi-line chart
  useEffect(() => {
    if (!forecastData || forecastData.length === 0 || !canvasRef.current || loading) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = canvas.parentElement.offsetWidth
      canvas.height = canvas.parentElement.offsetHeight

      const w = canvas.width
      const h = canvas.height
      const pad = { t: 20, r: 20, b: 40, l: 80 }
      const chartW = w - pad.l - pad.r
      const chartH = h - pad.t - pad.b

      // Compute max across all three series
      let maxVal = 0
      forecastData.forEach(d => {
        maxVal = Math.max(maxVal,
          d.cumulative_actual_usd || 0,
          d.cumulative_projected_usd || 0,
          d.cumulative_budget_usd || 0
        )
      })
      maxVal = maxVal * 1.1 || 1

      ctx.clearRect(0, 0, w, h)

      // Grid lines
      ctx.strokeStyle = 'rgba(0,0,0,0.05)'
      ctx.lineWidth = 1
      for (let i = 0; i <= 5; i++) {
        const y = pad.t + (i / 5) * chartH
        ctx.beginPath()
        ctx.moveTo(pad.l, y)
        ctx.lineTo(w - pad.r, y)
        ctx.stroke()
      }

      const n = forecastData.length
      const getX = (i) => pad.l + (i / (n - 1 || 1)) * chartW
      const getY = (v) => pad.t + chartH - (v / maxVal) * chartH

      // Find transition point (CURRENT index)
      const currentIdx = forecastData.findIndex(d => d.period_status === 'CURRENT')

      // --- Draw Budget line (dashed gray) ---
      ctx.strokeStyle = LINE_COLORS.budget
      ctx.lineWidth = 1.5
      ctx.setLineDash([6, 4])
      ctx.beginPath()
      forecastData.forEach((d, i) => {
        const x = getX(i)
        const y = getY(d.cumulative_budget_usd || 0)
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      })
      ctx.stroke()
      ctx.setLineDash([])

      // --- Draw Actual line (solid amber, up to CURRENT) ---
      const actualEnd = currentIdx >= 0 ? currentIdx : n - 1
      ctx.strokeStyle = LINE_COLORS.actual
      ctx.lineWidth = 2.5
      ctx.beginPath()
      for (let i = 0; i <= actualEnd; i++) {
        const x = getX(i)
        const y = getY(forecastData[i].cumulative_actual_usd || 0)
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.stroke()

      // Fill under actual
      ctx.fillStyle = 'rgba(180,134,46,0.08)'
      ctx.beginPath()
      ctx.moveTo(getX(0), pad.t + chartH)
      for (let i = 0; i <= actualEnd; i++) {
        ctx.lineTo(getX(i), getY(forecastData[i].cumulative_actual_usd || 0))
      }
      ctx.lineTo(getX(actualEnd), pad.t + chartH)
      ctx.closePath()
      ctx.fill()

      // --- Draw Projected line (dashed blue, from CURRENT onward) ---
      const projStart = currentIdx >= 0 ? currentIdx : 0
      if (projStart < n - 1) {
        ctx.strokeStyle = LINE_COLORS.projected
        ctx.lineWidth = 2
        ctx.setLineDash([5, 3])
        ctx.beginPath()
        for (let i = projStart; i < n; i++) {
          const projVal = (forecastData[i].cumulative_actual_usd || 0) +
                          (forecastData[i].cumulative_projected_usd || 0)
          const x = getX(i)
          const y = getY(projVal)
          i === projStart ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.stroke()
        ctx.setLineDash([])
      }

      // --- Points and tooltip data ---
      const allPoints = []
      forecastData.forEach((d, i) => {
        const x = getX(i)
        const actual = d.cumulative_actual_usd || 0
        const projected = d.cumulative_projected_usd || 0
        const budget = d.cumulative_budget_usd || 0

        // Actual point (only for ACTUAL/CURRENT)
        if (d.period_status !== 'PROJECTED') {
          ctx.fillStyle = LINE_COLORS.actual
          ctx.beginPath()
          ctx.arc(x, getY(actual), 3, 0, Math.PI * 2)
          ctx.fill()
        }

        // Projected point (only for PROJECTED/CURRENT)
        if (d.period_status !== 'ACTUAL') {
          const projTotal = actual + projected
          ctx.fillStyle = LINE_COLORS.projected
          ctx.beginPath()
          ctx.arc(x, getY(projTotal), 3, 0, Math.PI * 2)
          ctx.fill()
        }

        allPoints.push({
          x, label: d.date_label,
          actual, projected, budget,
          status: d.period_status
        })
      })
      pointsRef.current = allPoints

      // X-axis labels
      ctx.fillStyle = '#64748b'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      const labelStep = n > 15 ? Math.ceil(n / 10) : (n > 6 ? 2 : 1)
      forecastData.forEach((d, i) => {
        if (i % labelStep === 0 || i === n - 1) {
          ctx.fillText(d.date_label, getX(i), h - 10)
        }
      })

      // Y-axis labels
      ctx.textAlign = 'right'
      for (let i = 0; i <= 5; i++) {
        const v = maxVal * (5 - i) / 5
        const y = pad.t + (i / 5) * chartH
        ctx.fillText(formatUSD(v), pad.l - 5, y + 4)
      }
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [forecastData, loading])

  const handleMouseMove = (e) => {
    if (!canvasRef.current || pointsRef.current.length === 0) return
    const rect = canvasRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left

    // Find nearest point by X
    let nearest = null
    let minDist = Infinity
    pointsRef.current.forEach(p => {
      const dist = Math.abs(p.x - mouseX)
      if (dist < minDist) { minDist = dist; nearest = p }
    })

    if (nearest && minDist < 30) {
      setTooltip({
        show: true,
        x: nearest.x,
        y: 20,
        lines: [
          { label: nearest.label, color: '#334155', bold: true },
          { label: `Actual: ${formatUSD(nearest.actual)}`, color: LINE_COLORS.actual },
          ...(nearest.projected > 0 ? [{ label: `Projected: ${formatUSD(nearest.actual + nearest.projected)}`, color: LINE_COLORS.projected }] : []),
          { label: `Budget: ${formatUSD(nearest.budget)}`, color: LINE_COLORS.budget }
        ]
      })
    } else {
      setTooltip(prev => prev.show ? { ...prev, show: false } : prev)
    }
  }

  const handleMouseLeave = () => {
    setTooltip(prev => prev.show ? { ...prev, show: false } : prev)
  }

  // Prepare chart data for AI modal
  const aiChartData = {
    kpi: {
      title: 'Monthly Cash Outflows',
      description: 'Cash outflows forecast with actual vs projected vs budget',
      chart_type: chartType
    },
    data: forecastData,
    chart_type: chartType,
    chart_config: chartConfig,
    catalog: 'finance_fusion_catalog',
    schema: 'finance_fusion_catalog',
    persona: 'CFO'
  }

  const isLoading = loading || initialLoading

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-serif text-base font-medium text-slate-900">Monthly Cash Outflows</h3>
          <button
            onClick={() => setShowAIModal(true)}
            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 p-1 rounded transition-all"
            title="Ask AI about this chart"
          >
            <Sparkles size={16} />
          </button>
        </div>
        {/* Time Filter Buttons */}
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          {TIME_FILTERS.map(filter => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              disabled={isLoading}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                activeFilter === filter.key
                  ? 'bg-white text-amber-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary metrics bar */}
      {summary && (
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-6 text-xs">
          <div>
            <span className="text-slate-500">Actual:</span>{' '}
            <span className="font-semibold text-slate-800">{formatUSD(summary.total_actual_usd)}</span>
          </div>
          <div>
            <span className="text-slate-500">Projected:</span>{' '}
            <span className="font-semibold text-blue-600">{formatUSD(summary.total_projected_usd)}</span>
          </div>
          <div>
            <span className="text-slate-500">Budget:</span>{' '}
            <span className="font-semibold text-slate-600">{formatUSD(summary.total_budget_usd)}</span>
          </div>
          <div>
            <span className="text-slate-500">Variance:</span>{' '}
            <span className={`font-semibold ${(summary.variance_usd ?? 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {(summary.variance_usd ?? 0) > 0 ? '+' : ''}{formatUSD(Math.abs(summary.variance_usd ?? 0))} ({(summary.variance_pct ?? 0) > 0 ? '+' : ''}{(summary.variance_pct ?? 0).toFixed(1)}%)
            </span>
          </div>
        </div>
      )}

      <div className="p-4">
        {isLoading ? (
          <div className="h-52 flex items-center justify-center text-slate-400 text-sm">
            <div className="animate-pulse">Loading forecast data...</div>
          </div>
        ) : error ? (
          <div className="h-52 flex items-center justify-center text-red-400 text-sm">
            {error}
          </div>
        ) : chartType === 'line_chart' ? (
          <div
            ref={containerRef}
            className="h-52 relative"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {forecastData.length > 0 ? (
              <>
                <canvas ref={canvasRef} className="w-full h-full" />
                {/* Legend */}
                <div className="absolute top-1 right-1 flex items-center gap-3 text-[10px] text-slate-500">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5" style={{ backgroundColor: LINE_COLORS.actual }} />
                    <span>Actual</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5 border-t border-dashed" style={{ borderColor: LINE_COLORS.projected }} />
                    <span>Projected</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5 border-t border-dashed" style={{ borderColor: LINE_COLORS.budget }} />
                    <span>Budget</span>
                  </div>
                </div>
                {/* Tooltip */}
                {tooltip.show && (
                  <div
                    className="absolute pointer-events-none bg-slate-900 text-white text-xs px-3 py-2 rounded shadow-lg z-10"
                    style={{
                      left: Math.min(tooltip.x, (containerRef.current?.offsetWidth || 300) - 160),
                      top: tooltip.y,
                      transform: 'translateX(-50%)'
                    }}
                  >
                    {tooltip.lines.map((line, i) => (
                      <div key={i} className={line.bold ? 'font-medium mb-1' : ''} style={{ color: line.bold ? '#fff' : line.color }}>
                        {line.label}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No data for selected period
              </div>
            )}
          </div>
        ) : (
          forecastData.length > 0 ? (
            <ChartCanvas
              chartConfig={chartConfig}
              data={forecastData}
              chartType={chartType}
              title={chartConfig.title}
            />
          ) : (
            <div className="h-52 flex items-center justify-center text-slate-400 text-sm">
              No data for selected period
            </div>
          )
        )}
      </div>

      <AIChartQueryModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        chartData={aiChartData}
        onChartUpdate={handleChartUpdate}
      />
    </div>
  )
}

export default CashFlowChart
