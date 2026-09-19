// VaaniStock — Voice Service (Browser Web Speech API abstraction)

export class VoiceService {
  constructor() {
    this.recognition = null
    this.synthesis = window.speechSynthesis || null
    this.isSpeaking = false
    this.onSpeakingChange = null
    this._isSupported = this._checkSupport()
    
    // Preload voices
    if (this.synthesis) {
        this.synthesis.getVoices()
        this.synthesis.onvoiceschanged = () => {
            this.synthesis.getVoices()
        }
    }
  }

  _checkSupport() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    return !!SpeechRecognition
  }

  get isSupported() {
    return this._isSupported
  }

  /**
   * Start listening and return the transcript via Promise.
   * @param {string} lang - BCP 47 language tag (e.g. 'en-IN', 'hi-IN', 'te-IN')
   * @param {Function} onInterim - Called with interim transcript as user speaks
   * @returns {Promise<string>} - Final transcript
   */
  async listen(lang = 'en-IN', onInterim = null) {
    if (!this._isSupported) {
      throw new Error('Speech recognition not supported. Please use Chrome or Edge.')
    }

    if (this.recognition) {
      throw new Error('Voice recognition is already running. Please wait for it to finish.')
    }

    // Request mic permission before creating the recognition session.
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      throw new Error('Microphone permission was denied. Please allow microphone access in your browser settings.')
    }

    return new Promise((resolve, reject) => {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition

      this.recognition = new SpeechRecognition()
      this.recognition.continuous = false
      this.recognition.interimResults = true
      if (lang) this.recognition.lang = lang
      this.recognition.maxAlternatives = 3

      let finalTranscript = ''
      let silenceTimer = null

      this.recognition.onresult = (event) => {
        let interim = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            finalTranscript += result[0].transcript + ' '
          } else {
            interim += result[0].transcript
          }
        }
        if (onInterim) onInterim(finalTranscript.trim() || interim.trim())

        // Reset silence timer
        if (silenceTimer) clearTimeout(silenceTimer)
        silenceTimer = setTimeout(() => {
          if (finalTranscript.trim()) {
            this.stop()
          }
        }, 2000)
      }

      this.recognition.onend = () => {
        if (silenceTimer) clearTimeout(silenceTimer)
        this.recognition = null
        resolve(finalTranscript.trim())
      }

      this.recognition.onerror = (event) => {
        if (silenceTimer) clearTimeout(silenceTimer)
        this.recognition = null
        switch (event.error) {
          case 'not-allowed':
          case 'permission-denied':
            reject(new Error('Microphone blocked. Click the mic icon in your browser address bar to allow access.'))
            break
          case 'no-speech':
            reject(new Error('No speech detected. Please speak clearly and try again.'))
            break
          case 'network':
            reject(new Error('Browser speech service is unavailable. Type your command below, or retry in Chrome/Edge with internet access.'))
            break
          case 'audio-capture':
            reject(new Error('No microphone found. Please connect a microphone.'))
            break
          case 'aborted':
            resolve('')
            break
          default:
            reject(new Error(`Voice recognition error: ${event.error}. Try refreshing the page.`))
        }
      }

      try {
        this.recognition.start()
      } catch {
        reject(new Error('Failed to start voice recognition. Please refresh the page.'))
      }
    })
  }

  stop() {
    if (this.recognition) {
      try {
        this.recognition.stop()
      } catch {
        // Ignore
      }
    }
  }

  abort() {
    if (this.recognition) {
      try {
        this.recognition.abort()
      } catch {
        // Ignore
      }
    }
  }

  /**
   * Speak text using Text-to-Speech
   * @param {string} text
   * @param {string} lang - BCP 47 language tag
   */
  speak(text, lang = 'en-IN') {
    if (!this.synthesis) return

    // Cancel ongoing speech
    this.synthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.95
    utterance.pitch = 1.0
    utterance.volume = 1.0
    
    utterance.onstart = () => {
        this.isSpeaking = true
        if (this.onSpeakingChange) this.onSpeakingChange(true)
    }
    
    utterance.onend = () => {
        this.isSpeaking = false
        if (this.onSpeakingChange) this.onSpeakingChange(false)
    }
    
    utterance.onerror = () => {
        this.isSpeaking = false
        if (this.onSpeakingChange) this.onSpeakingChange(false)
    }

    // Try to get voices. If not loaded, attach to onvoiceschanged.
    let voices = this.synthesis.getVoices()
    
    const setVoiceAndSpeak = () => {
        voices = this.synthesis.getVoices()
        // Prefer Indian English voice if available, or exact match
        const preferred = voices.find(
          (v) =>
            v.lang === lang ||
            v.lang.startsWith(lang.split('-')[0]) ||
            v.name.toLowerCase().includes('india')
        )
        if (preferred) utterance.voice = preferred
        this.synthesis.speak(utterance)
    }

    if (voices.length === 0) {
        // Voices not loaded yet, wait for them
        const prevOnVoicesChanged = this.synthesis.onvoiceschanged
        this.synthesis.onvoiceschanged = (e) => {
            if (prevOnVoicesChanged) prevOnVoicesChanged(e)
            setVoiceAndSpeak()
            // Reset to prevent multiple speak calls on subsequent changes
            this.synthesis.onvoiceschanged = prevOnVoicesChanged
        }
    } else {
        setVoiceAndSpeak()
    }
    
    return utterance
  }

  cancelSpeech() {
    if (this.synthesis) this.synthesis.cancel()
  }

  /**
   * Get language tag from app language code
   */
  static getLangTag(appLang) {
    const map = {
      auto: navigator.language || 'en-IN',
      en: 'en-IN',
      hi: 'hi-IN',
      te: 'te-IN',
      hinglish: 'hi-IN',
    }
    return map[appLang] || 'en-IN'
  }
}

export const voiceService = new VoiceService()
export default voiceService
