'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppData, Customer, Order } from '@/types'
import { DEFAULT_SETTINGS, sampleData } from './sampleData'

const DEMO_KEY = 'tailor-measurement-book:v1'
const MODE_KEY = 'naap-mode'
const CACHE_KEY = 'naap-cloud-cache'

export type Mode = 'loading' | 'signedOut' | 'demo' | 'cloud'
export type SyncState = 'saved' | 'saving' | 'error' | 'offline'
export interface ShopInfo { name: string; phone: string }

const store = {
  get(k: string) { try { return localStorage.getItem(k) } catch { return null } },
  set(k: string, v: string) { try { localStorage.setItem(k, v) } catch { /* private mode or full */ } },
  del(k: string) { try { localStorage.removeItem(k) } catch { /* ignore */ } },
}

function loadDemo(): AppData {
  const raw = store.get(DEMO_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as AppData
      if (parsed && parsed.version === 1 && Array.isArray(parsed.orders)) {
        return migrate({ ...parsed, settings: { ...DEFAULT_SETTINGS, ...parsed.settings } })
      }
    } catch { /* corrupt: fall back to sample data */ }
  }
  return sampleData()
}

/** Older saves have no token numbers: give them numbers in the order they were created. */
function migrate(d: AppData): AppData {
  if (d.orders.every(o => typeof o.number === 'number' && o.number > 0)) return d
  let next = nextOrderNumber(d)
  const sorted = [...d.orders].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const numbers = new Map(sorted.map(o => [o.id, o.number > 0 ? o.number : next++]))
  return { ...d, orders: d.orders.map(o => ({ ...o, number: numbers.get(o.id)! })) }
}

export function nextOrderNumber(d: AppData): number {
  return d.orders.reduce((m, o) => Math.max(m, o.number || 0), 0) + 1
}

/** Restores a backup file. Throws with a readable message if the file is not a backup. */
export function parseBackup(text: string): AppData {
  const d = JSON.parse(text) as AppData
  if (!d || d.version !== 1 || !Array.isArray(d.orders) || !Array.isArray(d.customers)) throw new Error('This file is not a Naap backup.')
  return migrate({ ...d, settings: { ...DEFAULT_SETTINGS, ...d.settings } })
}

/** What changed between the last saved copy and now, as upserts and deletes. */
function diff(prev: AppData, next: AppData) {
  const changed = <T extends { id: string }>(a: T[], b: T[]) => {
    const before = new Map(a.map(x => [x.id, JSON.stringify(x)]))
    const after = new Set(b.map(x => x.id))
    return {
      upsert: b.filter(x => before.get(x.id) !== JSON.stringify(x)),
      remove: a.filter(x => !after.has(x.id)).map(x => x.id),
    }
  }
  const c = changed<Customer>(prev.customers, next.customers)
  const o = changed<Order>(prev.orders, next.orders)
  const settings = JSON.stringify(prev.settings) !== JSON.stringify(next.settings) ? next.settings : undefined
  const empty = !settings && !c.upsert.length && !c.remove.length && !o.upsert.length && !o.remove.length
  return empty ? undefined : { settings, upsertCustomers: c.upsert, deleteCustomers: c.remove, upsertOrders: o.upsert, deleteOrders: o.remove }
}

interface UndoEntry { label: string; data: AppData }

