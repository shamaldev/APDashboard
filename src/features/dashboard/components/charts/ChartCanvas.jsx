/**
 * ChartCanvas Component
 * Renders various chart types on HTML canvas
 */

import { useRef, useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { CHART_COLORS } from '../../utils/constants'

const ChartCanvas = ({ chartConfig, data, chartType, title, onAIClick, showAIButton = false }) => {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, value: '', label: '' })
  const elementsRef = useRef([])

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.parentElement.offsetWidth
    canvas.height = chartType === 'horizontal_bar_chart' && data.length > 8 ? 320 : 270

    const w = canvas.width
    const h = canvas.height
    const pad = { t: title ? 25 : 12, r: 30, b: 60, l: 55 }

    ctx.clearRect(0, 0, w, h)

    // Only draw title on canvas if explicitly provided (ChatMessage renders it in HTML)
    if (title) {
      ctx.fillStyle = '#1e293b'
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(title, w / 2, 14)
    }

    const xCol = chartConfig?.x_axis_col_name || Object.keys(data[0])[0]
    const yColArr = chartConfig?.y_axis_col_name || []
    const yCol = Array.isArray(yColArr) ? yColArr[0] : yColArr || Object.keys(data[0]).find(k => typeof data[0][k] === 'number')

    let elements = []
    if (chartType === 'horizontal_bar_chart') {
      elements = renderHorizontalBarChart(ctx, data, xCol, yColArr, yCol, w, h, pad)
    } else if (chartType === 'line_chart' || chartType === 'area_chart') {
      elements = renderLineChart(ctx, data, xCol, yCol, w, h, pad, chartType === 'area_chart')
    } else if (chartType === 'pareto_chart') {
      elements = renderParetoChart(ctx, data, xCol, yCol, w, h, pad, chartConfig)
    } else if (chartType === 'stacked_bar_chart' || chartType === 'vertical_bar_chart') {
      elements = renderVerticalBarChart(ctx, data, xCol, yCol, w, h, pad)
    } else if (chartType === 'pie_chart') {
      elements = renderPieChart(ctx, data, chartConfig, w, h)
    } else if (chartType === 'clustered_bar_chart') {
      elements = renderClusteredBarChart(ctx, data, chartConfig, w, h, pad)
    } else if (chartType === 'funnel_chart') {
      elements = renderFunnelChart(ctx, data, chartConfig, w, h, pad)
    } else {
      // Fallback to vertical bar chart for unsupported types
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
      {/* AI Button */}
      {showAIButton && onAIClick && (
        <button
          onClick={onAIClick}
          className="absolute top-2 right-2 z-20 bg-white hover:bg-amber-50 text-amber-600 p-1.5 rounded-lg border border-amber-200 shadow-sm transition-all hover:shadow-md group"
          title="Ask AI about this chart"
        >
          <Sparkles size={16} className="group-hover:scale-110 transition-transform" />
        </button>
      )}

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
  // For horizontal bar charts: x_axis = value axis (horizontal), y_axis = category axis (vertical)
  const yColName = Array.isArray(yColArr) ? yColArr[0] : yColArr
  const labelCol = yColName || Object.keys(data[0]).find(k => typeof data[0][k] === 'string') || Object.keys(data[0])[0]
  let valueCol = xCol

  // Get values from the configured column
  let values = data.map(d => Number(d[valueCol]) || 0)

  // Fallback: if all values are 0/null, find a numeric column with real data
  if (values.every(v => v === 0)) {
    const numericCols = Object.keys(data[0]).filter(k =>
      k !== labelCol && data.some(d => d[k] !== null && d[k] !== undefined && !isNaN(Number(d[k])) && Number(d[k]) !== 0)
    )
    if (numericCols.length > 0) {
      valueCol = numericCols[0]
      values = data.map(d => Number(d[valueCol]) || 0)
    }
  }

  const labels = data.map(d => d[labelCol] || '')
  const max = Math.max(...values) * 1.1 || 1

  // Dynamic left padding based on longest label
  ctx.font = '10px sans-serif'
  const maxLabelWidth = Math.max(...labels.map(l => ctx.measureText(String(l).substring(0, 18)).width))
  const leftPad = Math.max(pad.l, maxLabelWidth + 15)

  const barH = Math.min(20, (h - pad.t - pad.b) / values.length * 0.75)
  const gap = (h - pad.t - pad.b - barH * values.length) / (values.length + 1)
  const elements = []

  // Draw gridlines
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 0.5
  for (let i = 0; i <= 4; i++) {
    const x = leftPad + (i / 4) * (w - leftPad - pad.r)
    ctx.beginPath()
    ctx.moveTo(x, pad.t)
    ctx.lineTo(x, h - pad.b)
    ctx.stroke()

    // X-axis labels
    ctx.fillStyle = '#94a3b8'
    ctx.font = '9px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(formatValue(max * i / 4), x, h - pad.b + 14)
  }

  values.forEach((v, i) => {
    const y = pad.t + gap + i * (barH + gap)
    const barW = Math.max(1, (v / max) * (w - leftPad - pad.r))

    // Bar with rounded end
    ctx.fillStyle = CHART_COLORS[i % CHART_COLORS.length]
    ctx.beginPath()
    drawRoundRect(ctx, leftPad, y, barW, barH, [0, 3, 3, 0])
    ctx.fill()

    // Label on the left
    ctx.fillStyle = '#334155'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'right'
    const labelText = String(labels[i]).length > 18 ? String(labels[i]).substring(0, 17) + '…' : String(labels[i])
    ctx.fillText(labelText, leftPad - 8, y + barH / 2 + 3)

    // Value at end of bar
    ctx.fillStyle = '#64748b'
    ctx.textAlign = 'left'
    const valLabel = formatValue(v)
    ctx.fillText(valLabel, leftPad + barW + 5, y + barH / 2 + 3)

    elements.push({ type: 'bar', x: leftPad, y, width: barW, height: barH, label: labels[i], formattedValue: valLabel })
  })
  return elements
}

