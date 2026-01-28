import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Cookies from 'js-cookie'
import {jwtDecode} from 'jwt-decode'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, AlertCircle } from 'lucide-react'
import axiosInstance, { API_BASE_URL } from '../config/axios'

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    // Check token on mount
    const token = Cookies.get('access_token')
    if (token) {
      const decoded = jwtDecode(token)
      const now = Math.floor(Date.now() / 1000)
      if (decoded.exp > now) {
        navigate('/ssbi')
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

      // Decode token to get expiry
      const decoded = jwtDecode(access_token)
      const expires = new Date(decoded.exp * 1000) // JS Date in ms

      // Store in cookies
      Cookies.set('access_token', access_token, { expires })

      // Optional callback
      if (onLogin) onLogin(email, access_token)

      // Redirect to landing
      navigate('/ai-assistant')

      // Set timeout for auto logout
      const timeout = (decoded.exp - Math.floor(Date.now() / 1000)) * 1000
      setTimeout(() => {
        Cookies.remove('access_token')
        navigate('/login')
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

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-100 via-purple-50 to-pink-100 px-4 relative overflow-hidden">
      {/* Background Orbs */}
      <motion.div className="absolute top-20 left-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20"
        animate={{ scale: [1, 1.2, 1], x: [0, 100, 0] }}
        transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
      />
      <motion.div className="absolute bottom-20 right-10 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20"
        animate={{ scale: [1, 1.3, 1], x: [0, -100, 0] }}
        transition={{ duration: 12, repeat: Infinity, repeatType: "reverse" }}
      />

      <motion.div className="bg-white/90 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-md relative z-10 border border-white/50"
        variants={containerVariants} initial="hidden" animate="visible"
      >
        {/* Logo */}
        <motion.div className="flex justify-center mb-6"
          initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        >
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-4 rounded-2xl shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </motion.div>

        <motion.h2 className="text-3xl md:text-4xl font-black text-center text-black mb-2" variants={itemVariants}>
          Welcome Back
        </motion.h2>
        <motion.p className="text-center text-gray-600 mb-8" variants={itemVariants}>
          Sign in to continue your journey
        </motion.p>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Email */}
        <div className="space-y-5">
          <motion.div variants={itemVariants}>
            <label htmlFor="email" className="block text-sm font-semibold text-black mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSubmit(e)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-all duration-300 bg-white/50 text-black placeholder-gray-400"
                placeholder="Enter your email" disabled={isLoading}
              />
            </div>
          </motion.div>

          {/* Password */}
          <motion.div variants={itemVariants}>
            <label htmlFor="password" className="block text-sm font-semibold text-black mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type={showPassword ? "text" : "password"} id="password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSubmit(e)}
                className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-all duration-300 bg-white/50 text-black placeholder-gray-400"
                placeholder="Enter your password" disabled={isLoading}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </motion.div>

          {/* Sign In */}
          <motion.button type="button" onClick={handleSubmit} disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            whileHover={{ scale: isLoading ? 1 : 1.02 }} whileTap={{ scale: isLoading ? 1 : 0.98 }} variants={itemVariants}
          >
            {isLoading ? (
              <>
                <motion.div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

export default Login
