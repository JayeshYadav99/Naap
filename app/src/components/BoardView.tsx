'use client'

import { useState } from 'react'
import type { AppData, Order, Status } from '@/types'
import { STATUSES } from '@/types'
import { useLang } from '@/i18n'
import { statusKey } from './ui'
import { daysBetween, formatDay, fromISO } from '@/parser/dates'
import { itemsText } from '@/lib/messages'
import { formatPhone } from '@/parser/format'
import { BalanceText } from './ui'

export function BoardView({ data, today, update, go, toast }: {
  data: AppData
  today: Date
  update: (label: string, fn: (d: AppData) => AppData) => void
  go: (h: string) => void
  toast: (m: string, undoable?: boolean) => void
}) {
  const { t, lang } = useLang()
  const S = (s: Status) => t(statusKey(s))
  const [q, setQ] = useState('')
  const [showDelivered, setShowDelivered] = useState(false)
  const byId = new Map(data.customers.map(c => [c.id, c]))
  const query = q.trim().toLowerCase()
  const digits = query.replace(/\D/g, '')

  const matches = (o: Order) => {
    if (!query) return true
    if (/^#?\d{1,4}$/.test(query)) return o.number === +query.replace('#', '')
    const c = byId.get(o.customerId)
    return !!c && (c.name.toLowerCase().includes(query) || (digits.length >= 3 && !!c.phone?.includes(digits)) || itemsText(o.items).includes(query))
  }
  const move = (o: Order, to: Status) => {
    const name = byId.get(o.customerId)?.name ?? ''
    update(t('cust.statusChange', { name, status: S(to) }), d => ({ ...d, orders: d.orders.map(x => (x.id === o.id ? { ...x, status: to, statusChangedAt: new Date().toISOString() } : x)) }))
    toast(t('board.moved', { name, status: S(to) }), true)
  }
  const cols = STATUSES.filter(s => showDelivered || s !== 'delivered')

  return (
    <>
      <div className="view-head">
        <h1 className="view-title" tabIndex={-1}>{t('nav.orders')}</h1>
        <span className="hint">{t('board.open', { n: data.orders.filter(o => o.status !== 'delivered').length })}</span>
      </div>
      <div className="board-tools">
        <label className="sr-only" htmlFor="board-q">{t('board.searchLabel')}</label>
        <input id="board-q" className="input" type="search" placeholder={t('board.search')} value={q} onChange={e => setQ(e.target.value)} />
        <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center', minHeight: 48 }}>
          <input type="checkbox" checked={showDelivered} onChange={e => setShowDelivered(e.target.checked)} style={{ width: 22, height: 22 }} />
          {t('board.showDelivered')}
        </label>
      </div>
      <div className="board-scroll" tabIndex={0} aria-label={t('board.scroll')}>
        <div className="board" style={{ '--cols': cols.length } as React.CSSProperties}>
          {cols.map(s => {
            const list = data.orders.filter(o => o.status === s && matches(o)).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
            const idx = STATUSES.indexOf(s)
            return (
              <section className="col" key={s} aria-labelledby={`col-${s}`}>
                <h2 id={`col-${s}`}>{S(s)} <span className="count">{list.length}</span></h2>
                {list.length === 0 && <p className="empty">{t('board.none')}</p>}
                {list.map(o => {
                  const c = byId.get(o.customerId)
                  const n = daysBetween(today, fromISO(o.dueDate))
                  const late = n < 0 && s !== 'delivered'
                  return (
                    <article className={`ocard ${late ? 'late' : ''}`} key={o.id} aria-label={`${c?.name}, ${itemsText(o.items, lang)}`}>
                      <button type="button" className="who" onClick={() => go(`#customer/${o.customerId}/${o.id}`)}><span className="token">#{o.number}</span> {c?.name ?? t('due.unknown')}</button>
                      {o.kind === 'alteration' && <span className="badge b-warn" style={{ alignSelf: 'flex-start' }}>{t('card.alteration')}</span>}
                      {o.fabric?.from === 'customer' && o.fabric.received === false && <span className="badge b-danger" style={{ alignSelf: 'flex-start' }}>{t('board.fabricNot')}</span>}
                      <span className="meta num">{itemsText(o.items, lang)}</span>
                      <span className="meta num">{late ? <strong style={{ color: 'var(--danger)' }}>{n === -1 ? t('due.late1') : t('due.lateN', { n: -n })}</strong> : t('board.due', { date: formatDay(o.dueDate, undefined, lang) })}{c?.phone ? ` · ${formatPhone(c.phone)}` : ''}</span>
                      <BalanceText order={o} />
                      <div className="moves">
                        {idx > 0 && <button type="button" className="btn btn-quiet btn-sm" onClick={() => move(o, STATUSES[idx - 1])} aria-label={t('board.moveBack', { name: c?.name ?? '', status: S(STATUSES[idx - 1]) })}>← {S(STATUSES[idx - 1])}</button>}
                        {idx < STATUSES.length - 1 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(o, STATUSES[idx + 1])} aria-label={t('board.moveTo', { name: c?.name ?? '', status: S(STATUSES[idx + 1]) })}>{S(STATUSES[idx + 1])} →</button>}
                      </div>
                    </article>
                  )
                })}
              </section>
            )
          })}
        </div>
      </div>
    </>
  )
}