const renderLineChart = (ctx, data, xCol, yCol, w, h, pad, isAreaChart = false) => {
  const values = data.map(d => Number(d[yCol]) || 0)
  const labels = data.map(d => d[xCol] || '')
  const max = Math.max(...values) * 1.1 || 1
  const min = Math.min(...values) * 0.9
  const range = max - min || 1
  const chartW = w - pad.l - pad.r
  const chartH = h - pad.t - pad.b
  const elements = []

  // Draw horizontal gridlines and Y-axis labels
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 0.5
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (i / 4) * chartH
    ctx.beginPath()
    ctx.moveTo(pad.l, y)
    ctx.lineTo(w - pad.r, y)
    ctx.stroke()

    ctx.fillStyle = '#94a3b8'
    ctx.font = '9px sans-serif'
    ctx.textAlign = 'right'
    const val = max - (i / 4) * range
    ctx.fillText(formatValue(val), pad.l - 8, y + 3)
  }

  // Calculate point positions
  const getX = (i) => pad.l + (i / (values.length - 1 || 1)) * chartW
  const getY = (v) => pad.t + chartH - ((v - min) / range) * chartH

  // Fill area if area chart
  if (isAreaChart) {
    ctx.fillStyle = 'rgba(180,134,46,0.12)'
    ctx.beginPath()
    ctx.moveTo(getX(0), h - pad.b)
    values.forEach((v, i) => ctx.lineTo(getX(i), getY(v)))
    ctx.lineTo(getX(values.length - 1), h - pad.b)
    ctx.closePath()
    ctx.fill()
  }

  // Draw line with smooth curve
  ctx.strokeStyle = CHART_COLORS[0]
  ctx.lineWidth = 2.5
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.beginPath()
  values.forEach((v, i) => {
    i === 0 ? ctx.moveTo(getX(i), getY(v)) : ctx.lineTo(getX(i), getY(v))
  })
  ctx.stroke()

  // Draw points with white border
  values.forEach((v, i) => {
    const x = getX(i)
    const y = getY(v)

    // White border
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fill()

    // Colored center
    ctx.fillStyle = CHART_COLORS[0]
    ctx.beginPath()
    ctx.arc(x, y, 3.5, 0, Math.PI * 2)
    ctx.fill()

    elements.push({ type: 'point', x, y, label: labels[i], formattedValue: formatValue(v) })
  })

  // Draw X-axis labels
  ctx.fillStyle = '#475569'
  ctx.font = '9px sans-serif'
  ctx.textAlign = 'center'
  const labelStep = Math.max(1, Math.ceil(labels.length / 8))
  labels.forEach((l, i) => {
    if (i % labelStep === 0 || i === labels.length - 1) {
      const x = getX(i)
      // Format date labels nicely
      let labelText = String(l)
      if (labelText.match(/^\d{4}-\d{2}/)) {
        const d = new Date(labelText)
        if (!isNaN(d)) labelText = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
      } else {
        labelText = labelText.length > 10 ? labelText.substring(0, 9) + '…' : labelText
      }
      ctx.fillText(labelText, x, h - pad.b + 14)
    }
  })
  return elements
}

