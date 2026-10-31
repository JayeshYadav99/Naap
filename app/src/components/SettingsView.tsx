'use client'

import { useState } from 'react'
import type { AppData, Settings } from '@/types'
import { STATUS_LABEL } from '@/types'
import { sampleData } from '@/store/sampleData'
import { parseBackup, type Mode, type ShopInfo } from '@/store/useAppData'
import { formatPhone } from '@/parser/format'
import { LANGS, useLang } from '@/i18n'
import { GARMENT_LABEL, measureLabel } from '@/parser/vocab'
import { balanceOf } from '@/lib/messages'

function csvCell(v: unknown): string {
  const s = v === undefined || v === null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function exportCsv(data: AppData) {
  const byId = new Map(data.customers.map(c => [c.id, c]))
  const rows = [['Order #', 'Customer', 'Phone', 'Garment', 'Quantity', 'Fit', 'Measurements (in)', 'Due date', 'Status', 'Total', 'Paid', 'Balance', 'Notes', 'Created', 'What was said']]
  for (const o of data.orders) {
    const c = byId.get(o.customerId)
    for (const it of o.items) {
      rows.push([
        String(o.number), c?.name ?? '', c?.phone ?? '', GARMENT_LABEL[it.garment], String(it.quantity), it.fit ?? '',
        Object.entries(it.measurements).map(([k, v]) => `${measureLabel(k, it.garment)} ${v}`).join('; '),
        o.dueDate, STATUS_LABEL[o.status], o.total?.toString() ?? '', String(o.advance), balanceOf(o)?.toString() ?? '',
        o.notes ?? '', o.createdAt.slice(0, 10), o.rawText,
      ])
    }
  }
  const blob = new Blob(['﻿' + rows.map(r => r.map(csvCell).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export function SettingsView({ data, update, toast, mode, shop, onSignOut, onLeaveDemo }: {
  data: AppData
  mode: Mode
  shop: ShopInfo | null
  onSignOut: () => Promise<void>
  onLeaveDemo: () => void
  update: (label: string, fn: (d: AppData) => AppData) => void
  toast: (m: string, undoable?: boolean) => void
}) {
  const { t, lang, setLang } = useLang()
  const [confirm, setConfirm] = useState<'reset' | 'clear' | undefined>()
  const s = data.settings
  const set = (patch: Partial<Settings>, label = t('set.changed')) => update(label, d => ({ ...d, settings: { ...d.settings, ...patch } }))
  const H = { fontSize: '1.25rem' }

  return (
    <>
      <div className="view-head"><h1 className="view-title" tabIndex={-1}>{t('nav.settings')}</h1></div>
      <div className="settings">
        <section className="panel" aria-labelledby="lang-h">
          <h2 id="lang-h" style={H}>{t('set.language')}</h2>
          <div className="segmented" role="group" aria-labelledby="lang-h">
            {LANGS.map(l => (
              <button key={l.code} type="button" lang={l.code} aria-pressed={lang === l.code} onClick={() => {
                setLang(l.code)
                // Customer messages follow the screen language unless the shop picked Hinglish.
                if (s.messageLang !== 'hinglish') set({ messageLang: l.code }, t('set.changed'))
              }}>{l.label}</button>
            ))}
          </div>
          <p className="hint">{t('set.languageHint')}</p>
        </section>

        <section className="panel" aria-labelledby="acct-h">
          <h2 id="acct-h" style={H}>{t('set.account')}</h2>
          {mode === 'cloud' && shop ? (
            <>
              <p>{t('set.signedInAs', { name: shop.name, phone: formatPhone(shop.phone) })}</p>
              <div className="row-actions"><button type="button" className="btn btn-ghost" onClick={() => void onSignOut()}>{t('set.signOut')}</button></div>
            </>
          ) : (
            <>
              <p>{t('set.demoText')}</p>
              <div className="row-actions"><button type="button" className="btn btn-primary" onClick={onLeaveDemo}>{t('demo.signIn')}</button></div>
            </>
          )}
        </section>

        <section className="panel" aria-labelledby="shop-h">
          <h2 id="shop-h" style={H}>{t('set.shop')}</h2>
          <div className="grid-2">
            <div className="field">
              <label className="label" htmlFor="shop-name">{t('set.shopName')}</label>
              <input id="shop-name" className="input" defaultValue={s.shopName} onBlur={e => e.target.value.trim() && e.target.value !== s.shopName && set({ shopName: e.target.value.trim() }, t('set.shopName'))} />
            </div>
            <div className="field">
              <label className="label" htmlFor="shop-phone">{t('set.shopPhone')}</label>
              <input id="shop-phone" className="input num" inputMode="tel" defaultValue={s.shopPhone} onBlur={e => e.target.value !== s.shopPhone && set({ shopPhone: e.target.value }, t('set.shopPhone'))} />
            </div>
          </div>
        </section>

        <section className="panel" aria-labelledby="pref-h">
          <h2 id="pref-h" style={H}>{t('set.prefs')}</h2>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="label">{t('set.unit')}</legend>
            <div className="segmented">
              {(['in', 'cm'] as const).map(u => (
                <button key={u} type="button" aria-pressed={s.unit === u} onClick={() => set({ unit: u })}>{u === 'in' ? t('set.inches') : t('set.cm')}</button>
              ))}
            </div>
            <p className="hint" style={{ marginTop: 6 }}>{t('set.unitHint')}</p>
          </fieldset>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="label">{t('set.msgLang')}</legend>
            <div className="segmented">
              <button type="button" aria-pressed={s.messageLang === 'en'} onClick={() => set({ messageLang: 'en' })}>{t('set.english')}</button>
              <button type="button" lang="hi" aria-pressed={s.messageLang === 'hi'} onClick={() => set({ messageLang: 'hi' })}>{t('set.hindi')}</button>
              <button type="button" aria-pressed={s.messageLang === 'hinglish'} onClick={() => set({ messageLang: 'hinglish' })}>{t('set.hinglish')}</button>
            </div>
          </fieldset>
          <div className="field" style={{ maxWidth: 220 }}>
            <label className="label" htmlFor="cc">{t('set.cc')}</label>
            <input id="cc" className="input num" inputMode="numeric" defaultValue={s.countryCode} onBlur={e => e.target.value !== s.countryCode && set({ countryCode: e.target.value.replace(/\D/g, '') || '91' })} />
          </div>
        </section>

        <section className="panel" aria-labelledby="data-h">
          <h2 id="data-h" style={H}>{t('set.data')}</h2>
          <p className="hint">{mode === 'cloud' ? t('set.dataCloud') : t('set.dataDemo')}</p>
          <div className="row-actions">
            <button type="button" className="btn btn-primary" onClick={() => {
              const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob); a.download = `naap-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click()
              setTimeout(() => URL.revokeObjectURL(a.href), 1000)
              toast(t('set.downloaded'))
            }}>{t('set.download')}</button>
            <label className="btn btn-ghost" htmlFor="restore-file" style={{ cursor: 'pointer' }}>{t('set.restore')}</label>
            <input id="restore-file" type="file" accept="application/json,.json" className="sr-only" onChange={async e => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (!file) return
              try {
                const restored = parseBackup(await file.text())
                update(t('set.restore'), () => restored)
                toast(t('set.restored', { c: restored.customers.length, o: restored.orders.length }), true)
              } catch {
                toast(t('set.badFile'))
              }
            }} />
            <button type="button" className="btn btn-ghost" onClick={() => { exportCsv(data); toast(t('set.csvDone')) }}>{t('set.csv')}</button>
          </div>
          <div className="row-actions" aria-live="polite">
            {confirm === 'reset' ? (
              <>
                <span>{t('set.resetQ')}</span>
                <button type="button" className="btn btn-danger" onClick={() => { update(t('set.reset'), () => sampleData()); setConfirm(undefined); toast(t('set.resetDone'), true) }}>{t('set.yesReset')}</button>
                <button type="button" className="btn btn-quiet" onClick={() => setConfirm(undefined)}>{t('set.cancel')}</button>
              </>
            ) : confirm === 'clear' ? (
              <>
                <span>{t('set.clearQ')}</span>
                <button type="button" className="btn btn-danger" onClick={() => { update(t('set.clear'), d => ({ ...d, customers: [], orders: [] })); setConfirm(undefined); toast(t('set.cleared'), true) }}>{t('set.yesClear')}</button>
                <button type="button" className="btn btn-quiet" onClick={() => setConfirm(undefined)}>{t('set.cancel')}</button>
              </>
            ) : (
              <>
                {mode === 'demo' && <button type="button" className="btn btn-ghost" onClick={() => setConfirm('reset')}>{t('set.reset')}</button>}
                <button type="button" className="btn btn-danger" onClick={() => setConfirm('clear')}>{t('set.clear')}</button>
              </>
            )}
          </div>
        </section>
      </div>
    </>
  )
}
