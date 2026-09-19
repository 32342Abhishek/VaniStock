// VaaniStock — Voice Modal (full screen overlay)
import { useState } from 'react'
import { X, Keyboard } from 'lucide-react'
import { VOICE_STATES } from '../hooks/useVoice'
import MicButton from './MicButton'
import ConfirmationCard from './ConfirmationCard'

// Waveform animation bars
function Waveform() {
  return (
    <div className="flex items-center gap-1 h-10 justify-center">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} className="wave-bar w-1.5 h-8 rounded-full bg-accent-red" style={{ animationDelay: `${(i - 1) * 0.1}s` }} />
      ))}
    </div>
  )
}

export default function VoiceModal({ open, onClose, voiceState, transcript, parsed, product, error, isDemoMode, commandId, onStart, onCancel, onConfirm, onManualSubmit }) {
  const [manualText, setManualText] = useState('')
  const [showManual, setShowManual] = useState(false)

  if (!open) return null

  const isListening = voiceState === VOICE_STATES.LISTENING
  const isProcessing = voiceState === VOICE_STATES.PROCESSING
  const isConfirmation = voiceState === VOICE_STATES.CONFIRMATION
  const isSuccess = voiceState === VOICE_STATES.SUCCESS
  const isError = voiceState === VOICE_STATES.ERROR

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (manualText.trim()) {
      onManualSubmit(manualText.trim())
      setManualText('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
      <div className="relative w-full max-w-lg animate-slide-up">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
        >
          <X size={20} />
        </button>

        {isConfirmation ? (
          <ConfirmationCard
            parsed={parsed}
            product={product}
            transcript={transcript}
            commandId={commandId}
            onConfirm={onConfirm}
            onCancel={onCancel}
            onEdit={() => {}}
          />
        ) : (
          <div className="card text-center space-y-6">
            {/* Demo Mode Banner */}
            {isDemoMode && (
              <div className="flex items-center justify-center gap-2 bg-accent-orange/10 border border-accent-orange/20 rounded-xl py-2 px-3">
                <span className="text-accent-orange text-xs font-medium">⚡ Demo Voice Parser Active — AI mode disabled</span>
              </div>
            )}

            {/* Title */}
            <div>
              <h2 className="text-xl font-bold text-white">
                {isListening ? '🔴 Listening...' :
                 isProcessing ? '🤖 Understanding...' :
                 isSuccess ? '✅ Success!' :
                 isError ? '❌ Error' :
                 '🎙️ Voice Assistant'}
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {isListening ? 'Speak clearly. Say your command...' :
                 isProcessing ? 'AI is processing your command...' :
                 isSuccess ? 'Stock updated successfully!' :
                 isError ? (error || 'Something went wrong.') :
                 'Tap the mic and speak your inventory command'}
              </p>
            </div>

              {/* Keep the manual fallback close to the status message so it remains visible on small screens. */}
              {(voiceState === VOICE_STATES.IDLE || isError) && (
                <div className="border-t border-surface-600 pt-4">
                  {error && (
                    <p className="mb-3 w-full break-words rounded-xl border border-accent-orange/20 bg-accent-orange/10 px-3 py-2 text-left text-sm text-accent-orange">
                      {error}
                    </p>
                  )}
                  {!showManual && !isError && !error ? (
                    <button
                      onClick={() => setShowManual(true)}
                      className="btn-ghost text-sm gap-2"
                    >
                      <Keyboard size={15} />
                      Enter Command Manually
                    </button>
                  ) : (
                    <form onSubmit={handleManualSubmit} className="flex w-full gap-2">
                      <input
                        autoFocus={Boolean(error)}
                        value={manualText}
                        onChange={e => setManualText(e.target.value)}
                        placeholder="e.g. Add 10 bags of rice..."
                        className="input min-w-0 flex-1 text-sm"
                      />
                      <button type="submit" className="btn-primary flex-shrink-0 px-4 text-sm">Go</button>
                    </form>
                  )}
                </div>
              )}

            {/* Waveform */}
            {isListening && <Waveform />}

            {/* Transcript display */}
            {transcript && !isConfirmation && (
              <div className="bg-surface-700 rounded-xl px-4 py-3 border border-surface-500">
                <p className="text-xs text-gray-400 mb-1">Heard:</p>
                <p className="text-white font-medium">"{transcript}"</p>
              </div>
            )}

            {/* Mic Button */}
            {!isSuccess && !isConfirmation && (
              <div className="flex justify-center">
                <MicButton state={voiceState} onClick={isListening ? onCancel : onStart} size="xl" />
              </div>
            )}

            {/* State hint */}
            {voiceState === VOICE_STATES.IDLE && (
              <p className="text-gray-400 text-sm">
                Try: <span className="text-brand-400">"10 bags rice add karo"</span> or{' '}
                <span className="text-brand-400">"Which products are low?"</span>
              </p>
            )}

            {/* Manual fallback */}
            {/* Example commands */}
            {voiceState === VOICE_STATES.IDLE && (
              <div className="grid grid-cols-2 gap-2">
                {[
                  '10 bags rice add karo',
                  '5 carton biscuits hata do',
                  'Kitna sugar hai?',
                  'Low stock products?',
                ].map(cmd => (
                  <button
                    key={cmd}
                    onClick={() => onManualSubmit(cmd)}
                    className="text-left text-xs bg-surface-700 hover:bg-surface-600 border border-surface-500 rounded-xl px-3 py-2 text-gray-300 hover:text-white transition-all"
                  >
                    "{cmd}"
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
