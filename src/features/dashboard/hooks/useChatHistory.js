/**
 * useChatHistory Hook
 * Manages chat history fetching and state
 */

import { useState, useCallback, useEffect } from 'react'
import { fetchConversations, fetchConversation, archiveConversation, deleteConversation } from '../services/chatHistoryApi'

const useChatHistory = () => {
  const [conversations, setConversations] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const limit = 10

  // Fetch conversations list
  const loadConversations = useCallback(async (reset = false) => {
    setIsLoading(true)
    setError(null)

    try {
      const currentOffset = reset ? 0 : offset
      const data = await fetchConversations({
        limit,
        offset: currentOffset,
        includeArchived: false,
        sortBy: 'last_updated',
        sortOrder: 'desc'
      })

      if (reset) {
        setConversations(data.conversations || [])
        setOffset(limit)
      } else {
        setConversations(prev => [...prev, ...(data.conversations || [])])
        setOffset(prev => prev + limit)
      }

      setTotal(data.total || 0)
      setHasMore((data.conversations || []).length === limit)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [offset, limit])

  // Load more conversations (pagination)
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      loadConversations(false)
    }
  }, [isLoading, hasMore, loadConversations])

  // Refresh conversations list
  const refresh = useCallback(() => {
    setOffset(0)
    loadConversations(true)
  }, [loadConversations])

  // Load a specific conversation with all queries
  const loadConversation = useCallback(async (conversationId) => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchConversation(conversationId)
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Archive a conversation
  const archive = useCallback(async (conversationId) => {
    try {
      await archiveConversation(conversationId)
      setConversations(prev => prev.filter(c => c.conversation_id !== conversationId))
      setTotal(prev => prev - 1)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [])

  // Delete a conversation
  const remove = useCallback(async (conversationId) => {
    try {
      await deleteConversation(conversationId)
      setConversations(prev => prev.filter(c => c.conversation_id !== conversationId))
      setTotal(prev => prev - 1)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadConversations(true)
  }, [])

  return {
    conversations,
    isLoading,
    error,
    hasMore,
    total,
    loadMore,
    refresh,
    loadConversation,
    archive,
    remove
  }
}

export default useChatHistory
