// VaaniStock — Transaction List Component
import { ArrowUpCircle, ArrowDownCircle, Mic, MousePointer, Activity } from 'lucide-react'
import { formatRelativeTime } from '../utils/formatters'

export default function TransactionList({ transactions = [], compact = false }) {
  if (!transactions.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(97,113,246,0.08)', border: '1px solid rgba(97,113,246,0.15)' }}>
          <Activity size={24} className="text-brand-400/60" />
        </div>
        <div>
          <p className="text-gray-300 text-sm font-medium">No activity yet</p>
          <p className="text-gray-500 text-xs mt-0.5">Transactions will appear here after stock updates</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {transactions.map((txn) => (
        <TransactionItem key={txn.id} txn={txn} compact={compact} />
      ))}
    </div>
  )
}

function TransactionItem({ txn, compact }) {
  const isAdd = txn.action === 'ADD'

  if (compact) {
    return (
      <div className="flex items-center gap-3 py-2.5 border-b border-surface-700/60 last:border-0 group">
        <div className={`p-1.5 rounded-lg flex-shrink-0 transition-all ${isAdd ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'}`}>
          {isAdd ? <ArrowUpCircle size={15} /> : <ArrowDownCircle size={15} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{txn.productName}</p>
          <p className="text-gray-500 text-xs">{formatRelativeTime(txn.createdAt)}</p>
        </div>
        <span className={`text-sm font-bold flex-shrink-0 ${isAdd ? 'text-accent-green' : 'text-accent-red'}`}>
          {isAdd ? '+' : '-'}{txn.quantity} {txn.unit}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4 p-3.5 rounded-xl border transition-all group cursor-default"
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: `1px solid ${isAdd ? 'rgba(16,217,160,0.1)' : 'rgba(255,87,87,0.08)'}`,
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.045)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
    >
      {/* Left color bar */}
      <div className={`w-0.5 self-stretch rounded-full flex-shrink-0 ${isAdd ? 'bg-accent-green' : 'bg-accent-red'}`}
        style={{ boxShadow: isAdd ? '0 0 8px rgba(16,217,160,0.5)' : '0 0 8px rgba(255,87,87,0.5)' }} />

      <div className={`p-2 rounded-xl flex-shrink-0 ${isAdd ? 'bg-accent-green/12 text-accent-green' : 'bg-accent-red/12 text-accent-red'}`}>
        {isAdd ? <ArrowUpCircle size={17} /> : <ArrowDownCircle size={17} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-white font-semibold text-sm truncate">{txn.productName}</p>
          {txn.source === 'VOICE' ? (
            <span className="badge badge-purple text-xs gap-1">
              <Mic size={8} /> Voice
            </span>
          ) : (
            <span className="badge badge-blue text-xs gap-1">
              <MousePointer size={8} /> Manual
            </span>
          )}
        </div>
        {txn.transcript && (
          <p className="text-gray-500 text-xs italic mt-0.5 truncate">"{txn.transcript}"</p>
        )}
        <p className="text-gray-500 text-xs mt-0.5">{formatRelativeTime(txn.createdAt)}</p>
      </div>

      <div className="text-right flex-shrink-0">
        <p className={`font-black text-sm ${isAdd ? 'text-accent-green' : 'text-accent-red'}`}>
          {isAdd ? '+' : '-'}{txn.quantity} <span className="font-medium text-xs">{txn.unit}</span>
        </p>
        <p className="text-gray-600 text-xs mt-0.5">{txn.previousQuantity} → {txn.newQuantity}</p>
      </div>
    </div>
  )
}
