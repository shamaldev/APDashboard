/**
 * AlertMessage Component
 * Reusable alert/error message display
 */

import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle, Info } from 'lucide-react'

const variants = {
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: AlertCircle,
    iconColor: 'text-red-500',
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    icon: CheckCircle,
    iconColor: 'text-green-500',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    icon: Info,
    iconColor: 'text-blue-500',
  },
}

const AlertMessage = ({ message, type = 'error', show = true }) => {
  const style = variants[type] || variants.error
  const Icon = style.icon

  return (
    <AnimatePresence mode="wait">
      {show && message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`${style.bg} border ${style.border} ${style.text} px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-3`}
        >
          <Icon className={`w-5 h-5 flex-shrink-0 ${style.iconColor}`} />
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AlertMessage
