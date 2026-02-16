/**
 * AgingChart Component
 * Dynamic chart for AP aging distribution
 */

import { useState, useMemo } from 'react'
import { Sparkles } from 'lucide-react'
import { AGING_COLORS } from '../../utils/constants'
import AIChartQueryModal from '../modals/AIChartQueryModal'
import ChartCanvas from './ChartCanvas'

const AgingChart = ({ data }) => {
  const [showAIModal, setShowAIModal] = useState(false)
  const [chartType, setChartType] = useState('vertical_bar_chart')
  const [chartConfig, setChartConfig] = useState({
    x_axis_col_name: 'bucket',
    y_axis_col_name: ['amount_inr'],
    title: 'AP Aging Distribution'
  })
  const [chartData, setChartData] = useState(data || [])

  // Update chart data when prop changes
  useMemo(() => {
    if (data) setChartData(data)
  }, [data])

  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, data: null })

  // Prepare chart data for AI modal
  const aiChartData = {
    kpi: {
      title: 'AP Aging Distribution',
      description: 'Distribution of accounts payable by aging bucket',
      chart_type: chartType
    },
    data: chartData,
    chart_type: chartType,
    chart_config: chartConfig,
    catalog: 'finance_fusion_catalog',
    schema: 'finance_fusion_catalog',
    persona: 'CFO'
  }

  // Handle chart updates from AI
  const handleChartUpdate = (updatedChart) => {
    if (updatedChart.chart_type) setChartType(updatedChart.chart_type)
    if (updatedChart.chart_config) setChartConfig(updatedChart.chart_config)
    if (updatedChart.data) setChartData(updatedChart.data)
  }

  const agingData = data ? processAgingData(data) : []

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-serif text-base font-medium text-slate-900">AP Aging Distribution</h3>
        <button
          onClick={() => setShowAIModal(true)}
          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 p-1 rounded transition-all"
          title="Ask AI about this chart"
        >
          <Sparkles size={16} />
        </button>
      </div>
      <div className="p-4">
        {chartData && chartData.length > 0 ? (
          chartType === 'vertical_bar_chart' ? (
            // Use original custom rendering for default vertical bar chart
            <>
              {/* Values */}
              <div className="flex gap-0.5 mb-2">
                {agingData.map(a => (
                  <div key={a.label} className="flex-1 text-center">
                    <div className="font-mono text-xs font-semibold text-slate-900">{a.amount}</div>
                    <div className="text-[9px] text-slate-500">{a.pct}</div>
                  </div>
                ))}
              </div>

              {/* Bars */}
              <div
                className="flex gap-0.5 h-36 items-end mb-2 relative"
                onMouseLeave={() => setTooltip(prev => prev.show ? { ...prev, show: false } : prev)}
              >
                {agingData.map((a, idx) => (
                  <div
                    key={a.label}
                    className={`flex-1 rounded-t ${a.color} transition-all hover:opacity-80 cursor-pointer`}
                    style={{ height: `${a.h}%` }}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      const parentRect = e.currentTarget.parentElement.getBoundingClientRect()
                      setTooltip({
                        show: true,
                        x: rect.left - parentRect.left + rect.width / 2,
                        y: rect.top - parentRect.top,
                        data: a
                      })
                    }}
                  />
                ))}
                {tooltip.show && tooltip.data && (
                  <div
                    className="absolute pointer-events-none bg-slate-900 text-white text-xs px-2 py-1.5 rounded shadow-lg z-10"
                    style={{
                      left: tooltip.x,
                      top: tooltip.y,
                      transform: 'translate(-50%, -100%)'
                    }}
                  >
                    <div className="font-medium">{tooltip.data.label}</div>
                    <div className="text-amber-300">{tooltip.data.amount}</div>
                    <div className="text-slate-300">{tooltip.data.pct} of total</div>
                  </div>
                )}
              </div>

              {/* Labels */}
              <div className="flex gap-0.5">
                {agingData.map(a => (
                  <div key={a.label} className="flex-1 text-center text-[8px] text-slate-500 truncate">
                    {a.label}
                  </div>
                ))}
              </div>
            </>
          ) : (
            // Use ChartCanvas for other chart types
            <ChartCanvas
              chartConfig={chartConfig}
              data={chartData}
              chartType={chartType}
              title={chartConfig.title}
            />
          )
        ) : (
          <div className="h-36 flex items-center justify-center text-slate-400 text-sm">
            No data
          </div>
        )}
      </div>

      {/* AI Chart Query Modal */}
      <AIChartQueryModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        chartData={aiChartData}
        onChartUpdate={handleChartUpdate}
      />
    </div>
  )
}

const processAgingData = (data) => {
  const buckets = {}
  data.forEach(d => {
    const b = d.bucket || 'Unknown'
    buckets[b] = (buckets[b] || 0) + (d.amount_inr || 0)
  })

  const total = Object.values(buckets).reduce((a, b) => a + b, 0)
  const sorted = Object.entries(buckets).sort((a, b) => a[0].localeCompare(b[0]))
  const maxVal = Math.max(...sorted.map(([, v]) => v))

  return sorted.map(([label, val], i) => ({
    label: label.replace(/^\d\.\s*/, ''),
    amount: (val / 1e9).toFixed(2) + 'B',
    pct: ((val / total) * 100).toFixed(1) + '%',
    h: (val / maxVal) * 100,
    color: AGING_COLORS[i] || AGING_COLORS[5]
  }))
}

export default AgingChart
