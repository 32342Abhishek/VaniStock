// VaaniStock — Alerts Page
import { useState, useEffect, useCallback } from 'react'
import { alertsAPI } from '../services/api'
import LowStockAlert from '../components/LowStockAlert'
import { Bell, RefreshCw, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Alerts() {
  const [alerts, setAlerts]   = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await alertsAPI.list()
      setAlerts(res.data.data || [])
      setSummary(res.data.summary || {})
    } catch {
      toast.error('Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const outOfStock = alerts.filter(a => a.type === 'OUT_OF_STOCK')
  const lowStock   = alerts.filter(a => a.type === 'LOW_STOCK')

  return (
    <div className="space-y-5 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Bell size={20} className="text-accent-orange" /> Stock Alerts
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Products that need your attention</p>
        </div>
        <button onClick={load} className="btn-ghost btn-sm gap-1.5">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card relative overflow-hidden hover-lift"
          style={{ background: 'linear-gradient(135deg, rgba(255,87,87,0.1), rgba(255,87,87,0.03))', border: '1px solid rgba(255,87,87,0.2)' }}>
          <div className="absolute top-0 left-0 right-0 h-0.5"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,87,87,0.6), transparent)' }} />
          {(summary.outOfStock ?? 0) > 0 && (
            <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-accent-red animate-ping" />
          )}
          <p className="text-accent-red text-xs font-semibold uppercase tracking-wider">Out of Stock</p>
          <p className="text-4xl font-black text-white mt-1">{summary.outOfStock ?? 0}</p>
          <p className="text-gray-500 text-xs mt-1">Products</p>
        </div>
        <div className="card relative overflow-hidden hover-lift"
          style={{ background: 'linear-gradient(135deg, rgba(255,158,61,0.1), rgba(255,158,61,0.03))', border: '1px solid rgba(255,158,61,0.2)' }}>
          <div className="absolute top-0 left-0 right-0 h-0.5"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,158,61,0.6), transparent)' }} />
          {(summary.lowStock ?? 0) > 0 && (
            <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-accent-orange" style={{ boxShadow: '0 0 6px rgba(255,158,61,0.8)' }} />
          )}
          <p className="text-accent-orange text-xs font-semibold uppercase tracking-wider">Low Stock</p>
          <p className="text-4xl font-black text-white mt-1">{summary.lowStock ?? 0}</p>
          <p className="text-gray-500 text-xs mt-1">Products</p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
        </div>
      ) : !alerts.length ? (
        /* ── All Clear State ── */
        <div className="card text-center py-20 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(16,217,160,0.06), rgba(22,22,46,0.8))', border: '1px solid rgba(16,217,160,0.2)', boxShadow: '0 0 60px rgba(16,217,160,0.07)' }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(16,217,160,0.08), transparent)' }} />
          <div className="relative empty-state">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center float-anim mx-auto"
              style={{ background: 'linear-gradient(135deg, rgba(16,217,160,0.2), rgba(16,217,160,0.05))', border: '1px solid rgba(16,217,160,0.3)', boxShadow: '0 0 40px rgba(16,217,160,0.2)' }}>
              <ShieldCheck size={38} className="text-accent-green" />
            </div>
            <div>
              <p className="text-white text-xl font-black">All Clear! 🎉</p>
              <p className="text-gray-400 text-sm mt-2">All your products are well-stocked.<br />No alerts at this time.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {outOfStock.length > 0 && (
            <section>
              <h2 className="text-white font-bold text-sm flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-accent-red animate-ping" />
                <span className="w-2 h-2 rounded-full bg-accent-red -ml-3" />
                Out of Stock ({outOfStock.length})
              </h2>
              <div className="space-y-3">
                {outOfStock.map(a => <LowStockAlert key={a.productId} product={a} />)}
              </div>
            </section>
          )}
          {lowStock.length > 0 && (
            <section>
              <h2 className="text-white font-bold text-sm flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-accent-orange" style={{ boxShadow: '0 0 6px rgba(255,158,61,0.7)' }} />
                Low Stock ({lowStock.length})
              </h2>
              <div className="space-y-3">
                {lowStock.map(a => <LowStockAlert key={a.productId} product={a} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
