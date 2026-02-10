/**
 * useDashboardData Hook
 * Manages dashboard data fetching and state
 */

import { useState, useCallback } from 'react'
import { authFetch, Cookies } from '../utils/auth'

const useDashboardData = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)
  const [progressMsg, setProgressMsg] = useState('Initializing...')
  const [kpiCards, setKpiCards] = useState([])
  const [kpiResults, setKpiResults] = useState([])
  const [alerts, setAlerts] = useState([])
  const [insights, setInsights] = useState({})

  const fetchData = useCallback(async () => {
    if (!Cookies.get('access_token')) {
      setError('Please login')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    setProgress(0)
    setKpiCards([])
    setAlerts([])
    setInsights({})
    setProgressMsg('Connecting...')

    try {
      const res = await authFetch('/dashboards/process-kpis-with-summaries', {
        method: 'POST',
        headers: { 'Accept': 'text/event-stream' },
        body: JSON.stringify({
          persona: 'CFO',
          goal: 'strategic financial insights',
          catalog: 'finance_fusion_catalog',
          schema: 'finance_fusion_catalog'
        })
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.progress !== undefined) setProgress(data.progress)
              if (data.message) setProgressMsg(data.message)

              if (data.status === 'card_ready' && data.card) {
                setKpiCards(prev =>
                  prev.find(c => c.id === data.card.id)
                    ? prev.map(c => c.id === data.card.id ? data.card : c)
                    : [...prev, data.card]
                )
              }

              if (data.status === 'alert_ready' && data.alert) {
                setAlerts(prev => [...prev, data.alert])
              }

              if (data.status === 'insight_ready' && data.insight_type && data.data) {
                setInsights(prev => ({ ...prev, [data.insight_type]: data.data }))
              }

              if (data.status === 'completed' && data.result) {
                setKpiCards(data.result.kpi_cards || [])
                setKpiResults(data.result.kpi_results || [])
                if (data.result.proactive_agents?.agent_findings) {
                  setAlerts(data.result.proactive_agents.agent_findings)
                }
                setLoading(false)
              }
            } catch {}
          }
        }
      }
    } catch (e) {
      if (e.message !== 'Unauthorized') setError(e.message)
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    progress,
    progressMsg,
    kpiCards,
    kpiResults,
    alerts,
    insights,
    fetchData
  }
}

export default useDashboardData
