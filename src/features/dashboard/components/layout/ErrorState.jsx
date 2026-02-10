/**
 * ErrorState Component
 * Full-page error display with retry option
 */

import { AlertTriangle, RefreshCw } from 'lucide-react'

const ErrorState = ({ error, isAuthenticated, onRetry }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center p-8">
        <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
        <div className="text-lg font-medium text-slate-900 mb-2">
          {!isAuthenticated ? 'Authentication Required' : 'Error'}
        </div>
        <div className="text-sm text-slate-500 mb-4">
          {error || 'Please login'}
        </div>

        {!isAuthenticated ? (
          <a
            href="/login"
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            Login
          </a>
        ) : (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 mx-auto"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        )}
      </div>
    </div>
  )
}

export default ErrorState
