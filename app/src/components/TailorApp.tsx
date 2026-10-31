'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { Customer, Draft, Order } from '@/types'
import type { Command } from '@/parser'
import type { MessageType } from '@/lib/messages'
import { useAppData } from '@/store/useAppData'
import { TodayView } from './TodayView'
import { BoardView } from './BoardView'
import { CustomersView, CustomerPage } from './CustomersView'
import { SettingsView } from './SettingsView'
import { PrintView } from './PrintView'
import { HelpView } from './HelpView'
import { AuthScreen } from './AuthScreen'
import { canSpeak, onSpeakingChange, setSpeakingEnabled, speakingEnabled } from '@/lib/speak'
import { LangSwitch, localeOf, useLang, type Key } from '@/i18n'
import { Icon } from './ui'

export type Result =
  | { type: 'card'; draft: Draft; changes?: string[]; question?: string }
  | { type: 'message'; order: Order; customer: Customer; msgType: MessageType; headline?: string }
  | { type: 'info'; tone: 'ok' | 'warn' | 'info' | 'muted'; title: string; body?: string }
  | { type: 'choice'; command: Command; customers: Customer[] }
  | { type: 'balance'; customer: Customer }
  | { type: 'pickOrder'; command: Command; customer: Customer; orders: Order[] }
  | { type: 'summary' }
  | { type: 'orderList'; variant: 'owed' | 'ready' | 'trials' | 'fabric' }
  | { type: 'stats'; period: 'today' | 'week' | 'month' }
  | { type: 'phone'; customer: Customer }

const NAV: { hash: string; label: Key; icon: () => React.ReactElement }[] = [
  { hash: '#today', label: 'nav.today', icon: Icon.today },
  { hash: '#orders', label: 'nav.orders', icon: Icon.board },
  { hash: '#customers', label: 'nav.customers', icon: Icon.people },
  { hash: '#settings', label: 'nav.settings', icon: Icon.settings },
]

function useHash() {
  const [hash, setHash] = useState('#today')
  useEffect(() => {
    const read = () => setHash(window.location.hash || '#today')
    read()
    window.addEventListener('hashchange', read)
    return () => window.removeEventListener('hashchange', read)
  }, [])
  const go = useCallback((h: string) => {
    if (window.location.hash === h) setHash(h)
    else window.location.hash = h
  }, [])
  return [hash, go] as const
}

function useToday() {
  const [today, setToday] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d })
  useEffect(() => {
    // Roll the date over at midnight if the shop leaves the tab open.
    const id = setInterval(() => {
      const d = new Date(); d.setHours(0, 0, 0, 0)
      setToday(prev => (prev.getTime() === d.getTime() ? prev : d))
    }, 60_000)
    return () => clearInterval(id)
  }, [])
  return today
}

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark' | undefined>()
  useEffect(() => {
    try {
      const t = localStorage.getItem('tmb-theme') as 'light' | 'dark' | null
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (t) { setTheme(t); document.documentElement.dataset.theme = t }
    } catch { /* ignore */ }
  }, [])
  const toggle = () => {
    const current = theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    const next = current === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.dataset.theme = next
    try { localStorage.setItem('tmb-theme', next) } catch { /* ignore */ }
  }
  return { theme, toggle }
}