const renderVerticalBarChart = (ctx, data, xCol, yCol, w, h, pad) => {
  const values = data.map(d => Number(d[yCol]) || Number(d.total_spend) || 0)
  const labels = data.map(d => d[xCol] || d.category || '')
  const max = Math.max(...values) * 1.1 || 1
  const chartW = w - pad.l - pad.r
  const chartH = h - pad.t - pad.b
  const barW = chartW / values.length * 0.65
  const gap = chartW / values.length * 0.35
  const elements = []

  // Draw horizontal gridlines and Y-axis labels
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 0.5
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (i / 4) * chartH
    ctx.beginPath()
    ctx.moveTo(pad.l, y)
    ctx.lineTo(w - pad.r, y)
    ctx.stroke()

    ctx.fillStyle = '#94a3b8'
    ctx.font = '9px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(formatValue(max * (4 - i) / 4), pad.l - 8, y + 3)
  }

  // Draw bars
  values.forEach((v, i) => {
    const x = pad.l + i * (barW + gap) + gap / 2
    const barH = (v / max) * chartH
    ctx.fillStyle = CHART_COLORS[i % CHART_COLORS.length]
    ctx.beginPath()
    drawRoundRect(ctx, x, h - pad.b - barH, barW, barH, [3, 3, 0, 0])
    ctx.fill()

    // Value on top of bar
    ctx.fillStyle = '#475569'
    ctx.font = '9px sans-serif'
    ctx.textAlign = 'center'
    if (v > 0) ctx.fillText(formatValue(v), x + barW / 2, h - pad.b - barH - 4)

    elements.push({ type: 'bar', x, y: h - pad.b - barH, width: barW, height: barH, label: labels[i], formattedValue: formatValue(v) })
  })

  // Draw X-axis labels (smarter truncation based on available width)
  ctx.fillStyle = '#475569'
  ctx.font = '9px sans-serif'
  const maxLabelLen = Math.max(8, Math.floor((barW + gap) / 5))
  labels.forEach((l, i) => {
    const x = pad.l + i * (barW + gap) + gap / 2 + barW / 2
    ctx.save()
    ctx.translate(x, h - pad.b + 10)
    ctx.rotate(-Math.PI / 6)
    ctx.textAlign = 'right'
    const labelText = String(l).length > maxLabelLen ? String(l).substring(0, maxLabelLen - 1) + '…' : String(l)
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

const renderPieChart = (ctx, data, chartConfig, w, h) => {
  const categoryCol = chartConfig?.category_col_name || Object.keys(data[0])[0]
  const valueCol = chartConfig?.value_col_name || Object.keys(data[0]).find(k => typeof data[0][k] === 'number')

  const values = data.map(d => Number(d[valueCol]) || 0)
  const labels = data.map(d => d[categoryCol] || '')
  const total = values.reduce((a, b) => a + b, 0) || 1

  // Position pie to the right, legend to the left
  const legendWidth = 140
  const centerX = legendWidth + (w - legendWidth) / 2
  const centerY = h / 2
  const radius = Math.min(w - legendWidth, h) * 0.35
  const elements = []

  let currentAngle = -Math.PI / 2

  values.forEach((v, i) => {
    const sliceAngle = (v / total) * Math.PI * 2
    const endAngle = currentAngle + sliceAngle
    const midAngle = currentAngle + sliceAngle / 2

    // Draw slice
    ctx.fillStyle = CHART_COLORS[i % CHART_COLORS.length]
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, radius, currentAngle, endAngle)
    ctx.closePath()
    ctx.fill()

    // Draw percentage inside slice (only if large enough)
    const pct = ((v / total) * 100).toFixed(0) + '%'
    if (sliceAngle > 0.3) {
      const labelX = centerX + Math.cos(midAngle) * radius * 0.65
      const labelY = centerY + Math.sin(midAngle) * radius * 0.65
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(pct, labelX, labelY)
    }

    elements.push({
      type: 'slice',
      x: centerX + Math.cos(midAngle) * radius * 0.5,
      y: centerY + Math.sin(midAngle) * radius * 0.5,
      width: radius * 0.5,
      height: radius * 0.5,
      label: labels[i],
      formattedValue: `${formatValue(v)} (${pct})`
    })

    currentAngle = endAngle
  })

  // Draw legend on the left side
  const legendStartY = Math.max(15, (h - labels.length * 22) / 2)
  labels.forEach((label, i) => {
    const x = 10
    const y = legendStartY + i * 22

    // Color dot
    ctx.fillStyle = CHART_COLORS[i % CHART_COLORS.length]
    ctx.beginPath()
    ctx.arc(x + 5, y, 5, 0, Math.PI * 2)
    ctx.fill()

    // Label text
    ctx.fillStyle = '#334155'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(String(label).substring(0, 22), x + 15, y + 3)

    // Value below label
    const pct = ((values[i] / total) * 100).toFixed(1) + '%'
    ctx.fillStyle = '#94a3b8'
    ctx.font = '9px sans-serif'
    ctx.fillText(`${formatValue(values[i])} (${pct})`, x + 15, y + 14)
  })

  return elements
}

const renderClusteredBarChart = (ctx, data, chartConfig, w, h, pad) => {
  const xCol = chartConfig?.x_axis_col_name || Object.keys(data[0])[0]
  const yCol = chartConfig?.y_axis_col_name || Object.keys(data[0]).find(k => typeof data[0][k] === 'number')
  const clusterCol = chartConfig?.cluster_by || 'cluster'

  // Group data by x category and cluster
  const grouped = {}
  data.forEach(d => {
    const category = d[xCol] || 'Unknown'
    const cluster = d[clusterCol] || 'Default'
    if (!grouped[category]) grouped[category] = {}
    grouped[category][cluster] = Number(d[yCol]) || 0
  })

  const categories = Object.keys(grouped)
  const clusters = [...new Set(data.map(d => d[clusterCol] || 'Default'))]
  const allValues = data.map(d => Number(d[yCol]) || 0)
  const max = Math.max(...allValues) * 1.1 || 1

  const categoryWidth = (w - pad.l - pad.r) / categories.length
  const clusterWidth = categoryWidth * 0.8 / clusters.length
  const gap = categoryWidth * 0.2
  const elements = []

  categories.forEach((category, catIdx) => {
    clusters.forEach((cluster, clusterIdx) => {
      const value = grouped[category][cluster] || 0
      const x = pad.l + catIdx * categoryWidth + gap / 2 + clusterIdx * clusterWidth
      const barH = (value / max) * (h - pad.t - pad.b)

      ctx.fillStyle = CHART_COLORS[clusterIdx % CHART_COLORS.length]
      ctx.fillRect(x, h - pad.b - barH, clusterWidth, barH)

      elements.push({
        type: 'bar',
        x,
        y: h - pad.b - barH,
        width: clusterWidth,
        height: barH,
        label: `${category} - ${cluster}`,
        formattedValue: formatValue(value)
      })
    })
  })

  // Draw category labels
  ctx.fillStyle = '#64748b'
  ctx.font = '9px sans-serif'
  ctx.textAlign = 'center'
  categories.forEach((cat, i) => {
    const x = pad.l + i * categoryWidth + categoryWidth / 2
    ctx.fillText(String(cat).substring(0, 10), x, h - pad.b + 15)
  })

  return elements
}

const renderFunnelChart = (ctx, data, chartConfig, w, h, pad) => {
  const stagesCol = chartConfig?.stages_col_name || Object.keys(data[0])[0]
  const valueCol = chartConfig?.value_col_name || Object.keys(data[0]).find(k => typeof data[0][k] === 'number')

  const stages = data.map(d => d[stagesCol] || '')
  const values = data.map(d => Number(d[valueCol]) || 0)
  const max = Math.max(...values) || 1

  const chartHeight = h - pad.t - pad.b
  const stageHeight = chartHeight / stages.length
  const elements = []

  values.forEach((v, i) => {
    const topWidth = (v / max) * (w - pad.l - pad.r) * 0.9
    const bottomWidth = i < values.length - 1 ? (values[i + 1] / max) * (w - pad.l - pad.r) * 0.9 : topWidth * 0.8

    const y = pad.t + i * stageHeight
    const centerX = w / 2

    // Draw trapezoid
    ctx.fillStyle = CHART_COLORS[i % CHART_COLORS.length]
    ctx.beginPath()
    ctx.moveTo(centerX - topWidth / 2, y)
    ctx.lineTo(centerX + topWidth / 2, y)
    ctx.lineTo(centerX + bottomWidth / 2, y + stageHeight)
    ctx.lineTo(centerX - bottomWidth / 2, y + stageHeight)
    ctx.closePath()
    ctx.fill()

    // Draw stage label
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(String(stages[i]).substring(0, 20), centerX, y + stageHeight / 2)

    // Draw value
    ctx.font = '9px sans-serif'
    ctx.fillText(formatValue(v), centerX, y + stageHeight / 2 + 15)

    elements.push({
      type: 'bar',
      x: centerX - topWidth / 2,
      y,
      width: topWidth,
      height: stageHeight,
      label: stages[i],
      formattedValue: formatValue(v)
    })
  })

  return elements
}

// Polyfill roundRect for older browsers
const drawRoundRect = (ctx, x, y, w, h, radii) => {
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, radii)
  } else {
    const r = typeof radii === 'number' ? radii : (radii[0] || 0)
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }
}

const formatValue = (v) => {
  const num = Number(v) || 0
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(0) + 'K'
  return num.toFixed(0)
}

export default ChartCanvas
