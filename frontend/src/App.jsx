// VaaniStock — Main App Router
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useEffect, useState } from 'react'
import { alertsAPI } from './services/api'

// Lazy-load pages to reduce initial JS bundle size.
const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Inventory = lazy(() => import('./pages/Inventory'))
const AddProduct = lazy(() => import('./pages/AddProduct'))
const Transactions = lazy(() => import('./pages/Transactions'))
const Alerts = lazy(() => import('./pages/Alerts'))
const Reports = lazy(() => import('./pages/Reports'))
const VoiceAssistant = lazy(() => import('./pages/VoiceAssistant'))
const Settings = lazy(() => import('./pages/Settings'))

// Layout components
import Sidebar from './components/Sidebar'
import MobileNav from './components/MobileNav'

// Protected route wrapper
function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-surface-900">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse"
          style={{ background: 'linear-gradient(135deg, #6171f6, #4f52eb)', boxShadow: '0 0 30px rgba(97,113,246,0.5)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>
          </svg>
        </div>
        <p className="text-gray-500 text-sm">Loading VaaniStock…</p>
      </div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return <AppLayout />
}

// Main App Layout with sidebar
function AppLayout() {
  const [alertCount, setAlertCount] = useState(0)

  useEffect(() => {
    alertsAPI.list().then(res => {
      setAlertCount(res.data?.count || 0)
    }).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-surface-900">
      <Sidebar alertCount={alertCount} />
      <main className="lg:ml-64 min-h-screen pb-20 lg:pb-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <Outlet />
        </div>
      </main>
      <MobileNav alertCount={alertCount} />
    </div>
  )
}

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-900">
      <div className="flex flex-col items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-purple animate-pulse shadow-[0_0_30px_rgba(97,113,246,0.5)]" />
        <p className="text-sm text-gray-400">Loading VaaniStock…</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e1e35',
              color: '#fff',
              border: '1px solid #2e2e52',
              borderRadius: '12px',
              fontSize: '14px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.35)',
            },
            success: { iconTheme: { primary: '#10d9a0', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ff5757', secondary: '#fff' } },
            duration: 4000,
          }}
        />

        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/add-product" element={<AddProduct />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/voice" element={<VoiceAssistant />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
