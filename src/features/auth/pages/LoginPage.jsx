/**
 * Login Page
 * CrescentOne branded login — User Identifier + Password
 */

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import axiosInstance from '@config/axios'
import { ROUTES } from '@shared/constants'
import { AuthLayout } from '../components'

/* ─── Brand tokens ─────────────────────────────────────────────── */
const BRAND = {
  primary:     '#1B5272',
  button:      '#2F5597',
  buttonHover: '#243F7A',
  border:      '#A8C4CA',
  focusBorder: '#2F5597',
  focusShadow: 'rgba(47,85,151,0.14)',
  inputBg:     '#FFFFFF',
}

/* ─── Error alert ───────────────────────────────────────────────── */
const ErrorAlert = ({ message }) => (
  <AnimatePresence>
    {message && (
      <motion.div
        key="error"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          backgroundColor: '#FEF2F2',
          border: '1px solid #FCA5A5',
          borderRadius: 3,
          padding: '10px 12px',
          marginBottom: 14,
          fontSize: 13,
          color: '#B91C1C',
        }}
      >
        <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1, color: '#EF4444' }} />
        <span>{message}</span>
      </motion.div>
    )}
  </AnimatePresence>
)

/* ─── Login Page ────────────────────────────────────────────────── */
const LoginPage = ({ onLogin }) => {
  const [identifier, setIdentifier] = useState('')
  const [password,   setPassword]   = useState('')
  const [showPass,   setShowPass]   = useState(false)
  const [error,      setError]      = useState('')
  const [isLoading,  setIsLoading]  = useState(false)
  const [btnHover,   setBtnHover]   = useState(false)

  const navigate = useNavigate()

  /* Redirect if already logged in */
  useEffect(() => {
    const token = Cookies.get('access_token')
    if (!token) return
    try {
      const decoded = jwtDecode(token)
      if (decoded.exp > Date.now() / 1000) {
        navigate(ROUTES.DASHBOARD)
      } else {
        Cookies.remove('access_token')
      }
    } catch {
      Cookies.remove('access_token')
    }
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!identifier || !password) {
      setError('Please fill in all fields.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('username', identifier)
      formData.append('password', password)

      const response = await axiosInstance.post('/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })

      const { access_token } = response.data
      const decoded = jwtDecode(access_token)
      const expires = new Date(decoded.exp * 1000)

      Cookies.set('access_token', access_token, { expires })
      if (onLogin) onLogin(identifier, access_token)
      navigate(ROUTES.AI_ASSISTANT)

      const timeout = (decoded.exp - Math.floor(Date.now() / 1000)) * 1000
      setTimeout(() => {
        Cookies.remove('access_token')
        navigate(ROUTES.LOGIN)
      }, timeout)

    } catch (err) {
      console.error('Login error:', err)
      if (err.response) {
        setError(err.response.data?.detail || 'Invalid credentials. Please try again.')
      } else if (err.request) {
        setError('Unable to connect to server. Please check your connection.')
      } else {
        setError('An unexpected error occurred.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      {/* Spinner keyframe */}
      <style>{`@keyframes co-spin { to { transform: rotate(360deg); } }`}</style>

      <form onSubmit={handleSubmit} noValidate>
        <ErrorAlert message={error} />

        {/* User Identifier */}
        <div style={{ marginBottom: 10 }}>
          <input
            className="cr-input"
            type="text"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            placeholder="User Identifier"
            autoComplete="username"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #A8C4CA',
              borderRadius: 2,
              fontSize: 13,
              color: BRAND.primary,
              backgroundColor: BRAND.inputBg,
              outline: 'none',
              boxSizing: 'border-box',
              opacity: isLoading ? 0.65 : 1,
            }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 18, position: 'relative' }}>
          <input
            className="cr-input"
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '8px 36px 8px 12px',
              border: '1px solid #A8C4CA',
              borderRadius: 2,
              fontSize: 13,
              color: BRAND.primary,
              backgroundColor: BRAND.inputBg,
              outline: 'none',
              boxSizing: 'border-box',
              opacity: isLoading ? 0.65 : 1,
            }}
          />
          <button
            type="button"
            onClick={() => setShowPass(v => !v)}
            disabled={isLoading}
            style={{
              position: 'absolute', right: 10,
              top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none',
              padding: 0, cursor: 'pointer',
              color: '#A8C4CA', display: 'flex',
            }}
            aria-label={showPass ? 'Hide password' : 'Show password'}
          >
            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>

        {/* Bottom row — Reset Password | Login */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            style={{
              fontSize: 13, fontWeight: 700,
              color: '#1B3A4B', textDecoration: 'none',
            }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
          >
            Reset Password
          </Link>

          <button
            type="submit"
            disabled={isLoading}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            style={{
              backgroundColor: isLoading ? '#6B8FC4' : btnHover ? BRAND.buttonHover : BRAND.button,
              color: '#ffffff',
              border: 'none',
              borderRadius: 3,
              padding: '7px 28px',
              fontSize: 13,
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.18s',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            {isLoading ? (
              <>
                <svg
                  width="13" height="13" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor"
                  strokeWidth="3" strokeLinecap="round"
                  style={{ animation: 'co-spin 0.9s linear infinite' }}
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Logging in…
              </>
            ) : (
              'Login'
            )}
          </button>
        </div>
      </form>
    </AuthLayout>
  )
}

export default LoginPage
