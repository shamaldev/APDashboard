/**
 * FormInput Component
 * Reusable input field with icon and label
 */

import { forwardRef } from 'react'
import { motion } from 'framer-motion'

const itemVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
}

const FormInput = forwardRef(({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  autoComplete,
  icon: Icon,
  rightElement,
  className = '',
}, ref) => {
  return (
    <motion.div variants={itemVariants} className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
        )}
        <input
          ref={ref}
          type={type}
          id={id}
          value={value}
          onChange={onChange}
          className={`w-full ${Icon ? 'pl-11' : 'pl-4'} ${rightElement ? 'pr-11' : 'pr-4'} py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder-slate-400`}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
    </motion.div>
  )
})

FormInput.displayName = 'FormInput'

export default FormInput
