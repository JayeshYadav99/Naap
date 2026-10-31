import type { Draft, DraftItem } from '@/types'
import { parseOrder, type ParseOptions } from './parseOrder'
import { GARMENT_FIELDS, MEASURE_PHRASES, garmentLabel, measureLabel } from './vocab'
import { translate, type Key, type Vars } from '@/i18n/translate'
import type { Garment } from '@/types'
import { formatDay } from './dates'
import { fmtNum } from './format'
import { normalizeScript } from './numbers'

export interface CorrectionResult {
  draft: Draft
  changes: string[]
  question?: string
}

const clone = (d: Draft): Draft => ({
  ...d,
  items: d.items.map(it => ({ ...it, measurements: { ...it.measurements }, unclear: [...it.unclear], cmSpoken: [...it.cmSpoken] })),
  notes: [...d.notes],
  unmatched: [...d.unmatched],
})

function measureKeyIn(text: string): string | undefined {
  const words = text.toLowerCase().split(/[^a-z]+/).filter(Boolean)
  for (const p of MEASURE_PHRASES) {
    for (let i = 0; i < words.length; i++) if (p.words.every((w, k) => words[i + k] === w)) return p.key
  }
  return undefined
}

/** Applies a spoken correction to the open card. */
export function applyCorrection(draft: Draft, raw: string, opts: ParseOptions): CorrectionResult {
  const d = clone(draft)
  const changes: string[] = []
  const lang = opts.lang ?? 'en'
  const t = (k: Key, v?: Vars) => translate(lang, k, v)
  const g = (x: Garment) => garmentLabel(x, lang).toLowerCase()
  const day = (iso: string) => formatDay(iso, undefined, lang)
  const arrow = (from: string | number | undefined, to: string | number) => `${from !== undefined && from !== '' ? `${from} → ` : ''}${to}`
  let text = normalizeScript(raw).replace(/\b(that'?s|that is|it'?s|thats) (wrong|incorrect|galat|not right)\b[,.]?/gi, ' ')
    .replace(/\b(sorry|no no|nahi nahi|actually)\b[,.]?/gi, ' ')
  // "collar is 15, not 15 and a half" -> drop the "not ..." clause
  text = text.replace(/,?\s*\b(not|nahi|instead of)\b[^,.;]*/gi, ' ').trim()

  // Removals: "remove the fit", "no notes", "clear phone", "remove collar"
  const rm = text.match(/^\s*(?:please\s+)?(remove|delete|clear|no|hatao|hata do)\s+(?:the\s+)?(.+?)\s*$/i)
  if (rm) {
    const what = rm[2].toLowerCase()
    const items = d.items
    if (/^fit/.test(what)) { items.forEach(it => { if (it.fit) changes.push(t('c.removedFit', { fit: it.fit })); it.fit = undefined }) }
    else if (/^notes?/.test(what)) { if (d.notes.length) changes.push(t('c.removedNotes')); d.notes = [] }
    else if (/^(phone|number|mobile)/.test(what)) { if (d.phone) changes.push(t('c.removedPhone')); d.phone = undefined }
    else if (/^(total|price)/.test(what)) { if (d.total !== undefined) changes.push(t('c.removedTotal')); d.total = undefined }
    else if (/^advance/.test(what)) { if (d.advance) changes.push(t('c.advance0')); d.advance = 0 }
    else if (/^(date|delivery)/.test(what)) { if (d.dueDate) changes.push(t('c.removedDate')); d.dueDate = undefined; d.dueSaid = undefined }
    else {
      const key = measureKeyIn(what)
      if (key) items.forEach(it => { if (key in it.measurements) { changes.push(t('c.removedM', { label: measureLabel(key, it.garment, lang).toLowerCase() })); delete it.measurements[key] } })
    }
    return { draft: d, changes, question: changes.length ? undefined : t('c.nothingRemove', { what: rm[2] }) }
  }

  // Name: "name is Rohan Mehra"
  const nm = text.match(/\bname\s+(?:is\s+|should be\s+|:)?([A-Za-z\u0900-\u097F][A-Za-z\u0900-\u097F.' ]{0,40}?)\s*(?:$|[,.;])/i)
  if (nm) {
    const name = nm[1].trim().replace(/\b([a-z])/g, c => c.toUpperCase())
    if (name && name !== d.name) { changes.push(t('c.name', { change: arrow(d.name, name) })); d.name = name; d.customerId = undefined; d.forceNewCustomer = undefined }
    text = text.replace(nm[0], ' ')
  }

  const { draft: p, found } = parseOrder(text, opts)

  if (p.phone && p.phone !== d.phone) { changes.push(t('c.phone', { phone: p.phone })); d.phone = p.phone; d.customerId = undefined; d.forceNewCustomer = undefined }
  if (found.has('dueDate') && p.dueDate !== d.dueDate) { changes.push(t('c.due', { change: arrow(d.dueDate && day(d.dueDate), day(p.dueDate!)) })); d.dueDate = p.dueDate; d.dueSaid = p.dueSaid }
  if (found.has('trialDate') && p.trialDate !== d.trialDate) { changes.push(t('c.trial', { date: day(p.trialDate!) })); d.trialDate = p.trialDate }
  if (found.has('fabric')) { changes.push(t(p.fabric!.from === 'shop' ? 'c.fabShop' : p.fabric!.received ? 'c.fabRec' : 'c.fabPend')); d.fabric = p.fabric }
  if (found.has('total') && p.total !== d.total) { changes.push(t('c.total', { n: p.total! })); d.total = p.total }
  if (found.has('advance') && p.advance !== d.advance) { changes.push(t('c.advance', { change: arrow(d.advance ? `Rs ${d.advance}` : undefined, `Rs ${p.advance}`) })); d.advance = p.advance }
  if (p.notes.length) { d.notes.push(...p.notes); changes.push(t('c.note', { note: p.notes.join('; ') })) }

  for (const pi of p.items) {
    let target: DraftItem | undefined
    if (pi.garment) {
      target = d.items.find(it => it.garment === pi.garment)
      if (!target) {
        const blank = d.items.find(it => !it.garment)
        if (blank) { blank.garment = pi.garment; target = blank; changes.push(t('c.garmentSet', { g: g(pi.garment) })) }
        else if (Object.keys(pi.measurements).length || pi.quantity > 1) {
          d.items.push({ ...pi, unclear: [...pi.unclear] })
          changes.push(t('c.added', { n: pi.quantity, g: g(pi.garment) }))
          continue
        } else if (d.items.length === 1) {
          // "it's a kurta, not a shirt"
          target = d.items[0]
          changes.push(t('c.garment', { change: arrow(target.garment && g(target.garment), g(pi.garment)) }))
          target.garment = pi.garment
        }
      }
      if (target && pi.quantity !== 1 && pi.quantity !== target.quantity) {
        changes.push(t('c.qty', { change: arrow(target.quantity, pi.quantity) })); target.quantity = pi.quantity
      }
    }
    if (pi.fit) {
      const it = target ?? (d.items.length === 1 ? d.items[0] : undefined)
      if (it && it.fit !== pi.fit) { changes.push(t('c.fit', { fit: pi.fit })); it.fit = pi.fit }
      else if (!it && d.items.length > 1) d.items.forEach(x => { x.fit = pi.fit })
    }
    for (const [key, value] of Object.entries(pi.measurements)) {
      let it = target
      if (!it) {
        if (d.items.length === 1) it = d.items[0]
        else if (d.items.length === 0) { it = { quantity: 1, measurements: {}, unclear: [], cmSpoken: [] }; d.items.push(it) }
        else {
          const having = d.items.filter(x => key in x.measurements)
          const fitting = d.items.filter(x => x.garment && GARMENT_FIELDS[x.garment].includes(key))
          const pool = having.length ? having : fitting
          if (pool.length === 1) it = pool[0]
          else {
            const names = (pool.length ? pool : d.items).map(x => (x.garment ? g(x.garment) : t('c.item')))
            return {
              draft: d, changes,
              question: t('c.which', { list: names.join(t('c.or')), example: `${names[0]} ${measureLabel(key, undefined, lang).toLowerCase()} ${fmtNum(value)}` }),
            }
          }
        }
      }
      const before = it.measurements[key]
      if (before !== value) {
        changes.push(`${measureLabel(key, it.garment, lang)} ${arrow(before !== undefined ? fmtNum(before) : undefined, fmtNum(value))}`)
        it.measurements[key] = value
      }
      it.unclear = it.unclear.filter(k => k !== key)
      if (pi.cmSpoken.includes(key)) { if (!it.cmSpoken.includes(key)) it.cmSpoken.push(key) }
      else it.cmSpoken = it.cmSpoken.filter(k => k !== key)
    }
  }

  return { draft: d, changes }
}
