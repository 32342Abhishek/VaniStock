// VaaniStock — Mobile Bottom Navigation
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Package, Mic, Bell, ArrowRightLeft, Settings } from 'lucide-react'
import { clsx } from 'clsx'

const MOBILE_NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/inventory', icon: Package, label: 'Stock' },
  { to: '/voice', icon: Mic, label: 'Voice', center: true },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/transactions', icon: ArrowRightLeft, label: 'History' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function MobileNav({ alertCount = 0 }) {
  const { pathname } = useLocation()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-surface-600 bg-surface-800/90 backdrop-blur-xl" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
      <div className="flex items-center">
        {MOBILE_NAV.map(({ to, icon: Icon, label, center }) => {
          const active = pathname === to
          if (center) {
            return (
              <Link key={to} to={to} className="flex-1 flex flex-col items-center py-2 -mt-4">
                <div className={clsx(
                  'w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all',
                  active ? 'bg-brand-500 shadow-brand-900/60' : 'bg-brand-600 shadow-brand-900/40 hover:bg-brand-500'
                )}>
                  <Icon size={24} className="text-white" />
                </div>
                <span className="text-xs mt-1 text-gray-400">{label}</span>
              </Link>
            )
          }
          return (
            <Link
              key={to}
              to={to}
              className={clsx(
                'flex-1 flex flex-col items-center gap-1 py-3 transition-colors relative',
                active ? 'text-brand-400' : 'text-gray-500 hover:text-gray-300'
              )}
            >
              <Icon size={20} />
              <span className="text-xs">{label}</span>
              {to === '/alerts' && alertCount > 0 && (
                <span className="absolute top-2 right-6 bg-accent-red text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {alertCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
