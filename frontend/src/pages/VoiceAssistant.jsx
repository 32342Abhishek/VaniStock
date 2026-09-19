// VaaniStock — Voice Assistant Page (dedicated full-page experience)
import { useState } from 'react'
import { Mic, Info, Zap, CheckCircle2, Package, Globe, Volume2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useVoice, VOICE_STATES } from '../hooks/useVoice'
import MicButton from '../components/MicButton'
import ConfirmationCard from '../components/ConfirmationCard'
import { voiceAPI } from '../services/api'
import toast from 'react-hot-toast'

const EXAMPLE_CMDS = [
  {
    lang: 'English',  flag: '🇬🇧',
    cmds: [
      'Add 20 bags of rice',
      'Remove 5 packets of biscuits',
      'How much sugar is available?',
      'Which products are low on stock?',
    ]
  },
  {
    lang: 'Hinglish', flag: '🇮🇳',
    cmds: [
      '10 bags rice add karo',
      '5 carton biscuits right side karo',
      'Kitna sugar stock mein hai?',
      'Kaunsa stock kam hai?',
    ]
  },
  {
    lang: 'Telugu',   flag: '🇮🇳',
    cmds: [
      'Rice 20 bags add cheyyi',
      'Biscuits 5 cartons remove cheyyi',
      'Enta rice undi?',
      'Low stock products chupinchu',
    ]
  },
]

