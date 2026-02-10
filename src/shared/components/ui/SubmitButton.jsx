/**
 * SubmitButton Component
 * Reusable submit button with loading state
 */

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

const itemVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
}

const SubmitButton = ({
  isLoading = false,
  loadingText = 'Loading...',
  children,
  className = '',
}) => {
  return (
    <motion.button
      type="submit"
      disabled={isLoading}
      className={`w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      whileTap={{ scale: isLoading ? 1 : 0.98 }}
      variants={itemVariants}
    >
      {isLoading ? (
        <>
          <motion.div
            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          <span>{children}</span>
          <ArrowRight className="w-4 h-4" />
        </>
      )}
    </motion.button>
  )
}

export default SubmitButton
