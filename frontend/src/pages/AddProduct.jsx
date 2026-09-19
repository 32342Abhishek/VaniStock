// VaaniStock — Add/Edit Product Page
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Save, ArrowLeft, Loader2 } from 'lucide-react'
import { productsAPI } from '../services/api'
import { ALL_UNITS } from '../utils/unitNormalizer'
import toast from 'react-hot-toast'

const CATEGORIES = ['Grains', 'Essentials', 'Snacks', 'Beverages', 'Dairy', 'Spices', 'Household', 'General']

const defaultForm = {
  name: '', category: 'General', description: '', sku: '', unit: 'pieces',
  quantity: 0, purchasePrice: '', sellingPrice: '',
  lowStockThreshold: 5, reorderQuantity: 10,
  supplier: { name: '', contact: '' },
}

export default function AddProduct() {
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const editId = params.get('edit')
  const isEdit = !!editId

  useEffect(() => {
    if (editId) {
      setFetching(true)
      productsAPI.get(editId).then(res => {
        const p = res.data.data
        setForm({
          name: p.name || '', category: p.category || 'General',
          description: p.description || '', sku: p.sku || '',
          unit: p.unit || 'pieces', quantity: p.quantity || 0,
          purchasePrice: p.purchasePrice ?? '', sellingPrice: p.sellingPrice ?? '',
          lowStockThreshold: p.lowStockThreshold || 5, reorderQuantity: p.reorderQuantity || 10,
          supplier: p.supplier || { name: '', contact: '' },
        })
      }).catch(() => toast.error('Failed to load product')).finally(() => setFetching(false))
    }
  }, [editId])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setSupplier = (k, v) => setForm(f => ({ ...f, supplier: { ...f.supplier, [k]: v } }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Product name is required'
    if (!form.unit) e.unit = 'Unit is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const payload = {
        ...form,
        quantity: Number(form.quantity) || 0,
        purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : null,
        sellingPrice: form.sellingPrice ? Number(form.sellingPrice) : null,
        lowStockThreshold: Number(form.lowStockThreshold) || 5,
        reorderQuantity: Number(form.reorderQuantity) || 10,
      }
      if (isEdit) {
        await productsAPI.update(editId, payload)
        toast.success('Product updated!')
      } else {
        await productsAPI.create(payload)
        toast.success('Product added!')
      }
      navigate('/inventory')
    } catch (err) {
      const msg = err.response?.data?.detail?.message || err.response?.data?.detail || 'Save failed'
      toast.error(typeof msg === 'string' ? msg : 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="h-64 skeleton rounded-2xl animate-pulse" />

  return (
    <div className="max-w-2xl space-y-5 page-enter">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-sm p-2">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold text-white">{isEdit ? 'Edit Product' : 'Add Product'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <div className="card space-y-4">
          <h2 className="text-white font-semibold">Basic Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="input-label">Product Name *</label>
              <input id="prod-name" value={form.name} onChange={e => set('name', e.target.value)}
                className={`input ${errors.name ? 'border-accent-red' : ''}`} placeholder="e.g. Basmati Rice" />
              {errors.name && <p className="text-accent-red text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="input-label">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className="input">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">SKU / Code</label>
              <input value={form.sku} onChange={e => set('sku', e.target.value)} className="input" placeholder="Optional" />
            </div>
            <div className="sm:col-span-2">
              <label className="input-label">Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                className="input" rows="2" placeholder="Optional product description" />
            </div>
          </div>
        </div>

        {/* Stock */}
        <div className="card space-y-4">
          <h2 className="text-white font-semibold">Stock Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="input-label">Unit *</label>
              <select value={form.unit} onChange={e => set('unit', e.target.value)} className={`input ${errors.unit ? 'border-accent-red' : ''}`}>
                {ALL_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Opening Stock</label>
              <input type="number" value={form.quantity} onChange={e => set('quantity', e.target.value)}
                className="input" min="0" step="0.5" />
            </div>
            <div>
              <label className="input-label">Low Stock Alert ({form.unit})</label>
              <input type="number" value={form.lowStockThreshold} onChange={e => set('lowStockThreshold', e.target.value)}
                className="input" min="0" step="0.5" />
            </div>
            <div>
              <label className="input-label">Reorder Quantity ({form.unit})</label>
              <input type="number" value={form.reorderQuantity} onChange={e => set('reorderQuantity', e.target.value)}
                className="input" min="0" step="1" />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="card space-y-4">
          <h2 className="text-white font-semibold">Pricing (Optional)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Purchase Price (₹)</label>
              <input type="number" value={form.purchasePrice} onChange={e => set('purchasePrice', e.target.value)}
                className="input" placeholder="0" min="0" step="0.01" />
            </div>
            <div>
              <label className="input-label">Selling Price (₹)</label>
              <input type="number" value={form.sellingPrice} onChange={e => set('sellingPrice', e.target.value)}
                className="input" placeholder="0" min="0" step="0.01" />
            </div>
          </div>
        </div>

        {/* Supplier */}
        <div className="card space-y-4">
          <h2 className="text-white font-semibold">Supplier (Optional)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Supplier Name</label>
              <input value={form.supplier?.name || ''} onChange={e => setSupplier('name', e.target.value)}
                className="input" placeholder="ABC Distributors" />
            </div>
            <div>
              <label className="input-label">Contact</label>
              <input value={form.supplier?.contact || ''} onChange={e => setSupplier('contact', e.target.value)}
                className="input" placeholder="Phone / Email" />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 gap-2">
            {loading ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><Save size={15} /> {isEdit ? 'Update Product' : 'Add Product'}</>}
          </button>
        </div>
      </form>
    </div>
  )
}
