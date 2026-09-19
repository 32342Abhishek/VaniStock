// VaaniStock - Settings Page
import { useEffect, useState } from 'react'
import { Bell, Check, Globe, Loader2, Settings as SettingsIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { settingsAPI } from '../services/api'
import { showErrorToast } from '../utils/toast'

const DEFAULT_SETTINGS = {
  preferredLanguage: 'en',
  alertEnabled: true,
  theme: 'dark',
}

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'te', label: 'Telugu' },
]

export default function Settings() {
  const [form, setForm] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    settingsAPI.get()
      .then((res) => setForm({ ...DEFAULT_SETTINGS, ...res.data?.data }))
      .catch((err) => showErrorToast(err, 'Could not load settings.'))
      .finally(() => setLoading(false))
  }, [])

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      await settingsAPI.update({
        preferredLanguage: form.preferredLanguage,
        alertEnabled: form.alertEnabled,
        theme: form.theme,
      })
      toast.success('Settings saved successfully.')
    } catch (err) {
      showErrorToast(err, 'Could not save settings.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded-xl skeleton" />
        <div className="h-72 rounded-2xl skeleton" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 page-enter">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">Workspace</p>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-black text-white">
          <SettingsIcon size={21} className="text-brand-400" /> Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500">Adjust language, voice, and inventory alert preferences.</p>
      </div>

      <form onSubmit={save} className="card space-y-6">
        <section>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
              <Globe size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-white">Voice language</h2>
              <p className="text-xs text-gray-500">Choose the language used by the voice assistant.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {LANGUAGES.map((language) => (
              <button
                key={language.value}
                type="button"
                onClick={() => update('preferredLanguage', language.value)}
                className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                  form.preferredLanguage === language.value
                    ? 'border-brand-400/70 bg-brand-500/15 text-white'
                    : 'border-surface-600 bg-surface-800/50 text-gray-400 hover:border-surface-500 hover:text-gray-200'
                }`}
              >
                {language.label}
              </button>
            ))}
          </div>
        </section>

        <div className="h-px bg-surface-600" />

        <section className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-orange/15 text-accent-orange">
              <Bell size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-white">Low-stock alerts</h2>
              <p className="text-xs text-gray-500">Show warnings when products need replenishing.</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.alertEnabled}
            aria-label="Toggle low-stock alerts"
            onClick={() => update('alertEnabled', !form.alertEnabled)}
            className={`relative h-7 w-12 rounded-full transition-colors ${form.alertEnabled ? 'bg-brand-500' : 'bg-surface-600'}`}
          >
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${form.alertEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </section>

        <div className="flex justify-end border-t border-surface-600 pt-5">
          <button type="submit" disabled={saving} className="btn-primary gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {saving ? 'Saving...' : 'Save settings'}
          </button>
        </div>
      </form>
    </div>
  )
}