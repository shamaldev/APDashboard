/**
 * PrivateRoute Component
 * Protects routes that require authentication
 */

import { useEffect, useState, useRef } from 'react'
import { Navigate, Outlet, useNavigate } from 'react-router-dom'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'
import { ROUTES } from '@shared/constants'
import env from '@config/env'

const PrivateRoute = () => {
  const navigate = useNavigate()
  const [isValid, setIsValid] = useState(null)
  const intervalRef = useRef(null)

  const cleanupAndLogout = () => {
    Cookies.remove('access_token')
    localStorage.removeItem('dashboardCache')
    localStorage.removeItem('provactiveCache')
    navigate(ROUTES.LOGIN, { replace: true })
  }

  const validateToken = () => {
    const token = Cookies.get('access_token')

    if (!token) {
      cleanupAndLogout()
      return false
    }

    try {
      const decoded = jwtDecode(token)
      const now = Date.now() / 1000

      if (decoded.exp < now) {
        cleanupAndLogout()
        return false
      }

      return true
    } catch {
      cleanupAndLogout()
      return false
    }
  }

  useEffect(() => {
    const valid = validateToken()
    setIsValid(valid)

    if (!valid) return

    // Periodic token validation
    intervalRef.current = setInterval(() => {
      if (!validateToken()) {
        setIsValid(false)
      }
    }, env.TOKEN_CHECK_INTERVAL)

    // Validate on window focus
    const handleFocus = () => validateToken()
    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(intervalRef.current)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  // Loading state
  if (isValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Verifying session...</p>
        </div>
      </div>
    )
  }

  return isValid ? <Outlet /> : <Navigate to={ROUTES.LOGIN} replace />
}

export default PrivateRoute
