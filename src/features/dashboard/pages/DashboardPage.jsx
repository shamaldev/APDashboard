/**
 * Dashboard Page
 * Main AP Dashboard with KPIs, charts, alerts and AI chat
 */

import { useState, useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'

// Utils
import { Cookies, getUserFromToken, handleLogout } from '../utils'

// Hooks
import { useSpeechRecognition, useDashboardData, useChat, useChatHistory, useSpeechSynthesis } from '../hooks'

// Components
import {
  // Layout
  DashboardHeader,
  GreetingSection,
  LoadingState,
  ErrorState,
  // Cards
  KPICard,
  ProactiveCard,
  ActionRequiredCard,
  TopVendorExposureCard,
  OperationalEfficiencyCard,
  // Charts
  CashFlowChart,
  AgingChart,
  // Modals
  KPIModal,
  AlertModal,
  EmailModal,
  // Chat
  ChatMessage,
  ChatSidebar,
  ChatInput
} from '../components'

export default function DashboardPage() {
  // View state
  const [view, setView] = useState('dashboard')
  const [isAuthenticated, setIsAuthenticated] = useState(true)
  const [userName, setUserName] = useState(null)

  // Modal state
  const [modalCard, setModalCard] = useState(null)
  const [alertModal, setAlertModal] = useState(null)
  const [emailAlert, setEmailAlert] = useState(null)

  // Dashboard query
  const [dashboardQuery, setDashboardQuery] = useState('')

  // Refs
  const chatContainerRef = useRef(null)

  // Custom hooks
  const { isListening, isAgentListening, startVoiceInput, stopVoiceInput } = useSpeechRecognition()
  const { loading, error, progress, progressMsg, kpiCards, kpiResults, alerts, insights, fetchData } = useDashboardData()
  const {
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
    clearContext,
    addChartQueryResult
  } = useChat(userName)

  // Chat history
  const {
    conversations,
    isLoading: isLoadingHistory,
    hasMore: hasMoreHistory,
    loadMore: loadMoreHistory,
    loadConversation: fetchConversationMessages,
    archive: archiveConversation,
    remove: deleteConversation,
    refresh: refreshHistory
  } = useChatHistory()

  // Speech synthesis for read aloud
  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
    isPaused,
    currentMessageId: currentSpeakingId
  } = useSpeechSynthesis()

  // Handle speak/stop for messages
  const handleSpeak = (text, messageId) => {
    if (text === null) {
      stopSpeaking()
    } else {
      speak(text, messageId)
    }
  }

  // Auth check on mount
  useEffect(() => {
    const token = Cookies.get('access_token')
    if (!token) {
      setIsAuthenticated(false)
    } else {
      setUserName(getUserFromToken())
    }
  }, [])

  // Fetch data on auth
  useEffect(() => {
    if (isAuthenticated) fetchData()
  }, [fetchData, isAuthenticated])

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [agentMessages, streamingText])

  // Refresh sidebar after every completed chat interaction (loading true→false)
  const prevChatLoadingRef = useRef(false)
  useEffect(() => {
    if (prevChatLoadingRef.current && !isChatLoading) {
      refreshHistory()
    }
    prevChatLoadingRef.current = isChatLoading
  }, [isChatLoading, refreshHistory])

  // Handle simple answer from chart query (no extra API call)
  const handleChartSimpleAnswer = (result) => {
    setModalCard(null)
    setView('ai-agent')
    addChartQueryResult(result)
    refreshHistory()
  }

  // Handlers
  const handleModalQuestion = (question, card) => {
    setModalCard(null)
    setView('ai-agent')
    handleKPICardChat(question, card, true)
  }

  // Handle selecting a conversation from history
  const handleSelectConversation = async (convId) => {
    if (isLoadingConversation) return
    setView('ai-agent')
    const conversationData = await fetchConversationMessages(convId)
    if (conversationData) {
      loadConversation(convId, conversationData)
    }
  }

  // Handle deleting a conversation
  const handleDeleteConversation = async (convId) => {
    if (!window.confirm('Delete this conversation? This cannot be undone.')) return

    const success = await deleteConversation(convId)
    if (success && convId === conversationId) {
      handleNewChat()
    }
  }

  // Handle new chat with history refresh
  const handleNewChatWithRefresh = () => {
    handleNewChat()
    refreshHistory()
  }

  const handleAgentSend = () => {
    if (agentInput.trim() && !isChatLoading) {
      if (activeCard) {
        handleKPICardChat(agentInput, activeCard)
      } else {
        handleGeneralChat(agentInput)
      }
      setAgentInput('')
    }
  }

  const handleDashboardQuery = () => {
    if (dashboardQuery.trim() && !isChatLoading) {
      setView('ai-agent')
      setActiveCard(null)
      setTimeout(() => {
        handleGeneralChat(dashboardQuery)
        setDashboardQuery('')
      }, 100)
    }
  }

  // Date/time
  const now = new Date()
  const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })
  const date = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  // Derived data
  const localCards = kpiCards.filter(c => c.card_type === 'local')
  const proactiveCards = kpiCards.filter(c => c.card_type === 'proactive')
  const cashFlowKpi = kpiResults.find(k => k.kpi?.title?.includes('Cash Outflow'))
  const agingKpi = kpiResults.find(k => k.kpi?.title?.includes('Aging'))

  // Process alerts for Action Required Card (from alert_progress events)
  const actionItems = alerts.slice(0, 5).map((alert, idx) => {
    const severity = alert.structured_summary?.severity === 'CRITICAL' ? 'critical' :
                     alert.structured_summary?.severity === 'WARNING' ? 'warning' : 'info'
    const type = alert.tool_name?.includes('discount') ? 'discount' :
                 alert.tool_name?.includes('sla') ? 'approval' :
                 alert.tool_name?.includes('concentration') ? 'concentration' : 'month_end'

    // Extract value from raw_data if available
    let displayValue = ''
    if (alert.raw_data && alert.raw_data.length > 0) {
      const firstItem = alert.raw_data[0]
      if (firstItem.possible_discount_inr) {
        const totalDiscount = alert.raw_data.reduce((sum, item) => sum + (item.possible_discount_inr || 0), 0)
        displayValue = `$${(totalDiscount / 1e6).toFixed(1)} M`
      } else if (firstItem.total_invoice_amount_inr) {
        const totalAmount = alert.raw_data.reduce((sum, item) => sum + (item.total_invoice_amount_inr || 0), 0)
        displayValue = `$${(totalAmount / 1e6).toFixed(0)} M`
      } else {
        displayValue = `${alert.record_count || 0} items`
      }
    } else {
      displayValue = alert.record_count ? `${alert.record_count} items` : ''
    }

    return {
      title: alert.structured_summary?.alert_title || alert.tool_name?.replace(/_/g, ' ') || 'Alert',
      subtitle: (typeof alert.structured_summary?.key_findings === 'string' ? alert.structured_summary.key_findings.split('\n')[0]?.replace(/^-\s*/, '') : Array.isArray(alert.structured_summary?.key_findings) ? alert.structured_summary.key_findings[0] : null) || `${alert.record_count || 0} records found`,
      value: displayValue,
      severity,
      type,
      alertIndex: idx
    }
  })
  const criticalCount = alerts.filter(a => a.structured_summary?.severity === 'CRITICAL').length

  // Process data for Top Vendor Exposure Card (from vendor_exposure insight)
  const vendorExposureInsight = insights?.vendor_exposure
  const topVendors = (vendorExposureInsight?.vendors || []).map(vendor => ({
    name: vendor.vendor_name,
    value: vendor.outstanding_amount,
    formatted_value: vendor.formatted_amount,
    percentage: vendor.formatted_percentage
  }))

  // Process data for Operational Efficiency Card (from insights API)
  const operationalEfficiencyInsight = insights?.operational_efficiency
  const efficiencyMetrics = operationalEfficiencyInsight?.metrics || []

  // Helper to find metric by id
  const findMetric = (id) => efficiencyMetrics.find(m => m.id === id)

  // Get chart data for monthly trend from total_ap_outstanding card
  const totalApCard = kpiCards.find(c => c.id === 'total_ap_outstanding')
  const monthlyTrendData = totalApCard?.chart_data || []

  const operationalMetrics = {
    avgProcessingTime: {
      value: findMetric('avg_processing_time')?.formatted_value || '—',
      trend: findMetric('avg_processing_time')?.status === 'success' ? 'up' : findMetric('avg_processing_time')?.status === 'error' ? 'down' : null,
      trendValue: findMetric('avg_processing_time')?.comparison_label || ''
    },
    invoicePerFTE: {
      value: findMetric('invoice_per_fte')?.formatted_value || '—',
      trend: findMetric('invoice_per_fte')?.status === 'success' ? 'up' : findMetric('invoice_per_fte')?.status === 'warning' ? 'down' : null,
      trendValue: findMetric('invoice_per_fte')?.comparison_label || ''
    },
    eInvoiceRate: {
      value: findMetric('e_invoice_rate')?.formatted_value || '—',
      trend: findMetric('e_invoice_rate')?.status === 'success' ? 'up' : findMetric('e_invoice_rate')?.status === 'error' ? 'down' : null,
      trendValue: findMetric('e_invoice_rate')?.comparison_label || ''
    },
    onTimePayment: {
      value: findMetric('on_time_payment')?.formatted_value || '—',
      trend: findMetric('on_time_payment')?.status === 'success' ? 'up' : findMetric('on_time_payment')?.status === 'warning' ? 'down' : null,
      trendValue: findMetric('on_time_payment')?.comparison_label || ''
    },
    monthlyVolumeTrend: monthlyTrendData.slice(-6).map(d => (d.total_outstanding || 0) / 1e9)
  }

  // Loading state
  if (loading) {
    return <LoadingState message={progressMsg} progress={progress} />
  }

  // Error state
  if (error || !isAuthenticated) {
    return <ErrorState error={error} isAuthenticated={isAuthenticated} onRetry={fetchData} />
  }

  return (
    <div className="flex w-full min-h-screen" style={{ backgroundColor: '#F4F9FA' }}>
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="max-w-7xl mx-auto p-4 w-full">
          {/* Header */}
          <DashboardHeader
            view={view}
            onViewChange={setView}
            onRefresh={fetchData}
            onLogout={handleLogout}
            criticalAlertsCount={0}
            date={date}
            time={time}
          />

          {view === 'dashboard' ? (
            <>
              {/* Greeting Section */}
              <GreetingSection
                userName={userName}
                query={dashboardQuery}
                onQueryChange={setDashboardQuery}
                onQuerySubmit={handleDashboardQuery}
                onVoiceStart={() => startVoiceInput('dashboard', setDashboardQuery)}
                onVoiceStop={stopVoiceInput}
                isListening={isListening}
                isLoading={isChatLoading}
              />

              {/* KPI Cards */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {localCards.map(card => (
                  <KPICard key={card.id} card={card} onClick={setModalCard} />
                ))}
              </section>

              {/* Proactive Cards */}
              <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                {proactiveCards.map(card => (
                  <ProactiveCard key={card.id} card={card} />
                ))}
              </section>

              {/* Charts */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <CashFlowChart data={cashFlowKpi?.data} loading={loading} />
                <AgingChart data={agingKpi?.data} />
              </section>

              {/* Insights Section - 3 Column Layout */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <ActionRequiredCard
                  items={actionItems}
                  criticalCount={criticalCount}
                  onItemClick={(item) => setAlertModal(alerts[item.alertIndex])}
                />
                <TopVendorExposureCard
                  vendors={topVendors}
                  title={vendorExposureInsight?.section_title}
                  subtitle={vendorExposureInsight?.section_subtitle}
                />
                <OperationalEfficiencyCard metrics={operationalMetrics} />
              </section>
            </>
          ) : (
            /* AI Agent View */
            <div className="flex h-[calc(100vh-160px)] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Sidebar */}
              <ChatSidebar
                activeCard={activeCard}
                onNewChat={handleNewChatWithRefresh}
                onTopicSelect={setAgentInput}
                onClearContext={clearContext}
                conversations={conversations}
                isLoadingHistory={isLoadingHistory}
                hasMoreHistory={hasMoreHistory}
                onLoadMore={loadMoreHistory}
                onSelectConversation={handleSelectConversation}
                onArchiveConversation={archiveConversation}
                onDeleteConversation={handleDeleteConversation}
                activeConversationId={conversationId}
              />

              {/* Chat Area */}
              <div className="flex-1 flex flex-col">
                {/* Messages */}
                <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
                  {agentMessages.map((m, i) => (
                    <ChatMessage
                      key={i}
                      message={m}
                      messageIndex={i}
                      activeCard={activeCard}
                      onKPICardChat={handleKPICardChat}
                      onGeneralChat={handleGeneralChat}
                      isChatLoading={isChatLoading}
                      onSpeak={handleSpeak}
                      isSpeaking={isSpeaking}
                      isPaused={isPaused}
                      currentSpeakingId={currentSpeakingId}
                      onSimpleAnswer={handleChartSimpleAnswer}
                    />
                  ))}

                  {/* Streaming text */}
                  {streamingText && (
                    <div className="flex flex-col items-start max-w-[85%]">
                      <div className="px-4 py-3 rounded-2xl text-sm bg-slate-100 text-slate-900 rounded-bl-sm whitespace-pre-wrap">
                        {streamingText}
                        <span className="inline-block w-1.5 h-4 ml-1 animate-pulse" style={{ backgroundColor: '#2F5597' }} />
                      </div>
                    </div>
                  )}

                  {/* Loading indicator */}
                  {isChatLoading && !streamingText && (
                    <div className="flex items-center gap-2 text-sm text-slate-500 self-start">
                      <Loader2 size={14} className="animate-spin" />
                      Analyzing...
                    </div>
                  )}
                </div>

                {/* Input */}
                <ChatInput
                  value={agentInput}
                  onChange={setAgentInput}
                  onSend={handleAgentSend}
                  onVoiceStart={() => startVoiceInput('agent', setAgentInput)}
                  onVoiceStop={stopVoiceInput}
                  isListening={isAgentListening}
                  isLoading={isChatLoading}
                  activeCard={activeCard}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <KPIModal
        isOpen={!!modalCard}
        onClose={() => setModalCard(null)}
        card={modalCard}
        onAskQuestion={handleModalQuestion}
        onSimpleAnswer={handleChartSimpleAnswer}
      />
      <AlertModal
        isOpen={!!alertModal}
        onClose={() => setAlertModal(null)}
        alert={alertModal}
        onSendEmail={(alert) => setEmailAlert(alert)}
      />
      <EmailModal
        isOpen={!!emailAlert}
        onClose={() => setEmailAlert(null)}
        alert={emailAlert}
      />
    </div>
  )
}
