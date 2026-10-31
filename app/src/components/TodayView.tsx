'use client'

import { useEffect, useRef, useState } from 'react'
import type { AppData, Customer, Draft, Order, Status } from '@/types'
import { findCustomers, interpret, type Command, type DueFilter } from '@/parser'
import { validateDraft } from '@/parser/validate'
import { balanceOf, buildMessage, itemsText, whatsappLink } from '@/lib/messages'
import { formatPhone, rupees } from '@/parser/format'
import { addDays, formatDay, toISO } from '@/parser/dates'
import { nextOrderNumber } from '@/store/useAppData'
import { garmentLabel } from '@/parser/vocab'
import { LANGS, useLang, type Key, type Lang } from '@/i18n'
import { ConfirmCard } from './ConfirmCard'
import { DueList } from './DueList'
import { MessagePanel } from './MessagePanel'
import { statusKey } from './ui'
import type { Result } from './TailorApp'

type Sample = { label: string; text: string; when: 'idle' | 'card' }
const SAMPLES: Record<Lang, Sample[]> = {
  en: [
    { when: 'idle', label: 'Rohan shirt order', text: 'Rohan Mehta, 98765 43210, shirt, chest 38, waist 32, shoulder 17, sleeve 24, length 29, collar 15 and a half, slim fit, two shirts, delivery next Friday, advance 500.' },
    { when: 'idle', label: 'ready Rohan', text: 'ready Rohan' },
    { when: 'idle', label: 'what’s due this week', text: "what's due this week" },
    { when: 'idle', label: 'Hinglish kurta', text: 'Pooja kurta seena chautis kamar battis lambai byalis, aasteen saadhe bees, parso, advance 500' },
    { when: 'idle', label: 'kurta chest 140', text: 'kurta chest 140' },
    { when: 'idle', label: 'today’s summary', text: "today's summary" },
    { when: 'idle', label: 'who still owes money', text: 'who still owes money' },
    { when: 'card', label: 'collar is 15, not 15½', text: 'collar is 15, not 15 and a half' },
    { when: 'card', label: 'make delivery Saturday', text: 'make delivery Saturday' },
    { when: 'card', label: 'advance 1000', text: 'advance 1000' },
  ],
  hi: [
    { when: 'idle', label: 'Rohan का शर्ट ऑर्डर', text: 'Rohan Mehta, 98765 43210, शर्ट, सीना 38, कमर 32, कंधा 17, बाजू 24, लंबाई 29, गला साढ़े 15, स्लिम फिटिंग, दो शर्ट, शुक्रवार डिलीवरी, एडवांस 500' },
    { when: 'idle', label: 'Rohan का ऑर्डर तैयार है', text: 'Rohan का ऑर्डर तैयार है' },
    { when: 'idle', label: 'इस हफ़्ते क्या ड्यू है', text: 'इस हफ़्ते क्या ड्यू है' },
    { when: 'idle', label: 'Pooja कुर्ता', text: 'Pooja कुर्ता सीना चौंतीस कमर बत्तीस लंबाई बयालीस, आस्तीन साढ़े बीस, परसों, एडवांस 500' },
    { when: 'idle', label: 'कुर्ता सीना 140', text: 'कुर्ता सीना 140' },
    { when: 'idle', label: 'आज का हिसाब', text: 'आज का हिसाब' },
    { when: 'idle', label: 'किसका पैसा बाकी है', text: 'किसका पैसा बाकी है' },
    { when: 'card', label: 'गला 15', text: 'गला 15' },
    { when: 'card', label: 'डिलीवरी शनिवार', text: 'डिलीवरी शनिवार' },
    { when: 'card', label: 'एडवांस 1000', text: 'एडवांस 1000' },
  ],
}

const DEBOUNCE_MS = 1200

