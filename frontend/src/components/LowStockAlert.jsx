// VaaniStock — Low Stock Alert Component
import { AlertTriangle, AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'

export default function LowStockAlert({ product, compact = false }) {
  const isOut = product.status === 'OUT_OF_STOCK'

  if (compact) {
    return (
      <div className={clsx(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all hover-lift',
        isOut
          ? 'bg-accent-red/10 border-accent-red/20'
          : 'bg-accent-orange/10 border-accent-orange/20'
      )}>
        {isOut ? (
          <AlertCircle size={16} className="text-accent-red flex-shrink-0" />
        ) : (
          <AlertTriangle size={16} className="text-accent-orange flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{product.name}</p>
          <p className={clsx('text-xs', isOut ? 'text-accent-red' : 'text-accent-orange')}>
            {isOut ? 'Out of stock' : `${product.quantity} ${product.unit} remaining`}
          </p>
        </div>
        <span className={clsx('badge text-xs flex-shrink-0', isOut ? 'badge-red' : 'badge-orange')}>
          {isOut ? 'Out' : 'Low'}
        </span>
      </div>
    )
  }

  return (
    <div className={clsx(
      'card border-l-4 flex items-start gap-4',
      isOut ? 'border-l-accent-red' : 'border-l-accent-orange'
    )}>
      <div className={clsx(
        'p-2.5 rounded-xl flex-shrink-0',
        isOut ? 'bg-accent-red/15 text-accent-red' : 'bg-accent-orange/15 text-accent-orange'
      )}>
        {isOut ? <AlertCircle size={20} /> : <AlertTriangle size={20} />}
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-white font-semibold">{product.name}</h4>
            <p className="text-gray-400 text-sm">{product.category}</p>
          </div>
          <span className={clsx('badge flex-shrink-0', isOut ? 'badge-red' : 'badge-orange')}>
            {isOut ? 'Out of Stock' : 'Low Stock'}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
          <div className="bg-surface-700 rounded-lg p-2 text-center">
            <p className="text-gray-400 text-xs">Current</p>
            <p className={clsx('font-bold mt-0.5', isOut ? 'text-accent-red' : 'text-accent-orange')}>
              {product.quantity} {product.unit}
            </p>
          </div>
          <div className="bg-surface-700 rounded-lg p-2 text-center">
            <p className="text-gray-400 text-xs">Threshold</p>
            <p className="text-white font-medium mt-0.5">{product.lowStockThreshold} {product.unit}</p>
          </div>
          <div className="bg-surface-700 rounded-lg p-2 text-center">
            <p className="text-gray-400 text-xs">Reorder</p>
            <p className="text-brand-400 font-medium mt-0.5">{product.reorderQuantity || '—'} {product.unit}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
