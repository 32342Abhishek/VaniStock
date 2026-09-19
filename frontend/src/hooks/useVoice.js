// VaaniStock — useVoice Hook
import { useState, useRef, useCallback, useEffect } from 'react'
import voiceService from '../services/voiceService'
import { voiceAPI } from '../services/api'
import toast from 'react-hot-toast'

export const VOICE_STATES = {
  IDLE: 'IDLE',
  LISTENING: 'LISTENING',
  PROCESSING: 'PROCESSING',
  CONFIRMATION: 'CONFIRMATION',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
}

export function useVoice({ defaultLanguage = 'en', onConfirmed, onNavigate } = {}) {
  const [state, setState] = useState(VOICE_STATES.IDLE)
  const [transcript, setTranscript] = useState('')
  const [parsed, setParsed] = useState(null)
  const [product, setProduct] = useState(null)
  const [error, setError] = useState(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState(defaultLanguage)
  const [responseMessage, setResponseMessage] = useState(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const abortRef = useRef(false)
  
  useEffect(() => {
      voiceService.onSpeakingChange = (speaking) => setIsSpeaking(speaking)
      return () => { voiceService.onSpeakingChange = null }
  }, [])

  const langTag = { auto: null, en: 'en-IN', hi: 'hi-IN', te: 'te-IN' }[selectedLanguage] ?? 'en-IN'
  const speechLangTag = langTag || navigator.language || 'en-IN'

  const executeQuery = useCallback(async (queryText, intent, productName, lang) => {
    setState(VOICE_STATES.PROCESSING)
    try {
      const res = await voiceAPI.query({
        transcript: queryText,
        intent: intent,
        productName: productName,
        language: lang || selectedLanguage
      })
      const msg = res.data.message
      setResponseMessage(msg)
      setState(VOICE_STATES.SUCCESS)
      if (msg) voiceService.speak(msg, speechLangTag)
      if (onConfirmed) onConfirmed(res.data)

      setTimeout(() => {
        if (!voiceService.isSpeaking) setState(VOICE_STATES.IDLE)
      }, 5000)
    } catch (err) {
      setError(err.response?.data?.detail?.message || 'Query failed')
      setState(VOICE_STATES.ERROR)
    }
  }, [onConfirmed, selectedLanguage, speechLangTag])


  const startListening = useCallback(async () => {
    setError(null)
    setTranscript('')
    setParsed(null)
    setProduct(null)
    abortRef.current = false

    if (!voiceService.isSupported) {
      setError('Voice recognition is not supported in this browser. Please use Chrome or Edge.')
      setState(VOICE_STATES.ERROR)
      return
    }

    setState(VOICE_STATES.LISTENING)
    let finalText = ''

    try {
      finalText = await voiceService.listen(langTag, (interim) => {
        setTranscript(interim)
      })
    } catch (err) {
      if (abortRef.current) return
      setError(err.message)
      const browserSpeechUnavailable = err.message.startsWith('Browser speech service')
      setState(browserSpeechUnavailable ? VOICE_STATES.IDLE : VOICE_STATES.ERROR)
      return
    }

    if (!finalText.trim()) {
      setError('No speech detected. Please try again.')
      setState(VOICE_STATES.ERROR)
      return
    }

    setTranscript(finalText)
    setState(VOICE_STATES.PROCESSING)

    try {
      const res = await voiceAPI.parse(finalText, selectedLanguage)
      const { parsed: parsedData, product: productData, isDemoMode: demo } = res.data.data
      setParsed(parsedData)
      setProduct(productData)
      setIsDemoMode(!!demo)

      const intent = parsedData?.intent
      if (intent === 'NAVIGATE' && onNavigate && parsedData?.productName) {
        setState(VOICE_STATES.SUCCESS)
        onNavigate(parsedData.productName)
        setTimeout(() => setState(VOICE_STATES.IDLE), 1500)
      } else if (['STOCK_QUERY', 'LOW_STOCK_QUERY', 'REORDER_QUERY', 'INVENTORY_SUMMARY', 'PRODUCT_SEARCH', 'HELP'].includes(intent)) {
        // Auto-execute query
        await executeQuery(finalText, intent, parsedData?.productName, parsedData?.language)
      } else {
        setState(VOICE_STATES.CONFIRMATION)
      }
    } catch (err) {
      setError(err.response?.data?.detail?.message || 'Failed to process command')
      setState(VOICE_STATES.ERROR)
    }
    }, [executeQuery, langTag, onNavigate, selectedLanguage])

  const confirmCommand = useCallback(async (confirmData) => {
    setState(VOICE_STATES.PROCESSING)
    try {
      const res = await voiceAPI.confirm(confirmData)
      
      // If it's a DELETE_PRODUCT that needed confirmation but wasn't confirmed
      if (res.data.data?.needsConfirmation) {
          setResponseMessage(res.data.message)
          setState(VOICE_STATES.CONFIRMATION)
          if (res.data.message) voiceService.speak(res.data.message, speechLangTag)
          return res.data
      }
      
      setState(VOICE_STATES.SUCCESS)
      const msg = res.data.message
      setResponseMessage(msg)
      if (msg) voiceService.speak(msg, speechLangTag)
      toast.success(msg || 'Success!')
      if (onConfirmed) onConfirmed(res.data)
      setTimeout(() => {
          if (!voiceService.isSpeaking) setState(VOICE_STATES.IDLE)
      }, 5000)
      return res.data
    } catch (err) {
      const errMsg = err.response?.data?.detail?.message || 'Update failed'
      setError(errMsg)
      setState(VOICE_STATES.ERROR)
      toast.error(errMsg)
      if (errMsg) voiceService.speak(errMsg, speechLangTag)
    }
  }, [onConfirmed, speechLangTag])

  const submitManualCommand = useCallback(async (text) => {
    if (!text.trim()) return
    setTranscript(text)
    setState(VOICE_STATES.PROCESSING)
    try {
      const res = await voiceAPI.parse(text, selectedLanguage)
      const { parsed: parsedData, product: productData, isDemoMode: demo } = res.data.data
      setParsed(parsedData)
      setProduct(productData)
      setIsDemoMode(!!demo)
      
      const intent = parsedData?.intent
      if (intent === 'NAVIGATE' && onNavigate && parsedData?.productName) {
        setState(VOICE_STATES.SUCCESS)
        onNavigate(parsedData.productName)
        setTimeout(() => setState(VOICE_STATES.IDLE), 1500)
      } else if (['STOCK_QUERY', 'LOW_STOCK_QUERY', 'REORDER_QUERY', 'INVENTORY_SUMMARY', 'PRODUCT_SEARCH', 'HELP'].includes(intent)) {
        await executeQuery(text, intent, parsedData?.productName, parsedData?.language)
      } else {
        setState(VOICE_STATES.CONFIRMATION)
      }
    } catch (err) {
      setError(err.response?.data?.detail?.message || 'Failed to process command')
      setState(VOICE_STATES.ERROR)
    }
  }, [executeQuery, onNavigate, selectedLanguage])

  const cancel = useCallback(() => {
    abortRef.current = true
    voiceService.abort()
    voiceService.cancelSpeech()
    setState(VOICE_STATES.IDLE)
    setError(null)
    setTranscript('')
    setParsed(null)
  }, [])

  const reset = useCallback(() => {
    if (state !== VOICE_STATES.LISTENING && state !== VOICE_STATES.PROCESSING) {
        setState(VOICE_STATES.IDLE)
    }
    setError(null)
    setTranscript('')
    setParsed(null)
    setProduct(null)
    setResponseMessage(null)
  }, [state])

  return {
    state,
    transcript,
    parsed,
    product,
    error,
    isDemoMode,
    isListening: state === VOICE_STATES.LISTENING,
    isProcessing: state === VOICE_STATES.PROCESSING,
    isConfirmation: state === VOICE_STATES.CONFIRMATION,
    selectedLanguage,
    setSelectedLanguage,
    responseMessage,
    isSpeaking,
    startListening,
    confirmCommand,
    submitManualCommand,
    cancel,
    reset,
  }
}
