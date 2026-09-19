// VaaniStock — Landing Page
import { Link } from 'react-router-dom'
import { Mic, Package, TrendingUp, Shield, Globe, Zap, ArrowRight, CheckCircle2 } from 'lucide-react'

const features = [
  { icon: Mic,       title: 'Voice First',          desc: 'Just speak. Add or remove stock in seconds with natural voice commands.',        color: '#6171f6' },
  { icon: Globe,     title: 'Multilingual',          desc: 'English, Hindi, Telugu, Hinglish — speak in your language, we understand.',      color: '#b57bff' },
  { icon: Package,   title: 'Smart Inventory',       desc: 'Real-time stock tracking with low-stock alerts and reorder suggestions.',         color: '#10d9a0' },
  { icon: Shield,    title: 'Secure & Private',      desc: 'Your data is protected with JWT authentication and encrypted connections.',       color: '#4da6ff' },
  { icon: TrendingUp,'title': 'Transaction History', desc: 'Complete audit trail of every stock movement with export to CSV.',              color: '#ff9e3d' },
  { icon: Zap,       title: 'Instant Updates',       desc: 'Atomic stock updates — no double entries, no errors, always accurate.',          color: '#ff5757' },
]

const examples = [
  { lang: 'Hinglish', flag: '🇮🇳', cmd: '10 bags rice add karo',             desc: 'Add 10 bags of rice' },
  { lang: 'Telugu',   flag: '🇮🇳', cmd: 'Rice 20 bags stock lo add cheyyi', desc: 'Add 20 bags of rice' },
  { lang: 'Hindi',    flag: '🇮🇳', cmd: 'चावल के 20 बोरे जोड़ो',             desc: 'Add 20 bags of rice' },
  { lang: 'English',  flag: '🇬🇧', cmd: 'Which products are low?',           desc: 'Show low stock items' },
]

