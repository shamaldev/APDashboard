/**
 * Login Page
 * Handles user authentication
 */

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'
import { Mail } from 'lucide-react'
import axiosInstance from '@config/axios'
import { ROUTES } from '@shared/constants'
import { FormInput, SubmitButton, AlertMessage } from '@shared/components/ui'
import { AuthLayout, AuthFooter, PasswordInput } from '../components'

const itemVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
}

const LOGIN_FEATURES = [
  'Real-time analytics',
  'Secure authentication',
  'Advanced reporting'
]

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    const token = Cookies.get('access_token')
    if (token) {
      const decoded = jwtDecode(token)
      const now = Math.floor(Date.now() / 1000)
      if (decoded.exp > now) {
        navigate(ROUTES.DASHBOARD)
      } else {
        Cookies.remove('access_token')
      }
    }
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('username', email)
      formData.append('password', password)

      const response = await axiosInstance.post('/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })

      const { access_token } = response.data
      const decoded = jwtDecode(access_token)
      const expires = new Date(decoded.exp * 1000)

      Cookies.set('access_token', access_token, { expires })

      if (onLogin) onLogin(email, access_token)

      navigate(ROUTES.AI_ASSISTANT)

      const timeout = (decoded.exp - Math.floor(Date.now() / 1000)) * 1000
      setTimeout(() => {
        Cookies.remove('access_token')
        navigate(ROUTES.LOGIN)
      }, timeout)

    } catch (err) {
      console.error('Login error:', err)
      if (err.response) {
        setError(err.response.data?.detail || 'Invalid credentials')
      } else if (err.request) {
        setError('Unable to connect to server. Please try again.')
      } else {
        setError('An unexpected error occurred.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      headline="Secure access to your"
      highlightedText="analytics platform"
      description="Monitor performance, analyze data, and make informed decisions with our comprehensive dashboard solution."
      features={LOGIN_FEATURES}
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Welcome back
        </h2>
        <p className="text-slate-500">
          Enter your credentials to access your account
        </p>
      </div>

      <AlertMessage message={error} type="error" />

      <form onSubmit={handleSubmit} className="space-y-5">
        <FormInput
          id="email"
          label="Email address"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="name@company.com"
          disabled={isLoading}
          autoComplete="email"
          icon={Mail}
        />

        <PasswordInput
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={isLoading}
        />

        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
              disabled={isLoading}
            />
            <span className="text-sm text-slate-600">Remember me</span>
          </label>
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Forgot password?
          </Link>
        </motion.div>

        <SubmitButton isLoading={isLoading} loadingText="Signing in...">
          Sign in
        </SubmitButton>
      </form>

      <motion.p className="mt-8 text-center text-sm text-slate-500" variants={itemVariants}>
        Don't have an account?{' '}
        <Link
          to={ROUTES.SIGNUP}
          className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          Create an account
        </Link>
      </motion.p>

      <AuthFooter actionText="signing in" />
    </AuthLayout>
  )
}

export default LoginPage
