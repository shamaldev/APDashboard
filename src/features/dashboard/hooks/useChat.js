/**
 * useChat Hook
 * Manages AI chat state and API interactions
 * Handles: greeting, out_of_scope, simple, complex_why query types
 */

import { useState, useCallback } from 'react'
import { authFetch, Cookies, handle401 } from '../utils/auth'
import { getAIGreeting } from '../utils/helpers'

const useChat = (userName) => {
  const now = new Date()
  const hour = now.getHours()
  const dayOfWeek = now.getDay()

  const [agentMessages, setAgentMessages] = useState([
    { text: getAIGreeting(userName, hour, dayOfWeek), sender: 'ai' }
  ])
  const [agentInput, setAgentInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [activeCard, setActiveCard] = useState(null)
  const [conversationId, setConversationId] = useState(null)
  const [isLoadingConversation, setIsLoadingConversation] = useState(false)

  const handleKPICardChat = useCallback(async (question, card) => {
    if (!Cookies.get('access_token')) {
      handle401()
      return
    }

    setIsChatLoading(true)
    setStreamingText('')
    setActiveCard(card)
    setAgentMessages(prev => [...prev, { text: question, sender: 'user', cardTitle: card.title }])

    const cardContext = {
      card_id: card.id,
      title: card.title,
      description: card.description,
      value: card.value,
      formatted_value: card.formatted_value,
      comparison_value: card.comparison_value,
      comparison_label: card.comparison_label,
      detail_line_1: card.detail_line_1,
      detail_line_2: card.detail_line_2,
      sql_query: card.sql_query,
      chart_type: card.chart_type,
      chart_config: card.chart_config,
      data: card.chart_data || card.data,
      summary: card.summary
    }

    try {
      const res = await authFetch('/kpi-card-chat/chat-stream', {
        method: 'POST',
        headers: { 'Accept': 'text/event-stream' },
        body: JSON.stringify({
          query: question,
          card_context: cardContext,
          conversation_id: conversationId,
          catalog: 'finance_fusion_catalog',
          schema: 'finance_fusion_catalog',
          persona: 'CFO'
        })
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullAnswer = ''
      let resultData = null
      let followups = []
      let intent = ''
      let charts = []
      let diagnosticResult = null

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

              if (data.stage === 'analyzing') setStreamingText(data.message || 'Analyzing your question...')
              if (data.stage === 'intent_classified') {
                intent = data.intent || ''
                setStreamingText(data.message || `Understanding intent: ${intent}...`)
              }
              if (data.stage === 'routing') setStreamingText(data.message || 'Routing query...')
              if (data.stage === 'routing_done') setStreamingText(data.message || 'Route identified...')
              if (data.stage === 'planning') setStreamingText(data.message || 'Planning analysis...')
              if (data.stage === 'planning_done') setStreamingText(data.message || `Plan ready: ${data.query_count || ''} queries...`)
              if (data.stage === 'synthesizing') setStreamingText(data.message || 'Synthesizing insights...')

              // Handle streamed query results (diagnostic queries)
              if (data.stage === 'query_complete' && data.status === 'success') {
                if (data.data && data.data.length > 0 && data.chart_config) {
                  charts.push({
                    title: data.chart_config?.title || data.purpose || 'Query Result',
                    chart_type: data.chart_type || 'vertical_bar_chart',
                    chart_config: data.chart_config,
                    data: data.data,
                    sql_query: data.sql_query,
                    query_id: data.query_id
                  })
                }
                setStreamingText(`Analysis ${data.progress || ''}% complete...`)
              }

              // Existing stages (backward compatibility)
              if (data.stage === 'answer_ready' && data.answer) {
                fullAnswer = data.answer
                setStreamingText(data.answer)
              }
              if (data.stage === 'drill_down') {
                setStreamingText(fullAnswer + '\n\nGenerating detailed breakdown...')
              }
              if (data.stage === 'drill_down_ready') {
                resultData = data.data
                if (data.message) fullAnswer += '\n\n' + data.message
                setStreamingText(fullAnswer)
              }

              // Handle done/complete
              if (data.stage === 'done' || data.stage === 'complete') {
                if (data.conversation_id) setConversationId(data.conversation_id)

                if (data.result) {
                  // Diagnostic response format
                  if (data.result.diagnostic_type || data.result.narrative) {
                    diagnosticResult = data.result

                    // Extract narrative body without headline duplication
                    let narrativeBody = data.result.narrative || ''
                    if (data.result.headline && narrativeBody.startsWith(data.result.headline)) {
                      narrativeBody = narrativeBody.slice(data.result.headline.length).replace(/^\n+/, '')
                    }
                    fullAnswer = narrativeBody || data.result.headline || ''

                    // Build charts from query_results if not already captured from stream
                    if (data.result.query_results && data.result.query_results.length > 0 && charts.length === 0) {
                      charts = data.result.query_results
                        .filter(qr => qr.status === 'success' && qr.data && qr.data.length > 0 && qr.chart_config)
                        .map(qr => ({
                          title: qr.chart_config?.title || qr.purpose || 'Result',
                          chart_type: qr.chart_type || 'vertical_bar_chart',
                          chart_config: qr.chart_config,
                          data: qr.data,
                          sql_query: qr.sql_query,
                          query_id: qr.query_id
                        }))
                    }

                    followups = data.result.followups || []
                  } else {
                    // Original response format
                    fullAnswer = data.result.answer || fullAnswer
                    resultData = data.result.data || resultData
                    followups = data.result.suggested_followups || []
                    if (data.result.conversation_id) setConversationId(data.result.conversation_id)
                  }
                }
              }

              if (data.stage === 'error') {
                fullAnswer = 'Error: ' + (data.message || 'Unknown error')
              }
            } catch {}
          }
        }
      }

      setStreamingText('')

      // Build charts from KPI card data only if no diagnostic charts were captured
      if (charts.length === 0) {
        if (resultData && resultData.length > 0 && card.chart_config) {
          charts = [{
            title: card.chart_config?.title || card.title || 'Query Results',
            chart_type: card.chart_type || 'horizontal_bar_chart',
            chart_config: card.chart_config,
            data: resultData
          }]
        } else if (card.chart_data && card.chart_data.length > 0 && card.chart_config) {
          charts = [{
            title: card.chart_config?.title || card.title || 'Query Results',
            chart_type: card.chart_type || 'horizontal_bar_chart',
            chart_config: card.chart_config,
            data: card.chart_data
          }]
        }
      }

      setAgentMessages(prev => [...prev, {
        text: fullAnswer || 'No response',
        sender: 'ai',
        data: resultData,
        charts: charts.length > 0 ? charts : undefined,
        followups,
        intent,
        cardTitle: card.title,
        diagnosticResult
      }])
    } catch (e) {
      if (e.message !== 'Unauthorized') {
        setStreamingText('')
        setAgentMessages(prev => [...prev, { text: 'Error: ' + e.message, sender: 'ai' }])
      }
    } finally {
      setIsChatLoading(false)
    }
  }, [conversationId])

  const handleGeneralChat = useCallback(async (question) => {
    if (!Cookies.get('access_token')) {
      handle401()
      return
    }

    setIsChatLoading(true)
    setStreamingText('')
    setAgentMessages(prev => [...prev, { text: question, sender: 'user' }])

    try {
      const requestBody = {
        query: question,
        catalog: 'finance_fusion_catalog',
        schema: 'finance_fusion_catalog',
        persona: 'analyst'
      }
      if (conversationId) requestBody.conversation_id = conversationId

      const res = await authFetch('/conversational-bi/query-stream', {
        method: 'POST',
        headers: { 'Accept': 'text/event-stream' },
        body: JSON.stringify(requestBody)
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullAnswer = ''
      let followups = []
      let charts = []
      let queryType = 'simple'
      let dataQualityAlert = null
      let sqlQuery = null
      let keyInsights = []
      let strategicRecommendations = []
      let rootCauseAnalysis = null
      let queryIntent = null
      let overallConfidence = null

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

              // Handle conversation creation
              if (data.stage === 'conversation_created') {
                setConversationId(data.conversation_id)
              }

              // Handle followup detection
              if (data.stage === 'followup_detection') {
                setStreamingText('Checking conversation context...')
              }

              // Handle classification
              if (data.stage === 'classification') {
                setStreamingText('Analyzing question...')
              }

              if (data.stage === 'classified') {
                queryType = data.query_type || 'simple'
                setStreamingText(`Query type: ${queryType}...`)
              }

              // Handle intent analysis (complex_why)
              if (data.stage === 'intent_analysis') {
                setStreamingText('Analyzing business intent...')
              }

              // Handle planning (complex_why)
              if (data.stage === 'planning') {
                setStreamingText('Designing analysis strategy...')
              }

              // Handle SQL generation (simple)
              if (data.stage === 'sql_generation') {
                setStreamingText('Generating SQL...')
              }

              // Handle execution (simple)
              if (data.stage === 'executing') {
                setStreamingText('Executing query...')
                if (data.sql) sqlQuery = data.sql
              }

              // Handle data ready
              if (data.stage === 'data_ready') {
                setStreamingText(`Retrieved ${data.row_count || 0} rows...`)
              }

              // Handle generating answer
              if (data.stage === 'generating_answer') {
                setStreamingText('Analyzing results...')
              }

              // Handle synthesizing (complex_why)
              if (data.stage === 'synthesizing') {
                setStreamingText('Synthesizing insights...')
              }

              // Handle chart ready (complex_why - streamed charts)
              if (data.stage === 'chart_ready' && data.chart) {
                charts.push(data.chart)
                setStreamingText(`Analysis ${charts.length}/4 complete...`)
              }

              // Handle done/complete
              if (data.stage === 'done' || data.stage === 'complete') {
                const result = data.result || {}

                // Update conversation ID
                if (data.conversation_id) setConversationId(data.conversation_id)
                if (result.conversation_id) setConversationId(result.conversation_id)

                // Handle based on query type
                switch (queryType) {
                  case 'greeting':
                  case 'out_of_scope':
                    // Simple text response with suggested followups
                    fullAnswer = result.answer || ''
                    followups = result.suggested_followups || []
                    break

                  case 'simple':
                    // SQL query result with optional chart
                    fullAnswer = result.answer || ''
                    followups = result.suggested_followups || []
                    sqlQuery = result.sql_query || sqlQuery

                    // Add chart if data exists
                    if (result.data && result.data.length > 0 && result.chart_config) {
                      charts = [{
                        title: result.chart_config?.title || 'Query Results',
                        chart_type: result.chart_type || 'horizontal_bar_chart',
                        chart_config: result.chart_config,
                        data: result.data
                      }]
                    }
                    break

                  case 'complex_why':
                    // Complex analysis with multiple insights
                    queryIntent = result.query_intent
                    dataQualityAlert = result.data_quality_alert
                    keyInsights = result.key_insights || []
                    strategicRecommendations = result.strategic_recommendations || []
                    rootCauseAnalysis = result.root_cause_analysis
                    overallConfidence = result.overall_confidence

                    // Use charts from result if available (final set)
                    if (result.charts && result.charts.length > 0) {
                      charts = result.charts
                    }

                    // Build the answer from executive summary and insights
                    fullAnswer = result.executive_summary || ''

                    // Add key insights
                    if (keyInsights.length > 0) {
                      fullAnswer += '\n\n**Key Insights:**\n'
                      fullAnswer += keyInsights.map((insight, i) => {
                        let insightText = `${i + 1}. **${insight.headline}**`
                        if (insight.supporting_evidence && insight.supporting_evidence.length > 0) {
                          const evidence = insight.supporting_evidence[0]
                          if (evidence.metric && evidence.value) {
                            insightText += `\n   - ${evidence.metric}: ${evidence.value}`
                            if (evidence.context) insightText += ` (${evidence.context})`
                          }
                        }
                        if (insight.business_impact) {
                          insightText += `\n   - Impact: ${insight.business_impact}`
                        }
                        return insightText
                      }).join('\n')
                    }

                    // Add root cause if available
                    if (rootCauseAnalysis?.primary_driver) {
                      fullAnswer += `\n\n**Root Cause:** ${rootCauseAnalysis.primary_driver}`
                    }

                    // Add confidence score
                    if (overallConfidence) {
                      fullAnswer += `\n\n*Analysis Confidence: ${overallConfidence}%*`
                    }

                    // Extract followups from strategic recommendations
                    followups = strategicRecommendations.map(r => r.action).filter(Boolean)
                    break

                  default:
                    fullAnswer = result.answer || 'No response received'
                    followups = result.suggested_followups || []
                }
              }

              // Handle error
              if (data.stage === 'error') {
                fullAnswer = 'Error: ' + (data.message || data.error || 'Unknown error')
              }
            } catch {}
          }
        }
      }

      setStreamingText('')
      setAgentMessages(prev => [...prev, {
        text: fullAnswer || 'No response received',
        sender: 'ai',
        followups,
        charts: charts.length > 0 ? charts : undefined,
        queryType,
        dataQualityAlert,
        sqlQuery,
        keyInsights: keyInsights.length > 0 ? keyInsights : undefined,
        strategicRecommendations: strategicRecommendations.length > 0 ? strategicRecommendations : undefined,
        rootCauseAnalysis,
        overallConfidence
      }])
    } catch (e) {
      if (e.message !== 'Unauthorized') {
        setStreamingText('')
        setAgentMessages(prev => [...prev, { text: 'Error: ' + e.message, sender: 'ai' }])
      }
    } finally {
      setIsChatLoading(false)
    }
  }, [conversationId])

  const handleNewChat = useCallback(() => {
    const now = new Date()
    setAgentMessages([{ text: getAIGreeting(userName, now.getHours(), now.getDay()), sender: 'ai' }])
    setActiveCard(null)
    setConversationId(null)
  }, [userName])

  // Load an existing conversation by ID
  // Parses the conversation queries array into chat messages
  const loadConversation = useCallback(async (convId, conversationData) => {
    if (!convId || !conversationData) return

    setIsLoadingConversation(true)
    setConversationId(convId)
    setActiveCard(null)

    // Helper to normalize followups to strings
    const normalizeFollowups = (followups) => {
      if (!followups || !Array.isArray(followups)) return []
      return followups.map(f => {
        if (typeof f === 'string') return f
        if (typeof f === 'object' && f !== null) {
          return f.question || f.text || f.query || JSON.stringify(f)
        }
        return String(f)
      })
    }

    try {
      const queries = conversationData.queries || []
      const formattedMessages = []

      // Process each query and its result
      queries.forEach(query => {
        // Add user message
        formattedMessages.push({
          text: query.query_text,
          sender: 'user'
        })

        // Determine query type and get appropriate result
        const queryType = query.query_type || 'simple'
        let aiMessage = { sender: 'ai', queryType }

        switch (queryType) {
          case 'greeting':
            if (query.greeting_result) {
              aiMessage.text = query.greeting_result.answer || ''
              aiMessage.followups = normalizeFollowups(query.greeting_result.suggested_followups)
            }
            break

          case 'out_of_scope':
            if (query.out_of_scope_result) {
              aiMessage.text = query.out_of_scope_result.answer || ''
              aiMessage.followups = normalizeFollowups(query.out_of_scope_result.suggested_followups)
            }
            break

          case 'simple':
            // Check for diagnostic result first (rich structured rendering)
            if (query.diagnostic_result) {
              const diag = query.diagnostic_result

              // Extract narrative body (remove headline from start if duplicated)
              let narrativeBody = diag.narrative || ''
              if (diag.headline && narrativeBody.startsWith(diag.headline)) {
                narrativeBody = narrativeBody.slice(diag.headline.length).replace(/^\n+/, '')
              }

              // Pass structured diagnostic for rich rendering in ChatMessage
              aiMessage.diagnosticResult = diag
              aiMessage.text = narrativeBody || diag.headline || ''
              aiMessage.followups = normalizeFollowups(diag.followups)

              // Use query-level charts for diagnostics (multiple charts)
              if (query.charts && query.charts.length > 0) {
                aiMessage.charts = query.charts
              }
            } else if (query.simple_result) {
              const result = query.simple_result
              aiMessage.text = result.answer || ''
              aiMessage.sqlQuery = result.sql_query
              aiMessage.followups = normalizeFollowups(result.suggested_followups)

              // Add chart if data exists
              if (result.data && result.data.length > 0 && result.chart_config) {
                aiMessage.charts = [{
                  title: result.chart_config?.title || 'Query Results',
                  chart_type: result.chart_type || 'horizontal_bar_chart',
                  chart_config: result.chart_config,
                  data: result.data,
                  row_count: result.row_count
                }]
              }

              // Also check query-level charts (may have more charts than simple_result)
              if (query.charts && query.charts.length > 0 && (!aiMessage.charts || aiMessage.charts.length < query.charts.length)) {
                aiMessage.charts = query.charts
              }
            }
            break

          case 'complex_why':
            if (query.complex_result) {
              const result = query.complex_result
              aiMessage.text = result.executive_summary || ''
              aiMessage.overallConfidence = result.confidence_score
              aiMessage.followups = normalizeFollowups(result.suggested_followups)

              // Handle recommended_actions - can be strings or objects
              if (result.recommended_actions && result.recommended_actions.length > 0) {
                aiMessage.strategicRecommendations = result.recommended_actions.map(action => {
                  // If it's already an object with action property, use it
                  if (typeof action === 'object' && action !== null) {
                    return {
                      action: action.action || action.title || String(action),
                      rationale: action.rationale || action.description || '',
                      urgency: action.urgency || action.priority || '',
                      expected_impact: action.expected_impact || action.impact || ''
                    }
                  }
                  // If it's a string, wrap it
                  return { action: String(action) }
                })
              }

              // Add detailed findings as key insights
              if (result.detailed_findings && result.detailed_findings.length > 0) {
                aiMessage.keyInsights = result.detailed_findings
              }
            }

            // Add charts from query if available
            if (query.charts && query.charts.length > 0) {
              aiMessage.charts = query.charts
            }
            break

          default:
            // Fallback for unknown types - check diagnostic first
            if (query.diagnostic_result) {
              const diag = query.diagnostic_result
              let narrativeBody = diag.narrative || ''
              if (diag.headline && narrativeBody.startsWith(diag.headline)) {
                narrativeBody = narrativeBody.slice(diag.headline.length).replace(/^\n+/, '')
              }
              aiMessage.diagnosticResult = diag
              aiMessage.text = narrativeBody || diag.headline || ''
              aiMessage.followups = normalizeFollowups(diag.followups)
              if (query.charts && query.charts.length > 0) {
                aiMessage.charts = query.charts
              }
            } else if (query.simple_result) {
              aiMessage.text = query.simple_result.answer || ''
              aiMessage.followups = normalizeFollowups(query.simple_result.suggested_followups)
            } else if (query.greeting_result) {
              aiMessage.text = query.greeting_result.answer || ''
              aiMessage.followups = normalizeFollowups(query.greeting_result.suggested_followups)
            } else {
              aiMessage.text = 'No response available'
            }
        }

        // Only add AI message if we have content
        if (aiMessage.text) {
          formattedMessages.push(aiMessage)
        }
      })

      setAgentMessages(formattedMessages.length > 0 ? formattedMessages : [
        { text: getAIGreeting(userName, new Date().getHours(), new Date().getDay()), sender: 'ai' }
      ])
    } catch (e) {
      console.error('Error loading conversation:', e)
      setAgentMessages([{ text: 'Error loading conversation history', sender: 'ai' }])
    } finally {
      setIsLoadingConversation(false)
    }
  }, [userName])

  const clearContext = useCallback(() => {
    setActiveCard(null)
  }, [])

  return {
    agentMessages,
    agentInput,
    setAgentInput,
    isChatLoading,
    streamingText,
    activeCard,
    setActiveCard,
    conversationId,
    isLoadingConversation,
    handleKPICardChat,
    handleGeneralChat,
    handleNewChat,
    loadConversation,
    clearContext
  }
}

export default useChat
