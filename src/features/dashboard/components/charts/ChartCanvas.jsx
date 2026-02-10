/**
 * ChartCanvas Component
 * Renders various chart types on HTML canvas
 */

import { useRef, useEffect, useState } from 'react'
import { CHART_COLORS } from '../../utils/constants'

const ChartCanvas = ({ chartConfig, data, chartType, title }) => {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, value: '', label: '' })
  const elementsRef = useRef([])

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.parentElement.offsetWidth
    canvas.height = 250

    const w = canvas.width
    const h = canvas.height
    const pad = { t: 25, r: 30, b: 70, l: 90 }

    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(title || chartConfig?.title || '', w / 2, 14)

    const xCol = chartConfig?.x_axis_col_name || Object.keys(data[0])[0]
    const yColArr = chartConfig?.y_axis_col_name || []
    const yCol = Array.isArray(yColArr) ? yColArr[0] : yColArr || Object.keys(data[0]).find(k => typeof data[0][k] === 'number')

    let elements = []
    if (chartType === 'horizontal_bar_chart') {
      elements = renderHorizontalBarChart(ctx, data, xCol, yColArr, yCol, w, h, pad)
    } else if (chartType === 'line_chart') {
      elements = renderLineChart(ctx, data, xCol, yCol, w, h, pad)
    } else if (chartType === 'pareto_chart') {
      elements = renderParetoChart(ctx, data, xCol, yCol, w, h, pad, chartConfig)
    } else if (chartType === 'stacked_bar_chart' || chartType === 'vertical_bar_chart') {
      elements = renderVerticalBarChart(ctx, data, xCol, yCol, w, h, pad)
    }
    elementsRef.current = elements
  }, [chartConfig, data, chartType, title])

  const handleMouseMove = (e) => {
    if (!canvasRef.current || elementsRef.current.length === 0) return
    const rect = canvasRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const element = elementsRef.current.find(el => {
      if (el.type === 'point') {
        return Math.abs(el.x - mouseX) < 15 && Math.abs(el.y - mouseY) < 15
      } else if (el.type === 'bar') {
        return mouseX >= el.x && mouseX <= el.x + el.width &&
               mouseY >= el.y && mouseY <= el.y + el.height
      }
      return false
    })

    if (element) {
      setTooltip({
        show: true,
        x: element.type === 'point' ? element.x : element.x + element.width / 2,
        y: element.type === 'point' ? element.y - 10 : element.y,
        value: element.formattedValue,
        label: element.label
      })
    } else {
      setTooltip(prev => prev.show ? { ...prev, show: false } : prev)
    }
  }

  const handleMouseLeave = () => {
    setTooltip(prev => prev.show ? { ...prev, show: false } : prev)
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <canvas ref={canvasRef} className="w-full" />
      {tooltip.show && (
        <div
          className="absolute pointer-events-none bg-slate-900 text-white text-xs px-2 py-1.5 rounded shadow-lg z-10"
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
    </div>
  )
}

const renderHorizontalBarChart = (ctx, data, xCol, yColArr, yCol, w, h, pad) => {
  // For horizontal bar chart: xCol contains labels (categories), yCol contains values (numbers)
  const values = data.map(d => Number(d[yCol]) || Number(d[xCol]) || 0)
  const labels = data.map(d => d[xCol] || d[Object.keys(d)[0]] || '')
  const max = Math.max(...values) * 1.1 || 1
  const barH = (h - pad.t - pad.b) / values.length * 0.8
  const gap = (h - pad.t - pad.b) / values.length * 0.2
  const elements = []

  values.forEach((v, i) => {
    const y = pad.t + i * (barH + gap)
    const barW = (v / max) * (w - pad.l - pad.r)
    ctx.fillStyle = CHART_COLORS[i % CHART_COLORS.length]
    ctx.fillRect(pad.l, y, barW, barH)
    ctx.fillStyle = '#64748b'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'right'
    const labelText = String(labels[i]).length > 12 ? String(labels[i]).substring(0, 11) + '…' : String(labels[i])
    ctx.fillText(labelText, pad.l - 5, y + barH / 2 + 3)
    ctx.textAlign = 'left'
    const valLabel = formatValue(v)
    ctx.fillText(valLabel, pad.l + barW + 5, y + barH / 2 + 3)
    elements.push({ type: 'bar', x: pad.l, y, width: barW, height: barH, label: labels[i], formattedValue: valLabel })
  })
  return elements
}

const renderLineChart = (ctx, data, xCol, yCol, w, h, pad) => {
  const values = data.map(d => Number(d[yCol]) || 0)
  const labels = data.map(d => d[xCol] || '')
  const max = Math.max(...values) * 1.1 || 1
  const elements = []

  ctx.strokeStyle = CHART_COLORS[0]
  ctx.lineWidth = 2
  ctx.beginPath()

  values.forEach((v, i) => {
    const x = pad.l + (i / (values.length - 1 || 1)) * (w - pad.l - pad.r)
    const y = pad.t + (h - pad.t - pad.b) - (v / max) * (h - pad.t - pad.b)
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  })
  ctx.stroke()

  ctx.fillStyle = CHART_COLORS[0]
  values.forEach((v, i) => {
    const x = pad.l + (i / (values.length - 1 || 1)) * (w - pad.l - pad.r)
    const y = pad.t + (h - pad.t - pad.b) - (v / max) * (h - pad.t - pad.b)
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fill()
    elements.push({ type: 'point', x, y, label: labels[i], formattedValue: formatValue(v) })
  })

  ctx.fillStyle = '#64748b'
  ctx.font = '8px sans-serif'
  ctx.textAlign = 'center'
  labels.forEach((l, i) => {
    if (i % Math.ceil(labels.length / 6) === 0) {
      const x = pad.l + (i / (labels.length - 1 || 1)) * (w - pad.l - pad.r)
      ctx.fillText(String(l).substring(0, 7), x, h - 5)
    }
  })
  return elements
}

const renderVerticalBarChart = (ctx, data, xCol, yCol, w, h, pad) => {
  const values = data.map(d => Number(d[yCol]) || Number(d.total_spend) || 0)
  const labels = data.map(d => d[xCol] || d.category || '')
  const max = Math.max(...values) * 1.1 || 1
  const barW = (w - pad.l - pad.r) / values.length * 0.7
  const gap = (w - pad.l - pad.r) / values.length * 0.3
  const elements = []

  values.forEach((v, i) => {
    const x = pad.l + i * (barW + gap) + gap / 2
    const barH = (v / max) * (h - pad.t - pad.b)
    ctx.fillStyle = CHART_COLORS[i % CHART_COLORS.length]
    ctx.fillRect(x, h - pad.b - barH, barW, barH)
    elements.push({ type: 'bar', x, y: h - pad.b - barH, width: barW, height: barH, label: labels[i], formattedValue: formatValue(v) })
  })

  ctx.fillStyle = '#64748b'
  ctx.font = '9px sans-serif'
  ctx.textAlign = 'right'
  labels.forEach((l, i) => {
    const x = pad.l + i * (barW + gap) + gap / 2 + barW / 2
    ctx.save()
    ctx.translate(x, h - pad.b + 12)
    ctx.rotate(-Math.PI / 4)
    const labelText = String(l).length > 12 ? String(l).substring(0, 11) + '…' : String(l)
    ctx.fillText(labelText, 0, 0)
    ctx.restore()
  })
  return elements
}

const renderParetoChart = (ctx, data, xCol, yCol, w, h, pad, chartConfig) => {
  // Get value and cumulative columns
  const valueCol = yCol || chartConfig?.value_col_name || 'value'
  const cumulativeCol = chartConfig?.cumulative_line || 'cumulative_pct'

  const values = data.map(d => Number(d[valueCol]) || Number(d.value) || Number(d.amount) || 0)
  const labels = data.map(d => d[xCol] || d.category || d.label || '')
  const cumulatives = data.map(d => Number(d[cumulativeCol]) || Number(d.cumulative_pct) || Number(d.cumulative) || 0)

  const maxVal = Math.max(...values) * 1.1 || 1
  const barW = (w - pad.l - pad.r) / values.length * 0.7
  const gap = (w - pad.l - pad.r) / values.length * 0.3
  const elements = []

  // Draw bars
  values.forEach((v, i) => {
    const x = pad.l + i * (barW + gap) + gap / 2
    const barH = (v / maxVal) * (h - pad.t - pad.b)
    ctx.fillStyle = CHART_COLORS[i % CHART_COLORS.length]
    ctx.fillRect(x, h - pad.b - barH, barW, barH)
    elements.push({
      type: 'bar',
      x,
      y: h - pad.b - barH,
      width: barW,
      height: barH,
      label: labels[i],
      formattedValue: `${formatValue(v)} (${cumulatives[i]?.toFixed ? cumulatives[i].toFixed(1) : cumulatives[i]}%)`
    })
  })

  // Draw cumulative line (right Y-axis, 0-100%)
  if (cumulatives.some(c => c > 0)) {
    ctx.strokeStyle = '#ef4444' // Red color for cumulative line
    ctx.lineWidth = 2
    ctx.beginPath()

    cumulatives.forEach((c, i) => {
      const x = pad.l + i * (barW + gap) + gap / 2 + barW / 2
      const y = pad.t + (h - pad.t - pad.b) - (c / 100) * (h - pad.t - pad.b)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke()

    // Draw points on cumulative line
    ctx.fillStyle = '#ef4444'
    cumulatives.forEach((c, i) => {
      const x = pad.l + i * (barW + gap) + gap / 2 + barW / 2
      const y = pad.t + (h - pad.t - pad.b) - (c / 100) * (h - pad.t - pad.b)
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fill()
      elements.push({
        type: 'point',
        x,
        y,
        label: `${labels[i]} (Cumulative)`,
        formattedValue: `${c?.toFixed ? c.toFixed(1) : c}%`
      })
    })

    // Draw right Y-axis labels (percentages)
    ctx.fillStyle = '#ef4444'
    ctx.font = '8px sans-serif'
    ctx.textAlign = 'left'
    for (let i = 0; i <= 4; i++) {
      const pct = i * 25
      const y = pad.t + (h - pad.t - pad.b) - (pct / 100) * (h - pad.t - pad.b)
      ctx.fillText(`${pct}%`, w - pad.r + 5, y + 3)
    }
  }

  // Draw X-axis labels
  ctx.fillStyle = '#64748b'
  ctx.font = '9px sans-serif'
  ctx.textAlign = 'right'
  labels.forEach((l, i) => {
    const x = pad.l + i * (barW + gap) + gap / 2 + barW / 2
    ctx.save()
    ctx.translate(x, h - pad.b + 12)
    ctx.rotate(-Math.PI / 4)
    const labelText = String(l).length > 12 ? String(l).substring(0, 11) + '…' : String(l)
    ctx.fillText(labelText, 0, 0)
    ctx.restore()
  })

  // Draw left Y-axis labels (values)
  ctx.fillStyle = '#64748b'
  ctx.textAlign = 'right'
  for (let i = 0; i <= 4; i++) {
    const v = maxVal * (4 - i) / 4
    const y = pad.t + (i / 4) * (h - pad.t - pad.b)
    ctx.fillText(formatValue(v), pad.l - 5, y + 3)
  }

  return elements
}

const formatValue = (v) => {
  const num = Number(v) || 0
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(0) + 'K'
  return num.toFixed(0)
}

export default ChartCanvas
