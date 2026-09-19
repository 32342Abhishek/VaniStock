// VaaniStock — Reports Page
import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { inventoryAPI, transactionsAPI } from '../services/api'
import { formatCurrency } from '../utils/formatters'
import { TrendingUp, ArrowRightLeft, BarChart2 } from 'lucide-react'
import toast from 'react-hot-toast'

const COLORS = ['#6171f6', '#10d9a0', '#ff9e3d', '#ff5757', '#b57bff', '#4da6ff']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0f0f24', border: '1px solid rgba(97,113,246,0.3)', borderRadius: 12, padding: '10px 14px' }}>
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.fill }} className="text-sm font-bold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

export default function Reports() {
  const [inventory, setInventory] = useState(null)
  const [txns, setTxns]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([inventoryAPI.summary(), transactionsAPI.list({ limit: 100 })])
      .then(([invRes, txnRes]) => {
        setInventory(invRes.data.data)
        setTxns(txnRes.data.data || [])
      })
      .catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-6">
      <div className="h-8 skeleton w-48 rounded-xl" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 skeleton rounded-2xl" />
        <div className="h-64 skeleton rounded-2xl" />
      </div>
    </div>
  )

  const isEmpty = !inventory?.totalProducts && txns.length === 0

  // Category distribution
  const catData = Object.entries(inventory?.categories || {}).map(([name, data]) => ({ name, value: data.count }))

  // Transaction trend (last 7 days)
  const trendMap = {}
  txns.forEach(t => {
    const date = new Date(t.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
    if (!trendMap[date]) trendMap[date] = { date, stockIn: 0, stockOut: 0 }
    if (t.action === 'ADD') trendMap[date].stockIn += t.quantity
    else trendMap[date].stockOut += t.quantity
  })
  const trendData = Object.values(trendMap).slice(-7)

  // Top products by value
  const topProducts = (inventory?.products || [])
    .filter(p => p.purchasePrice)
    .map(p => ({ name: p.name, value: p.quantity * p.purchasePrice, unit: p.unit }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  const summaryCards = [
    { label: 'Total Products',         value: inventory?.totalProducts ?? 0,                                                   icon: '📦', color: '#6171f6' },
    { label: 'Total Transactions',      value: txns.length,                                                                     icon: '↕',  color: '#10d9a0' },
    { label: 'Stock Added (All Time)',  value: txns.filter(t => t.action === 'ADD').reduce((s, t) => s + t.quantity, 0).toFixed(1), icon: '↑', color: '#10d9a0' },
    { label: 'Stock Removed',          value: txns.filter(t => t.action === 'REMOVE').reduce((s, t) => s + t.quantity, 0).toFixed(1), icon: '↓', color: '#ff5757' },
  ]

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <TrendingUp size={20} className="text-brand-400" /> Reports & Analytics
        </h1>
        <p className="text-gray-500 text-sm mt-1">Track your inventory performance over time</p>
      </div>

      {isEmpty ? (
        /* ── Empty State ── */
        <div className="card text-center py-20 relative overflow-hidden"
          style={{ background: 'rgba(97,113,246,0.03)', border: '1px solid rgba(97,113,246,0.15)' }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 100%, rgba(97,113,246,0.06), transparent)' }} />
          <div className="relative empty-state">
            <div className="empty-icon-wrap">
              <BarChart2 size={36} className="text-brand-400/70" />
            </div>
            <div>
              <p className="text-white text-lg font-bold">No analytics yet</p>
              <p className="text-gray-500 text-sm mt-1">Start adding products and recording stock changes to see reports here</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {summaryCards.map(({ label, value, color }) => (
              <div key={label} className="card text-center hover-lift relative overflow-hidden"
                style={{ border: `1px solid ${color}18` }}>
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }} />
                <p className="text-3xl font-black text-white">{value}</p>
                <p className="text-gray-500 text-xs mt-1.5 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trend Chart */}
            <div className="card" style={{ border: '1px solid rgba(97,113,246,0.12)' }}>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1.5 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #6171f6, #b57bff)' }} />
                <h2 className="text-white font-bold text-sm">Stock Movement</h2>
              </div>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={trendData} barGap={4}>
                    <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="stockIn"  fill="#10d9a0" name="Stock In"  radius={[4,4,0,0]} />
                    <Bar dataKey="stockOut" fill="#ff5757" name="Stock Out" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-600">
                  <div className="text-center">
                    <ArrowRightLeft size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No transactions recorded yet</p>
                  </div>
                </div>
              )}
            </div>

            {/* Category Pie */}
            <div className="card" style={{ border: '1px solid rgba(97,113,246,0.12)' }}>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1.5 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #b57bff, #6171f6)' }} />
                <h2 className="text-white font-bold text-sm">Products by Category</h2>
              </div>
              {catData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={catData} cx="50%" cy="50%" innerRadius={52} outerRadius={82}
                      paddingAngle={3} dataKey="value" strokeWidth={0}>
                      {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-600">
                  <p className="text-sm text-center">No products yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Products by Value */}
          {topProducts.length > 0 && (
            <div className="card" style={{ border: '1px solid rgba(97,113,246,0.12)' }}>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1.5 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #ff9e3d, #6171f6)' }} />
                <h2 className="text-white font-bold text-sm">Top Products by Inventory Value</h2>
              </div>
              <div className="space-y-4">
                {topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-4">
                    <span className="text-gray-600 text-sm font-bold w-5 text-center flex-shrink-0">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-white text-sm font-medium">{p.name}</span>
                        <span className="text-accent-green text-sm font-bold">{formatCurrency(p.value)}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(p.value / topProducts[0].value) * 100}%`,
                            background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i+1) % COLORS.length]}80)`,
                            boxShadow: `0 0 8px ${COLORS[i % COLORS.length]}60`
                          }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
