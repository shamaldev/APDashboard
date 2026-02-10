/**
 * LoadingState Component
 * Full-page loading indicator with progress
 */

import { Loader2 } from 'lucide-react'

const LoadingState = ({ message, progress }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
        <Loader2 size={48} className="animate-spin text-amber-600 mx-auto mb-4" />
        <div className="text-lg font-medium text-slate-900 mb-2">{message}</div>
        <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden mx-auto">
          <div
            className="h-full bg-amber-600 transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-sm text-slate-500 mt-2">{progress}%</div>
      </div>
    </div>
  )
}

export default LoadingState
