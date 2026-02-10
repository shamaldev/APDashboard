/**
 * AuthFooter Component
 * Footer links for auth pages (terms, privacy)
 */

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ROUTES } from '@shared/constants'

const itemVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
}

const AuthFooter = ({ actionText = 'signing in' }) => {
  return (
    <motion.p className="mt-8 text-center text-xs text-slate-400" variants={itemVariants}>
      By {actionText}, you agree to our{' '}
      <Link to={ROUTES.TERMS} className="underline hover:text-slate-600">Terms of Service</Link>
      {' '}and{' '}
      <Link to={ROUTES.PRIVACY} className="underline hover:text-slate-600">Privacy Policy</Link>
    </motion.p>
  )
}

export default AuthFooter
