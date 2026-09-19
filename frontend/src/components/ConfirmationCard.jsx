// VaaniStock — Voice Confirmation Card
import { useState } from 'react'
import { Check, X, Edit3, AlertTriangle, Info, Mic } from 'lucide-react'
import { clsx } from 'clsx'
import { ALL_UNITS } from '../utils/unitNormalizer'

export default function ConfirmationCard({ parsed, product, transcript, commandId, onConfirm, onCancel, onVoiceConfirm, onEdit: _onEdit }) {
  const [editing, setEditing] = useState(false)
  const [editQty, setEditQty] = useState(parsed?.quantity || '')
  const [editUnit, setEditUnit] = useState(parsed?.unit || '')

  const isAddStock = parsed?.intent === 'ADD_STOCK'
  const isRemoveStock = parsed?.intent === 'REMOVE_STOCK'
  const isCreateProduct = parsed?.intent === 'CREATE_PRODUCT'
  const isDeleteProduct = parsed?.intent === 'DELETE_PRODUCT'
  const isMutation = isAddStock || isRemoveStock

  const currentQty = product?.quantity ?? '?'
  const newQty = product && isMutation
      ? isAddStock
        ? currentQty + (editQty || parsed?.quantity || 0)
        : currentQty - (editQty || parsed?.quantity || 0)
      : null

  const confidence = parsed?.confidence ?? 1
  const showWarning = confidence < 0.85 && confidence >= 0.5
  const showClarification = parsed?.requiresClarification || confidence < 0.5

  const handleConfirm = () => {
    if (isDeleteProduct) {
      const deleteData = {
        commandId,
        transcript,
        intent: parsed.intent,
        productName: parsed.productName || product?.name,
        productId: product?.id || null,
        language: parsed.language,
      }
        onConfirm({
        ...deleteData,
            confirmed: true
        })
        return
    }
    
    if (isCreateProduct) {
        onConfirm({
            commandId,
            transcript,
            intent: parsed.intent,
            productName: parsed.productName,
            quantity: Number(editing ? editQty : parsed.quantity),
            unit: editing ? editUnit : parsed.unit || 'pieces',
        })
        return
    }

    if (!product) return
    onConfirm({
      commandId,
      transcript,
      intent: parsed.intent,
      productId: product.id,
      productName: product.name,
      quantity: Number(editing ? editQty : parsed.quantity),
      unit: editing ? editUnit : parsed.unit || product.unit,
    })
  }

  const intentLabel = isAddStock ? 'ADD STOCK' : isRemoveStock ? 'REMOVE STOCK' : isCreateProduct ? 'CREATE PRODUCT' : isDeleteProduct ? 'DELETE PRODUCT' : parsed?.intent

  return (
    <div className="card animate-slide-up max-w-md w-full mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-white font-semibold text-base flex items-center gap-2">
          <Mic size={16} className="text-brand-400" />
          Confirm Stock Update
        </h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-surface-600">
          <X size={18} />
        </button>
      </div>

      {/* Transcript */}
      <div className="bg-surface-700 rounded-xl p-3 mb-4 border border-surface-500">
        <p className="text-xs text-gray-400 mb-1">You said:</p>
        <p className="text-white text-sm italic">"{transcript}"</p>
      </div>

      {/* Warnings */}
      {showWarning && (
        <div className="flex items-start gap-2 bg-accent-orange/10 border border-accent-orange/20 rounded-xl p-3 mb-4">
          <AlertTriangle size={15} className="text-accent-orange mt-0.5 flex-shrink-0" />
          <p className="text-accent-orange text-xs">Please verify the detected command — confidence is low.</p>
        </div>
      )}
      {showClarification && (
        <div className="flex items-start gap-2 bg-accent-blue/10 border border-accent-blue/20 rounded-xl p-3 mb-4">
          <Info size={15} className="text-accent-blue mt-0.5 flex-shrink-0" />
          <p className="text-accent-blue text-xs">{parsed?.clarificationMessage || 'Please fill in the missing details.'}</p>
        </div>
      )}

      {/* Parsed Details */}
      <div className="space-y-2 mb-5">
        <DetailRow label="Action" value={
          <span className={clsx('font-semibold', 
              isAddStock || isCreateProduct ? 'text-accent-green' : 'text-accent-red'
          )}>
            {intentLabel}
          </span>
        } />
        
        {isDeleteProduct ? (
            <div className="py-2 border-b border-surface-600">
                <span className="text-white text-base text-center block font-medium mt-2 mb-2">
                    Are you sure you want to permanently delete <span className="text-accent-red font-bold">{parsed?.productName || product?.name}</span>?
                </span>
                <p className="text-gray-400 text-xs text-center">This action cannot be undone and will remove all stock history.</p>
            </div>
        ) : (
            <>
                <DetailRow label="Product" value={
                  (product || isCreateProduct)
                    ? <span className="text-white font-medium">{product?.name || parsed?.productName}</span>
                    : <span className="text-accent-orange text-xs">Product not found in inventory</span>
                } />

                {/* Editable quantity & unit */}
                <div className="flex items-center justify-between py-2 border-b border-surface-600">
                  <span className="text-gray-400 text-sm">Quantity</span>
                  {editing ? (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={editQty}
                        onChange={e => setEditQty(e.target.value)}
                        className="input w-20 py-1 text-sm text-center"
                        min="0.1"
                        step="0.5"
                      />
                      <select
                        value={editUnit}
                        onChange={e => setEditUnit(e.target.value)}
                        className="input w-24 py-1 text-sm"
                      >
                        {ALL_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  ) : (
                    <span className="text-white font-semibold">
                      {parsed?.quantity ?? '?'} {parsed?.unit || product?.unit || 'pieces'}
                    </span>
                  )}
                </div>

                {product && isMutation && (
                  <>
                    <DetailRow label="Current Stock"
                      value={<span className="text-white">{currentQty} {product.unit}</span>} />
                    <DetailRow label="After Update"
                      value={
                        <span className={clsx('font-bold', newQty < 0 ? 'text-accent-red' : 'text-accent-green')}>
                          {Math.max(0, newQty)} {editing ? editUnit : product.unit}
                        </span>
                      }
                    />
                  </>
                )}
            </>
        )}
      </div>

      {/* Confidence indicator */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>AI Confidence</span>
          <span>{Math.round(confidence * 100)}%</span>
        </div>
        <div className="h-1.5 bg-surface-600 rounded-full overflow-hidden">
          <div
            className={clsx('h-full rounded-full transition-all', confidence >= 0.85 ? 'bg-accent-green' : confidence >= 0.5 ? 'bg-accent-orange' : 'bg-accent-red')}
            style={{ width: `${confidence * 100}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {!isDeleteProduct && (
            <button
              onClick={() => setEditing(!editing)}
              className="btn-secondary flex-1 gap-2 text-sm"
            >
              <Edit3 size={15} />
              {editing ? 'Done Editing' : 'Edit'}
            </button>
        )}
        <button onClick={onCancel} className="btn-danger flex-1 text-sm">
          Cancel
        </button>
        {isDeleteProduct && onVoiceConfirm && (
          <button onClick={() => onVoiceConfirm({
            commandId,
            transcript,
            intent: parsed.intent,
            productName: parsed.productName || product?.name,
            productId: product?.id || null,
            language: parsed.language,
          })} className="btn-secondary flex-1 text-sm">
            <Mic size={15} /> Say Yes/No
          </button>
        )}
        <button
          onClick={handleConfirm}
          disabled={!isDeleteProduct && (!product && !isCreateProduct || !parsed?.quantity)}
          className={clsx("flex-1 gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed", 
              isDeleteProduct ? 'btn-danger bg-accent-red hover:bg-red-600' : 'btn-success'
          )}
        >
          <Check size={15} />
          {isDeleteProduct ? 'Confirm Delete' : 'Confirm'}
        </button>
      </div>
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-surface-600 last:border-0">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  )
}
