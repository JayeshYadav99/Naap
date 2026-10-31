'use client'

import type { AppData } from '@/types'
import { garmentLabel, measureLabel } from '@/parser/vocab'
import { localeOf, useLang } from '@/i18n'
import { formatDay } from '@/parser/dates'
import { fmtMeasure, formatPhone, rupees } from '@/parser/format'
import { balanceOf, itemsText } from '@/lib/messages'
import { Icon } from './ui'

export function PrintView({ data, orderId, kind, go }: { data: AppData; orderId?: string; kind: 'slip' | 'tag'; go: (h: string) => void }) {
  const { t, lang } = useLang()
  const o = data.orders.find(x => x.id === orderId)
  const c = o && data.customers.find(x => x.id === o.customerId)
  if (!o || !c) return <><h1 className="view-title" tabIndex={-1}>{t('print.notFound')}</h1><p><a href="#orders">{t('print.backOrders')}</a></p></>
  const s = data.settings
  const bal = balanceOf(o)
  const longDate = formatDay(o.dueDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }, lang)

  return (
    <>
      <div className="view-head no-print">
        <h1 className="view-title" tabIndex={-1}>{kind === 'slip' ? t('print.slip') : t('print.tag')}: {c.name}</h1>
        <div className="row-actions">
          <button type="button" className="btn btn-primary btn-lg" onClick={() => window.print()}><Icon.print /> {t('print.print')}</button>
          <a className="btn btn-ghost btn-lg" href={`#print/${o.id}/${kind === 'slip' ? 'tag' : 'slip'}`}>{kind === 'slip' ? t('print.tag') : t('print.slip')}</a>
          <button type="button" className="btn btn-quiet btn-lg" onClick={() => go(`#customer/${c.id}/${o.id}`)}>{t('print.back')}</button>
        </div>
      </div>
      {kind === 'slip' ? (
        <article className="print-area slip">
          <h1 style={{ fontSize: '1.6rem' }}>{s.shopName}</h1>
          <p>{s.shopPhone}</p>
          <hr />
          <p style={{ fontSize: '1.6rem', fontWeight: 800 }}>{t('print.order', { n: o.number })}</p>
          <p><strong>{t('print.customer')}</strong> {c.name}{c.phone ? ` · ${formatPhone(c.phone)}` : ''}</p>
          <p><strong>{t('print.orderDate')}</strong> {new Date(o.createdAt).toLocaleDateString(localeOf(lang), { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p style={{ fontSize: '1.3rem' }}><strong>{t('print.delivery', { date: longDate })}</strong></p>
          <table>
            <thead><tr><th>{t('print.item')}</th><th>{t('print.qty')}</th><th>{t('print.measurements', { unit: s.unit })}</th></tr></thead>
            <tbody>
              {o.items.map((it, i) => (
                <tr key={i}>
                  <td>{garmentLabel(it.garment, lang)}{it.fit ? ` (${it.fit})` : ''}{it.style ? <><br /><small>{it.style}</small></> : null}</td>
                  <td>{it.quantity}</td>
                  <td>{Object.entries(it.measurements).map(([k, v]) => `${measureLabel(k, it.garment, lang)} ${fmtMeasure(v, s.unit)}`).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: 12 }}>
            <strong>{t('print.total')}</strong> {o.total !== undefined ? rupees(o.total) : '—'} &nbsp; <strong>{t('print.advance')}</strong> {rupees(o.advance)} &nbsp; <strong>{t('print.balance')}</strong> {bal !== undefined ? rupees(bal) : '—'}
          </p>
          {o.trialDate && <p><strong>{t('print.trial')}</strong> {formatDay(o.trialDate, { weekday: 'long', day: 'numeric', month: 'long' }, lang)}</p>}
          {o.notes && <p><strong>{o.kind === 'alteration' ? t('print.alteration') : t('print.notes')}</strong> {o.notes}</p>}
          <p style={{ marginTop: 16, fontSize: '.9rem' }}>{t('print.bring')}</p>
        </article>
      ) : (
        <article className="print-area">
          <div className="cloth-tag">
            <div className="big">#{o.number}</div>
            <div className="big" style={{ fontSize: '1.6rem' }}>{c.name.toUpperCase()}</div>
            <p style={{ fontSize: '1.3rem', marginTop: 8 }}>{itemsText(o.items, lang)}</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 8 }}>{t('print.due', { date: formatDay(o.dueDate, undefined, lang) })}</p>
            {c.phone && <p>{formatPhone(c.phone)}</p>}
          </div>
        </article>
      )}
    </>
  )
}
