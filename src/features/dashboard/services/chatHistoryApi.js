/**
 * Chat History API Service
 * Handles all API calls for conversation history
 */

import { authFetch } from '../utils/auth'

/**
 * Fetch conversation history list
 * @param {Object} options - Query options
 * @param {number} options.limit - Number of conversations to fetch
 * @param {number} options.offset - Pagination offset
 * @param {boolean} options.includeArchived - Include archived conversations
 * @param {string} options.sortBy - Sort field (last_updated, created_at)
 * @param {string} options.sortOrder - Sort order (asc, desc)
 */
export const fetchConversations = async ({
  limit = 10,
  offset = 0,
  includeArchived = false,
  sortBy = 'last_updated',
  sortOrder = 'desc'
} = {}) => {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    include_archived: includeArchived.toString(),
    sort_by: sortBy,
    sort_order: sortOrder
  })

  const response = await authFetch(`/bi-history/conversations?${params}`, {
    method: 'GET'
  })

  if (!response.ok) {
    throw new Error('Failed to fetch conversations')
  }

  return response.json()
}

/**
 * Fetch a specific conversation with all queries and results
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<Object>} Conversation with queries array
 */
export const fetchConversation = async (conversationId) => {
  const response = await authFetch(`/bi-history/conversations/${conversationId}`, {
    method: 'GET'
  })

  if (!response.ok) {
    throw new Error('Failed to fetch conversation')
  }

  return response.json()
}

/**
 * Archive a conversation
 * @param {string} conversationId - The conversation ID
 */
export const archiveConversation = async (conversationId) => {
  const response = await authFetch(`/bi-history/conversations/${conversationId}/archive`, {
    method: 'POST'
  })

  if (!response.ok) {
    throw new Error('Failed to archive conversation')
  }

  return response.json()
}

/**
 * Delete a conversation
 * @param {string} conversationId - The conversation ID
 */
export const deleteConversation = async (conversationId) => {
  const response = await authFetch(`/bi-history/conversations/${conversationId}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    throw new Error('Failed to delete conversation')
  }

  return response.json()
}

export default {
  fetchConversations,
  fetchConversation,
  archiveConversation,
  deleteConversation
}
