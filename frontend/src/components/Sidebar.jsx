// VaaniStock — Sidebar Navigation Component
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Package, PlusCircle, ArrowRightLeft,
  Bell, Mic, Settings, LogOut, TrendingUp
} from 'lucide-react'
import { clsx } from 'clsx'

const NAV_ITEMS = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/inventory',    icon: Package,          label: 'Inventory' },
  { to: '/add-product',  icon: PlusCircle,       label: 'Add Product' },
  { to: '/transactions', icon: ArrowRightLeft,   label: 'Transactions' },
  { to: '/alerts',       icon: Bell,             label: 'Alerts', badge: true },
  { to: '/voice',        icon: Mic,              label: 'Voice Assistant', highlight: true },
  { to: '/reports',      icon: TrendingUp,       label: 'Reports' },
]

// Premium VaaniStock logo mark SVG
function LogoMark({ size = 36 }) {
  return (
    <div
      style={{
        width: size, height: size,
        background: 'linear-gradient(135deg, #6171f6 0%, #4f52eb 60%, #b57bff 100%)',
        boxShadow: '0 0 20px rgba(97,113,246,0.6), 0 0 40px rgba(97,113,246,0.25)',
        borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, position: 'relative',
      }}
    >
      {/* Waveform bars as logo */}
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 22 22" fill="none">
        <rect x="1"  y="8"  width="2.5" height="6"  rx="1.2" fill="white" opacity="0.7"/>
        <rect x="5"  y="4"  width="2.5" height="14" rx="1.2" fill="white" opacity="0.9"/>
        <rect x="9"  y="1"  width="2.5" height="20" rx="1.2" fill="white"/>
        <rect x="13" y="4"  width="2.5" height="14" rx="1.2" fill="white" opacity="0.9"/>
        <rect x="17" y="8"  width="2.5" height="6"  rx="1.2" fill="white" opacity="0.7"/>
      </svg>
      {/* Online dot */}
      <span style={{
        position: 'absolute', top: -2, right: -2,
        width: 9, height: 9,
        background: '#10d9a0',
        borderRadius: '50%',
        border: '2px solid #0f0f24',
        boxShadow: '0 0 6px rgba(16,217,160,0.8)',
      }} />
    </div>
  )
}

export default function Sidebar({ alertCount = 0 }) {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '?'

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen fixed left-0 top-0 z-30"
      style={{
        background: 'linear-gradient(180deg, #0d0d22 0%, #11112a 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '4px 0 32px rgba(0,0,0,0.5)',
      }}>

      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3">
          <LogoMark size={38} />
          <div>
            <h1 className="font-black text-white leading-none tracking-tight" style={{ fontSize: 17 }}>VaaniStock</h1>
            <p className="text-gray-500 mt-0.5" style={{ fontSize: 11 }}>Speak. Manage. Grow.</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      {user && (
        <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="relative w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6171f6, #b57bff)', boxShadow: '0 0 12px rgba(97,113,246,0.4)' }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user.name}</p>
              <p className="text-gray-500 truncate" style={{ fontSize: 11 }}>{user.businessName}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollable" style={{ padding: '12px 10px 8px' }}>
        <p className="text-gray-600 uppercase tracking-widest px-3 mb-2" style={{ fontSize: 10, fontWeight: 700 }}>Menu</p>
        <div className="space-y-0.5">
          {NAV_ITEMS.map(({ to, icon: Icon, label, badge, highlight }) => {
            const active = pathname === to || pathname.startsWith(to + '/')
            return (
              <Link
                key={to}
                to={to}
                className={clsx(
                  'sidebar-link group',
                  active && 'active',
                  highlight && !active && 'text-brand-400 hover:text-brand-300'
                )}
              >
                <Icon size={17} className={clsx('flex-shrink-0 transition-colors', active ? 'text-brand-400' : 'group-hover:text-gray-300')} />
                <span className="flex-1">{label}</span>
                {badge && alertCount > 0 && (
                  <span className="bg-accent-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold flex-shrink-0"
                    style={{ boxShadow: '0 0 8px rgba(255,87,87,0.6)', fontSize: 10 }}>
                    {alertCount > 9 ? '9+' : alertCount}
                  </span>
                )}
                {highlight && !active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Bottom */}
      <div style={{ padding: '8px 10px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="space-y-0.5">
          <Link to="/settings" className={clsx('sidebar-link', pathname === '/settings' && 'active')}>
            <Settings size={17} />
            <span>Settings</span>
          </Link>
          <button onClick={handleLogout} className="sidebar-link text-red-400/80 hover:text-red-300"
            style={{}}>
            <LogOut size={17} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  )
}

