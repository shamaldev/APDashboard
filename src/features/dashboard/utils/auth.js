/**
 * Dashboard Authentication Utilities
 * Cookie management and auth helpers
 */

import env from '@config/env'

export const Cookies = {
  get: (name) => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop().split(';').shift()
    return null
  },
  remove: (name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
  }
}

export const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (e) {
    return null
  }
}

export const getUserFromToken = () => {
  const token = Cookies.get('access_token')
  if (!token) return null
  const decoded = decodeToken(token)
  return decoded?.user_id || decoded?.name || decoded?.username || decoded?.email || null
}

export const getAuthHeaders = () => {
  const token = Cookies.get('access_token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

export const handle401 = () => {
  Cookies.remove('access_token')
  window.location.href = '/login'
}

export const authFetch = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...getAuthHeaders(),
    ...options.headers
  }
  const response = await fetch(`${env.API_BASE_URL}${url}`, { ...options, headers })
  if (response.status === 401) {
    handle401()
    throw new Error('Unauthorized')
  }
  return response
}

export const handleLogout = () => {
  Cookies.remove('access_token')
  window.location.href = '/login'
}
