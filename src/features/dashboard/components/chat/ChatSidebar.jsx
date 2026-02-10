/**
 * ChatSidebar Component
 * Sidebar with chat history, suggested topics and active context
 */

import { useState } from 'react'
import { Plus, X, MessageSquare, Clock, Trash2, Archive, ChevronDown, Loader2 } from 'lucide-react'

// Format relative time
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
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

  return (
    <div className="w-56 bg-slate-50 border-r border-slate-200 p-3 flex flex-col">
      {/* New Chat Button */}
      <button
        onClick={onNewChat}
        className="flex items-center gap-2 px-3 py-2 bg-amber-600 text-white rounded text-xs font-medium mb-3 hover:bg-amber-700"
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
          <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
            {conversations.length === 0 && !isLoadingHistory && (
              <div className="text-[10px] text-slate-400 text-center py-2">
                No conversations yet
              </div>
            )}

            {conversations.map((conv) => (
              <div
                key={conv.conversation_id}
                onMouseEnter={() => setHoveredId(conv.conversation_id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`group relative flex items-start gap-2 px-2 py-1.5 rounded text-xs cursor-pointer transition-colors ${
                  activeConversationId === conv.conversation_id
                    ? 'bg-amber-100 text-amber-900'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                onClick={() => onSelectConversation?.(conv.conversation_id)}
              >
                <MessageSquare size={12} className="mt-0.5 flex-shrink-0 text-slate-400" />
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium text-[11px]">
                    {conv.title || 'Untitled conversation'}
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-slate-400">
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
                className="text-[10px] text-amber-600 hover:text-amber-700 py-1 text-center disabled:opacity-50"
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
            <div className="text-[10px] text-amber-600 font-semibold">
              {activeCard.formatted_value}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatSidebar
