import type { Draft, DraftItem, Garment, Unit } from '@/types'
import { normalizeScript, numberize, tokenize, type Token } from './numbers'
import { findDate, toISO } from './dates'
import { FIT_WORDS, GARMENT_WORDS, MEASURE_PHRASES } from './vocab'

export interface ParseOptions {
  today: Date
  unit?: Unit
  lang?: 'en' | 'hi'
}

/** Pulls a 10-digit Indian mobile number out of the text, spaces and dashes allowed. */
export function extractPhone(text: string): { phone?: string; rest: string } {
  const re = /(?<![\d.])(?:\+?\s?91[\s-]*)?\d(?:[\s-]?\d){9}(?![\d.])/g
  for (const m of text.matchAll(re)) {
    let digits = m[0].replace(/\D/g, '')
    if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
    if (digits.length === 10) {
      return { phone: digits, rest: text.slice(0, m.index) + ' ' + text.slice(m.index! + m[0].length) }
    }
  }
  return { rest: text }
}

const SKIP_AFTER_KEY = new Set(['is', 'to', 'of', '-', ':', '=', 'ka', 'ki', 'ke', 'hai', 'should', 'be', 'make', 'it', 'about', 'around', 'size'])
const MONEY_SKIP = new Set(['rs', 'rupees', 'rupee', 'inr', '₹', 'of', 'is', ':', '-', '='])
const NAME_STOP = new Set([
  'customer', 'name', 'new', 'order', 'for', 'is', 'mr', 'mrs', 'ms', 'miss', 'shri', 'smt', 'sir', 'madam',
  'ka', 'ki', 'ke', 'the', 'a', 'an', 'okay', 'ok', 'so', 'please', 'and',
  'haan', 'han', 'ha', 'hmm', 'chalo', 'accha', 'achha', 'bhai', 'bhaiya', 'ji', 'toh', 'lo', 'likho', 'lakho', 'hello', 'now', 'yes',
])
const FILLER = new Set([
  'and', 'the', 'a', 'an', 'is', 'of', 'to', 'for', 'with', 'by', 'on', 'at', 'in', 'fit', 'fitting', 'delivery',
  'deliver', 'due', 'ready', 'date', 'inch', 'inches', 'in', 'piece', 'pieces', 'pcs', 'order', 'customer',
  'name', 'phone', 'number', 'mobile', 'ka', 'ki', 'ke', 'hai', 'aur', 'please', 'okay', 'ok', 'so', 'then',
  'also', 'make', 'it', 'set', 'change', 'measurements', 'measurement', 'naap', 'size', 'x', '×', 'each',
  'per', 'quantity', 'qty', 'total', 'advance', 'chahiye', 'wala', 'wali', 'new', 'one', 'not', 'that', 'this',
])

const FABRIC_WORDS = new Set(['fabric', 'cloth', 'kapda', 'kapra', 'material', 'given', 'received', 'diya', 'mila', 'own', 'apna', 'apni', 'shop', 'our', 'hamara', 'pending', 'later', 'came'])
const ALTER_WORDS = new Set(['alteration', 'alterations', 'alter', 'altering', 'repair', 'repairs', 'shorten', 'shortening', 'lengthen', 'loosen', 'tighten', 'taper', 'hem', 'hemming', 'rafu', 'darning', 'mending'])

function emptyItem(garment?: Garment): DraftItem {
  return { garment, quantity: 1, measurements: {}, unclear: [], cmSpoken: [] }
}

const titleCase = (s: string) => s.replace(/\b([a-z])/g, c => c.toUpperCase())

/** Matches a measurement phrase at position i. */
function matchMeasure(toks: Token[], i: number): { key: string; len: number } | undefined {
  for (const p of MEASURE_PHRASES) {
    if (p.words.every((w, k) => toks[i + k]?.low === w)) {
      // "neck depth" without front/back stays unclear-ish; "back length" vs "length" handled by longest-first
      return { key: p.key, len: p.words.length }
    }
  }
  return undefined
}

