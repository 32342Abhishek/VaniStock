// VaaniStock — Stat Card Component
import { clsx } from 'clsx'
import { TrendingUp, TrendingDown } from 'lucide-react'

const colorConfig = {
  brand:  { grad: 'from-brand-600/15 to-brand-900/5',   border: 'border-brand-500/15',   icon: 'bg-brand-600/20 text-brand-400',   glow: 'rgba(97,113,246,0.12)'  },
  green:  { grad: 'from-accent-green/15 to-emerald-900/5', border: 'border-accent-green/15', icon: 'bg-accent-green/20 text-accent-green', glow: 'rgba(16,217,160,0.1)' },
  orange: { grad: 'from-accent-orange/15 to-orange-900/5', border: 'border-accent-orange/15', icon: 'bg-accent-orange/20 text-accent-orange', glow: 'rgba(255,158,61,0.1)' },
  red:    { grad: 'from-accent-red/15 to-red-900/5',    border: 'border-accent-red/15',   icon: 'bg-accent-red/20 text-accent-red',   glow: 'rgba(255,87,87,0.1)'  },
  purple: { grad: 'from-accent-purple/15 to-purple-900/5', border: 'border-accent-purple/15', icon: 'bg-accent-purple/20 text-accent-purple', glow: 'rgba(181,123,255,0.1)' },
  blue:   { grad: 'from-accent-blue/15 to-blue-900/5',  border: 'border-accent-blue/15',  icon: 'bg-accent-blue/20 text-accent-blue',  glow: 'rgba(77,166,255,0.1)' },
}

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'brand', trend, isEmpty = false }) {
  const cfg = colorConfig[color] || colorConfig.brand

  const displayValue = isEmpty ? '—' : value

  return (
    <div
      className={clsx(
        'card bg-gradient-to-br border rounded-2xl p-5 hover-lift cursor-default relative overflow-hidden',
        cfg.grad, cfg.border
      )}
      style={{ boxShadow: `0 4px 24px rgba(0,0,0,0.25), 0 0 40px ${cfg.glow}` }}
    >
      {/* Subtle shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${cfg.glow.replace('0.12','0.4').replace('0.1','0.3')}, transparent)` }} />

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">{title}</p>
          <p className={clsx('text-2xl font-black leading-none', isEmpty ? 'text-gray-600' : 'text-white')}>
            {displayValue}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1.5">{isEmpty ? 'No data yet' : subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={clsx('p-2.5 rounded-xl flex-shrink-0', cfg.icon)}
            style={{ boxShadow: `0 0 16px ${cfg.glow}` }}>
            <Icon size={20} />
          </div>
        )}
      </div>

      {trend !== undefined && !isEmpty && (
        <div className={clsx(
          'flex items-center gap-1 mt-3 text-xs font-medium',
          trend >= 0 ? 'text-accent-green' : 'text-accent-red'
        )}>
          {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          <span>{Math.abs(trend)}% today</span>
        </div>
      )}
    </div>
  )
}
