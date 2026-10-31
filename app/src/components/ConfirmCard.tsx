'use client'

import { useId, useState } from 'react'
import type { AppData, Draft, DraftItem, Garment, Unit } from '@/types'
import { ALL_GARMENTS, GARMENT_FIELDS, garmentLabel, measureLabel } from '@/parser/vocab'
import { matchCustomer, previousMeasurements, validateDraft, type Issue } from '@/parser/validate'
import { normalizeScript, numberize, tokenize } from '@/parser/numbers'
import { daysBetween, formatDay, fromISO } from '@/parser/dates'
import { fmtMeasure, fmtNum, formatPhone, fromUnit, rupees, toUnit } from '@/parser/format'
import { useLang, localeOf } from '@/i18n'
import { GarmentDiagram } from './GarmentDiagram'
import { describeDraft } from '@/lib/describe'
import { speak } from '@/lib/speak'

function parseNum(s: string): number | undefined {
  const t = numberize(tokenize(normalizeScript(s.replace(',', '.'))))
  return t.length && t[0].n !== undefined ? t[0].n : undefined
}

function NumberField({ id, label, value, unit, issue, extra, changed, onChange, big = true, placeholder }: {
  id: string; label: string; value?: number; unit?: Unit; issue?: Issue; extra?: React.ReactNode; changed?: boolean
  onChange: (v: number | undefined) => void; big?: boolean; placeholder?: string
}) {
  const show = (v?: number) => (v === undefined ? '' : unit ? fmtMeasure(v, unit) : String(v))
  const [text, setText] = useState(show(value))
  // Re-sync when the value changes from outside (e.g. a spoken correction).
  const [synced, setSynced] = useState({ value, unit })
  if (synced.value !== value || synced.unit !== unit) {
    setSynced({ value, unit })
    setText(show(value))
  }
  const msgId = `${id}-msg`
  const cls = ['field', value === undefined && !issue ? 'is-empty' : '', issue?.level === 'missing' ? 'is-missing' : '', issue?.level === 'warn' ? 'is-warn' : '', changed ? 'just-changed' : ''].join(' ')
  return (
    <div className={cls}>
      <label className="label" htmlFor={id}><span>{label}</span>{unit && <span aria-hidden="true">{unit}</span>}</label>
      <input
        id={id} className={`input ${big ? 'm-input' : ''}`} inputMode="decimal" autoComplete="off" value={text}
        placeholder={value === undefined ? placeholder : undefined}
        aria-invalid={issue?.level === 'warn' || issue?.level === 'missing' ? true : undefined}
        aria-describedby={issue || extra ? msgId : undefined}
        onChange={e => setText(e.target.value)}
        onBlur={() => {
          const n = text.trim() === '' ? undefined : parseNum(text)
          if (n === undefined && text.trim() !== '') { setText(show(value)); return }
          const inches = n === undefined ? undefined : unit ? fromUnit(n, unit) : n
          if (inches !== value) onChange(inches)
        }}
        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
      />
      {(issue || extra) && (
        <span id={msgId} className={`field-msg ${issue ? issue.level : 'was'}`}>
          {issue?.message}{issue && extra ? ' ' : ''}{extra}
        </span>
      )}
    </div>
  )
}

/**
 * The confirmation card. Kept to what a tailor checks every time (customer, garment, measurements,
 * date, money). Everything else sits under "More details", which opens by itself when it has content.
 */
