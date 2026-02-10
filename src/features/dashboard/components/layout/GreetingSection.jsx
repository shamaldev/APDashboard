/**
 * GreetingSection Component
 * Personalized greeting with search input
 */

import { HelpCircle, Mic, MicOff, Send } from 'lucide-react'
import {
  getPersonalizedGreeting,
  getCreativeHeadline,
  getContextualSubtext,
  getActionPrompt
} from '../../utils/helpers'

const GreetingSection = ({
  userName,
  query,
  onQueryChange,
  onQuerySubmit,
  onVoiceStart,
  onVoiceStop,
  isListening,
  isLoading
}) => {
  const now = new Date()
  const hour = now.getHours()
  const dayOfWeek = now.getDay()

  const greeting = getPersonalizedGreeting(userName, hour)
  const headline = getCreativeHeadline(dayOfWeek, hour)
  const contextualTip = `${getContextualSubtext(dayOfWeek, hour)}\n${getActionPrompt(dayOfWeek)}`

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onQuerySubmit()
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 mb-8">
      {/* Greeting Text */}
      <div className="text-center">
        <h2 className="font-serif text-3xl font-semibold text-slate-900">
          {greeting}
        </h2>
        <p className="text-base text-slate-600 mt-2">{headline}</p>
        <p className="text-sm text-slate-500 mt-1 whitespace-pre-line">{contextualTip}</p>
      </div>

      {/* Search Input */}
      <div className="w-full max-w-2xl">
        <div className={`bg-white border rounded-full px-5 py-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-all ${
          isListening ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-200'
        }`}>
          <HelpCircle size={18} className="text-slate-400" />
          <input
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your business data (e.g., 'Show me invoices over $50k from last month')"
            className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder-slate-400"
          />

          {/* Voice Button */}
          <button
            onClick={isListening ? onVoiceStop : onVoiceStart}
            className={`p-2 rounded-full transition-colors ${
              isListening
                ? 'bg-red-100 text-red-600 animate-pulse'
                : 'hover:bg-slate-100 text-slate-500'
            }`}
            title={isListening ? 'Stop listening' : 'Voice input'}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          {/* Send Button */}
          <button
            onClick={onQuerySubmit}
            disabled={!query.trim() || isLoading}
            className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-50 transition-colors"
          >
            <Send size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Listening indicator */}
        {isListening && (
          <div className="text-center text-xs text-red-500 mt-2 animate-pulse">
            Listening... Speak now
          </div>
        )}
      </div>
    </div>
  )
}

export default GreetingSection