export function isGarmentWord(low: string) {
  return low in GARMENT_WORDS
}

export interface ParseResult {
  draft: Draft
  /** True when the text contains anything order-like (garment, measurement). */
  looksLikeOrder: boolean
  /** Token indices of fields found (used by corrections). */
  found: Set<string>
}

/**
 * Rule-based order parser. Never invents numbers: anything it can't read stays blank.
 */
export function parseOrder(rawText: string, opts: ParseOptions): ParseResult {
  const found = new Set<string>()
  const defaultUnit = opts.unit ?? 'in'
  const { phone, rest } = extractPhone(normalizeScript(rawText))
  if (phone) found.add('phone')

  const toks = numberize(tokenize(rest))
  const used = new Array(toks.length).fill(false)
  const draft: Draft = { items: [], advance: 0, notes: [], unmatched: [], rawText, phone }

  // 1. Notes: "note pocket on left" / "remarks ..." runs to the end of the clause.
  for (let i = 0; i < toks.length; i++) {
    if (/^(note|notes|remark|remarks|nb)$/.test(toks[i].low) && !used[i]) {
      used[i] = true
      let j = i + 1
      if (toks[j]?.low === ':' || toks[j]?.low === '-') { used[j] = true; j++ }
      const words: string[] = []
      while (j < toks.length && !(toks[j].punct && /[.;]/.test(toks[j].low))) {
        if (toks[j].low === ',' && words.length && isStructural(toks, j + 1)) break
        words.push(toks[j].t); used[j] = true; j++
      }
      const note = words.join(' ').replace(/\s+([,.])/g, '$1').trim()
      if (note) { draft.notes.push(note); found.add('notes') }
    }
  }

  // 2a. Trial / fitting date: "trial Tuesday", "fitting on 5 Nov".
  for (let i = 0; i < toks.length; i++) {
    if (used[i] || !/^(trial|trail|fitting)$/.test(toks[i].low)) continue
    let j = i + 1
    while (j < toks.length && /^(on|date|ka|ki|is|for)$/.test(toks[j].low)) j++
    const hit = findDate(toks.slice(j, j + 4), opts.today)
    if (hit && hit.start === 0) {
      draft.trialDate = toISO(hit.date)
      found.add('trialDate')
      for (let k = i; k < j + hit.end; k++) used[k] = true
    }
  }

  // 2b. Fabric: "own fabric", "cloth received", "shop fabric", "kapda baad mein".
  {
    const low = normalizeScript(rawText).toLowerCase()
    const CLOTH = '(fabric|cloth|kapda|kapra|material)'
    if (new RegExp(`\\b(shop|our|hamara|dukaan ka|dukan ka)\\s+${CLOTH}`).test(low)) draft.fabric = { from: 'shop', received: true }
    else if (new RegExp(`\\b${CLOTH}\\s+(pending|later|not given|baad mein|nahi aaya|will bring|aayega)`).test(low)) draft.fabric = { from: 'customer', received: false }
    else if (new RegExp(`\\b(own|apna|apni|customer'?s?|their)\\s+${CLOTH}|\\b${CLOTH}\\s+(given|received|diya|de diya|mila|aa gaya|came)`).test(low)) draft.fabric = { from: 'customer', received: true }
    if (draft.fabric) {
      found.add('fabric')
      for (let i = 0; i < toks.length; i++) if (FABRIC_WORDS.has(toks[i].low)) used[i] = true
    }
  }

  // 2c. Alterations: "pant shorten 1 inch".
  if (toks.some(t => ALTER_WORDS.has(t.low))) { draft.kind = 'alteration'; found.add('kind') }

  // 2. Delivery date.
  {
    const hit = findDate(toks.map((t, i) => (used[i] ? { ...t, low: '\u0000' } : t)), opts.today)
    if (hit) {
      draft.dueDate = toISO(hit.date)
      // Only echo the phrase if it appears as said (Hindi in Devanagari is read through Latin keywords).
      draft.dueSaid = rawText.toLowerCase().includes(hit.said.toLowerCase()) ? hit.said : undefined
      found.add('dueDate')
      for (let k = hit.start; k < hit.end; k++) used[k] = true
      // swallow "delivery"/"due"/"by" right before the date
      for (let k = hit.start - 1; k >= 0 && k >= hit.start - 2; k--) {
        if (/^(delivery|deliver|due|by|on|date|ready|trial)$/.test(toks[k].low)) used[k] = true
        else break
      }
    }
  }

  // 3. Money: advance / paid / total / price each.
  let pricePerItem: number | undefined
  for (let i = 0; i < toks.length; i++) {
    if (used[i]) continue
    const w = toks[i].low
    const isAdv = /^(advance|paid|deposit|jama|diye|received)$/.test(w)
    const isTotal = /^(total|price|stitching|charges|charge|rate|cost|amount|bill|silai|majoori|mazdoori)$/.test(w)
    if (!isAdv && !isTotal) continue
    // number after: "advance 500", "advance rs 500"
    let j = i + 1
    while (j < toks.length && (MONEY_SKIP.has(toks[j].low) || toks[j].low === 'rs.')) j++
    let numIdx = toks[j]?.n !== undefined && !used[j] ? j : -1
    // number before: "500 advance", "rs 500 advance"
    if (numIdx < 0) {
      let k = i - 1
      while (k >= 0 && MONEY_SKIP.has(toks[k].low)) k--
      if (k >= 0 && toks[k].n !== undefined && !used[k]) numIdx = k
    }
    if (numIdx < 0) continue
    const amount = toks[numIdx].n!
    let each = false
    const after = toks[numIdx + 1]?.low
    if (after === 'each' || after === 'per' || after === 'har') { each = true; used[numIdx + 1] = true; if (toks[numIdx + 2]?.low === 'piece') used[numIdx + 2] = true }
    used[i] = true; used[numIdx] = true
    for (let k = Math.min(i, numIdx); k <= Math.max(i, numIdx); k++) if (MONEY_SKIP.has(toks[k].low)) used[k] = true
    if (isAdv) { draft.advance = amount; found.add('advance') }
    else if (each) { pricePerItem = amount; found.add('total') }
    else { draft.total = amount; found.add('total') }
  }
  // "50 rupees" with no keyword is the total.
  for (let i = 0; i < toks.length - 1; i++) {
    if (!used[i] && toks[i].n !== undefined && /^(rs|rupees|rupee|₹|rupaye)$/.test(toks[i + 1].low) && draft.total === undefined && !draft.advance) {
      draft.total = toks[i].n; used[i] = used[i + 1] = true; found.add('total')
    }
  }
  // stray currency words
  for (let i = 0; i < toks.length; i++) if (/^(rs|rupees|rupee|₹|inr)$/.test(toks[i].low)) used[i] = true

  // 4. Name: "name is X", "for X", or leading words before the first known word.
  {
    const capWords = (from: number) => {
      const words: string[] = []
      let j = from
      while (j < toks.length && words.length < 4) {
        const tk = toks[j]
        if (used[j] || tk.punct || tk.n !== undefined) break
        if (isGarmentWord(tk.low) || matchMeasure(toks, j) || tk.low in FIT_WORDS || NAME_STOP.has(tk.low) || /^(delivery|advance|total|paid|note|price|shirt|ka|ki)$/.test(tk.low)) break
        words.push(tk.t); j++
      }
      return { words, end: j }
    }
    let nameHit: { start: number; end: number; words: string[] } | undefined
    for (let i = 0; i < toks.length - 1 && !nameHit; i++) {
      if (used[i]) continue
      if (toks[i].low === 'name' && toks[i + 1]) {
        let s = i + 1
        if (toks[s]?.low === 'is' || toks[s]?.low === ':') s++
        const r = capWords(s)
        if (r.words.length) nameHit = { start: i, end: r.end, words: r.words }
      } else if ((toks[i].low === 'for' || toks[i].low === 'customer') && toks[i + 1] && /^[A-Z]/.test(toks[i + 1].t)) {
        const r = capWords(i + 1)
        if (r.words.length) nameHit = { start: i, end: r.end, words: r.words }
      }
    }
    if (!nameHit) {
      let s = 0
      while (s < toks.length && (NAME_STOP.has(toks[s].low) || toks[s].punct)) s++
      const r = capWords(s)
      // Leading words count as a name only when the next thing said is a garment, a number or a measurement.
      // That keeps chatter like "okay so," or "chalo, likho" from becoming the customer's name.
      let nx = r.end
      while (nx < toks.length && toks[nx].punct) nx++
      const next = toks[nx]
      const orderLike = !!next && (isGarmentWord(next.low) || next.n !== undefined || !!matchMeasure(toks, nx))
      if (r.words.length && orderLike) nameHit = { start: s, end: r.end, words: r.words }
    }
    if (nameHit) {
      draft.name = titleCase(nameHit.words.join(' '))
      found.add('name')
      for (let k = nameHit.start; k < nameHit.end; k++) used[k] = true
      // "Rohan's" / "Rohan ka"
      draft.name = draft.name.replace(/['’]s$/i, '')
    }
  }

  // 5. Garments, quantities, fits and measurements, in order.
  let current: DraftItem | undefined
  const pending: DraftItem = emptyItem()
  const target = () => current ?? pending
  let lastNumIdx = -1

  for (let i = 0; i < toks.length; i++) {
    if (used[i]) continue
    const tk = toks[i]
    const g = GARMENT_WORDS[tk.low]
    if (g) {
      used[i] = true
      found.add('garment')
      // quantity before: "two shirts", "2 shirts", "do kurta"
      let qty: number | undefined
      if (i > 0 && toks[i - 1].n !== undefined && !used[i - 1] && Number.isInteger(toks[i - 1].n) && toks[i - 1].n! > 0 && toks[i - 1].n! <= 50) {
        qty = toks[i - 1].n; used[i - 1] = true
      }
      // quantity after: "shirt x 2", "shirts quantity 3", "2 pieces"
      const j = i + 1
      if (/^(x|×|quantity|qty)$/.test(toks[j]?.low ?? '')) {
        if (toks[j + 1]?.n !== undefined) { qty = toks[j + 1].n; used[j] = used[j + 1] = true }
      } else if (toks[j]?.n !== undefined && /^(piece|pieces|pcs|nos)$/.test(toks[j + 1]?.low ?? '')) {
        qty = toks[j].n; used[j] = used[j + 1] = true
      }
      const same = current?.garment === g || (!current && pending.garment === g)
      if (same) {
        if (qty) target().quantity = qty
      } else if (current && !current.garment) {
        current.garment = g
        if (qty) current.quantity = qty
      } else {
        current = emptyItem(g)
        if (qty) current.quantity = qty
        // measurements spoken before the first garment belong to it
        if (draft.items.length === 0 && (Object.keys(pending.measurements).length || pending.unclear.length || pending.fit)) {
          Object.assign(current.measurements, pending.measurements)
          current.unclear.push(...pending.unclear)
          current.cmSpoken.push(...pending.cmSpoken)
          current.fit = current.fit ?? pending.fit
          pending.measurements = {}; pending.unclear = []; pending.fit = undefined
        }
        draft.items.push(current)
      }
      continue
    }
    if (tk.low in FIT_WORDS) {
      const next = toks[i + 1]?.low
      // "slim fit" / "loose fitting"; bare "slim" also counts
      target().fit = FIT_WORDS[tk.low]
      used[i] = true
      if (next === 'fit' || next === 'fitting') used[i + 1] = true
      found.add('fit')
      continue
    }
    const mm = matchMeasure(toks, i)
    if (mm) {
      for (let k = 0; k < mm.len; k++) used[i + k] = true
      found.add('measure')
      let j = i + mm.len
      while (j < toks.length && SKIP_AFTER_KEY.has(toks[j].low) && !used[j]) j++
      let numIdx = -1
      if (toks[j]?.n !== undefined && !used[j]) numIdx = j
      else if (i > 0 && toks[i - 1].n !== undefined && !used[i - 1] && i - 1 > lastNumIdx) numIdx = i - 1 // "38 chest"
      const item = target()
      if (numIdx >= 0) {
        used[numIdx] = true
        for (let k = i + mm.len; k < numIdx; k++) used[k] = true
        let value = toks[numIdx].n!
        let unit: Unit = defaultUnit
        const u = toks[numIdx + 1]?.low
        if (u === 'cm' || u === 'cms' || u === 'centimeter' || u === 'centimeters' || u === 'centimetre' || u === 'centimetres') { unit = 'cm'; used[numIdx + 1] = true }
        else if (u === 'inch' || u === 'inches' || u === 'in' && toks[numIdx + 2]?.n === undefined) { unit = 'in'; if (u !== 'in') used[numIdx + 1] = true }
        // Self-correction in the same breath: "sleeve 25, no, make it 24.5" / "25 nahi 24" -> the last value wins.
        {
          let k = numIdx + 1
          while (k < toks.length && (used[k] || toks[k].punct)) k++
          if (/^(no|nahi|nahin|sorry|actually|matlab)$/.test(toks[k]?.low ?? '')) {
            let j = k + 1
            while (j < toks.length && j <= k + 4 && (toks[j].punct || /^(make|it|change|to|is|i|mean|nahi|no|,)$/.test(toks[j].low))) j++
            if (toks[j]?.n !== undefined && !used[j]) {
              for (let x = k; x <= j; x++) used[x] = true
              value = toks[j].n!
              numIdx = j
            }
          }
        }
        if (unit === 'cm') { value = Math.round((value / 2.54) * 100) / 100; item.cmSpoken.push(mm.key) }
        item.measurements[mm.key] = value
        item.unclear = item.unclear.filter(k => k !== mm.key)
        lastNumIdx = numIdx
      } else if (!(mm.key in item.measurements) && !item.unclear.includes(mm.key)) {
        item.unclear.push(mm.key)
      }
      i = Math.max(i + mm.len - 1, numIdx >= 0 ? numIdx : i)
      continue
    }
  }

  // Measurements with no garment at all still form an item, with the garment left blank.
  if (!draft.items.length && (Object.keys(pending.measurements).length || pending.unclear.length)) {
    draft.items.push(pending)
  }
  if (pricePerItem !== undefined) {
    const qty = draft.items.reduce((s, it) => s + it.quantity, 0) || 1
    draft.total = pricePerItem * qty
  }

  // 6. Leftovers the parser didn't understand (kept visible, never silently dropped).
  for (let i = 0; i < toks.length; i++) {
    if (used[i] || toks[i].punct) continue
    if (FILLER.has(toks[i].low)) continue
    draft.unmatched.push(toks[i].t)
  }

  // For alterations, what's left is the job description: "shorten 1 inch".
  if (draft.kind === 'alteration') {
    const job = toks.filter((t, i) => !used[i] && !t.punct && !/^(and|the|a|for|please|karna|karo|hai)$/.test(t.low)).map(t => t.t).join(' ')
    if (job) draft.notes.unshift(job)
    draft.unmatched = []
  }

  const looksLikeOrder = found.has('garment') || found.has('measure')
  return { draft, looksLikeOrder, found }
}

function isStructural(toks: Token[], i: number) {
  const w = toks[i]?.low ?? ''
  return isGarmentWord(w) || !!matchMeasure(toks, i) || /^(delivery|advance|total|paid|due)$/.test(w)
}
