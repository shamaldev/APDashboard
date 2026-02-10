/**
 * useSpeechRecognition Hook
 * Manages speech recognition functionality
 */

import { useState, useEffect, useRef, useCallback } from 'react'

const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false)
  const [isAgentListening, setIsAgentListening] = useState(false)
  const recognitionRef = useRef(null)

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'
    }
  }, [])

  const startVoiceInput = useCallback((target, onResult) => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser.')
      return
    }

    const setListeningState = target === 'dashboard' ? setIsListening : setIsAgentListening

    recognitionRef.current.onstart = () => setListeningState(true)
    recognitionRef.current.onend = () => setListeningState(false)
    recognitionRef.current.onerror = (e) => {
      console.error('Speech error:', e)
      setListeningState(false)
    }
    recognitionRef.current.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('')
      onResult(transcript)
    }

    recognitionRef.current.start()
  }, [])

  const stopVoiceInput = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
      setIsAgentListening(false)
    }
  }, [])

  return {
    isListening,
    isAgentListening,
    startVoiceInput,
    stopVoiceInput
  }
}

export default useSpeechRecognition