export default function Landing() {
  return (
    <div className="min-h-screen text-white" style={{ background: '#0a0a1a' }}>

      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="hero-orb w-96 h-96 top-[-10%] left-[-5%] opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(97,113,246,0.5), transparent)' }} />
        <div className="hero-orb w-80 h-80 top-[20%] right-[-5%] opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(181,123,255,0.5), transparent)', animationDelay: '-4s' }} />
        <div className="hero-orb w-64 h-64 bottom-[10%] left-[10%] opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(16,217,160,0.4), transparent)', animationDelay: '-8s' }} />
      </div>

      <header className="fixed top-0 left-0 right-0 z-30"
        style={{ background: 'rgba(10,10,26,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6171f6, #4f52eb)', boxShadow: '0 0 16px rgba(97,113,246,0.5)' }}>
                <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                  <rect x="1"  y="8"  width="2.5" height="6"  rx="1.2" fill="white" opacity="0.7"/>
                  <rect x="5"  y="4"  width="2.5" height="14" rx="1.2" fill="white" opacity="0.9"/>
                  <rect x="9"  y="1"  width="2.5" height="20" rx="1.2" fill="white"/>
                  <rect x="13" y="4"  width="2.5" height="14" rx="1.2" fill="white" opacity="0.9"/>
                  <rect x="17" y="8"  width="2.5" height="6"  rx="1.2" fill="white" opacity="0.7"/>
                </svg>
              </div>
              <span style={{ position:'absolute', top:-2, right:-2, width:8, height:8, background:'#10d9a0', borderRadius:'50%', border:'2px solid #0a0a1a', boxShadow:'0 0 6px rgba(16,217,160,0.8)' }} />
            </div>
            <span className="font-black text-lg tracking-tight">VaaniStock</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-sm">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm">Get Started →</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-36 pb-24 px-6 text-center relative">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm mb-8"
            style={{ background: 'rgba(97,113,246,0.12)', border: '1px solid rgba(97,113,246,0.25)', color: '#a5b4fc' }}>
            <Zap size={13} /> Voice-First Inventory for India's Small Businesses
          </div>

          <h1 className="text-5xl lg:text-7xl font-black mb-6 leading-tight tracking-tight">
            <span className="text-gradient">Manage Your Stock.</span>
            <br />
            <span className="text-white">Just Speak.</span>
          </h1>

          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            VaaniStock lets kirana shops, grocery stores, and small retailers manage
            inventory using natural voice commands in Hindi, Telugu, English, or Hinglish.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary btn-lg gap-2">
              Start for Free <ArrowRight size={17} />
            </Link>
            <Link to="/login" className="btn-secondary btn-lg">
              Sign In
            </Link>
          </div>

          {/* Voice Demo Card */}
          <div className="mt-16 max-w-sm mx-auto float-anim">
            <div className="rounded-2xl p-5 text-left"
              style={{ background: 'rgba(15,15,36,0.9)', border: '1px solid rgba(97,113,246,0.2)', boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(97,113,246,0.1)' }}>
              {/* Mic header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #ff5757, #c0392b)', boxShadow: '0 0 20px rgba(255,87,87,0.5)' }}>
                  <Mic size={17} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">Listening…</p>
                  <div className="flex items-end gap-0.5 mt-1 h-4">
                    {[3, 6, 9, 7, 5, 8, 6, 4].map((h, i) => (
                      <div key={i} className="wave-bar w-1"
                        style={{ height: `${h * 2}px`, animationDelay: `${i * 0.12}s` }} />
                    ))}
                  </div>
                </div>
              </div>
              {/* Transcript */}
              <div className="rounded-xl px-4 py-3 mb-3"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-gray-500 text-xs mb-1">You said:</p>
                <p className="text-white font-semibold text-sm">"10 bags rice add karo"</p>
              </div>
              {/* Parsed result */}
              <div className="rounded-xl px-4 py-3"
                style={{ background: 'rgba(16,217,160,0.08)', border: '1px solid rgba(16,217,160,0.2)' }}>
                <p className="text-accent-green text-xs font-semibold mb-2">✅ Understood:</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Intent</span>
                    <span className="text-white font-medium">ADD_STOCK</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Product</span>
                    <span className="text-white font-medium">Rice</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Quantity</span>
                    <span className="text-accent-green font-bold">+10 bags</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Voice Examples */}
      <section className="py-20 px-6" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-3">Speak in Your Language</h2>
          <p className="text-gray-500 mb-12">Supports English, Hindi, Telugu, and Hinglish — more coming soon</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {examples.map(({ lang, flag, cmd, desc }) => (
              <div key={lang} className="text-left p-5 rounded-2xl hover-lift transition-all"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(97,113,246,0.3)'; e.currentTarget.style.background = 'rgba(97,113,246,0.06)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{flag}</span>
                  <span className="badge badge-purple text-xs">{lang}</span>
                </div>
                <p className="text-white font-bold text-base mb-1">"{cmd}"</p>
                <p className="text-gray-500 text-sm">→ {desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-3">Everything You Need</h2>
          <p className="text-gray-500 text-center mb-14">Built for small business owners across India</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="p-5 rounded-2xl hover-lift transition-all"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color + '30'; e.currentTarget.style.background = color + '06' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.025)' }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: color + '15', boxShadow: `0 0 16px ${color}20` }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <h3 className="text-white font-bold mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center relative">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(97,113,246,0.08), transparent)' }} />
        <div className="max-w-xl mx-auto relative">
          <h2 className="text-4xl font-black mb-4">Ready to get started?</h2>
          <p className="text-gray-400 mb-8 text-lg">Join thousands of shopkeepers managing inventory with their voice.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="btn-primary btn-lg gap-2">
              Create Free Account <ArrowRight size={17} />
            </Link>
            <Link to="/login" className="btn-secondary btn-lg">Sign In</Link>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 text-gray-600 text-sm">
            {['Free forever', 'No credit card', 'Setup in 2 minutes'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-accent-green/60" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center text-gray-600 text-sm"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p>VaaniStock — Manage Your Stock. Just Speak. 🎙️</p>
        <p className="mt-1 text-gray-700">Built for Hackathon 2026</p>
      </footer>
    </div>
  )
}