export function useAppData() {
  const [data, setData] = useState<AppData | null>(null)
  const [mode, setMode] = useState<Mode>('loading')
  const [shop, setShop] = useState<ShopInfo | null>(null)
  const [syncState, setSyncState] = useState<SyncState>('saved')
  const undoStack = useRef<UndoEntry[]>([])
  const [undoLabel, setUndoLabel] = useState<string | undefined>()

  const modeRef = useRef<Mode>('loading')
  const shopRef = useRef<ShopInfo | null>(null)
  const latest = useRef<AppData | null>(null)
  const synced = useRef<AppData | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const inFlight = useRef(false)
  const flushRef = useRef<() => Promise<void>>(async () => {})

  const enterCloud = useCallback((d: AppData, s: ShopInfo) => {
    modeRef.current = 'cloud'
    shopRef.current = s
    latest.current = d
    synced.current = d
    undoStack.current = []
    setUndoLabel(undefined)
    setShop(s)
    setData(d)
    setMode('cloud')
    setSyncState('saved')
    store.set(CACHE_KEY, JSON.stringify({ shop: s, data: d }))
  }, [])

  // Sends whatever changed since the last successful save. Retries until it gets through.
  const flush = useCallback(async () => {
    if (modeRef.current !== 'cloud' || inFlight.current || !latest.current || !synced.current) return
    const target = latest.current
    const ops = diff(synced.current, target)
    if (!ops) { setSyncState('saved'); return }
    inFlight.current = true
    setSyncState('saving')
    try {
      const res = await fetch('/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ops) })
      if (res.status === 401) { modeRef.current = 'signedOut'; setMode('signedOut'); return }
      if (!res.ok) throw new Error(String(res.status))
      synced.current = target
      setSyncState(latest.current === target ? 'saved' : 'saving')
    } catch {
      setSyncState(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'error')
      clearTimeout(timer.current)
      timer.current = setTimeout(() => void flushRef.current(), 5000)
      return
    } finally {
      inFlight.current = false
    }
    if (latest.current !== synced.current) { clearTimeout(timer.current); timer.current = setTimeout(() => void flushRef.current(), 300) }
  }, [])
  useEffect(() => { flushRef.current = flush }, [flush])

  const persist = useCallback((next: AppData) => {
    latest.current = next
    if (modeRef.current === 'demo') { store.set(DEMO_KEY, JSON.stringify(next)); return }
    if (modeRef.current === 'cloud') {
      // Keep a copy on the device too, so the shop still opens without internet.
      store.set(CACHE_KEY, JSON.stringify({ shop: shopRef.current, data: next }))
      setSyncState('saving')
      clearTimeout(timer.current)
      timer.current = setTimeout(() => void flush(), 400)
    }
  }, [flush])

  const startDemo = useCallback(() => {
    store.set(MODE_KEY, 'demo')
    const d = loadDemo()
    modeRef.current = 'demo'
    latest.current = d
    undoStack.current = []
    setUndoLabel(undefined)
    setShop(null)
    setData(d)
    setMode('demo')
  }, [])

  const signedIn = useCallback(async (s: ShopInfo) => {
    store.del(MODE_KEY)
    const res = await fetch('/api/data', { cache: 'no-store' })
    if (!res.ok) throw new Error('Could not load your shop. Try again.')
    enterCloud(await res.json() as AppData, s)
  }, [enterCloud])

  const leaveDemo = useCallback(() => {
    store.del(MODE_KEY)
    modeRef.current = 'signedOut'
    setData(null)
    setMode('signedOut')
  }, [])

  const signOut = useCallback(async () => {
    if (modeRef.current === 'cloud') await flush()
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    store.del(MODE_KEY)
    store.del(CACHE_KEY)
    modeRef.current = 'signedOut'
    shopRef.current = null
    setShop(null)
    setData(null)
    setMode('signedOut')
  }, [flush])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const params = new URLSearchParams(window.location.search)
      if (params.get('demo') === '1' || store.get(MODE_KEY) === 'demo') { if (!cancelled) startDemo(); return }
      try {
        const me = await fetch('/api/auth/me', { cache: 'no-store' }).then(r => r.json()) as { shop: ShopInfo | null }
        if (cancelled) return
        if (!me.shop) { modeRef.current = 'signedOut'; setMode('signedOut'); return }
        await signedIn(me.shop)
      } catch {
        // Offline: show the last copy from this device and save when the connection is back.
        const cached = store.get(CACHE_KEY)
        if (cached && !cancelled) {
          const { shop: s, data: d } = JSON.parse(cached) as { shop: ShopInfo; data: AppData }
          enterCloud(d, s)
          setSyncState('offline')
        } else if (!cancelled) { modeRef.current = 'signedOut'; setMode('signedOut') }
      }
    })()
    const online = () => void flush()
    window.addEventListener('online', online)
    return () => { cancelled = true; window.removeEventListener('online', online) }
  }, [startDemo, signedIn, enterCloud, flush])

  // Warn before closing the tab while changes are still being saved.
  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (modeRef.current === 'cloud' && latest.current !== synced.current) e.preventDefault()
    }
    window.addEventListener('beforeunload', onLeave)
    return () => window.removeEventListener('beforeunload', onLeave)
  }, [])

  const update = useCallback((label: string, fn: (d: AppData) => AppData) => {
    const prev = latest.current
    if (!prev) return
    undoStack.current.push({ label, data: prev })
    if (undoStack.current.length > 30) undoStack.current.shift()
    const next = fn(prev)
    setData(next)
    persist(next)
    setUndoLabel(label)
  }, [persist])

  const undo = useCallback((): string | undefined => {
    const entry = undoStack.current.pop()
    if (!entry) return undefined
    setData(entry.data)
    persist(entry.data)
    setUndoLabel(undoStack.current.at(-1)?.label)
    return entry.label
  }, [persist])

  return { data, mode, shop, syncState, update, undo, undoLabel, startDemo, leaveDemo, signedIn, signOut }
}
