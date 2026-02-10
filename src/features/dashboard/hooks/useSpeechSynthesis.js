/**
 * useSpeechSynthesis Hook
 * Provides text-to-speech functionality using Web Speech API
 */

import { useState, useCallback, useEffect, useRef } from 'react'

const useSpeechSynthesis = () => {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentMessageId, setCurrentMessageId] = useState(null)
  const utteranceRef = useRef(null)

  // Check if speech synthesis is supported
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  // Clean up text for better speech output
  const cleanTextForSpeech = (text) => {
    if (!text) return ''

    return text
      // Remove markdown bold/italic
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      // Remove URLs
      .replace(/https?:\/\/[^\s]+/g, '')
      // Clean up multiple spaces and newlines
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  // Stop speaking
  const stop = useCallback(() => {
    if (isSupported && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
    setIsPaused(false)
    setCurrentMessageId(null)
    utteranceRef.current = null
  }, [isSupported])

  // Pause speaking
  const pause = useCallback(() => {
    if (isSupported && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause()
      setIsPaused(true)
    }
  }, [isSupported])

  // Resume speaking
  const resume = useCallback(() => {
    if (isSupported && window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
      setIsPaused(false)
    }
  }, [isSupported])

  // Speak text
  const speak = useCallback((text, messageId = null) => {
    if (!isSupported) {
      console.warn('Speech synthesis not supported')
      return
    }

    // If already speaking the same message, toggle pause/resume
    if (currentMessageId === messageId && isSpeaking) {
      if (isPaused) {
        resume()
      } else {
        pause()
      }
      return
    }

    // Stop any current speech
    stop()

    const cleanedText = cleanTextForSpeech(text)
    if (!cleanedText) return

    const utterance = new SpeechSynthesisUtterance(cleanedText)
    utteranceRef.current = utterance

    // Configure voice settings
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0

    // Try to get a good English voice
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find(voice =>
      voice.lang.startsWith('en') && voice.name.includes('Google')
    ) || voices.find(voice =>
      voice.lang.startsWith('en')
    )

    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    // Event handlers
    utterance.onstart = () => {
      setIsSpeaking(true)
      setIsPaused(false)
      setCurrentMessageId(messageId)
    }

    utterance.onend = () => {
      setIsSpeaking(false)
      setIsPaused(false)
      setCurrentMessageId(null)
      utteranceRef.current = null
    }

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error)
      setIsSpeaking(false)
      setIsPaused(false)
      setCurrentMessageId(null)
      utteranceRef.current = null
    }

    utterance.onpause = () => {
      setIsPaused(true)
    }

    utterance.onresume = () => {
      setIsPaused(false)
    }

    // Start speaking
    window.speechSynthesis.speak(utterance)
  }, [isSupported, currentMessageId, isSpeaking, isPaused, stop, pause, resume])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel()
      }
    }
  }, [isSupported])

  // Load voices (they may not be immediately available)
  useEffect(() => {
    if (!isSupported) return

    const loadVoices = () => {
      window.speechSynthesis.getVoices()
    }

    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [isSupported])

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    currentMessageId,
    isSupported
  }
}

export default useSpeechSynthesis
