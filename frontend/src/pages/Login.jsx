// VaaniStock — Login Page
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { showErrorToast, showSuccessToast } from '../utils/toast'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const { login } = useAuth()
  const navigate = useNavigate()

  const validate = () => {
    const e = {}
    if (!form.email.trim()) e.email = 'Email is required.'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email address.'
    if (!form.password) e.password = 'Password is required.'
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await login(form.email.trim(), form.password)
      showSuccessToast('Welcome back! 👋')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.detail?.message || 'Invalid email or password.'
      showErrorToast(err, msg)
      setErrors({ general: msg })
    } finally {
      setLoading(false)
    }
  }

  // Quick demo login
  const demoLogin = async () => {
    setForm({ email: 'demo@vaanistock.in', password: 'demo1234' })
    setLoading(true)
    try {
      await login('demo@vaanistock.in', 'demo1234')
      showSuccessToast('Welcome to the demo! 🎉')
      navigate('/dashboard')
    } catch {
      // Demo account doesn't exist, register it
      try {
        const { authAPI } = await import('../services/api')
        await authAPI.register({
          name: 'Demo Shopkeeper',
          email: 'demo@vaanistock.in',
          password: 'demo1234',
          businessName: 'Demo Kirana Store',
          preferredLanguage: 'en',
        })
        await login('demo@vaanistock.in', 'demo1234')
        showSuccessToast('Demo account created! 🎉')
        navigate('/dashboard')
      } catch {
        showErrorToast({ message: 'Demo login failed. Please register.' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-900 p-4">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-40 w-80 h-80 bg-brand-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-40 w-80 h-80 bg-accent-purple/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex relative mb-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #6171f6 0%, #4f52eb 60%, #b57bff 100%)',
                boxShadow: '0 0 24px rgba(97,113,246,0.6), 0 0 48px rgba(97,113,246,0.25)',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 22 22" fill="none">
                <rect x="1"  y="8"  width="2.5" height="6"  rx="1.2" fill="white" opacity="0.7"/>
                <rect x="5"  y="4"  width="2.5" height="14" rx="1.2" fill="white" opacity="0.9"/>
                <rect x="9"  y="1"  width="2.5" height="20" rx="1.2" fill="white"/>
                <rect x="13" y="4"  width="2.5" height="14" rx="1.2" fill="white" opacity="0.9"/>
                <rect x="17" y="8"  width="2.5" height="6"  rx="1.2" fill="white" opacity="0.7"/>
              </svg>
            </div>
            <span style={{
              position: 'absolute', top: -3, right: -3,
              width: 12, height: 12,
              background: '#10d9a0',
              borderRadius: '50%',
              border: '2px solid #0f0f1a',
              boxShadow: '0 0 8px rgba(16,217,160,0.8)',
            }} />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-gray-400 mt-1">Sign in to VaaniStock</p>
        </div>

        <div className="card">
          {/* Demo Button */}
          <button
            onClick={demoLogin}
            disabled={loading}
            className="w-full mb-5 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600/30 to-accent-purple/20 border border-brand-500/30 text-white hover:border-brand-400/50 transition-all text-sm font-medium disabled:opacity-50"
          >
            ⚡ Try Demo Account — No Sign-up Needed
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-surface-600" />
            <span className="text-gray-500 text-xs">or sign in</span>
            <div className="flex-1 h-px bg-surface-600" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className={`input ${errors.email ? 'border-accent-red' : ''}`}
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-accent-red text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className={`input pr-10 ${errors.password ? 'border-accent-red' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-accent-red text-xs mt-1">{errors.password}</p>}
            </div>

            {errors.general && (
              <div className="bg-accent-red/10 border border-accent-red/20 rounded-xl p-3 text-accent-red text-sm">
                {errors.general}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-50">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">
            Sign Up Free
          </Link>
        </p>
      </div>
    </div>
  )
}
