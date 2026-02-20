/**
 * ChatInput Component
 * Input area for AI chat with voice support
 */

import { Send, MessageSquare, Mic, MicOff } from 'lucide-react'

const ChatInput = ({
  value,
  onChange,
  onSend,
  onVoiceStart,
  onVoiceStop,
  isListening,
  isLoading,
  activeCard
}) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className="p-4 bg-white border-t border-slate-100">
      <div className={`bg-slate-50 border rounded-xl p-3 transition-all ${
        isListening ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-200'
      }`}>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask anything about your AP data..."
          className="w-full bg-transparent outline-none text-sm resize-none"
          rows={2}
          disabled={isLoading}
        />

        <div className="flex justify-between items-center mt-2">
          {/* Context indicator */}
          <div className="text-[10px] text-slate-400 flex items-center gap-2">
            <MessageSquare size={10} />
            {activeCard ? (
              <span>Context: <span style={{ color: '#1B5272' }} className="font-medium">{activeCard.title}</span></span>
            ) : (
              <span>General AP Query</span>
            )}
            {isListening && (
              <span className="text-red-500 animate-pulse">Listening...</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Voice button */}
            <button
              onClick={isListening ? onVoiceStop : onVoiceStart}
              disabled={isLoading}
              className={`p-1.5 rounded transition-colors ${
                isListening
                  ? 'bg-red-100 text-red-600 animate-pulse'
                  : 'hover:bg-slate-200 text-slate-500'
              } disabled:opacity-50`}
              title={isListening ? 'Stop listening' : 'Voice input'}
            >
              {isListening ? <MicOff size={14} /> : <Mic size={14} />}
            </button>

            {/* Send button */}
            <button
              onClick={onSend}
              disabled={isLoading || !value.trim()}
              className="text-white rounded px-3 py-1.5 disabled:opacity-50 flex items-center gap-1.5 text-xs font-medium transition-colors"
              style={{ backgroundColor: '#2F5597' }}
              onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#243F7A' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#2F5597' }}
            >
              <Send size={12} />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatInput
