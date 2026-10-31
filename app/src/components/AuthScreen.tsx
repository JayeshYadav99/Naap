'use client'

import { useState } from 'react'
import type { ShopInfo } from '@/store/useAppData'
import { LangSwitch, useLang, type Key } from '@/i18n'

export function AuthScreen({ onSignedIn, onDemo }: { onSignedIn: (s: ShopInfo) => Promise<void>; onDemo: () => void }) {
  const { t } = useLang()
  const [tab, setTab] = useState<'login' | 'signup'>('login')
  const [form, setForm] = useState({ shopName: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res = await fetch(tab === 'login' ? '/api/auth/login' : '/api/auth/signup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) { setError(body.code ? t(`auth.e.${body.code}` as Key) : body.error ?? t('auth.generic')); return }
      await onSignedIn(body.shop)
    } catch {
      setError(t('auth.offline'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <section className="panel auth-card" aria-labelledby="auth-title">
        <h1 id="auth-title" className="view-title" tabIndex={-1}>{tab === 'login' ? t('auth.signInTitle') : t('auth.signUpTitle')}</h1>
        <LangSwitch />
        <div className="segmented" role="group" aria-label={t('auth.switch')}>
          <button type="button" aria-pressed={tab === 'login'} onClick={() => { setTab('login'); setError('') }}>{t('auth.haveShop')}</button>
          <button type="button" aria-pressed={tab === 'signup'} onClick={() => { setTab('signup'); setError('') }}>{t('auth.newShop')}</button>
        </div>
        <form onSubmit={submit} className="auth-form" noValidate>
          {tab === 'signup' && (
            <div className="field">
              <label className="label" htmlFor="a-shop">{t('auth.shopName')}</label>
              <input id="a-shop" className="input" autoComplete="organization" value={form.shopName} onChange={e => setForm({ ...form, shopName: e.target.value })} placeholder="Sharma Tailors" />
            </div>
          )}
          <div className="field">
            <label className="label" htmlFor="a-phone">{t('auth.mobile')}</label>
            <input id="a-phone" className="input num" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="98765 43210" />
          </div>
          <div className="field">
            <label className="label" htmlFor="a-pw">{t('auth.password')}</label>
            <input id="a-pw" className="input" type="password" autoComplete={tab === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} aria-describedby="a-pw-hint" />
            <span id="a-pw-hint" className="hint">{tab === 'signup' ? t('auth.pwHint') : ' '}</span>
          </div>
          {error && <p className="question" role="alert">{error}</p>}
          <button className="btn btn-primary btn-lg" type="submit" disabled={busy}>{busy ? t('auth.wait') : tab === 'login' ? t('auth.signIn') : t('auth.create')}</button>
        </form>
        <div className="auth-demo">
          <p className="hint">{t('auth.demoText')}</p>
          <button type="button" className="btn btn-ghost btn-lg" onClick={onDemo}>{t('auth.demo')}</button>
        </div>
      </section>
    </div>
  )
}