export default function VoiceAssistant() {
  const { user }   = useAuth()
  const [queryResult, setQueryResult]   = useState(null)
  const [manualInput, setManualInput]   = useState('')
  const [showExamples, setShowExamples] = useState(true)

  const voice = useVoice({
    defaultLanguage: user?.preferredLanguage || 'en',
    onConfirmed: (data) => { setQueryResult({ type: 'mutation', data }) }
  })

  const isReadOnly = voice.parsed && [
    'STOCK_QUERY','LOW_STOCK_QUERY','REORDER_QUERY','INVENTORY_SUMMARY','PRODUCT_SEARCH','HELP'
  ].includes(voice.parsed.intent)

  const handleConfirm = async (confirmData) => {
    if (isReadOnly) {
      try {
        const res = await voiceAPI.query({
          transcript: voice.transcript,
          intent: voice.parsed.intent,
          productName: voice.parsed.productName,
          language: voice.parsed.language,
        })
        setQueryResult({ type: 'query', result: res.data })
        voice.reset()
      } catch {
        toast.error('Query failed')
        voice.cancel()
      }
      return
    }
    await voice.confirmCommand({ ...confirmData, requestId: crypto.randomUUID() })
  }

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (manualInput.trim()) {
      voice.submitManualCommand(manualInput.trim())
      setManualInput('')
      setQueryResult(null)
      setShowExamples(false)
    }
  }

  const handleMicClick = () => {
    if (voice.state === VOICE_STATES.LISTENING) {
      voice.cancel()
    } else {
      voice.startListening()
      setQueryResult(null)
      setShowExamples(false)
    }
  }

  const stateLabel = {
    [VOICE_STATES.IDLE]:         { title: 'Ready to Listen',    sub: 'Tap the mic and speak your command' },
    [VOICE_STATES.LISTENING]:    { title: 'Listening…',          sub: 'Speak clearly into your microphone' },
    [VOICE_STATES.PROCESSING]:   { title: 'Processing…',         sub: 'AI is understanding your command' },
    [VOICE_STATES.CONFIRMATION]: { title: 'Review Command',      sub: 'Confirm the action below' },
    [VOICE_STATES.SUCCESS]:      { title: 'Done! ✅',            sub: 'Command executed successfully' },
    [VOICE_STATES.ERROR]:        { title: 'Error',               sub: voice.error || 'Something went wrong' },
  }[voice.state] || { title: '', sub: '' }

  return (
    <div className="max-w-2xl mx-auto space-y-5 page-enter">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Mic size={20} className="text-brand-400" /> Voice Assistant
        </h1>
        <p className="text-gray-500 text-sm mt-1">Speak or type to manage your inventory in any language</p>
      </div>

      {/* Demo Mode Banner */}
      {voice.isDemoMode && (
        <div className="flex items-start gap-3 rounded-xl p-3.5"
          style={{ background: 'rgba(97,113,246,0.08)', border: '1px solid rgba(97,113,246,0.2)' }}>
          <Zap size={15} className="text-brand-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-brand-300 text-sm font-semibold">Smart Rule-Based Parser Active</p>
            <p className="text-gray-400 text-xs mt-0.5">
              Supports English, Hinglish &amp; Telugu. Try commands like "right side karo", "hata do", "add cheyyi".
              Add a valid Gemini API key in backend/.env for full AI NLP.
            </p>
          </div>
        </div>
      )}

      {/* Main Voice Area */}
      <div className="card relative overflow-hidden"
        style={{
          background: voice.state === VOICE_STATES.LISTENING
            ? 'linear-gradient(135deg, rgba(255,87,87,0.08), rgba(22,22,46,0.95))'
            : voice.state === VOICE_STATES.SUCCESS
            ? 'linear-gradient(135deg, rgba(16,217,160,0.08), rgba(22,22,46,0.95))'
            : 'linear-gradient(135deg, rgba(97,113,246,0.07), rgba(22,22,46,0.95))',
          border: voice.state === VOICE_STATES.LISTENING
            ? '1px solid rgba(255,87,87,0.25)'
            : voice.state === VOICE_STATES.SUCCESS
            ? '1px solid rgba(16,217,160,0.25)'
            : '1px solid rgba(97,113,246,0.18)',
          transition: 'all 0.4s ease',
          minHeight: 240,
        }}>

        {/* Background radial glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: voice.state === VOICE_STATES.LISTENING
              ? 'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(255,87,87,0.1), transparent)'
              : 'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(97,113,246,0.08), transparent)',
            transition: 'all 0.4s ease',
          }} />

        <div className="relative text-center space-y-5 py-2">
          {/* Language Selector */}
          <div className="flex justify-center mb-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                   style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Globe size={14} className="text-gray-400" />
                  <select 
                      value={voice.selectedLanguage}
                      onChange={(e) => voice.setSelectedLanguage(e.target.value)}
                      className="bg-transparent text-xs text-white outline-none cursor-pointer"
                  >
                      <option value="auto">Auto Detect</option>
                      <option value="en">English</option>
                      <option value="hi">Hindi (हिंदी)</option>
                      <option value="te">Telugu (తెలుగు)</option>
                  </select>
              </div>
          </div>

          {/* Status text */}
          <div>
            <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                {stateLabel.title}
                {voice.isSpeaking && <Volume2 size={18} className="text-brand-400 animate-pulse" />}
            </h2>
            <p className="text-gray-400 text-sm mt-1">{stateLabel.sub}</p>
          </div>

          {/* Waveform when listening */}
          {voice.state === VOICE_STATES.LISTENING && (
            <div className="flex items-center gap-1.5 h-10 justify-center">
              {[1,2,3,4,5,6,7].map(i => (
                <div key={i} className="wave-bar" style={{ width: 5, height: 28, animationDelay: `${(i-1)*0.1}s` }} />
              ))}
            </div>
          )}

          {/* Transcript bubble */}
          {voice.transcript && voice.state !== VOICE_STATES.CONFIRMATION && (
            <div className="rounded-2xl px-4 py-3 text-left mx-auto max-w-sm"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">You said</p>
              <p className="text-white font-semibold text-sm">&#34;{voice.transcript}&#34;</p>
            </div>
          )}

          {/* Response Message */}
          {voice.responseMessage && voice.state !== VOICE_STATES.CONFIRMATION && (
              <div className="rounded-2xl px-4 py-3 text-center mx-auto max-w-sm mt-2"
                   style={{ background: 'rgba(16,217,160,0.1)', border: '1px solid rgba(16,217,160,0.2)' }}>
                  <p className="text-white text-sm font-medium">{voice.responseMessage}</p>
              </div>
          )}

          {/* Mic button */}
          {voice.state !== VOICE_STATES.CONFIRMATION && (
            <div className="flex justify-center py-2 relative">
              <MicButton state={voice.state} onClick={handleMicClick} size="xl" />
            </div>
          )}

          {voice.state === VOICE_STATES.IDLE && (
            <p className="text-xs text-gray-600 pb-1">
              {!window.SpeechRecognition && !window.webkitSpeechRecognition
                ? '⚠️ Voice not supported in this browser. Use Chrome or Edge, or type below.'
                : '🎤 Works best in Chrome or Edge — allow microphone access when prompted'}
            </p>
          )}
        </div>
      </div>

      {/* Confirmation Card */}
      {voice.state === VOICE_STATES.CONFIRMATION && voice.parsed && (
        <div className="animate-[slide-up_0.2s_ease-out]">
          {isReadOnly ? (
            <div className="card space-y-4">
              <p className="text-white font-bold">Query: <span className="text-brand-400">{voice.parsed.intent}</span></p>
              <p className="text-gray-400 text-sm">Product: <span className="text-white">{voice.parsed.productName || 'All'}</span></p>
              <div className="flex gap-2">
                <button onClick={voice.cancel} className="btn-secondary flex-1">Cancel</button>
                <button onClick={() => handleConfirm({})} className="btn-primary flex-1 gap-2">
                  <Mic size={14} /> Get Answer
                </button>
              </div>
            </div>
          ) : (
            <ConfirmationCard
              parsed={voice.parsed}
              product={voice.product}
              transcript={voice.transcript}
              commandId={voice.commandId}
              onConfirm={handleConfirm}
              onVoiceConfirm={voice.confirmPendingByVoice}
              onCancel={voice.cancel}
            />
          )}
        </div>
      )}

      {/* Query / Mutation Result */}
      {queryResult && (
        <div className="card animate-[slide-up_0.2s_ease-out]"
          style={{ border: '1px solid rgba(97,113,246,0.2)', background: 'rgba(97,113,246,0.04)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Info size={15} className="text-brand-400" />
            <h3 className="text-white font-bold text-sm">Result</h3>
          </div>

          {queryResult.type === 'mutation' && queryResult.data?.product && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-accent-green" />
                <p className="text-accent-green text-sm font-medium">
                  {queryResult.data?.transaction?.action === 'ADD' ? 'Stock added' : 'Stock removed'} successfully
                </p>
              </div>
              <div className="rounded-xl px-4 py-3 text-sm"
                style={{ background: 'rgba(16,217,160,0.07)', border: '1px solid rgba(16,217,160,0.15)' }}>
                <span className="text-gray-400">New stock: </span>
                <span className="font-black text-accent-green text-lg">
                  {queryResult.data.product.quantity} {queryResult.data.product.unit}
                </span>
              </div>
              {queryResult.data.alert && (
                <p className="text-accent-orange text-sm">⚠️ {queryResult.data.alert.productName} is now {queryResult.data.alert.type === 'OUT_OF_STOCK' ? 'out of stock' : 'low in stock'}!</p>
              )}
            </div>
          )}

          {queryResult.type === 'query' && (
            <div className="space-y-2">
              <p className="text-accent-green text-sm">{queryResult.result?.message}</p>
              {Array.isArray(queryResult.result?.data) && queryResult.result.data.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  {queryResult.result.data.slice(0, 5).map(p => (
                    <div key={p.id || p.productId}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center gap-2">
                        <Package size={13} className="text-gray-500" />
                        <span className="text-white text-sm font-medium">{p.name || p.productName}</span>
                      </div>
                      <span className={`text-sm font-bold ${
                        p.status === 'OUT_OF_STOCK' ? 'text-accent-red'
                          : p.status === 'LOW_STOCK' ? 'text-accent-orange'
                          : 'text-accent-green'}`}>
                        {p.quantity} {p.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <button onClick={() => { setQueryResult(null); voice.reset() }}
            className="btn-ghost btn-sm mt-4 w-full">
            Clear Result
          </button>
        </div>
      )}

      {/* Manual Input */}
      <div className="card">
        <p className="text-sm text-gray-400 mb-3 flex items-center gap-2">
          <Zap size={13} className="text-brand-400" />
          Or type a command manually
        </p>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            value={manualInput}
            onChange={e => setManualInput(e.target.value)}
            placeholder='"10 bags rice add karo" or "Which products are low?"'
            className="input flex-1 text-sm"
          />
          <button type="submit" className="btn-primary px-4 text-sm flex-shrink-0">Send</button>
        </form>
      </div>

      {/* Example Commands */}
      {showExamples && (
        <div className="space-y-4">
          <h2 className="text-white font-semibold text-sm flex items-center gap-2">
            <span className="w-4 h-0.5 rounded-full bg-brand-500" />
            Example Commands
          </h2>
          {EXAMPLE_CMDS.map(({ lang, flag, cmds }) => (
            <div key={lang} className="card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{flag}</span>
                <span className="badge badge-purple text-xs">{lang}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {cmds.map(cmd => (
                  <button key={cmd}
                    onClick={() => { voice.submitManualCommand(cmd); setShowExamples(false) }}
                    className="text-left text-xs rounded-xl px-3 py-2.5 transition-all text-gray-400 hover:text-white"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(97,113,246,0.12)'; e.currentTarget.style.borderColor = 'rgba(97,113,246,0.3)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
                  >
                    "{cmd}"
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
