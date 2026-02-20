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
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ backgroundColor: '#D7EBEE' }}
      >
        <img
          src="/crescent-logo.jpg"
          alt="CrescentOne"
          style={{ height: 40, objectFit: 'contain', marginBottom: 24, mixBlendMode: 'multiply' }}
        />
        <div
          className="rounded-full animate-spin mb-3"
          style={{
            width: 36,
            height: 36,
            border: '3px solid #B8D9DE',
            borderTopColor: '#1B5272',
          }}
        />
        <p style={{ fontSize: 13, color: '#7DAAAD' }}>Verifying session...</p>
      </div>
    )
  }

  return isValid ? <Outlet /> : <Navigate to={ROUTES.LOGIN} replace />
}

export default PrivateRoute
