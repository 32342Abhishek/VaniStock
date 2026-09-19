// VaaniStock — Inventory Page
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Package, Edit2, Trash2, ArrowUpCircle, ArrowDownCircle, RefreshCw, X } from 'lucide-react'
import { productsAPI, inventoryAPI } from '../services/api'
import { formatRelativeTime } from '../utils/formatters'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'
import voiceService from '../services/voiceService'

const CATEGORIES = ['All', 'Grains', 'Essentials', 'Snacks', 'Beverages', 'Dairy', 'Spices', 'Household', 'General']

const STATUS_OPTIONS = [
  { key: 'All',          label: 'All Status' },
  { key: 'HEALTHY',      label: '✓ Healthy' },
  { key: 'LOW_STOCK',    label: '⚠ Low Stock' },
  { key: 'OUT_OF_STOCK', label: '✕ Out of Stock' },
]

export default function Inventory() {
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [category, setCategory] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [stockModal, setStockModal]     = useState(null)
  const [qty, setQty]         = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search)              params.search   = search
      if (category !== 'All') params.category = category
      if (statusFilter !== 'All') params.status = statusFilter
      const res = await productsAPI.list(params)
      setProducts(res.data.data || [])
    } catch {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [search, category, statusFilter])

  useEffect(() => { load() }, [load])

  const handleStockUpdate = async (e) => {
    e.preventDefault()
    const quantity = Number(qty)

    if (!qty || Number.isNaN(quantity) || quantity <= 0) {
      toast.error('Enter a valid quantity greater than zero.')
      return
    }

    if (stockModal.type === 'out' && quantity > stockModal.product.quantity) {
      toast.error(`Only ${stockModal.product.quantity} ${stockModal.product.unit} available for ${stockModal.product.name}.`)
      return
    }

    setSubmitting(true)
    try {
      const fn = stockModal.type === 'in' ? inventoryAPI.stockIn : inventoryAPI.stockOut
      const res = await fn({ productId: stockModal.product.id, quantity, requestId: crypto.randomUUID() })
      toast.success(res.data.message || 'Stock updated successfully.')
      if (res.data.data?.alert) {
        const a = res.data.data.alert
        toast(`⚠️ ${a.productName} is now ${a.type === 'OUT_OF_STOCK' ? 'out of stock' : 'low in stock'}!`, { icon: '⚠️' })
      }
      setStockModal(null); setQty(''); load()
    } catch (err) {
      const msg = err.response?.data?.detail?.message || err.response?.data?.detail || 'Update failed'
      toast.error(typeof msg === 'string' ? msg : 'Update failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await productsAPI.delete(id)
      const msg = `${deleteConfirm?.name || 'Product'} has been deleted successfully`
      toast.success(msg)
      voiceService.speak(msg)
      setDeleteConfirm(null); load()
    } catch {
      toast.error('Delete failed')
    }
  }

  const statusBadge = (status) => {
    const map = {
      HEALTHY:      <span className="badge badge-green text-xs">Healthy</span>,
      LOW_STOCK:    <span className="badge badge-orange text-xs">⚠ Low</span>,
      OUT_OF_STOCK: <span className="badge badge-red text-xs">Out</span>,
    }
    return map[status] || <span className="badge badge-blue text-xs">{status}</span>
  }

  const rowBorderColor = (status) => {
    if (status === 'OUT_OF_STOCK') return 'rgba(255,87,87,0.25)'
    if (status === 'LOW_STOCK')    return 'rgba(255,158,61,0.25)'
    return 'transparent'
  }

  return (
    <div className="space-y-5 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Inventory</h1>
          {!loading && <p className="text-gray-500 text-xs mt-0.5">{products.length} product{products.length !== 1 ? 's' : ''} found</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-ghost btn-sm" title="Refresh"><RefreshCw size={14} /></button>
          <Link to="/add-product" className="btn-primary btn-sm gap-2"><Plus size={14} /> Add Product</Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products by name..."
            className="input pl-9"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                category === c
                  ? 'text-white'
                  : 'text-gray-400 hover:text-gray-300 bg-surface-700/60 hover:bg-surface-600'
              )}
              style={category === c ? {
                background: 'linear-gradient(135deg, #6171f6, #4f52eb)',
                boxShadow: '0 2px 10px rgba(97,113,246,0.35)',
              } : {}}>
              {c}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {STATUS_OPTIONS.map(({ key, label }) => (
            <button key={key} onClick={() => setStatusFilter(key)}
              className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                statusFilter === key
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300 bg-surface-700/40 hover:bg-surface-600/60'
              )}
              style={statusFilter === key ? {
                background: 'rgba(97,113,246,0.2)',
                border: '1px solid rgba(97,113,246,0.3)',
                color: '#a5b4fc',
              } : {}}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table / Empty State */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <div key={i} className="h-14 skeleton rounded-xl" />)}
        </div>
      ) : !products.length ? (
        <div className="card text-center py-20">
          <div className="empty-state">
            <div className="empty-icon-wrap">
              <Package size={36} className="text-brand-400/70" />
            </div>
            <div>
              <p className="text-white text-lg font-bold">No products found</p>
              <p className="text-gray-500 text-sm mt-1">
                {search || category !== 'All' || statusFilter !== 'All'
                  ? 'Try adjusting your filters or search term'
                  : 'Add your first product to start tracking inventory'}
              </p>
            </div>
            {!search && category === 'All' && statusFilter === 'All' && (
              <Link to="/add-product" className="btn-primary gap-2 mt-2">
                <Plus size={15} /> Add First Product
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Product', 'Qty', 'Status', 'Threshold', 'Price', 'Updated', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3.5 text-gray-500 font-semibold text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}
                  className="transition-colors"
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    borderLeft: `3px solid ${rowBorderColor(p.status)}`,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td className="px-4 py-3.5">
                    <p className="text-white font-semibold">{p.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{p.category}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-white font-bold">{p.quantity}</span>
                    <span className="text-gray-500 text-xs ml-1">{p.unit}</span>
                  </td>
                  <td className="px-4 py-3.5">{statusBadge(p.status)}</td>
                  <td className="px-4 py-3.5 text-gray-400 text-xs">{p.lowStockThreshold} {p.unit}</td>
                  <td className="px-4 py-3.5 text-gray-400 text-xs">{p.sellingPrice ? `₹${p.sellingPrice}` : '—'}</td>
                  <td className="px-4 py-3.5 text-gray-500 text-xs">{formatRelativeTime(p.updatedAt)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <ActionBtn title="Stock In"  color="green"
                        onClick={() => { setStockModal({ product: p, type: 'in' }); setQty('') }}>
                        <ArrowUpCircle size={15} />
                      </ActionBtn>
                      <ActionBtn title="Stock Out" color="red"
                        onClick={() => { setStockModal({ product: p, type: 'out' }); setQty('') }}>
                        <ArrowDownCircle size={15} />
                      </ActionBtn>
                      <Link to={`/add-product?edit=${p.id}`}
                        className="p-1.5 text-gray-500 hover:text-white hover:bg-surface-600/60 rounded-lg transition-all">
                        <Edit2 size={13} />
                      </Link>
                      <ActionBtn title="Delete" color="red"
                        onClick={() => setDeleteConfirm(p)}>
                        <Trash2 size={13} />
                      </ActionBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Stock Update Modal */}
      {stockModal && (
        <Modal onClose={() => setStockModal(null)}>
          <div className="flex items-center gap-2 mb-1">
            {stockModal.type === 'in'
              ? <ArrowUpCircle size={18} className="text-accent-green" />
              : <ArrowDownCircle size={18} className="text-accent-red" />}
            <h3 className="text-white font-bold">{stockModal.type === 'in' ? 'Stock In' : 'Stock Out'}</h3>
          </div>
          <p className="text-gray-400 text-sm mb-1">{stockModal.product.name}</p>
          <p className="text-xs text-gray-500 mb-4">
            Current stock: <span className="text-white font-semibold">{stockModal.product.quantity} {stockModal.product.unit}</span>
          </p>
          <form onSubmit={handleStockUpdate} className="space-y-4">
            <div>
              <label className="input-label">Quantity ({stockModal.product.unit})</label>
              <input autoFocus type="number" value={qty}
                onChange={e => setQty(e.target.value)}
                className="input" placeholder={`Enter qty in ${stockModal.product.unit}`}
                min="0.1" step="0.5" />
            </div>
            {qty && (
              <div className="rounded-xl px-4 py-3 text-sm"
                style={{ background: stockModal.type === 'in' ? 'rgba(16,217,160,0.08)' : 'rgba(255,158,61,0.08)',
                         border: `1px solid ${stockModal.type === 'in' ? 'rgba(16,217,160,0.2)' : 'rgba(255,158,61,0.2)'}` }}>
                <span className="text-gray-400">New stock: </span>
                <span className={`font-black text-base ${stockModal.type === 'in' ? 'text-accent-green' : 'text-accent-orange'}`}>
                  {stockModal.type === 'in'
                    ? stockModal.product.quantity + Number(qty)
                    : Math.max(0, stockModal.product.quantity - Number(qty))}{' '}
                  {stockModal.product.unit}
                </span>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setStockModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={submitting}
                className={`flex-1 ${stockModal.type === 'in' ? 'btn-success' : 'btn-danger'}`}>
                {submitting ? 'Updating…' : `Confirm ${stockModal.type === 'in' ? 'Stock In' : 'Stock Out'}`}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <Modal onClose={() => setDeleteConfirm(null)}>
          <div className="w-12 h-12 rounded-2xl bg-accent-red/10 border border-accent-red/20 flex items-center justify-center mx-auto mb-4">
            <Trash2 size={20} className="text-accent-red" />
          </div>
          <h3 className="text-white font-bold text-center mb-2">Delete Product?</h3>
          <p className="text-gray-400 text-sm text-center mb-5">
            Are you sure you want to delete <span className="text-white font-semibold">"{deleteConfirm.name}"</span>? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={() => handleDelete(deleteConfirm.id)} className="btn-danger flex-1">Delete</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function ActionBtn({ children, onClick, title, color }) {
  const colors = { green: 'hover:text-accent-green hover:bg-accent-green/10', red: 'hover:text-accent-red hover:bg-accent-red/10' }
  return (
    <button title={title} onClick={onClick}
      className={`p-1.5 text-gray-500 rounded-lg transition-all ${colors[color] || ''}`}>
      {children}
    </button>
  )
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card max-w-sm w-full animate-[slide-up_0.2s_ease-out] relative"
        style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)' }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors">
          <X size={16} />
        </button>
        {children}
      </div>
    </div>
  )
}