// Minimal typing for the browser speech API (Chrome, Edge, Android Chrome; partly Safari).
interface SpeechRec {
  lang: string; continuous: boolean; interimResults: boolean
  start(): void; stop(): void
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}
type SpeechCtor = new () => SpeechRec
function speechCtor(): SpeechCtor | undefined {
  if (typeof window === 'undefined') return undefined
  const w = window as unknown as { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

const MicIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </svg>
)

export function TodayView({ data, today, result, setResult, update, undo, toast, go }: {
  data: AppData
  today: Date
  result: Result | null
  setResult: (r: Result | null) => void
  update: (label: string, fn: (d: AppData) => AppData) => void
  undo: () => string | undefined
  toast: (msg: string, undoable?: boolean) => void
  go: (hash: string) => void
}) {
  const { t, lang } = useLang()
  const [text, setText] = useState('')
  const [status, setStatus] = useState<{ msg: string; busy?: boolean }>({ msg: '' })
  const [filter, setFilter] = useState<DueFilter>('all')
  const [listening, setListening] = useState(false)
  const [canSpeak] = useState(() => !!speechCtor())
  const boxRef = useRef<HTMLTextAreaElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const recRef = useRef<SpeechRec | null>(null)
  const heard = useRef('')
  const silence = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const openDraft = result?.type === 'card' ? result.draft : undefined
  const day = (iso: string) => formatDay(iso, undefined, lang)
  const items = (o: Order) => itemsText(o.items, lang)

  useEffect(() => { boxRef.current?.focus() }, [])
  useEffect(() => () => { clearTimeout(timer.current); clearTimeout(silence.current); recRef.current?.stop() }, [])

  const ordersOf = (c: Customer) => data.orders.filter(o => o.customerId === c.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const latestOpen = (c: Customer, prefer?: (o: Order) => boolean) => {
    const open = ordersOf(c).filter(o => o.status !== 'delivered')
    return (prefer && open.find(prefer)) ?? open[0]
  }

  function setStatusOf(order: Order, s: Status) {
    update(`${t(statusKey(s))}: ${data.customers.find(c => c.id === order.customerId)?.name}`, d => ({
      ...d, orders: d.orders.map(o => (o.id === order.id ? { ...o, status: s, statusChangedAt: new Date().toISOString() } : o)),
    }))
  }

  function runOnOrder(cmd: Command, c: Customer, order: Order) {
    if (cmd.kind === 'status') {
      setStatusOf(order, cmd.status)
      const updated = { ...order, status: cmd.status }
      if (cmd.status === 'ready') {
        setResult({ type: 'message', order: updated, customer: c, msgType: 'ready', headline: t('res.readyHead', { n: order.number, name: c.name, items: items(order) }) })
      } else {
        setResult({ type: 'info', tone: 'ok', title: t('res.moved', { n: order.number, name: c.name, items: items(order), status: t(statusKey(cmd.status)) }), body: t('res.sayUndo') })
      }
      return
    }
    if (cmd.kind === 'remind') {
      setResult({ type: 'message', order, customer: c, msgType: order.status === 'ready' ? 'ready' : 'reminder', headline: t('res.msgFor', { name: c.name, n: order.number }) })
      return
    }
    if (cmd.kind === 'show') { setResult(null); go(`#customer/${c.id}/${order.id}`) }
  }

  function runCommand(cmd: Command, chosen?: Customer) {
    if (cmd.kind === 'undo') {
      const label = undo()
      setResult({ type: 'info', tone: label ? 'ok' : 'muted', title: label ? t('toast.undone', { label }) : t('res.nothingToUndo') })
      return
    }
    if (cmd.kind === 'due') {
      setFilter(cmd.filter)
      setResult({ type: 'info', tone: 'info', title: t('res.showing', { what: t(`due.${cmd.filter}L` as Key) }), body: t('res.noOrderCreated') })
      document.getElementById('due-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    if (cmd.kind === 'help') { setResult(null); go('#help'); return }
    if (cmd.kind === 'summary') { setResult({ type: 'summary' }); return }
    if (cmd.kind === 'owed') { setResult({ type: 'orderList', variant: 'owed' }); return }
    if (cmd.kind === 'readyList') { setResult({ type: 'orderList', variant: 'ready' }); return }
    if (cmd.kind === 'trials') { setResult({ type: 'orderList', variant: 'trials' }); return }
    if (cmd.kind === 'fabricPending') { setResult({ type: 'orderList', variant: 'fabric' }); return }
    if (cmd.kind === 'stats') { setResult({ type: 'stats', period: cmd.period }); return }

    // "ready 47": a token number goes straight to that order.
    const numMatch = cmd.who.match(/^#?(\d+)$/)
    if (numMatch && !chosen) {
      const order = data.orders.find(o => o.number === +numMatch[1])
      const c = order && data.customers.find(x => x.id === order.customerId)
      if (!order || !c) { setResult({ type: 'info', tone: 'warn', title: t('res.noOrderNum', { n: numMatch[1] }) }); return }
      if (order.status === 'delivered' && cmd.kind === 'status' && cmd.status !== 'delivered') {
        setResult({ type: 'info', tone: 'warn', title: t('res.alreadyDelivered', { n: order.number, name: c.name }), body: t('res.alreadyDeliveredBody') })
        return
      }
      return runOnOrder(cmd, c, order)
    }
    const matches = chosen ? [chosen] : findCustomers(cmd.who, data.customers)
    if (!matches.length) {
      setResult({ type: 'info', tone: 'warn', title: t('res.noCustomer', { who: cmd.who }), body: t('res.noCustomerBody') })
      return
    }
    if (matches.length > 1) {
      setResult({ type: 'choice', command: cmd, customers: matches })
      return
    }
    const c = matches[0]
    if (cmd.kind === 'show') { setResult(null); go(`#customer/${c.id}`); return }
    if (cmd.kind === 'phone') { setResult({ type: 'phone', customer: c }); return }
    if (cmd.kind === 'lastOrder') {
      const last = ordersOf(c)[0]
      if (!last) { setResult({ type: 'info', tone: 'warn', title: t('q.noOrders', { name: c.name }) }); return }
      setResult(null); go(`#customer/${c.id}/${last.id}`); return
    }

    if (cmd.kind === 'status' || cmd.kind === 'remind') {
      const garment = cmd.garment
      const open = ordersOf(c).filter(o => o.status !== 'delivered' && (!garment || o.items.some(it => it.garment === garment)))
      if (!open.length) {
        setResult({ type: 'info', tone: 'warn', title: garment ? t('res.noOpenG', { name: c.name, garment: garmentLabel(garment, lang).toLowerCase() }) : t('res.noOpen', { name: c.name }) })
        return
      }
      const notYet = cmd.kind === 'status' ? open.filter(o => o.status !== cmd.status) : open
      // Several open orders: ask which one instead of guessing.
      if (notYet.length > 1) { setResult({ type: 'pickOrder', command: cmd, customer: c, orders: notYet }); return }
      return runOnOrder(cmd, c, notYet[0] ?? open[0])
    }

    if (cmd.kind === 'balance') {
      setResult({ type: 'balance', customer: c })
      return
    }
    if (cmd.kind === 'paid') {
      const order = latestOpen(c, o => (balanceOf(o) ?? 0) > 0) ?? ordersOf(c)[0]
      if (!order) { setResult({ type: 'info', tone: 'warn', title: t('res.noOrders', { name: c.name }) }); return }
      update(t('cust.paymentFrom', { amount: rupees(cmd.amount), name: c.name }), d => ({
        ...d, orders: d.orders.map(o => (o.id === order.id ? { ...o, advance: o.advance + cmd.amount, payments: [...(o.payments ?? []), { amount: cmd.amount, at: new Date().toISOString() }] } : o)),
      }))
      const bal = balanceOf({ ...order, advance: order.advance + cmd.amount })
      setResult({
        type: 'info', tone: 'ok', title: t('res.received', { amount: rupees(cmd.amount), name: c.name }),
        body: bal === undefined ? t('res.totalNotSet') : bal === 0 ? t('res.fullyPaid') : t('res.balanceNow', { amount: rupees(bal) }),
      })
    }
  }

  function read(raw = text) {
    clearTimeout(timer.current)
    const value = raw.trim()
    if (!value) { setStatus({ msg: '' }); return }
    const r = interpret(value, { today, unit: data.settings.unit, openDraft, lang })
    switch (r.kind) {
      case 'command':
        runCommand(r.command)
        setStatus({ msg: t('status.done') })
        break
      case 'order':
        setResult({ type: 'card', draft: r.draft })
        setStatus({ msg: t('status.checkCard') })
        break
      case 'correction':
        setResult({ type: 'card', draft: r.draft, changes: r.changes, question: r.question })
        setStatus({ msg: r.question ? t('status.oneQuestion') : t('status.corrected') })
        break
      case 'question':
        if (openDraft) setResult({ type: 'card', draft: openDraft, question: r.message })
        setStatus({ msg: r.message })
        break
      case 'nothing':
        if (!openDraft) setResult({ type: 'info', tone: 'muted', title: r.message })
        setStatus({ msg: '' })
        break
    }
    setText('')
  }

  function onType(v: string) {
    setText(v)
    clearTimeout(timer.current)
    if (!v.trim()) { setStatus({ msg: '' }); return }
    if (listening) return
    setStatus({ msg: t('status.listening'), busy: true })
    timer.current = setTimeout(() => read(v), DEBOUNCE_MS)
  }

  // Browser microphone: text lands in the same box and goes through the same card.
  function stopMic() {
    clearTimeout(silence.current)
    recRef.current?.stop()
  }
  function startMic() {
    const Ctor = speechCtor()
    if (!Ctor) return
    clearTimeout(timer.current)
    const rec = new Ctor()
    rec.lang = LANGS.find(l => l.code === lang)!.speech
    rec.continuous = true
    rec.interimResults = true
    heard.current = ''
    const base = text.trim() ? text.trim() + ' ' : ''
    rec.onresult = e => {
      let finals = '', interim = ''
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) finals += r[0].transcript; else interim += r[0].transcript
      }
      heard.current = (base + finals).trim()
      setText((base + finals + interim).trim())
      // Stop by itself after a short pause, like Flow does when you release the key.
      clearTimeout(silence.current)
      silence.current = setTimeout(() => rec.stop(), 2500)
    }
    rec.onerror = e => {
      setStatus({ msg: e.error === 'not-allowed' || e.error === 'service-not-allowed' ? t('mic.denied') : t('mic.error') })
    }
    rec.onend = () => {
      setListening(false)
      recRef.current = null
      clearTimeout(silence.current)
      const said = heard.current
      if (said) read(said)
    }
    try {
      rec.start()
      recRef.current = rec
      setListening(true)
      setStatus({ msg: t('mic.listening'), busy: true })
    } catch {
      setStatus({ msg: t('mic.error') })
    }
  }

  function saveDraft(draft: Draft, again: boolean) {
    const issues = validateDraft(draft, { today, customers: data.customers, orders: data.orders, lang })
    const blocker = issues.find(i => i.level === 'missing' && (i.field === 'name' || i.field.startsWith('garment') || i.field === 'dueDate'))
    if (blocker) {
      toast(blocker.message)
      document.querySelector<HTMLElement>('.card .is-missing input, .card .is-missing select')?.focus()
      return
    }
    const name = draft.name!.trim()
    let customerId = draft.customerId
    if (!customerId && !draft.forceNewCustomer) {
      customerId = (draft.phone && data.customers.find(c => c.phone === draft.phone && c.name.toLowerCase() === name.toLowerCase())?.id)
        || data.customers.find(c => c.name.toLowerCase() === name.toLowerCase() && (!draft.phone || !c.phone || c.phone === draft.phone))?.id
    }
    const now = new Date().toISOString()
    const orderItems = draft.items.filter(it => it.garment).map(it => ({ garment: it.garment!, quantity: it.quantity, fit: it.fit, measurements: it.measurements, style: it.style }))
    const editing = draft.editingOrderId ? data.orders.find(o => o.id === draft.editingOrderId) : undefined
    if (editing) {
      update(t('save.edited', { n: editing.number }), d => ({
        ...d,
        customers: d.customers.map(c => (c.id === editing.customerId ? { ...c, name, phone: draft.phone ?? c.phone } : c)),
        orders: d.orders.map(o => (o.id === editing.id ? { ...o, dueDate: draft.dueDate!, trialDate: draft.trialDate, items: orderItems, total: draft.total, advance: draft.advance, notes: draft.notes.join('\n') || undefined, fabric: draft.fabric, kind: draft.kind } : o)),
      }))
      toast(t('save.edited', { n: editing.number }), true)
      setResult(null)
      setStatus({ msg: '' })
      go(`#customer/${editing.customerId}/${editing.id}`)
      return
    }
    const isNew = !customerId
    const cid = customerId ?? `c-${Date.now().toString(36)}`
    const order: Order = {
      id: `o-${Date.now().toString(36)}`, customerId: cid, createdAt: now, dueDate: draft.dueDate!, trialDate: draft.trialDate,
      status: 'new', number: nextOrderNumber(data), kind: draft.kind, fabric: draft.fabric, items: orderItems,
      total: draft.total, advance: draft.advance, notes: draft.notes.join('\n') || undefined, rawText: draft.rawText,
    }
    const msg = t('save.saved', { n: order.number, name, items: items(order), date: day(order.dueDate) })
    update(msg, d => ({
      ...d,
      customers: isNew
        ? [...d.customers, { id: cid, name, phone: draft.phone, createdAt: now }]
        : d.customers.map(c => (c.id === cid && draft.phone && !c.phone ? { ...c, phone: draft.phone } : c)),
      orders: [...d.orders, order],
    }))
    toast(msg, true)
    setResult(null)
    setStatus({ msg: again ? t('status.savedNext') : '' })
    boxRef.current?.focus()
  }

  return (
    <div className="today">
      <div className="today-main">
        <section className="panel entry" aria-labelledby="entry-label">
          <div className="tape" aria-hidden="true" />
          <div className="entry-body">
            <label id="entry-label" className="entry-label" htmlFor="entry">
              {openDraft ? t('entry.sayCorrection') : t('entry.say')}
            </label>
            <div className="entry-row">
              <textarea
                id="entry" ref={boxRef} className="entry-box" value={text} rows={3} lang={lang}
                placeholder={openDraft ? t('entry.placeholderCard') : t('entry.placeholder')}
                aria-describedby="entry-help entry-status"
                onChange={e => onType(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); read() } }}
              />
              {canSpeak && (
                <button type="button" className="mic-btn" aria-pressed={listening} onClick={listening ? stopMic : startMic}
                  aria-label={listening ? t('mic.stop') : `${t('mic.start')}. ${t('mic.hint')}`} title={t('mic.hint')}>
                  <MicIcon />{listening ? t('mic.stop') : t('mic.start')}
                </button>
              )}
            </div>
            <div className="entry-foot">
              <p id="entry-status" className={`entry-status ${status.busy ? 'busy' : ''}`} aria-live="polite">{status.msg}</p>
              <div className="row-actions">
                <button type="button" className="btn btn-primary" onClick={() => read()} disabled={!text.trim()}>{t('entry.readNow')}</button>
              </div>
            </div>
            <p id="entry-help" className="hint">
              {t('entry.help')} {canSpeak && t('mic.hint')}
            </p>
            <div className="chips-wrap">
              <span className="eyebrow" id="try-label">{openDraft ? t('entry.tryCorrection') : t('entry.try')}</span>
              <div className="chips" role="group" aria-labelledby="try-label">
                {SAMPLES[lang].filter(s => s.when === (openDraft ? 'card' : 'idle')).map(s => (
                  <button key={s.label} type="button" className="chip" lang={lang} onClick={() => { setText(s.text); boxRef.current?.focus(); read(s.text) }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            {!openDraft && <p className="hint">{t('entry.commands')}</p>}
          </div>
        </section>

        <div aria-live="polite" aria-atomic="false">
          {result?.type === 'card' && (
            <ConfirmCard
              draft={result.draft} data={data} today={today} changes={result.changes} question={result.question}
              onChange={d => setResult({ type: 'card', draft: d })}
              onSave={again => saveDraft(result.draft, again)}
              onDiscard={() => { setResult(null); setStatus({ msg: t('status.discarded') }); boxRef.current?.focus() }}
            />
          )}
          {result?.type === 'message' && (
            <MessagePanel order={result.order} customer={result.customer} settings={data.settings} initial={result.msgType} headline={result.headline} onToast={toast} />
          )}
          {result?.type === 'info' && (
            <div className={`result panel tone-${result.tone}`} role={result.tone === 'warn' ? 'alert' : 'status'}>
              <h2>{result.title}</h2>
              {result.body && <p>{result.body}</p>}
            </div>
          )}
          {result?.type === 'choice' && (
            <div className="result panel tone-warn">
              <h2>{t('res.which', { name: result.customers[0].name.split(' ')[0] })}</h2>
              <div className="choice-list">
                {result.customers.map(c => {
                  const last = ordersOf(c)[0]
                  return (
                    <button key={c.id} type="button" className="choice-btn" onClick={() => runCommand(result.command, c)}>
                      <span><strong>{c.name}</strong><br /><span className="hint">{c.phone ? formatPhone(c.phone) : t('res.noPhone')}</span></span>
                      <span className="hint">{last ? t('res.itemsDue', { items: items(last), date: day(last.dueDate) }) : t('res.noOrdersShort')}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          {result?.type === 'pickOrder' && (
            <div className="result panel tone-warn">
              <h2>{t('res.pickOrder', { name: result.customer.name, n: result.orders.length })}</h2>
              <div className="pick-list">
                {result.orders.map(o => (
                  <button key={o.id} type="button" className="choice-btn" onClick={() => runOnOrder(result.command, result.customer, o)}>
                    <span><strong>#{o.number} · {items(o)}</strong><br /><span className="hint">{t('board.due', { date: day(o.dueDate) })} · {t(statusKey(o.status))}</span></span>
                    <span className="hint">{t('res.sayIt', { text: `${result.command.kind === 'remind' ? 'remind' : result.command.kind === 'status' ? result.command.status : ''} ${o.number}` })}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {result?.type === 'orderList' && (() => {
            const byId = new Map(data.customers.map(c => [c.id, c]))
            const open = data.orders.filter(o => o.status !== 'delivered')
            const v = result.variant
            const todayISO = toISO(today), weekISO = toISO(addDays(today, 7))
            const list = (v === 'owed' ? data.orders.filter(o => (balanceOf(o) ?? 0) > 0)
              : v === 'ready' ? open.filter(o => o.status === 'ready')
              : v === 'trials' ? open.filter(o => o.trialDate && o.trialDate >= todayISO && o.trialDate <= weekISO)
              : open.filter(o => o.fabric?.from === 'customer' && o.fabric.received === false))
              .sort((a, b) => v === 'owed' ? (balanceOf(b) ?? 0) - (balanceOf(a) ?? 0) : (v === 'trials' ? a.trialDate!.localeCompare(b.trialDate!) : a.dueDate.localeCompare(b.dueDate)))
            const title = { owed: 'q.owedTitle', ready: 'q.readyTitle', trials: 'q.trialsTitle', fabric: 'q.fabricTitle' }[v] as Key
            const empty = { owed: 'q.owedEmpty', ready: 'q.readyEmpty', trials: 'q.trialsEmpty', fabric: 'q.fabricEmpty' }[v] as Key
            const totalOwed = v === 'owed' ? list.reduce((s, o) => s + (balanceOf(o) ?? 0), 0) : 0
            return (
              <div className="result panel tone-info">
                <h2>{t(title, { n: list.length })}</h2>
                {v === 'owed' && list.length > 0 && <p className="money due" style={{ alignSelf: 'flex-start' }}><span className="k">{t('q.owedTotal', { amount: rupees(totalOwed) })}</span></p>}
                {list.length === 0 ? <p className="hint">{t(empty)}</p> : (
                  <ul className="rows">
                    {list.map(o => {
                      const c = byId.get(o.customerId)
                      if (!c) return null
                      const msgType = v === 'owed' ? 'balance' : v === 'ready' ? 'ready' : 'reminder'
                      const msg = buildMessage(msgType, o, c, data.settings)
                      const detail = v === 'owed' ? t('bal.due', { amount: rupees(balanceOf(o) ?? 0) })
                        : v === 'trials' ? t('q.trialOn', { date: day(o.trialDate!) })
                        : t('board.due', { date: day(o.dueDate) })
                      return (
                        <li key={o.id} className="orow" style={{ cursor: 'default' }}>
                          <span>
                            <button type="button" className="who" style={{ background: 'none', border: 0, padding: 0, textDecoration: 'underline', color: 'inherit', font: 'inherit', fontWeight: 700 }} onClick={() => go(`#customer/${c.id}/${o.id}`)}>#{o.number} {c.name}</button><br />
                            <span className="what">{items(o)} · {detail}</span>
                          </span>
                          {(v === 'owed' || v === 'ready') && (
                            <a className="btn btn-ok btn-sm" href={whatsappLink(c.phone, msg, data.settings.countryCode)} target="_blank" rel="noopener noreferrer">{v === 'owed' ? t('q.sendBalance') : t('q.sendReady')}</a>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })()}
          {result?.type === 'stats' && (() => {
            const from = result.period === 'today' ? today : result.period === 'week' ? addDays(today, -6) : new Date(today.getFullYear(), today.getMonth(), 1)
            const fromISO = toISO(from)
            const inPeriod = (iso?: string) => !!iso && toISO(new Date(iso)) >= fromISO
            const taken = data.orders.filter(o => inPeriod(o.createdAt))
            const garments = taken.reduce((s, o) => s + o.items.reduce((a, it) => a + it.quantity, 0), 0)
            const value = taken.reduce((s, o) => s + (o.total ?? 0), 0)
            const firstAdvance = taken.reduce((s, o) => s + o.advance - (o.payments ?? []).reduce((a, p) => a + p.amount, 0), 0)
            const later = data.orders.reduce((s, o) => s + (o.payments ?? []).filter(p => inPeriod(p.at)).reduce((a, p) => a + p.amount, 0), 0)
            const delivered = data.orders.filter(o => o.status === 'delivered' && inPeriod(o.statusChangedAt)).length
            const head = { today: 'q.statsToday', week: 'q.statsWeek', month: 'q.statsMonth' }[result.period] as Key
            return (
              <div className="result panel tone-info">
                <h2>{t(head)}</h2>
                <div className="money-grid">
                  <div className="money"><div className="k">{t('q.orders')}</div><div className="v">{taken.length}</div></div>
                  <div className="money"><div className="k">{t('q.garments')}</div><div className="v">{garments}</div></div>
                  <div className="money"><div className="k">{t('q.value')}</div><div className="v">{rupees(value)}</div></div>
                  <div className="money"><div className="k">{t('q.received')}</div><div className="v">{rupees(firstAdvance + later)}</div></div>
                  <div className="money"><div className="k">{t('q.delivered')}</div><div className="v">{delivered}</div></div>
                </div>
              </div>
            )
          })()}
          {result?.type === 'phone' && (
            <div className="result panel tone-info">
              <h2>{result.customer.name}</h2>
              {result.customer.phone ? (
                <>
                  <p className="num" style={{ fontSize: '1.8rem', fontWeight: 700, userSelect: 'all' }}>{formatPhone(result.customer.phone)}</p>
                  <div className="row-actions">
                    <a className="btn btn-primary" href={`tel:+${data.settings.countryCode}${result.customer.phone}`}>{t('q.call')}</a>
                    <a className="btn btn-ok" href={whatsappLink(result.customer.phone, '', data.settings.countryCode)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                    <button type="button" className="btn btn-ghost" onClick={() => go(`#customer/${result.customer.id}`)}>{t('q.open')}</button>
                  </div>
                </>
              ) : <p>{t('q.phoneNone', { name: result.customer.name })}</p>}
            </div>
          )}
          {result?.type === 'summary' && (() => {
            const todayISO = toISO(today)
            const tomorrowISO = toISO(addDays(today, 1))
            const isToday = (iso?: string) => !!iso && toISO(new Date(iso)) === todayISO
            const taken = data.orders.filter(o => isToday(o.createdAt))
            const firstAdvance = taken.reduce((s, o) => s + o.advance - (o.payments ?? []).reduce((a, p) => a + p.amount, 0), 0)
            const later = data.orders.reduce((s, o) => s + (o.payments ?? []).filter(p => isToday(p.at)).reduce((a, p) => a + p.amount, 0), 0)
            const delivered = data.orders.filter(o => o.status === 'delivered' && isToday(o.statusChangedAt))
            const open = data.orders.filter(o => o.status !== 'delivered')
            const dueTomorrow = open.filter(o => o.dueDate === tomorrowISO)
            const pending = open.reduce((s, o) => s + (balanceOf(o) ?? 0), 0)
            const byId = new Map(data.customers.map(c => [c.id, c]))
            return (
              <div className="result panel tone-info">
                <h2>{t('sum.title')}</h2>
                <div className="money-grid">
                  <div className="money"><div className="k">{t('sum.taken')}</div><div className="v">{taken.length}</div></div>
                  <div className="money"><div className="k">{t('sum.received')}</div><div className="v">{rupees(firstAdvance + later)}</div></div>
                  <div className="money"><div className="k">{t('sum.delivered')}</div><div className="v">{delivered.length}</div></div>
                  <div className="money due"><div className="k">{t('sum.balance')}</div><div className="v">{rupees(pending)}</div></div>
                </div>
                <h3 style={{ fontSize: '1.1rem' }}>{t('sum.dueTomorrow', { n: dueTomorrow.length })}</h3>
                {dueTomorrow.length === 0 ? <p className="hint">{t('sum.nothingTomorrow')}</p> : (
                  <ul className="rows">
                    {dueTomorrow.map(o => {
                      const c = byId.get(o.customerId)!
                      const msg = buildMessage(o.status === 'ready' ? 'ready' : 'reminder', o, c, data.settings)
                      return (
                        <li key={o.id} className="orow" style={{ cursor: 'default' }}>
                          <span><span className="who">#{o.number} {c.name}</span><br /><span className="what">{items(o)} · {t(statusKey(o.status))}</span></span>
                          <a className="btn btn-ok btn-sm" href={whatsappLink(c.phone, msg, data.settings.countryCode)} target="_blank" rel="noopener noreferrer">{t('sum.sendReminder')}</a>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })()}
          {result?.type === 'balance' && (() => {
            const orders = ordersOf(result.customer).filter(o => o.status !== 'delivered' || (balanceOf(o) ?? 0) > 0)
            const total = orders.reduce((s, o) => s + (o.total ?? 0), 0)
            const paid = orders.reduce((s, o) => s + o.advance, 0)
            const bal = orders.reduce((s, o) => s + (balanceOf(o) ?? 0), 0)
            return (
              <div className="result panel tone-info">
                <h2>{t('bal.title', { name: result.customer.name })}</h2>
                {orders.length === 0 ? <p>{t('bal.noOpen')}</p> : (
                  <div className="money-grid">
                    <div className="money"><div className="k">{t('bal.total')}</div><div className="v">{rupees(total)}</div></div>
                    <div className="money"><div className="k">{t('bal.paid')}</div><div className="v">{rupees(paid)}</div></div>
                    <div className={`money ${bal ? 'due' : ''}`}><div className="k">{t('bal.balance')}</div><div className="v">{rupees(bal)}</div></div>
                  </div>
                )}
                {orders.some(o => o.total === undefined) && <p className="hint">{t('bal.noTotalNote')}</p>}
                <div className="row-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => go(`#customer/${result.customer.id}`)}>{t('bal.openPage', { name: result.customer.name.split(' ')[0] })}</button>
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      <DueList data={data} today={today} filter={filter} onFilter={setFilter}
        onOpen={o => go(`#customer/${o.customerId}/${o.id}`)} />
    </div>
  )
}
