/**
 * AI Chart Query Modal
 * Allows users to query existing charts with AI
 */

import { useState, useRef, useEffect } from 'react'
import { X, Send, Sparkles, Loader2, MoreVertical } from 'lucide-react'
import { post } from '@shared/services/api.service'

const CHART_TYPES = [
  { value: 'line_chart', label: 'Line Chart', icon: '📈' },
  { value: 'stacked_bar_chart', label: 'Stacked Bar', icon: '📊' },
  { value: 'vertical_bar_chart', label: 'Vertical Bar', icon: '📊' },
  { value: 'horizontal_bar_chart', label: 'Horizontal Bar', icon: '📊' },
  { value: 'pie_chart', label: 'Pie Chart', icon: '🥧' },
  { value: 'pareto_chart', label: 'Pareto Chart', icon: '📊' },
  { value: 'funnel_chart', label: 'Funnel Chart', icon: '🔻' },
  { value: 'area_chart', label: 'Area Chart', icon: '🏔️' },
  { value: 'bubble_map_chart', label: 'Bubble Map', icon: '🗺️' },
  { value: 'clustered_bar_chart', label: 'Clustered Bar', icon: '📊' },
]

const AIChartQueryModal = ({ isOpen, onClose, chartData, onChartUpdate, onSimpleAnswer }) => {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showChartTypeSelector, setShowChartTypeSelector] = useState(false)
  const [selectedChartType, setSelectedChartType] = useState(null)
  const [showChartTypeMenu, setShowChartTypeMenu] = useState(false)
  const menuRef = useRef(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowChartTypeMenu(false)
      }
    }

    if (showChartTypeMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showChartTypeMenu])

  if (!isOpen || !chartData) return null

  // Normalize chart data to match backend expected structure
  const buildRequestBody = (queryText) => {
    const normalizedChartData = {
      ...chartData,
      sql_query: chartData.sql_query || chartData.chart_sql || '',
      kpi: chartData.kpi || {
        title: chartData.title || 'Chart',
        description: chartData.description || '',
        chart_type: chartData.chart_type || ''
      }
    }

    return {
      query: queryText,
      chart_data: normalizedChartData,
      catalog: chartData.catalog || 'finance_fusion_catalog',
      schema: chartData.schema || 'finance_fusion_catalog',
      persona: chartData.persona || 'CFO',
      schema_text: chartData.schema_text || '',
      chart_id: chartData.chart_id || null
    }
  }

  const handleSubmit = async () => {
    if (!query.trim() || isLoading) return

    setIsLoading(true)
    setError(null)
    setShowChartTypeSelector(false)

    try {
      const requestBody = buildRequestBody(query.trim())

      const response = await post('/conversational-bi/query-chart', requestBody)

      // Handle different intents
      if (response.intent === 'simple_question') {
        // Show answer directly in AI agent chat
        if (onSimpleAnswer) {
          onSimpleAnswer({
            question: query.trim(),
            answer: response.answer,
            chartData,
            suggestedActions: response.suggested_actions || []
          })
        }
        onClose()
      } else if (response.intent === 'change_chart_type') {
        // Show chart type selector or update chart if type already provided
        if (response.new_chart_type && response.new_chart_config) {
          onChartUpdate({
            ...chartData,
            chart_type: response.new_chart_type,
            chart_config: response.new_chart_config,
            data: response.data || chartData.data
          })
          onClose()
        } else {
          setShowChartTypeSelector(true)
        }
      } else if (response.intent === 'filter_data') {
        // Update chart with filtered data
        if (response.data && response.data.length > 0) {
          onChartUpdate({
            ...chartData,
            data: response.data,
            chart_config: response.chart_config || chartData.chart_config
          })
          onClose()
        } else {
          setError(response.answer || 'No data available after filtering')
        }
      } else {
        // Default: show the answer
        setError(response.answer || 'Query processed successfully')
      }

      setQuery('')
    } catch (err) {
      console.error('AI Chart Query Error:', err)
      setError(err.message || 'Failed to process query. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChartTypeSelect = async (chartType) => {
    setSelectedChartType(chartType)
    setIsLoading(true)
    setError(null)
    setShowChartTypeMenu(false)

    try {
      const requestBody = buildRequestBody(`Change to ${chartType.label}`)

      const response = await post('/conversational-bi/query-chart', requestBody)

      if (response.new_chart_type && response.new_chart_config) {
        onChartUpdate({
          ...chartData,
          chart_type: response.new_chart_type,
          chart_config: response.new_chart_config,
          data: response.data || chartData.data
        })
        onClose()
      } else {
        setError('Failed to change chart type')
      }
    } catch (err) {
      console.error('Chart Type Change Error:', err)
      setError(err.message || 'Failed to change chart type')
    } finally {
      setIsLoading(false)
      setShowChartTypeSelector(false)
      setSelectedChartType(null)
    }
  }

  const suggestedQueries = [
    "What's the trend?",
    "Show top 5",
    "Filter by last month",
    "Change to pie chart"
  ]

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-amber-50 to-white">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-amber-600" />
            <h2 className="font-serif text-lg font-semibold text-slate-900">
              Ask AI About This Chart
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto">
          {/* Chart Info */}
          <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-900">
                  {chartData.kpi?.title || chartData.title || 'Chart'}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {chartData.kpi?.description || chartData.description || ''}
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  Type: <span className="font-mono">{chartData.kpi?.chart_type || chartData.chart_type || 'Unknown'}</span>
                </div>
              </div>
              {/* Chart Type Menu */}
              <div className="relative ml-2" ref={menuRef}>
                <button
                  onClick={() => setShowChartTypeMenu(!showChartTypeMenu)}
                  disabled={isLoading}
                  className="p-2 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Change chart type"
                >
                  <MoreVertical size={16} className="text-slate-600" />
                </button>

                {showChartTypeMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 w-56 max-h-80 overflow-y-auto">
                    <div className="p-2 border-b border-slate-100">
                      <div className="text-xs font-semibold text-slate-600 uppercase">Change Chart Type</div>
                    </div>
                    <div className="p-1">
                      {CHART_TYPES.map((chartType) => (
                        <button
                          key={chartType.value}
                          onClick={() => handleChartTypeSelect(chartType)}
                          disabled={isLoading || chartType.value === (chartData.kpi?.chart_type || chartData.chart_type)}
                          className={`w-full flex items-center gap-2 p-2 rounded hover:bg-amber-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-left ${
                            chartType.value === (chartData.kpi?.chart_type || chartData.chart_type) ? 'bg-amber-100' : ''
                          }`}
                        >
                          <span className="text-lg">{chartType.icon}</span>
                          <span className="text-sm text-slate-700">{chartType.label}</span>
                          {chartType.value === (chartData.kpi?.chart_type || chartData.chart_type) && (
                            <span className="ml-auto text-xs text-amber-600">Current</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Chart Type Selector */}
          {showChartTypeSelector && (
            <div className="mb-4">
              <div className="text-sm font-medium text-slate-700 mb-3">
                Select Chart Type:
              </div>
              <div className="grid grid-cols-2 gap-2">
                {CHART_TYPES.map((chartType) => (
                  <button
                    key={chartType.value}
                    onClick={() => handleChartTypeSelect(chartType)}
                    disabled={isLoading}
                    className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-amber-50 hover:border-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                  >
                    <span className="text-2xl">{chartType.icon}</span>
                    <span className="text-sm font-medium text-slate-700">
                      {chartType.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Query Input */}
          {!showChartTypeSelector && (
            <>
              <div className="mb-3">
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Ask a question or give a command:
                </label>
                <div className="flex gap-2">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., Show top 5 items or Change to bar chart"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={!query.trim() || isLoading}
                    className="bg-amber-600 text-white rounded-lg px-4 py-2 hover:bg-amber-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm">Processing...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span className="text-sm">Send</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Suggested Queries */}
              <div>
                <div className="text-xs text-slate-500 mb-2">Try these:</div>
                <div className="flex flex-wrap gap-2">
                  {suggestedQueries.map((suggested, idx) => (
                    <button
                      key={idx}
                      onClick={() => setQuery(suggested)}
                      disabled={isLoading}
                      className="text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {suggested}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50">
          <div className="text-xs text-slate-500 text-center">
            AI can help you analyze data, change chart types, or apply filters
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIChartQueryModal
