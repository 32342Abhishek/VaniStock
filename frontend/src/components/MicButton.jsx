// VaaniStock — Mic Button Component
import { clsx } from 'clsx'
import { Mic, Square, Loader2 } from 'lucide-react'
import { VOICE_STATES } from '../hooks/useVoice'

export default function MicButton({ state, onClick, size = 'lg' }) {
  const isListening = state === VOICE_STATES.LISTENING
  const isProcessing = state === VOICE_STATES.PROCESSING

  const sizeMap = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
  }

  const iconSize = { sm: 18, md: 22, lg: 28, xl: 36 }[size]

  return (
    <div className="relative flex items-center justify-center">
      {/* Pulse rings when listening */}
      {isListening && (
        <>
          <span className="absolute inline-flex w-full h-full rounded-full bg-accent-red/40 animate-ping" />
          <span className="absolute inline-flex w-[140%] h-[140%] rounded-full bg-accent-red/20 animate-pulse" />
        </>
      )}

      <button
        id="mic-button"
        onClick={onClick}
        className={clsx(
          'relative rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer',
          'shadow-2xl active:scale-95 focus:outline-none focus:ring-4 focus:ring-brand-500/30',
          sizeMap[size],
          isListening && 'mic-listening scale-110',
          isProcessing && 'mic-processing',
          !isListening && !isProcessing && 'mic-idle hover:scale-105'
        )}
      >
        {isProcessing ? (
          <Loader2 size={iconSize} className="text-white animate-spin" />
        ) : isListening ? (
          <Square size={iconSize} className="text-white fill-white" />
        ) : (
          <Mic size={iconSize} className="text-white" />
        )}
      </button>
    </div>
  )
}
