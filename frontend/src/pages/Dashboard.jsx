// VaaniStock — Dashboard Page
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, AlertTriangle, TrendingUp, TrendingDown, Mic, ArrowRight, RefreshCw, Sparkles } from 'lucide-react'
import { inventoryAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import StatCard from '../components/StatCard'
import TransactionList from '../components/TransactionList'
import LowStockAlert from '../components/LowStockAlert'
import { formatCurrency, getGreeting } from '../utils/formatters'
import { useVoice } from '../hooks/useVoice'
import VoiceModal from '../components/VoiceModal'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [voiceOpen, setVoiceOpen] = useState(false)

  const loadDashboard = async () => {
    try {
      const res = await inventoryAPI.dashboard()
      setStats(res.data.data)
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDashboard() }, [])

  const voice = useVoice({
    language: user?.preferredLanguage || 'en',
    onConfirmed: () => { loadDashboard() }
  })

  const handleVoiceOpen  = () => { setVoiceOpen(true); voice.reset() }
  const handleVoiceClose = () => { voice.cancel(); setVoiceOpen(false) }

  const isEmpty = !loading && (stats?.totalProducts ?? 0) === 0

  if (loading) return <DashboardSkeleton />

  return (
    <div className="space-y-6 page-enter">

      {/* Header */}
      <div className="card-glass relative overflow-hidden p-4 sm:p-5">
        <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-brand-500/10 to-transparent" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-[0.2em]">{getGreeting()} 👋</p>
            <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">{user?.businessName || 'Your Store'}</h1>
            <p className="mt-1 text-sm text-gray-400">Here’s your live stock overview for today.</p>
          </div>
          <div className="flex gap-2 self-start sm:self-auto">
            <button onClick={loadDashboard} className="btn-ghost btn-sm" title="Refresh">
              <RefreshCw size={14} />
            </button>
            <button onClick={handleVoiceOpen} id="dashboard-voice-btn" className="btn-primary btn-sm gap-2">
              <Mic size={14} />
              <span className="hidden sm:inline">Voice</span>
            </button>
          </div>
        </div>
      </div>

      {/* Empty Onboarding State */}
      {isEmpty ? (
        <WelcomeCard onVoice={handleVoiceOpen} />
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard title="Total Products" value={stats?.totalProducts ?? 0} icon={Package}       color="brand"  subtitle="In inventory" />
            <StatCard title="Low Stock"       value={stats?.lowStockCount ?? 0}   icon={AlertTriangle} color="orange" subtitle="Need attention" />
            <StatCard title="Out of Stock"    value={stats?.outOfStockCount ?? 0} icon={AlertTriangle} color="red"    subtitle="Action required" />
            <StatCard title="Today's Stock In"  value={`+${stats?.todayStockIn ?? 0}`}  icon={TrendingUp}   color="green"  subtitle="Units added" />
            <StatCard title="Today's Stock Out" value={`-${stats?.todayStockOut ?? 0}`} icon={TrendingDown} color="purple" subtitle="Units sold" />
            <StatCard title="Inventory Value" value={formatCurrency(stats?.totalInventoryValue ?? 0)} icon={TrendingUp} color="blue" subtitle="Purchase price" />
          </div>

          {/* Voice CTA */}
          <VoiceCTA onClick={handleVoiceOpen} />

          {/* Bottom Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Low Stock */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                  <AlertTriangle size={15} className="text-accent-orange" />
                  Low Stock Alerts
                </h2>
                <Link to="/alerts" className="text-brand-400 text-xs hover:text-brand-300 flex items-center gap-1 transition-colors">
                  View all <ArrowRight size={12} />
                </Link>
              </div>
              {!stats?.lowStockProducts?.length ? (
                <div className="text-center py-6">
                  <p className="text-accent-green text-sm">🎉 All products are well-stocked!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.lowStockProducts.slice(0, 4).map(p => (
                    <LowStockAlert key={p.id} product={p} compact />
                  ))}
                </div>
              )}
            </div>

            {/* Recent Transactions */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                  <TrendingUp size={15} className="text-brand-400" />
                  Recent Activity
                </h2>
                <Link to="/transactions" className="text-brand-400 text-xs hover:text-brand-300 flex items-center gap-1 transition-colors">
                  View all <ArrowRight size={12} />
                </Link>
              </div>
              <TransactionList transactions={stats?.recentTransactions?.slice(0, 6) || []} compact />
            </div>
          </div>
        </>
      )}

      {/* Voice CTA when empty (below welcome card) */}
      {isEmpty && (
        <VoiceCTA onClick={handleVoiceOpen} label="Or use voice to add your first product" />
      )}

      {/* Voice Modal */}
      <VoiceModal
        open={voiceOpen}
        onClose={handleVoiceClose}
        voiceState={voice.state}
        transcript={voice.transcript}
        parsed={voice.parsed}
        product={voice.product}
        error={voice.error}
        isDemoMode={voice.isDemoMode}
        commandId={null}
        onStart={voice.startListening}
        onCancel={voice.cancel}
        onConfirm={(data) => {
          voice.confirmCommand({ ...data, requestId: crypto.randomUUID() })
          setTimeout(() => setVoiceOpen(false), 2000)
        }}
        onManualSubmit={voice.submitManualCommand}
      />
    </div>
  )
}

/* ─── Welcome / Onboarding card ─────────────────────────────── */
function WelcomeCard({ onVoice }) {
  return (
    <div className="card text-center py-16 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(97,113,246,0.08) 0%, rgba(181,123,255,0.05) 100%)',
        border: '1px solid rgba(97,113,246,0.2)',
        boxShadow: '0 0 60px rgba(97,113,246,0.1)',
      }}>
      {/* Background orbs */}
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(181,123,255,0.4), transparent)', filter: 'blur(40px)' }} />
      <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(97,113,246,0.4), transparent)', filter: 'blur(40px)' }} />

      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center float-anim"
          style={{ background: 'linear-gradient(135deg, #6171f6, #4f52eb)', boxShadow: '0 0 40px rgba(97,113,246,0.6), 0 0 80px rgba(97,113,246,0.2)' }}>
          <Sparkles size={34} className="text-white" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-white">Welcome to VaaniStock! 🎉</h2>
          <p className="text-gray-400 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
            Your inventory is empty. Start by adding your first product — speak naturally or use the form.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <button onClick={onVoice} className="btn-primary gap-2">
            <Mic size={16} /> Speak to Add Stock
          </button>
          <Link to="/add-product" className="btn-secondary gap-2">
            <Package size={16} /> Add Product Manually
          </Link>
        </div>

        <div className="mt-4 flex items-center gap-3 text-xs text-gray-600">
          <span className="px-2 py-1 rounded-lg bg-surface-700/60">Try: "10 bags rice add karo"</span>
          <span className="px-2 py-1 rounded-lg bg-surface-700/60">or "Add 5 kg sugar"</span>
        </div>
      </div>
    </div>
  )
}

/* ─── Voice CTA strip ────────────────────────────────────────── */
function VoiceCTA({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border-2 border-dashed text-center py-7 group transition-all duration-300 relative overflow-hidden"
      style={{
        borderColor: 'rgba(97,113,246,0.25)',
        background: 'rgba(97,113,246,0.03)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(97,113,246,0.5)'
        e.currentTarget.style.background  = 'rgba(97,113,246,0.06)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(97,113,246,0.25)'
        e.currentTarget.style.background  = 'rgba(97,113,246,0.03)'
      }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mic-idle group-hover:scale-110 transition-transform duration-300">
          <Mic size={24} className="text-white" />
        </div>
        <div>
          <p className="text-white font-semibold">{label || '🎙️ Tap to Speak'}</p>
          <p className="text-gray-500 text-xs mt-1">Say "10 bags rice add karo" or "Which products are low?"</p>
        </div>
      </div>
    </button>
  )
}

/* ─── Skeleton ───────────────────────────────────────────────── */
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 skeleton w-48 rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
      </div>
      <div className="h-28 skeleton rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-48 skeleton rounded-2xl" />
        <div className="h-48 skeleton rounded-2xl" />
      </div>
    </div>
  )
}
