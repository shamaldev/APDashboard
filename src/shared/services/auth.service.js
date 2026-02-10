/**
 * Authentication Service
 * Handles all token-related operations
 */

import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'

const TOKEN_KEY = 'access_token'

/**
 * Get the current access token from cookies
 */
export const getToken = () => {
  return Cookies.get(TOKEN_KEY)
}

/**
 * Set the access token in cookies
 * @param {string} token - JWT token
 * @param {Date} expires - Expiration date
 */
export const setToken = (token, expires) => {
  Cookies.set(TOKEN_KEY, token, { expires })
}

/**
 * Remove the access token from cookies
 */
export const removeToken = () => {
  Cookies.remove(TOKEN_KEY)
}

/**
 * Decode the JWT token
 * @param {string} token - JWT token
 * @returns {object|null} Decoded token or null if invalid
 */
export const decodeToken = (token) => {
  try {
    return jwtDecode(token)
  } catch {
    return null
  }
}

/**
 * Check if the current token is valid (exists and not expired)
 * @returns {boolean}
 */
export const isTokenValid = () => {
  const token = getToken()
  if (!token) return false

  const decoded = decodeToken(token)
  if (!decoded) return false

  const now = Math.floor(Date.now() / 1000)
  return decoded.exp > now
}

/**
 * Get user info from the token
 * @returns {object|null} User info or null
 */
export const getUserFromToken = () => {
  const token = getToken()
  if (!token) return null

  const decoded = decodeToken(token)
  if (!decoded) return null

  return {
    id: decoded.user_id,
    name: decoded.name,
    username: decoded.username,
    email: decoded.email,
  }
}

/**
 * Get display name from token
 * @returns {string|null}
 */
export const getDisplayName = () => {
  const user = getUserFromToken()
  if (!user) return null

  return user.name || user.username || user.email?.split('@')[0] || user.id
}

/**
 * Get authorization headers for API requests
 * @returns {object} Headers object
 */
export const getAuthHeaders = () => {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * Calculate token expiry timeout in milliseconds
 * @returns {number} Timeout in ms, or 0 if no valid token
 */
export const getTokenExpiryTimeout = () => {
  const token = getToken()
  if (!token) return 0

  const decoded = decodeToken(token)
  if (!decoded?.exp) return 0

  const now = Math.floor(Date.now() / 1000)
  return Math.max(0, (decoded.exp - now) * 1000)
}

/**
 * Logout - clear token and redirect
 */
export const logout = () => {
  removeToken()
  localStorage.removeItem('dashboardCache')
  localStorage.removeItem('provactiveCache')
  window.location.href = '/login'
}

export default {
  getToken,
  setToken,
  removeToken,
  decodeToken,
  isTokenValid,
  getUserFromToken,
  getDisplayName,
  getAuthHeaders,
  getTokenExpiryTimeout,
  logout,
}
