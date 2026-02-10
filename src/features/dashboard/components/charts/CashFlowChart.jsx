/**
 * CashFlowChart Component
 * Line chart for monthly cash outflows with time filter
 */

import { useState, useRef, useEffect, useMemo } from 'react'
import { CHART_COLORS } from '../../utils/constants'

const TIME_FILTERS = [
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
  { key: 'ytd', label: 'YTD' }
]

const CashFlowChart = ({ data, loading }) => {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [activeFilter, setActiveFilter] = useState('ytd')
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, value: '', label: '' })
  const pointsRef = useRef([])

  // Fix year in month labels if they show future dates (e.g., Dec 2026 should be Dec 2025)
  const correctedData = useMemo(() => {
    if (!data || data.length === 0) return []

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() // 0-indexed

    const monthMap = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    }

    return data.map(d => {
      if (d.month) {
        const parts = d.month.split(' ')
        if (parts.length === 2) {
          const monthName = parts[0]
          const year = parseInt(parts[1])
          const monthIndex = monthMap[monthName]

          // If the date is in the future, correct the year
          if (year > currentYear || (year === currentYear && monthIndex > currentMonth)) {
            return { ...d, month: `${monthName} ${year - 1}` }
          }
        }
      }
      return d
    })
  }, [data])

  // Filter data based on selected time range
  const filteredData = useMemo(() => {
    if (!correctedData || correctedData.length === 0) return []

    const now = new Date()
    const currentYear = now.getFullYear()

    switch (activeFilter) {
      case '30d':
        return correctedData.slice(-1) // Last month
      case '90d':
        return correctedData.slice(-3) // Last 3 months
      case 'ytd':
      default:
        // Filter data for current year
        return correctedData.filter(d => {
          if (d.month) {
            const monthYear = d.month.split(' ')
            if (monthYear.length === 2) {
              return parseInt(monthYear[1]) === currentYear
            }
          }
          return true
        })
    }
  }, [correctedData, activeFilter])

  useEffect(() => {
    if (!filteredData || filteredData.length === 0 || !canvasRef.current || loading) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = canvas.parentElement.offsetWidth
      canvas.height = canvas.parentElement.offsetHeight

      const values = filteredData.map(d => d.total_outflow_inr || 0)
      const labels = filteredData.map(d => d.month)
      const w = canvas.width
      const h = canvas.height
      const pad = { t: 20, r: 20, b: 40, l: 70 }
      const max = Math.max(...values) * 1.1 || 1

      ctx.clearRect(0, 0, w, h)

      // Grid lines
      ctx.strokeStyle = 'rgba(0,0,0,0.05)'
      for (let i = 0; i <= 5; i++) {
        const y = pad.t + (i / 5) * (h - pad.t - pad.b)
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
      ctx.fillStyle = 'rgba(180,134,46,0.1)'
      ctx.beginPath()
      ctx.moveTo(pad.l, h - pad.b)
      values.forEach((v, i) => {
        const x = pad.l + (i / (values.length - 1 || 1)) * (w - pad.l - pad.r)
        ctx.lineTo(x, pad.t + (h - pad.t - pad.b) - (v / max) * (h - pad.t - pad.b))
      })
      ctx.lineTo(w - pad.r, h - pad.b)
      ctx.closePath()
      ctx.fill()

      // Points and store positions for tooltips
      ctx.fillStyle = CHART_COLORS[0]
      const points = []
      values.forEach((v, i) => {
        const x = pad.l + (i / (values.length - 1 || 1)) * (w - pad.l - pad.r)
        const y = pad.t + (h - pad.t - pad.b) - (v / max) * (h - pad.t - pad.b)
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fill()
        points.push({ x, y, value: v, label: labels[i] })
      })
      pointsRef.current = points

      // X-axis labels
      ctx.fillStyle = '#64748b'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      labels.forEach((l, i) => {
        if (i % 2 === 0 || labels.length <= 6) {
          const x = pad.l + (i / (labels.length - 1 || 1)) * (w - pad.l - pad.r)
          ctx.fillText(l, x, h - 10)
        }
      })

      // Y-axis labels
      ctx.textAlign = 'right'
      for (let i = 0; i <= 5; i++) {
        const v = max * (5 - i) / 5
        ctx.fillText((v / 1e9).toFixed(1) + 'B', pad.l - 5, pad.t + (i / 5) * (h - pad.t - pad.b) + 4)
      }
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [filteredData, loading])

  const handleMouseMove = (e) => {
    if (!canvasRef.current || pointsRef.current.length === 0) return
    const rect = canvasRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const nearestPoint = pointsRef.current.find(p =>
      Math.abs(p.x - mouseX) < 20 && Math.abs(p.y - mouseY) < 20
    )

    if (nearestPoint) {
      setTooltip({
        show: true,
        x: nearestPoint.x,
        y: nearestPoint.y - 10,
        value: (nearestPoint.value / 1e9).toFixed(2) + 'B',
        label: nearestPoint.label
      })
    } else {
      setTooltip(prev => prev.show ? { ...prev, show: false } : prev)
    }
  }

  const handleMouseLeave = () => {
    setTooltip(prev => prev.show ? { ...prev, show: false } : prev)
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-serif text-base font-medium text-slate-900">Monthly Cash Outflows</h3>
        {/* Time Filter Buttons */}
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          {TIME_FILTERS.map(filter => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                activeFilter === filter.key
                  ? 'bg-white text-amber-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4">
        <div
          ref={containerRef}
          className="h-52 relative"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {filteredData.length > 0 ? (
            <>
              <canvas ref={canvasRef} className="w-full h-full" />
              {tooltip.show && (
                <div
                  className="absolute pointer-events-none bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-lg z-10"
                  style={{
                    left: tooltip.x,
                    top: tooltip.y,
                    transform: 'translate(-50%, -100%)'
                  }}
                >
                  <div className="font-medium">{tooltip.label}</div>
                  <div className="text-amber-300">{tooltip.value}</div>
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              No data for selected period
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CashFlowChart
