'use client'

import { useState } from 'react'
import type { AppData, Customer, Garment, Order } from '@/types'
import { STATUSES } from '@/types'
import { GARMENT_FIELDS, garmentLabel, measureLabel } from '@/parser/vocab'
import { localeOf, useLang, type Lang } from '@/i18n'
import { formatDay } from '@/parser/dates'
import { fmtMeasure, formatPhone, rupees } from '@/parser/format'
import { balanceOf, itemsText } from '@/lib/messages'
import { findCustomers } from '@/parser'
import { MessagePanel } from './MessagePanel'
import { BalanceText, Icon, StatusChip, statusKey } from './ui'

const fmtDateL = (iso: string, lang: Lang) => new Date(iso).toLocaleDateString(localeOf(lang), { day: 'numeric', month: 'short', year: 'numeric' })

export function CustomersView({ data, go }: { data: AppData; go: (h: string) => void }) {
  const { t, lang } = useLang()
  const [q, setQ] = useState('')
  const list = (q.trim() ? findCustomers(q, data.customers) : [...data.customers]).sort((a, b) => a.name.localeCompare(b.name))
  const lastOrder = (c: Customer) => data.orders.filter(o => o.customerId === c.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  return (
    <>
      <div className="view-head">
        <h1 className="view-title" tabIndex={-1}>{t('nav.customers')}</h1>
        <span className="hint">{t('cust.count', { n: data.customers.length })}</span>
      </div>
      <div className="board-tools">
        <label className="sr-only" htmlFor="cust-q">{t('cust.searchLabel')}</label>
        <input id="cust-q" className="input" type="search" placeholder={t('cust.search')} value={q} onChange={e => setQ(e.target.value)} autoFocus />
      </div>
      {list.length === 0 ? <p className="empty">{t('cust.none', { q })}</p> : (
        <ul className="cust-list">
          {list.map(c => {
            const o = lastOrder(c)
            return (
              <li key={c.id}>
                <a className="cust-row" href={`#customer/${c.id}`} onClick={e => { e.preventDefault(); go(`#customer/${c.id}`) }}>
                  <span className="n">{c.name}</span>
                  <span className="hint num">{c.phone ? formatPhone(c.phone) : t('res.noPhone')}</span>
                  {o && <span className="hint">{itemsText(o.items, lang)} · {t(statusKey(o.status))}</span>}
                </a>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

/** Latest measurements per garment, with what they were the time before. */
function measurementHistory(customerId: string, orders: Order[]) {
  const mine = orders.filter(o => o.customerId === customerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const byGarment = new Map<Garment, { date: string; m: Record<string, number> }[]>()
  for (const o of mine) for (const it of o.items) {
    if (!Object.keys(it.measurements).length) continue
    const arr = byGarment.get(it.garment) ?? []
    arr.push({ date: o.createdAt, m: it.measurements })
    byGarment.set(it.garment, arr)
  }
  return byGarment
}

export function CustomerPage({ data, today, customerId, openOrderId, update, go, toast, onNewOrder, onEditOrder }: {
  data: AppData
  today: Date
  customerId?: string
  openOrderId?: string
  update: (label: string, fn: (d: AppData) => AppData) => void
  go: (h: string) => void
  toast: (m: string, undoable?: boolean) => void
  onNewOrder: (c: Customer, from?: Order) => void
  onEditOrder: (o: Order) => void
}) {
  const { t, lang } = useLang()
  const fmtDate = (iso: string) => fmtDateL(iso, lang)
  const S = (st: Order['status']) => t(statusKey(st))
  const c = data.customers.find(x => x.id === customerId)
  const [editingCustomer, setEditingCustomer] = useState(false)
  const [custForm, setCustForm] = useState({ name: '', phone: '' })
  const [msgFor, setMsgFor] = useState<string | undefined>()
  const [pay, setPay] = useState<Record<string, string>>({})
  const [confirmDelete, setConfirmDelete] = useState<string | undefined>()
  if (!c) return (<><h1 className="view-title" tabIndex={-1}>{t('cust.notFound')}</h1><p><a href="#customers">{t('cust.back')}</a></p></>)

  const unit = data.settings.unit
  const orders = data.orders.filter(o => o.customerId === c.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const history = measurementHistory(c.id, data.orders)
  const outstanding = orders.reduce((s, o) => s + (balanceOf(o) ?? 0), 0)
  const lastMeasured = orders.find(o => o.items.some(it => Object.keys(it.measurements).length))
  const monthsSince = lastMeasured ? Math.floor((today.getTime() - new Date(lastMeasured.createdAt).getTime()) / (30 * 86400000)) : 0
  const updateOrder = (o: Order, patch: Partial<Order>, label: string) =>
    update(label, d => ({ ...d, orders: d.orders.map(x => (x.id === o.id ? { ...x, ...patch } : x)) }))

  return (
    <>
      <div className="view-head">
        <div>
          <p className="hint"><a href="#customers">{t('nav.customers')}</a> / {c.name}</p>
          <h1 className="view-title" tabIndex={-1}>{c.name}</h1>
          <p className="hint num">{c.phone ? formatPhone(c.phone) : t('cust.noPhoneSaved')} · {t('cust.since', { date: fmtDate(c.createdAt) })}
            {' '}<button type="button" className="btn btn-quiet btn-sm" onClick={() => { setCustForm({ name: c.name, phone: c.phone ?? '' }); setEditingCustomer(!editingCustomer) }} aria-expanded={editingCustomer}>{t('cust.editNamePhone')}</button>
          </p>
          {editingCustomer && (
            <form className="row-actions" style={{ alignItems: 'end', marginTop: 8 }} onSubmit={e => {
              e.preventDefault()
              const name = custForm.name.trim()
              const phone = custForm.phone.replace(/\D/g, '').slice(-10) || undefined
              if (!name) { toast(t('cust.nameEmpty')); return }
              const clash = phone && data.customers.find(x => x.id !== c.id && x.phone === phone)
              if (clash) { toast(t('cust.phoneClash', { phone: formatPhone(phone), name: clash.name })); return }
              update(t('cust.edited', { name: c.name }), d => ({ ...d, customers: d.customers.map(x => (x.id === c.id ? { ...x, name, phone } : x)) }))
              setEditingCustomer(false); toast(t('cust.updated'), true)
            }}>
              <div className="field"><label className="label" htmlFor="ec-name">{t('card.name')}</label><input id="ec-name" className="input" value={custForm.name} onChange={e => setCustForm({ ...custForm, name: e.target.value })} /></div>
              <div className="field"><label className="label" htmlFor="ec-phone">{t('card.phone')}</label><input id="ec-phone" className="input num" inputMode="tel" value={custForm.phone} onChange={e => setCustForm({ ...custForm, phone: e.target.value })} /></div>
              <button className="btn btn-primary" type="submit">{t('cust.save')}</button>
              <button className="btn btn-quiet" type="button" onClick={() => setEditingCustomer(false)}>{t('cust.cancel')}</button>
            </form>
          )}
        </div>
        <button type="button" className="btn btn-primary btn-lg" onClick={() => onNewOrder(c)}>{t('cust.newWithLast')}</button>
      </div>

      <div className="cust">
        <section className="panel" aria-labelledby="m-title">
          <h2 id="m-title" style={{ fontSize: '1.3rem' }}>{t('cust.measurements')}</h2>
          {lastMeasured && (
            <p className={`badge ${monthsSince >= 6 ? 'b-warn' : 'b-info'}`} style={{ alignSelf: 'flex-start' }}>
              {t('cust.lastMeasured', { date: fmtDate(lastMeasured.createdAt) })}{monthsSince >= 6 ? t('cust.checkChanges') : ''}
            </p>
          )}
          {history.size === 0 && <p className="empty">{t('cust.noMeasurements')}</p>}
          {[...history.entries()].map(([g, entries]) => {
            const [latest, previous] = entries
            const keys = [...new Set([...GARMENT_FIELDS[g], ...Object.keys(latest.m)])].filter(k => latest.m[k] !== undefined || previous?.m[k] !== undefined)
            return (
              <div key={g}>
                <h3 className="eyebrow" style={{ marginBottom: 6 }}>{garmentLabel(g, lang)} · {fmtDate(latest.date)} · {unit === 'cm' ? t('cust.cm') : t('cust.inches')}</h3>
                <div className="mtable-wrap">
                  <table className="mtable">
                    <thead><tr><th scope="col">{t('cust.part')}</th><th scope="col">{t('cust.now')}</th><th scope="col">{previous ? t('cust.beforeDate', { date: fmtDate(previous.date) }) : t('cust.before')}</th></tr></thead>
                    <tbody>
                      {keys.map(k => {
                        const now = latest.m[k], before = previous?.m[k]
                        const diff = now !== undefined && before !== undefined ? Math.round((now - before) * 100) / 100 : undefined
                        return (
                          <tr key={k}>
                            <th scope="row" style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '1rem', color: 'var(--ink)' }}>{measureLabel(k, g, lang)}</th>
                            <td className="n">{now !== undefined ? fmtMeasure(now, unit) : '—'}</td>
                            <td>
                              {before !== undefined ? fmtMeasure(before, unit) : <span className="hint">{t('cust.notTaken')}</span>}
                              {diff ? <span className="delta"> {diff > 0 ? '+' : '−'}{fmtMeasure(Math.abs(diff), unit)}</span> : null}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
          <div>
            <label className="label" htmlFor="cust-notes">{t('cust.notes')}</label>
            <textarea id="cust-notes" className="textarea" rows={2} defaultValue={c.notes ?? ''} placeholder={t('cust.notesPh')}
              onBlur={e => { if (e.target.value !== (c.notes ?? '')) update(t('cust.notesFor', { name: c.name }), d => ({ ...d, customers: d.customers.map(x => (x.id === c.id ? { ...x, notes: e.target.value } : x)) })) }} />
          </div>
        </section>

        <section className="panel" aria-labelledby="o-title">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <h2 id="o-title" style={{ fontSize: '1.3rem' }}>{t('cust.orders')}</h2>
            <span className={`badge ${outstanding ? 'b-danger' : 'b-ok'}`}>{outstanding ? t('cust.balance', { amount: rupees(outstanding) }) : t('cust.nothingOwed')}</span>
          </div>
          {orders.map(o => (
            <details className="order-detail" key={o.id} open={o.id === openOrderId || (!openOrderId && o === orders[0])}>
              <summary>
                <span><strong><span className="token">#{o.number}</span> {o.kind === 'alteration' ? t('due.alteration') : ''}{itemsText(o.items, lang)}</strong><br /><span className="hint num">{t('cust.due', { date: formatDay(o.dueDate, { day: 'numeric', month: 'short', year: 'numeric' }, lang) })}</span></span>
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}><StatusChip status={o.status} /><BalanceText order={o} /></span>
              </summary>
              <div className="field">
                <label className="label" htmlFor={`st-${o.id}`}>{t('cust.status')}</label>
                <select id={`st-${o.id}`} className="select" value={o.status}
                  onChange={e => { const s = e.target.value as Order['status']; updateOrder(o, { status: s, statusChangedAt: new Date().toISOString() }, t('cust.statusChange', { name: c.name, status: S(s) })); toast(t('cust.movedTo', { status: S(s) }), true); if (s === 'ready') setMsgFor(o.id) }}>
                  {STATUSES.map(s => <option key={s} value={s}>{S(s)}</option>)}
                </select>
              </div>
              {o.items.map((it, i) => (
                <div key={i}>
                  <p className="eyebrow">{it.quantity} × {garmentLabel(it.garment, lang)}{it.fit ? ` · ${t('cust.fitSuffix', { fit: it.fit })}` : ''}{it.style ? ` · ${it.style}` : ''}</p>
                  <p className="num">{Object.entries(it.measurements).map(([k, v]) => `${measureLabel(k, it.garment, lang)} ${fmtMeasure(v, unit)}`).join(' · ') || t('cust.noM')}</p>
                </div>
              ))}
              <dl className="kv num">
                <dt>{t('cust.total')}</dt><dd>{o.total !== undefined ? rupees(o.total) : t('cust.notSet')}</dd>
                <dt>{t('cust.paid')}</dt><dd>{rupees(o.advance)}</dd>
                <dt>{t('cust.balanceL')}</dt><dd>{balanceOf(o) !== undefined ? rupees(balanceOf(o)!) : '—'}</dd>
                {o.trialDate && (<><dt>{t('cust.trial')}</dt><dd>{formatDay(o.trialDate, { weekday: 'short', day: 'numeric', month: 'short' }, lang)}</dd></>)}
                {o.fabric && (<><dt>{t('cust.fabric')}</dt><dd>{o.fabric.from === 'shop' ? t('cust.fabShop') : o.fabric.received === false ? t('cust.fabNot') : t('cust.fabRec')}{o.fabric.detail ? ` · ${o.fabric.detail}` : ''}
                  {o.fabric.from === 'customer' && o.fabric.received === false && <> <button type="button" className="btn btn-quiet btn-sm" onClick={() => updateOrder(o, { fabric: { ...o.fabric!, received: true } }, t('cust.fabReceivedFor', { n: o.number }))}>{t('cust.markReceived')}</button></>}</dd></>)}
                {o.notes && (<><dt>{o.kind === 'alteration' ? t('cust.work') : t('cust.notesL')}</dt><dd style={{ fontWeight: 400 }}>{o.notes}</dd></>)}
              </dl>
              <form className="row-actions" style={{ alignItems: 'end' }} onSubmit={e => {
                e.preventDefault()
                const n = parseFloat(pay[o.id] ?? '')
                if (!Number.isFinite(n) || n <= 0) { toast(t('cust.enterAmount')); return }
                updateOrder(o, { advance: o.advance + n, payments: [...(o.payments ?? []), { amount: n, at: new Date().toISOString() }] }, t('cust.paymentFrom', { amount: rupees(n), name: c.name }))
                setPay({ ...pay, [o.id]: '' })
                toast(t('cust.added', { amount: rupees(n) }), true)
              }}>
                <div className="field" style={{ maxWidth: 180 }}>
                  <label className="label" htmlFor={`pay-${o.id}`}>{t('cust.payment')}</label>
                  <input id={`pay-${o.id}`} className="input num" inputMode="numeric" value={pay[o.id] ?? ''} onChange={e => setPay({ ...pay, [o.id]: e.target.value })} />
                </div>
                <button className="btn btn-ghost" type="submit">{t('cust.addPayment')}</button>
                {o.total === undefined && (
                  <button type="button" className="btn btn-quiet" onClick={() => {
                    const n = parseFloat(pay[o.id] ?? '')
                    if (!Number.isFinite(n) || n <= 0) { toast(t('cust.typeTotal')); return }
                    updateOrder(o, { total: n }, t('cust.totalFor', { name: c.name })); setPay({ ...pay, [o.id]: '' }); toast(t('cust.totalSet', { amount: rupees(n) }), true)
                  }}>{t('cust.setTotal')}</button>
                )}
              </form>
              <div className="row-actions">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => onEditOrder(o)}>{t('cust.editOrder')}</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMsgFor(msgFor === o.id ? undefined : o.id)}><Icon.whatsapp /> {t('cust.message')}</button>
                <a className="btn btn-ghost btn-sm" href={`#print/${o.id}/slip`}><Icon.print /> {t('cust.jobSlip')}</a>
                <a className="btn btn-ghost btn-sm" href={`#print/${o.id}/tag`}><Icon.print /> {t('cust.clothTag')}</a>
                <button type="button" className="btn btn-quiet btn-sm" onClick={() => onNewOrder(c, o)}>{t('cust.repeat')}</button>
                {confirmDelete === o.id ? (
                  <>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => { update(t('cust.deletedOrderFor', { name: c.name }), d => ({ ...d, orders: d.orders.filter(x => x.id !== o.id) })); setConfirmDelete(undefined); toast(t('cust.orderDeleted'), true) }}>{t('cust.yesDelete')}</button>
                    <button type="button" className="btn btn-quiet btn-sm" onClick={() => setConfirmDelete(undefined)}>{t('cust.keep')}</button>
                  </>
                ) : <button type="button" className="btn btn-quiet btn-sm" onClick={() => setConfirmDelete(o.id)}>{t('cust.delete')}</button>}
              </div>
              {msgFor === o.id && <MessagePanel order={o} customer={c} settings={data.settings} initial={o.status === 'ready' ? 'ready' : (balanceOf(o) ?? 0) > 0 && o.status === 'delivered' ? 'balance' : 'reminder'} onToast={toast} />}
              <p className="said">{t('cust.said')} <q>{o.rawText}</q></p>
            </details>
          ))}
          <div className="row-actions">
            <button type="button" className="btn btn-quiet" onClick={() => go('#today')}>{t('cust.backToday')}</button>
            {confirmDelete === 'customer' ? (
              <>
                <span>{t('cust.deleteQ', { name: c.name, n: orders.length })}</span>
                <button type="button" className="btn btn-danger" onClick={() => { update(t('cust.deleted', { name: c.name }), d => ({ ...d, customers: d.customers.filter(x => x.id !== c.id), orders: d.orders.filter(o => o.customerId !== c.id) })); toast(t('cust.deleted', { name: c.name }), true); go('#customers') }}>{t('cust.yesDelete')}</button>
                <button type="button" className="btn btn-quiet" onClick={() => setConfirmDelete(undefined)}>{t('cust.keep')}</button>
              </>
            ) : <button type="button" className="btn btn-quiet" onClick={() => setConfirmDelete('customer')}>{t('cust.deleteCustomer')}</button>}
          </div>
        </section>
      </div>
    </>
  )
}
