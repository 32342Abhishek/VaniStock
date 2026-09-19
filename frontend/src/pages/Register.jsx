// VaaniStock — Register Page
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { showErrorToast, showSuccessToast } from '../utils/toast'

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi (हिंदी)' },
  { value: 'te', label: 'Telugu (తెలుగు)' },
]

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    businessName: '', preferredLanguage: 'en',
  })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const { register } = useAuth()
  const navigate = useNavigate()

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required.'
    if (!form.email.trim()) e.email = 'Email is required.'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email address.'
    if (!form.password) e.password = 'Password is required.'
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters.'
    if (!form.businessName.trim()) e.businessName = 'Business name is required.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await register({ ...form, email: form.email.trim(), name: form.name.trim(), businessName: form.businessName.trim() })
      showSuccessToast('Account created! Demo data loaded. 🎉')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.detail?.message || err.response?.data?.detail || 'Registration failed.'
      showErrorToast(err, typeof msg === 'string' ? msg : 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-900 p-4">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -left-40 w-80 h-80 bg-accent-green/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
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
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-gray-400 mt-1">Start managing inventory with your voice</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">Your Name</label>
                <input id="name" type="text" value={form.name} onChange={e => update('name', e.target.value)}
                  className={`input ${errors.name ? 'border-accent-red' : ''}`} placeholder="Ramesh Kumar" />
                {errors.name && <p className="text-accent-red text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="input-label">Language</label>
                <select value={form.preferredLanguage} onChange={e => update('preferredLanguage', e.target.value)} className="input">
                  {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="input-label">Business Name</label>
              <input id="businessName" type="text" value={form.businessName} onChange={e => update('businessName', e.target.value)}
                className={`input ${errors.businessName ? 'border-accent-red' : ''}`} placeholder="Ramesh Kirana Store" />
              {errors.businessName && <p className="text-accent-red text-xs mt-1">{errors.businessName}</p>}
            </div>

            <div>
              <label className="input-label">Email</label>
              <input id="reg-email" type="email" value={form.email} onChange={e => update('email', e.target.value)}
                className={`input ${errors.email ? 'border-accent-red' : ''}`} placeholder="ramesh@example.com" />
              {errors.email && <p className="text-accent-red text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <input id="reg-password" type={showPwd ? 'text' : 'password'} value={form.password}
                  onChange={e => update('password', e.target.value)}
                  className={`input pr-10 ${errors.password ? 'border-accent-red' : ''}`} placeholder="Min. 6 characters" />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-accent-red text-xs mt-1">{errors.password}</p>}
            </div>

            <div className="bg-brand-600/10 border border-brand-500/20 rounded-xl p-3 text-xs text-gray-300">
              ✅ Demo inventory data (15 products) will be automatically added to your account.
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-50">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account...</> : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign In</Link>
        </p>
      </div>
    </div>
  )
}
