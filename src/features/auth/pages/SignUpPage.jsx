/**
 * SignUp Page
 * Handles user registration
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, User } from 'lucide-react'
import axiosInstance from '@config/axios'
import { ROUTES } from '@shared/constants'
import { FormInput, SubmitButton, AlertMessage } from '@shared/components/ui'
import { AuthLayout, AuthFooter, PasswordInput } from '../components'

const itemVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
}

const SIGNUP_FEATURES = [
  'Free 14-day trial',
  'No credit card required',
  'Full platform access'
]

const SignUpPage = ({ onSignup }) => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!firstName || !lastName || !email || !password) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const payload = { firstName, lastName, email, password }
      const response = await axiosInstance.post('/signup', payload)

      if (onSignup) onSignup(response.data)
      navigate(ROUTES.LOGIN)
    } catch (err) {
      console.error('Signup error:', err)
      if (err.response) {
        setError(err.response.data?.detail || 'Error creating account')
      } else if (err.request) {
        setError('Unable to connect to server. Please try again.')
      } else {
        setError('Unexpected error occurred.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      headline="Start your journey with"
      highlightedText="powerful analytics"
      description="Create your account and unlock the full potential of our analytics platform with real-time insights and advanced reporting."
      features={SIGNUP_FEATURES}
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Create your account
        </h2>
        <p className="text-slate-500">
          Fill in your details to get started
        </p>
      </div>

      <AlertMessage message={error} type="error" />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            id="firstName"
            label="First name"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            placeholder="John"
            disabled={isLoading}
            autoComplete="given-name"
            icon={User}
          />

          <FormInput
            id="lastName"
            label="Last name"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            placeholder="Doe"
            disabled={isLoading}
            autoComplete="family-name"
            icon={User}
          />
        </div>

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
          placeholder="Create a password"
          disabled={isLoading}
          autoComplete="new-password"
        />

        <SubmitButton isLoading={isLoading} loadingText="Creating account...">
          Create account
        </SubmitButton>
      </form>

      <motion.p className="mt-8 text-center text-sm text-slate-500" variants={itemVariants}>
        Already have an account?{' '}
        <Link
          to={ROUTES.LOGIN}
          className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          Sign in
        </Link>
      </motion.p>

      <AuthFooter actionText="creating an account" />
    </AuthLayout>
  )
}

export default SignUpPage