export default function TailorApp() {
  const { data, mode, shop, syncState, update, undo, undoLabel, startDemo, leaveDemo, signedIn, signOut } = useAppData()
  const { t, lang } = useLang()
  const [hash, go] = useHash()
  const today = useToday()
  const { theme, toggle } = useTheme()
  const [result, setResult] = useState<Result | null>(null)
  const [toastState, setToast] = useState<{ msg: string; undoable?: boolean } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const mainRef = useRef<HTMLElement>(null)

  const toast = useCallback((msg: string, undoable?: boolean) => {
    setToast({ msg, undoable })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), undoable ? 6000 : 3500)
  }, [])

  const doUndo = useCallback(() => {
    const label = undo()
    toast(label ? t('toast.undone', { label }) : t('top.nothingToUndo'))
    return label
  }, [undo, toast, t])

  // Ctrl/Cmd+Z outside text fields undoes the last change.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) {
        e.preventDefault(); doUndo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [doUndo])

  // Customer messages follow the screen language, unless the shop chose Hinglish.
  useEffect(() => {
    if (data && data.settings.messageLang !== 'hinglish' && data.settings.messageLang !== lang) {
      update(t('set.changed'), d => ({ ...d, settings: { ...d.settings, messageLang: lang } }))
    }
  }, [lang, data, update, t])

  const [route, ...params] = hash.replace(/^#/, '').split('/')
  const section = route === 'customer' ? 'customers' : route === 'print' ? 'orders' : route || 'today'

  // Move focus to the new view's heading for screen-reader and keyboard users.
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    mainRef.current?.querySelector<HTMLElement>('h1')?.focus()
    window.scrollTo({ top: 0 })
  }, [route, params[0]]) // eslint-disable-line react-hooks/exhaustive-deps

  const startOrderFor = (c: Customer, from?: Order) => {
    const base = from ?? data?.orders.filter(o => o.customerId === c.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
    setResult({
      type: 'card',
      draft: {
        name: c.name, phone: c.phone, customerId: c.id, advance: 0, notes: [], unmatched: [],
        rawText: t('repeat.raw', { name: c.name }),
        items: base ? base.items.map(it => ({ garment: it.garment, quantity: 1, fit: it.fit, measurements: { ...it.measurements }, unclear: [], cmSpoken: [] })) : [{ quantity: 1, measurements: {}, unclear: [], cmSpoken: [] }],
      },
      question: t('repeat.question'),
    })
    go('#today')
  }

  const editOrder = (o: Order) => {
    const c = data?.customers.find(x => x.id === o.customerId)
    setResult({
      type: 'card',
      draft: {
        editingOrderId: o.id, customerId: o.customerId, name: c?.name, phone: c?.phone,
        dueDate: o.dueDate, trialDate: o.trialDate, total: o.total, advance: o.advance, kind: o.kind, fabric: o.fabric,
        notes: o.notes ? o.notes.split('\n') : [], unmatched: [], rawText: o.rawText,
        items: o.items.map(it => ({ ...it, measurements: { ...it.measurements }, unclear: [], cmSpoken: [] })),
      },
      question: t('edit.question', { n: o.number }),
    })
    go('#today')
  }

  const dateLabel = today.toLocaleDateString(localeOf(lang), { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="shell">
      <a className="skip" href="#main">{t('skip')}</a>
      <header className="topbar no-print">
        <div className="wrap gutter topbar-inner">
          <Link href="/" className="brand" aria-label={t('top.home')}>
            <span className="brand-mark"><Icon.tape /></span>
            <span>
              <span className="brand-name">{data?.settings.shopName ?? 'Naap'}</span><br />
              <span className="brand-date">{dateLabel}</span>
            </span>
          </Link>
          <nav className="topnav" aria-label={t('nav.main')}>
            {NAV.map(n => (
              <a key={n.hash} href={n.hash} aria-current={section === n.hash.slice(1) ? 'page' : undefined}>{t(n.label)}</a>
            ))}
          </nav>
          <div className="top-actions">
            {mode === 'cloud' && (
              <span className={`sync sync-${syncState}`} role="status" aria-live="polite">{t(`sync.${syncState}` as Key)}</span>
            )}
            <SpeakToggle />
            <LangSwitch compact />
            <a className="icon-btn" href="#help" aria-label={t('top.help')} title={t('top.help')} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 800, fontSize: '1.2rem' }}>?</a>
            <button type="button" className="icon-btn" onClick={doUndo} disabled={!undoLabel}
              aria-label={undoLabel ? t('top.undo', { label: undoLabel }) : t('top.nothingToUndo')} title={undoLabel ? t('top.undo', { label: undoLabel }) : t('top.nothingToUndo')}>
              <Icon.undo />
            </button>
            <button type="button" className="icon-btn theme-btn" onClick={toggle} aria-label={theme === 'dark' ? t('top.toLight') : t('top.toDark')}>
              {theme === 'dark' ? <Icon.sun /> : <Icon.moon />}
            </button>
          </div>
        </div>
      </header>

      <main id="main" ref={mainRef} className="wrap gutter" tabIndex={-1}>
        {mode === 'demo' && (
          <p className="demo-bar">
            <strong>{t('demo.bar')}</strong> {t('demo.barText')}
            <button type="button" className="demo-link" onClick={leaveDemo}>{t('demo.signIn')}</button>
          </p>
        )}
        {mode === 'signedOut' ? <AuthScreen onSignedIn={async s => { await signedIn(s); go('#today') }} onDemo={() => { startDemo(); go('#today') }} /> : !data ? <p className="loading" role="status">{t('loading')}</p> : (
          <>
            {section === 'today' && (
              <>
                <h1 className="sr-only" tabIndex={-1}>{t('nav.today')}</h1>
                <TodayView data={data} today={today} result={result} setResult={setResult} update={update} undo={doUndo} toast={toast} go={go} />
              </>
            )}
            {route === 'orders' && <BoardView data={data} today={today} update={update} go={go} toast={toast} />}
            {route === 'customers' && <CustomersView data={data} go={go} />}
            {route === 'customer' && (
              <CustomerPage data={data} today={today} customerId={params[0]} openOrderId={params[1]} update={update} go={go} toast={toast} onNewOrder={startOrderFor} onEditOrder={editOrder} />
            )}
            {route === 'settings' && <SettingsView data={data} update={update} toast={toast} mode={mode} shop={shop} onSignOut={signOut} onLeaveDemo={leaveDemo} />}
            {route === 'help' && <HelpView />}
            {route === 'print' && <PrintView data={data} orderId={params[0]} kind={params[1] === 'tag' ? 'tag' : 'slip'} go={go} />}
          </>
        )}
      </main>

      <nav className="tabbar no-print" aria-label={t('nav.main')}>
        {NAV.map(n => (
          <a key={n.hash} href={n.hash} aria-current={section === n.hash.slice(1) ? 'page' : undefined}>
            <n.icon />{t(n.label)}
          </a>
        ))}
      </nav>

      <div aria-live="polite" className="sr-only">{toastState?.msg}</div>
      {toastState && (
        <div className="toast" role="status">
          <span>{toastState.msg}</span>
          {toastState.undoable && <button type="button" onClick={() => { doUndo() }}>{t('toast.undo')}</button>}
        </div>
      )}
    </div>
  )
}

/** 🔊 / 🔇: turns spoken answers on or off. */
function SpeakToggle() {
  const { t } = useLang()
  const [on, setOn] = useState(true)
  const [supported, setSupported] = useState(false)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(canSpeak()); setOn(speakingEnabled())
    return onSpeakingChange(setOn)
  }, [])
  if (!supported) return null
  return (
    <button type="button" className="icon-btn" aria-pressed={on} onClick={() => setSpeakingEnabled(!on)}
      aria-label={on ? t('sp.on') : t('sp.off')} title={on ? t('sp.on') : t('sp.off')}>
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M11 5 6 9H3v6h3l5 4V5Z" />
        {on ? <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /> : <path d="m16 9 5 6M21 9l-5 6" />}
      </svg>
    </button>
  )
}
