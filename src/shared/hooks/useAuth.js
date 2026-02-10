/**
 * useAuth Hook
 * Provides authentication state and utilities
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  isTokenValid,
  getDisplayName,
  getUserFromToken,
  logout as authLogout,
} from '../services/auth.service'
import env from '@config/env'
import { ROUTES } from '../constants/routes'

/**
 * Authentication hook for protected components
 * @param {object} options - Hook options
 * @param {boolean} options.redirectOnInvalid - Redirect to login if token invalid
 * @returns {object} Auth state and utilities
 */
export const useAuth = (options = {}) => {
  const { redirectOnInvalid = false } = options
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(null)
  const [user, setUser] = useState(null)
  const intervalRef = useRef(null)

  const validateToken = useCallback(() => {
    const valid = isTokenValid()

    if (!valid && redirectOnInvalid) {
      authLogout()
      return false
    }

    setIsAuthenticated(valid)

    if (valid) {
      setUser(getUserFromToken())
    } else {
      setUser(null)
    }

    return valid
  }, [redirectOnInvalid])

  const logout = useCallback(() => {
    authLogout()
  }, [])

  useEffect(() => {
    const valid = validateToken()

    if (!valid) return

    // Periodic token check
    intervalRef.current = setInterval(() => {
      if (!validateToken()) {
        setIsAuthenticated(false)
      }
    }, env.TOKEN_CHECK_INTERVAL)

    // Check on window focus
    const handleFocus = () => validateToken()
    window.addEventListener('focus', handleFocus)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      window.removeEventListener('focus', handleFocus)
    }
  }, [validateToken])

  return {
    isAuthenticated,
    isLoading: isAuthenticated === null,
    user,
    displayName: getDisplayName(),
    logout,
    validateToken,
  }
}

export default useAuth
