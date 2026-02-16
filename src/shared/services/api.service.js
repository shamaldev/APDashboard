/**
 * API Service
 * Centralized API communication with streaming support
 */

import env from '@config/env'
import { getAuthHeaders, logout } from './auth.service'

/**
 * Handle 401 responses
 */
const handle401 = () => {
  logout()
  throw new Error('Unauthorized')
}

/**
 * Authenticated fetch wrapper
 * @param {string} url - API endpoint (relative to base URL)
 * @param {object} options - Fetch options
 * @returns {Promise<Response>}
 */
export const authFetch = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...getAuthHeaders(),
    ...options.headers,
  }

  const response = await fetch(`${env.API_BASE_URL}${url}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    handle401()
  }

  return response
}

/**
 * Stream reader utility for SSE responses
 * @param {Response} response - Fetch response
 * @param {function} onEvent - Callback for each parsed event
 * @param {AbortSignal} signal - Optional abort signal
 */
export const readStream = async (response, onEvent, signal = null) => {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      if (signal?.aborted) {
        reader.cancel()
        break
      }

      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            onEvent(data)
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

/**
 * POST request with JSON body
 * @param {string} url - API endpoint
 * @param {object} data - Request body
 * @param {object} options - Additional options
 * @returns {Promise<object>}
 */
export const post = async (url, data, options = {}) => {
  const response = await authFetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || error.message || 'Request failed')
  }

  return response.json()
}

/**
 * GET request
 * @param {string} url - API endpoint
 * @param {object} options - Additional options
 * @returns {Promise<object>}
 */
export const get = async (url, options = {}) => {
  const response = await authFetch(url, {
    method: 'GET',
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || error.message || 'Request failed')
  }

  return response.json()
}

/**
 * POST request with streaming response
 * @param {string} url - API endpoint
 * @param {object} data - Request body
 * @param {function} onEvent - Callback for each SSE event
 * @param {AbortSignal} signal - Optional abort signal
 */
export const postStream = async (url, data, onEvent, signal = null) => {
  const response = await authFetch(url, {
    method: 'POST',
    headers: { Accept: 'text/event-stream' },
    body: JSON.stringify(data),
    signal,
  })

  await readStream(response, onEvent, signal)
}

/**
 * Send email via backend
 * @param {object} emailData - { to_email, subject, body, from_email?, attachments? }
 * @returns {Promise<object>}
 */
export const sendEmail = (emailData) => post('/dashboards/send-email/', emailData)

export default {
  authFetch,
  readStream,
  post,
  get,
  postStream,
  sendEmail,
}
