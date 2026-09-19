// VaaniStock — Transactions Page
import { useState, useEffect, useCallback } from 'react'
import { Download, RefreshCw, ArrowRightLeft } from 'lucide-react'
import { transactionsAPI } from '../services/api'
import TransactionList from '../components/TransactionList'
import toast from 'react-hot-toast'

const FILTERS = [
  { key: 'ALL',    label: 'All' },
  { key: 'ADD',    label: '↑ Stock In' },
  { key: 'REMOVE', label: '↓ Stock Out' },
]

export default function Transactions() {
  const [txns, setTxns]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('ALL')
  const [page, setPage]       = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { limit: 50, skip: page * 50 }
      if (filter !== 'ALL') params.action = filter
      const res = await transactionsAPI.list(params)
      setTxns(res.data.data || [])
    } catch {
      toast.error('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }, [filter, page])

  useEffect(() => { load() }, [load])

  const handleExportCSV = async () => {
    try {
      const res = await transactionsAPI.exportCSV()
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
      const a   = document.createElement('a')
      a.href = url; a.download = 'vaanistock_transactions.csv'; a.click()
      URL.revokeObjectURL(url)
      toast.success('CSV exported!')
    } catch {
      toast.error('Export failed')
    }
  }

  return (
    <div className="space-y-5 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ArrowRightLeft size={20} className="text-brand-400" /> Transaction History
          </h1>
          {!loading && <p className="text-gray-500 text-xs mt-0.5">{txns.length} record{txns.length !== 1 ? 's' : ''}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-ghost btn-sm" title="Refresh"><RefreshCw size={13} /></button>
          <button onClick={handleExportCSV} className="btn-secondary btn-sm gap-1.5">
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {FILTERS.map(({ key, label }) => (
          <button key={key} onClick={() => { setFilter(key); setPage(0) }}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150"
            style={filter === key ? {
              background: 'linear-gradient(135deg, #6171f6, #4f52eb)',
              color: 'white',
              boxShadow: '0 2px 12px rgba(97,113,246,0.4)',
            } : {
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              color: '#9ca3af',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}
        </div>
      ) : (
        <div className="card">
          <TransactionList transactions={txns} />
          {txns.length === 50 && (
            <div className="mt-4 text-center pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => setPage(p => p + 1)} className="btn-secondary btn-sm">
                Load More
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