export function ConfirmCard({ draft, data, today, changes, question, onChange, onSave, onDiscard }: {
  draft: Draft
  data: AppData
  today: Date
  changes?: string[]
  question?: string
  onChange: (d: Draft) => void
  onSave: (again: boolean) => void
  onDiscard: () => void
}) {
  const { t, lang } = useLang()
  const uid = useId()
  const unit = data.settings.unit
  const issues = validateDraft(draft, { today, customers: data.customers, orders: data.orders, lang })
  const issueFor = (field: string) => issues.find(i => i.field === field && i.level !== 'info') ?? issues.find(i => i.field === field)
  const missing = issues.filter(i => i.level === 'missing')
  const warns = issues.filter(i => i.level === 'warn')
  const match = matchCustomer(draft, data.customers)
  const changedKeys = new Set((changes ?? []).map(c => c.split(' ')[0].toLowerCase()))
  const fmtDate = (iso: string, o: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleDateString(localeOf(lang), o)

  const set = (patch: Partial<Draft>) => onChange({ ...draft, ...patch })
  const setItem = (i: number, patch: Partial<DraftItem>) =>
    onChange({ ...draft, items: draft.items.map((it, k) => (k === i ? { ...it, ...patch } : it)) })
  const setMeasure = (i: number, key: string, v: number | undefined) => {
    const it = draft.items[i]
    const m = { ...it.measurements }
    if (v === undefined) delete m[key]; else m[key] = v
    setItem(i, { measurements: m, unclear: it.unclear.filter(k => k !== key), cmSpoken: it.cmSpoken.filter(k => k !== key) })
  }
  const [diagramOpen, setDiagramOpen] = useState<Record<number, boolean>>({})
  const [shownKeys, setShownKeys] = useState<Record<number, string[]>>({})
  const [speaking, setSpeaking] = useState(false)
  const hasExtras = !!(draft.kind === 'alteration' || draft.trialDate || draft.fabric || draft.notes.length || draft.items.some(it => it.style))
  const [moreOpen, setMoreOpen] = useState(hasExtras)
  const editing = draft.editingOrderId ? data.orders.find(o => o.id === draft.editingOrderId) : undefined
  const summary = describeDraft(draft, unit, lang)

  const readAloud = () => {
    try {
      const synth = window.speechSynthesis
      if (speaking) { synth.cancel(); setSpeaking(false); return }
      speak(summary, lang, true)
      setSpeaking(true)
      const done = setInterval(() => { if (!synth.speaking) { setSpeaking(false); clearInterval(done) } }, 400)
    } catch { setSpeaking(false) }
  }
  const balance = draft.total !== undefined ? draft.total - draft.advance : undefined
  const dueDays = draft.dueDate ? daysBetween(today, fromISO(draft.dueDate)) : undefined

  return (
    <section className="panel card" aria-labelledby={`${uid}-title`}>
      <div className="card-head">
        <h2 id={`${uid}-title`}>{editing ? t('card.edit', { n: editing.number }) : t('card.check')}</h2>
        <div className="issues-summary">
          {draft.kind === 'alteration' && <span className="badge b-warn">{t('card.alteration')}</span>}
          {match.customer && <span className="badge b-info">{t('card.existing')}</span>}
          {missing.length > 0 && <span className="badge b-warn">{t('card.missing', { n: missing.length })}</span>}
          {warns.length > 0 && <span className="badge b-danger">{t('card.toCheck', { n: warns.length })}</span>}
          {!missing.length && !warns.length && <span className="badge b-ok">{t('card.complete')}</span>}
        </div>
      </div>

      <div className="card-body">
        <div aria-live="polite" className="sr-only">
          {changes?.length ? t('card.changed', { list: changes.join('. ') }) : ''}{question ?? ''}
        </div>
        {changes && changes.length > 0 && <p className="changes">✓ {changes.join(' · ')}</p>}
        {question && <p className="question" role="alert">{question}</p>}

        <div className="summary-box">
          <p>{summary}</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={readAloud} aria-pressed={speaking}>
            {speaking ? t('card.stopReading') : t('card.readAloud')}
          </button>
        </div>

        {/* 1. Customer */}
        <div className="section">
          <h3>{t('card.customer')}</h3>
          <div className="grid-2">
            <div className={`field ${issueFor('name')?.level === 'missing' ? 'is-missing' : ''} ${changedKeys.has('name') ? 'just-changed' : ''}`}>
              <label className="label" htmlFor={`${uid}-name`}>{t('card.name')}</label>
              <input id={`${uid}-name`} className="input" value={draft.name ?? ''} placeholder={t('card.namePh')} autoComplete="off"
                aria-invalid={issueFor('name') ? true : undefined}
                onChange={e => set({ name: e.target.value, customerId: undefined, forceNewCustomer: undefined })} />
              {issueFor('name') && <span className="field-msg missing">{issueFor('name')!.message}</span>}
            </div>
            <div className={`field ${issueFor('phone') ? 'is-warn' : ''}`}>
              <label className="label" htmlFor={`${uid}-phone`}>{t('card.phone')}</label>
              <input id={`${uid}-phone`} className="input num" inputMode="tel" autoComplete="off" value={draft.phone ? formatPhone(draft.phone) : ''}
                placeholder="98765 43210"
                onChange={e => { const d = e.target.value.replace(/\D/g, '').slice(-10); set({ phone: d || undefined, customerId: undefined, forceNewCustomer: undefined }) }} />
              {issueFor('phone') && <span className="field-msg warn">{issueFor('phone')!.message}</span>}
            </div>
          </div>
          {match.conflict && (
            <div className="customer-match" role="group" aria-label={t('card.dupLabel')}>
              <span>{t('card.dupText', { phone: formatPhone(match.conflict.phone), name: match.conflict.name })}</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => set({ customerId: match.conflict!.id, name: match.conflict!.name })}>{t('card.dupYes', { name: match.conflict.name })}</button>
              <button type="button" className="btn btn-quiet btn-sm" onClick={() => set({ forceNewCustomer: true })}>{t('card.dupNo')}</button>
            </div>
          )}
          {match.customer && (
            <p className="hint" style={{ marginTop: 8 }}>
              {t('card.savingTo', {
                name: match.customer.name,
                phone: match.customer.phone ? ` (${formatPhone(match.customer.phone)})` : '',
                date: fmtDate(match.customer.createdAt, { month: 'short', year: 'numeric' }),
              })}
            </p>
          )}
        </div>

        {/* 2. Garments and measurements */}
        {draft.items.map((it, i) => {
          const prev = match.customer && it.garment ? previousMeasurements(match.customer.id, it.garment, data.orders) : undefined
          const gIssue = issueFor(`garment.${i}`)
          const all = [...new Set([...(it.garment ? GARMENT_FIELDS[it.garment] : []), ...Object.keys(it.measurements), ...it.unclear])]
          const blank = Object.keys(it.measurements).length === 0 && draft.kind !== 'alteration'
          // Show what was said; the rest of the standard fields sit behind small "+ Hip" buttons to keep the card calm.
          const keys = blank ? all : all.filter(k => it.measurements[k] !== undefined || it.unclear.includes(k) || shownKeys[i]?.includes(k) || prev?.measurements[k] !== undefined)
          const hidden = all.filter(k => !keys.includes(k))
          return (
            <div className="section" key={i}>
              <h3>
                {draft.items.length > 1 ? t('card.garmentNofM', { i: i + 1, n: draft.items.length }) : t('card.garment')}
                {prev && <span className="badge b-info">{t('card.lastMeasured', { date: fmtDate(prev.date, { day: 'numeric', month: 'short', year: 'numeric' }) })}</span>}
              </h3>
              <div className="item-block">
                <div className="item-head">
                  <div className={`field ${gIssue ? 'is-missing' : ''}`}>
                    <label className="label" htmlFor={`${uid}-g${i}`}>{t('card.garment')}</label>
                    <select id={`${uid}-g${i}`} className="select" value={it.garment ?? ''} aria-invalid={gIssue ? true : undefined}
                      onChange={e => setItem(i, { garment: (e.target.value || undefined) as Garment | undefined })}>
                      <option value="">{t('card.choose')}</option>
                      {ALL_GARMENTS.map(g => <option key={g} value={g}>{garmentLabel(g, lang)}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label className="label" htmlFor={`${uid}-q${i}`}>{t('card.qty')}</label>
                    <div className="stepper">
                      <button type="button" aria-label={t('card.oneLess')} onClick={() => setItem(i, { quantity: Math.max(1, it.quantity - 1) })}>−</button>
                      <input id={`${uid}-q${i}`} className="input num" inputMode="numeric" value={it.quantity}
                        onChange={e => { const n = parseInt(e.target.value, 10); setItem(i, { quantity: Number.isFinite(n) && n > 0 ? n : 1 }) }} />
                      <button type="button" aria-label={t('card.oneMore')} onClick={() => setItem(i, { quantity: it.quantity + 1 })}>+</button>
                    </div>
                  </div>
                  <div className="field">
                    <label className="label" htmlFor={`${uid}-f${i}`}>{t('card.fit')}</label>
                    <input id={`${uid}-f${i}`} className="input" value={it.fit ?? ''} placeholder={t('card.fitPh')} list={`${uid}-fits`}
                      onChange={e => setItem(i, { fit: e.target.value || undefined })} />
                  </div>
                  {draft.items.length > 1 && (
                    <button type="button" className="btn btn-quiet btn-sm" onClick={() => set({ items: draft.items.filter((_, k) => k !== i) })}>{t('card.remove')}</button>
                  )}
                </div>
                {gIssue && <span className="field-msg missing">{gIssue.message}</span>}
                <div className={`item-grid ${diagramOpen[i] && it.garment ? 'with-diagram' : ''}`}>
                  <div className="fields">
                    {keys.map(key => {
                      const v = it.measurements[key]
                      const before = prev?.measurements[key]
                      const label = measureLabel(key, it.garment, lang)
                      const extra = before !== undefined && v !== undefined && before !== v
                        ? t('card.was', { v: fmtMeasure(before, unit), date: fmtDate(prev!.date, { day: 'numeric', month: 'short' }) })
                        : before !== undefined && v === undefined ? t('card.lastTime', { v: fmtMeasure(before, unit) }) : undefined
                      return (
                        <NumberField key={key} id={`${uid}-m${i}-${key}`} label={label} value={v} unit={unit} placeholder={t('card.notTaken')}
                          issue={issueFor(`m.${i}.${key}`)} extra={extra} changed={changedKeys.has(label.toLowerCase())}
                          onChange={nv => setMeasure(i, key, nv)} />
                      )
                    })}
                  </div>
                  {diagramOpen[i] && it.garment && (
                    <GarmentDiagram garment={it.garment} measurements={it.measurements} unclear={it.unclear} unit={unit} title={t('card.diagram', { garment: garmentLabel(it.garment, lang) })} />
                  )}
                </div>
                <div className="item-foot">
                  {hidden.length > 0 && (
                    <div className="add-fields" role="group" aria-label={t('card.addField')}>
                      {hidden.map(k => (
                        <button key={k} type="button" className="chip chip-sm" onClick={() => {
                          setShownKeys({ ...shownKeys, [i]: [...(shownKeys[i] ?? []), k] })
                          setTimeout(() => document.getElementById(`${uid}-m${i}-${k}`)?.focus(), 0)
                        }}>+ {measureLabel(k, it.garment, lang)}</button>
                      ))}
                    </div>
                  )}
                  {it.garment && (
                    <button type="button" className="btn btn-ghost btn-sm" aria-expanded={!!diagramOpen[i]} onClick={() => setDiagramOpen({ ...diagramOpen, [i]: !diagramOpen[i] })}>
                      {diagramOpen[i] ? t('card.hideDiagram') : t('card.showDiagram')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div>
          <button type="button" className="btn btn-quiet btn-sm" onClick={() => set({ items: [...draft.items, { quantity: 1, measurements: {}, unclear: [], cmSpoken: [] }] })}>
            {t('card.addGarment')}
          </button>
        </div>
        <datalist id={`${uid}-fits`}>{['slim', 'regular', 'loose', 'comfortable', 'tight'].map(f => <option key={f} value={f} />)}</datalist>

        {/* 3. Delivery and money */}
        <div className="section">
          <h3>{t('card.delivery')}</h3>
          <div className="fields" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
            <div className={`field ${issueFor('dueDate')?.level === 'missing' ? 'is-missing' : issueFor('dueDate') ? 'is-warn' : ''} ${changedKeys.has('delivery') || changedKeys.has('डिलीवरी') ? 'just-changed' : ''}`}>
              <label className="label" htmlFor={`${uid}-due`}>{t('card.dueDate')}</label>
              <input id={`${uid}-due`} type="date" className="input" value={draft.dueDate ?? ''}
                aria-describedby={`${uid}-due-msg`}
                onChange={e => set({ dueDate: e.target.value || undefined, dueSaid: undefined })} />
              <span id={`${uid}-due-msg`} className={`field-msg ${issueFor('dueDate')?.level ?? 'was'}`}>
                {issueFor('dueDate')?.message ?? (draft.dueDate && <>
                  {formatDay(draft.dueDate, { weekday: 'long', day: 'numeric', month: 'long' }, lang)}
                  {dueDays !== undefined && ` · ${dueDays === 0 ? t('card.today') : dueDays === 1 ? t('card.tomorrow') : t('card.inDays', { n: dueDays })}`}
                  {draft.dueSaid && <> · {t('card.youSaid', { text: draft.dueSaid })}</>}
                </>)}
              </span>
            </div>
            <NumberField id={`${uid}-total`} label={t('card.total')} value={draft.total} big={false} onChange={v => set({ total: v })}
              extra={draft.total === undefined ? t('card.totalHint') : undefined} />
            <NumberField id={`${uid}-adv`} label={t('card.advance')} value={draft.advance} big={false} issue={issueFor('advance')} onChange={v => set({ advance: v ?? 0 })} />
            <div className="field">
              <span className="label">{t('card.balance')}</span>
              <div className="input num" style={{ display: 'flex', alignItems: 'center', fontWeight: 700, background: 'var(--sunk)', borderColor: 'var(--line)' }} aria-live="polite">
                {balance === undefined ? '—' : rupees(Math.max(0, balance))}
              </div>
            </div>
          </div>
        </div>

        {/* 4. More details: only when needed */}
        <details className="more" open={moreOpen} onToggle={e => setMoreOpen((e.target as HTMLDetailsElement).open)}>
          <summary><span>{t('card.more')}</span> <span className="hint">{t('card.moreHint')}</span></summary>
          <div className="more-body">
            <div className="segmented" role="group" aria-label={t('card.orderType')}>
              <button type="button" aria-pressed={draft.kind !== 'alteration'} onClick={() => set({ kind: undefined })}>{t('card.typeStitch')}</button>
              <button type="button" aria-pressed={draft.kind === 'alteration'} onClick={() => set({ kind: 'alteration' })}>{t('card.typeAlter')}</button>
            </div>
            <div className="field" style={{ maxWidth: 280 }}>
              <label className="label" htmlFor={`${uid}-trial`}>{t('card.trial')}</label>
              <input id={`${uid}-trial`} type="date" className="input" value={draft.trialDate ?? ''} onChange={e => set({ trialDate: e.target.value || undefined })} />
              {draft.trialDate && <span className="field-msg was">{formatDay(draft.trialDate, { weekday: 'long', day: 'numeric', month: 'long' }, lang)}</span>}
            </div>
            <div>
              <span className="label" id={`${uid}-fab`}>{t('card.fabric')}</span>
              <div className="segmented" role="group" aria-labelledby={`${uid}-fab`}>
                <button type="button" aria-pressed={draft.fabric?.from === 'customer' && draft.fabric.received !== false} onClick={() => set({ fabric: { ...draft.fabric, from: 'customer', received: true } })}>{t('card.fabGave')}</button>
                <button type="button" aria-pressed={draft.fabric?.from === 'customer' && draft.fabric.received === false} onClick={() => set({ fabric: { ...draft.fabric, from: 'customer', received: false } })}>{t('card.fabPending')}</button>
                <button type="button" aria-pressed={draft.fabric?.from === 'shop'} onClick={() => set({ fabric: { ...draft.fabric, from: 'shop', received: true } })}>{t('card.fabShop')}</button>
              </div>
              {draft.fabric && (
                <input aria-label={t('card.fabDetail')} className="input" style={{ marginTop: 8 }} placeholder={t('card.fabDetailPh')} value={draft.fabric.detail ?? ''}
                  onChange={e => set({ fabric: { ...draft.fabric!, detail: e.target.value || undefined } })} />
              )}
            </div>
            {draft.items.map((it, i) => it.garment && (
              <div className="field" key={i}>
                <label className="label" htmlFor={`${uid}-s${i}`}>{t('card.style')}{draft.items.length > 1 ? ` · ${garmentLabel(it.garment, lang)}` : ''}</label>
                <input id={`${uid}-s${i}`} className="input" value={it.style ?? ''} list={`${uid}-styles-${it.garment}`}
                  placeholder={STYLE_HINT[it.garment]} onChange={e => setItem(i, { style: e.target.value || undefined })} />
                <datalist id={`${uid}-styles-${it.garment}`}>{(STYLES[it.garment] ?? []).map(x => <option key={x} value={x} />)}</datalist>
              </div>
            ))}
            <div className="field">
              <label className="label" htmlFor={`${uid}-notes`}>{draft.kind === 'alteration' ? t('card.notesAlter') : t('card.notes')}</label>
              <textarea id={`${uid}-notes`} className="textarea" rows={2} value={draft.notes.join('\n')} placeholder={t('card.notesPh')}
                onChange={e => set({ notes: e.target.value ? e.target.value.split('\n') : [] })} />
            </div>
          </div>
        </details>

        {draft.unmatched.length > 0 && (
          <p className="unmatched">{t('card.notUnderstood', { words: draft.unmatched.join(' ') })}</p>
        )}
        <p className="said">{t('card.said')} <q>{draft.rawText}</q></p>
      </div>

      <div className="card-foot">
        <button type="button" className="btn btn-primary btn-lg" onClick={() => onSave(false)}>{editing ? t('card.saveChanges') : t('card.save')}</button>
        {!editing && <button type="button" className="btn btn-ghost btn-lg" onClick={() => onSave(true)}>{t('card.saveAnother')}</button>}
        <button type="button" className="btn btn-quiet btn-lg" onClick={onDiscard}>{t('card.discard')}</button>
        {missing.length > 0 && <span className="hint">{t('card.needed')}</span>}
      </div>
    </section>
  )
}

const STYLES: Partial<Record<Garment, string[]>> = {
  shirt: ['button-down collar', 'Chinese collar', 'cutaway collar', 'one pocket', 'two pockets', 'no pocket', 'French cuff', 'half sleeves'],
  kurta: ['Chinese collar', 'round neck', 'side pockets', 'side slits', 'short kurta', 'pathani'],
  trouser: ['single pleat', 'flat front', 'belt loops', 'side pockets', 'back pocket', 'turn-up bottom'],
  blouse: ['round neck', 'boat neck', 'deep back', 'sweetheart neck', 'padded', 'hooks at back', 'zip at side', 'sleeveless', 'elbow sleeves'],
  suit: ['single breasted', 'double breasted', 'two buttons', 'notch lapel', 'peak lapel', 'side vents'],
  salwar: ['patiala', 'churidar', 'straight', 'elastic waist', 'drawstring'],
  sherwani: ['Chinese collar', 'embroidered', 'side slits'],
  lehenga: ['can-can', 'lining', 'side zip', 'latkans'],
}
const STYLE_HINT: Record<Garment, string> = {
  shirt: 'button-down collar, one pocket', kurta: 'Chinese collar, side pockets', trouser: 'flat front, belt loops',
  pyjama: 'elastic waist', salwar: 'patiala, drawstring', blouse: 'boat neck, padded, hooks at back',
  suit: 'two buttons, notch lapel', blazer: 'two buttons, notch lapel', waistcoat: 'five buttons',
  jacket: 'bandhgala', sherwani: 'Chinese collar, embroidered', lehenga: 'can-can, lining', dress: 'A-line, side zip',
}

export { fmtNum, toUnit }
