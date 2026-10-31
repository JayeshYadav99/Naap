'use client'

import type { AppData, Order } from '@/types'
import type { DueFilter } from '@/parser'
import { daysBetween, formatDay, fromISO } from '@/parser/dates'
import { itemsText, balanceOf } from '@/lib/messages'
import { rupees } from '@/parser/format'
import { BalanceText, StatusChip } from './ui'
import { useLang, type Key } from '@/i18n'

const GROUPS: { key: Exclude<DueFilter, 'all'> | 'later'; test: (n: number) => boolean }[] = [
  { key: 'overdue', test: n => n < 0 },
  { key: 'today', test: n => n === 0 },
  { key: 'tomorrow', test: n => n === 1 },
  { key: 'week', test: n => n > 1 && n <= 7 },
  { key: 'later', test: n => n > 7 },
]
const FILTERS: DueFilter[] = ['all', 'overdue', 'today', 'tomorrow', 'week']

export function DueList({ data, today, filter, onFilter, onOpen }: {
  data: AppData
  today: Date
  filter: DueFilter
  onFilter: (f: DueFilter) => void
  onOpen: (order: Order) => void
}) {
  const { t, lang } = useLang()
  const open = data.orders.filter(o => o.status !== 'delivered')
  const byId = new Map(data.customers.map(c => [c.id, c]))
  const days = (o: Order) => daysBetween(today, fromISO(o.dueDate))
  const weekCount = open.filter(o => days(o) >= 0 && days(o) <= 7).length
  const overdue = open.filter(o => days(o) < 0).length
  const pending = open.reduce((s, o) => s + (balanceOf(o) ?? 0), 0)
  const readyCount = open.filter(o => o.status === 'ready').length

  const visible = GROUPS.filter(g => {
    if (filter === 'all') return true
    if (filter === 'week') return g.key === 'today' || g.key === 'tomorrow' || g.key === 'week'
    return g.key === filter
  })

  return (
    <section className="panel due" aria-labelledby="due-title">
      <div className="due-head">
        <h2 id="due-title">{t('due.title')}</h2>
      </div>
      <div className="stats">
        <div className="stat"><div className="v">{weekCount}</div><div className="k">{t('due.stWeek')}</div></div>
        <div className={`stat ${overdue ? 'alert' : ''}`}><div className="v">{overdue}</div><div className="k">{t('due.stOverdue')}</div></div>
        <div className="stat"><div className="v">{readyCount}</div><div className="k">{t('due.stReady')}</div></div>
        <div className="stat"><div className="v num" style={{ fontSize: '1.2rem' }}>{rupees(pending)}</div><div className="k">{t('due.stCollect')}</div></div>
      </div>
      <div className="segmented" role="group" aria-label={t('due.filter')}>
        {FILTERS.map(f => (
          <button key={f} type="button" aria-pressed={filter === f} onClick={() => onFilter(f)}>{t(`f.${f}` as Key)}</button>
        ))}
      </div>
      {visible.map(g => {
        const list = open.filter(o => g.test(days(o))).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        return (
          <div className={`group grp-${g.key}`} key={g.key}>
            <h3 id={`grp-${g.key}`}>{t(`grp.${g.key}` as Key)} <span className="count">{list.length}</span></h3>
            {list.length === 0 ? <p className="empty">{t('due.empty')}</p> : (
              <ul className="rows" aria-labelledby={`grp-${g.key}`}>
                {list.map(o => {
                  const c = byId.get(o.customerId)
                  const n = days(o)
                  return (
                    <li key={o.id}>
                      <button type="button" className="orow" onClick={() => onOpen(o)}>
                        <span>
                          <span className="who"><span className="token">#{o.number}</span> {c?.name ?? t('due.unknown')}</span><br />
                          <span className="what num">{o.kind === 'alteration' ? t('due.alteration') : ''}{itemsText(o.items, lang)}{o.trialDate && o.trialDate >= o.createdAt.slice(0, 10) && o.status !== 'delivered' ? ` · ${t('due.trial', { date: formatDay(o.trialDate, undefined, lang) })}` : ''} · {n < 0 ? (n === -1 ? t('due.late1') : t('due.lateN', { n: -n })) : formatDay(o.dueDate, undefined, lang)}</span>
                        </span>
                        <span className="right"><StatusChip status={o.status} /><BalanceText order={o} /></span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )
      })}
    </section>
  )
}
