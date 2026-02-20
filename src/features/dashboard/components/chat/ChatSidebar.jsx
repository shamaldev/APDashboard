/**
 * ChatSidebar Component
 * Sidebar with chat history, suggested topics and active context
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import { Plus, X, MessageSquare, Clock, Trash2, Archive, ChevronDown, Loader2 } from 'lucide-react'

// Format relative time — handles ISO strings, epoch seconds, and epoch milliseconds
const formatRelativeTime = (dateString) => {
  if (!dateString) return ''

  let date
  const num = typeof dateString === 'number' ? dateString : Number(dateString)

  if (!isNaN(num) && String(dateString).match(/^\d+(\.\d+)?$/)) {
    // Numeric timestamp: epoch seconds (< 1e12) vs milliseconds (>= 1e12)
    date = new Date(num < 1e12 ? num * 1000 : num)
  } else {
    date = new Date(dateString)
  }

  if (isNaN(date.getTime())) return ''

  const now = new Date()
  const diffMs = now - date
  if (diffMs < 0) return 'Just now'

  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

const ChatSidebar = ({
  activeCard,
  onNewChat,
  onClearContext,
  // Chat history props
  conversations = [],
  isLoadingHistory = false,
  hasMoreHistory = false,
  onLoadMore,
  onSelectConversation,
  onArchiveConversation,
  onDeleteConversation,
  activeConversationId
}) => {
  const [showHistory, setShowHistory] = useState(true)
  const [hoveredId, setHoveredId] = useState(null)
  const listRef = useRef(null)

  // Force re-render every 60s to keep relative timestamps fresh
  const [, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(timer)
  }, [])

  // Scroll active conversation into view when it changes
  useEffect(() => {
    if (activeConversationId && listRef.current) {
      const activeEl = listRef.current.querySelector('[data-active="true"]')
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [activeConversationId])

  // Sort conversations: active conversation always at top, rest by API order (last_updated desc)
  const sortedConversations = useMemo(() => {
    if (!activeConversationId || conversations.length === 0) return conversations
    const active = conversations.filter(c => c.conversation_id === activeConversationId)
    const rest = conversations.filter(c => c.conversation_id !== activeConversationId)
    return [...active, ...rest]
  }, [conversations, activeConversationId])

  return (
    <div className="w-56 bg-slate-50 border-r border-slate-200 p-3 flex flex-col">
      {/* New Chat Button */}
      <button
        onClick={onNewChat}
        className="flex items-center gap-2 px-3 py-2 text-white rounded text-xs font-semibold mb-3 transition-colors"
        style={{ backgroundColor: '#2F5597' }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#243F7A')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2F5597')}
      >
        <Plus size={14} />
        New Chat
      </button>

      {/* Chat History Section */}
      <div className="mb-3">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center justify-between w-full text-[9px] font-semibold uppercase text-slate-500 mb-2 hover:text-slate-700"
        >
          <span className="flex items-center gap-1">
            <Clock size={10} />
            Recent Chats
          </span>
          <ChevronDown
            size={10}
            className={`transform transition-transform ${showHistory ? 'rotate-0' : '-rotate-90'}`}
          />
        </button>

        {showHistory && (
          <div ref={listRef} className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
            {sortedConversations.length === 0 && !isLoadingHistory && (
              <div className="text-[10px] text-slate-400 text-center py-2">
                No conversations yet
              </div>
            )}

            {sortedConversations.map((conv) => (
              <div
                key={conv.conversation_id}
                data-active={activeConversationId === conv.conversation_id ? 'true' : undefined}
                onMouseEnter={() => setHoveredId(conv.conversation_id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`group relative flex items-start gap-2 px-2 py-1.5 rounded text-xs cursor-pointer transition-colors ${
                  activeConversationId === conv.conversation_id
                    ? 'text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                style={
                  activeConversationId === conv.conversation_id
                    ? { backgroundColor: '#1B5272' }
                    : {}
                }
                onClick={() => onSelectConversation?.(conv.conversation_id)}
              >
                <MessageSquare
                  size={12}
                  className="mt-0.5 shrink-0"
                  style={{ color: activeConversationId === conv.conversation_id ? '#B0D4DC' : undefined }}
                />
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium text-[11px]">
                    {conv.title || 'Untitled conversation'}
                  </div>
                  <div
                    className="flex items-center gap-1 text-[9px]"
                    style={{ color: activeConversationId === conv.conversation_id ? '#B0D4DC' : '#94A3B8' }}
                  >
                    <span>{formatRelativeTime(conv.last_updated)}</span>
                    {conv.total_queries > 0 && (
                      <>
                        <span>•</span>
                        <span>{conv.total_queries} msgs</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Action buttons on hover */}
                {hoveredId === conv.conversation_id && (
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5 bg-slate-100 rounded p-0.5">
                    {onArchiveConversation && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onArchiveConversation(conv.conversation_id)
                        }}
                        className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-700"
                        title="Archive"
                      >
                        <Archive size={10} />
                      </button>
                    )}
                    {onDeleteConversation && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteConversation(conv.conversation_id)
                        }}
                        className="p-1 hover:bg-red-100 rounded text-slate-500 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Load more button */}
            {hasMoreHistory && (
              <button
                onClick={onLoadMore}
                disabled={isLoadingHistory}
                className="text-[10px] py-1 text-center disabled:opacity-50 font-medium transition-colors"
                style={{ color: '#1B5272' }}
              >
                {isLoadingHistory ? (
                  <span className="flex items-center justify-center gap-1">
                    <Loader2 size={10} className="animate-spin" />
                    Loading...
                  </span>
                ) : (
                  'Load more'
                )}
              </button>
            )}

            {/* Loading indicator */}
            {isLoadingHistory && conversations.length === 0 && (
              <div className="flex items-center justify-center gap-1 py-2 text-[10px] text-slate-400">
                <Loader2 size={10} className="animate-spin" />
                Loading history...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active Context */}
      {activeCard && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="text-[9px] font-semibold uppercase text-slate-500 mb-2 flex justify-between items-center">
            <span>Active Context</span>
            <button onClick={onClearContext} className="text-red-500 hover:text-red-700">
              <X size={12} />
            </button>
          </div>
          <div className="bg-white p-2 rounded border border-slate-200">
            <div className="text-xs font-medium text-slate-900 truncate">
              {activeCard.title}
            </div>
            <div className="text-[10px] font-semibold" style={{ color: '#1B5272' }}>
              {activeCard.formatted_value}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatSidebar
