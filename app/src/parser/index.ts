import type { Customer, Draft } from '@/types'
import { parseCommand, type Command } from './commands'
import { applyCorrection } from './corrections'
import { parseOrder, type ParseOptions } from './parseOrder'
import { translate } from '@/i18n/translate'

export type Interpretation =
  | { kind: 'command'; command: Command }
  | { kind: 'order'; draft: Draft }
  | { kind: 'correction'; draft: Draft; changes: string[]; question?: string }
  | { kind: 'question'; message: string }
  | { kind: 'nothing'; message: string }


/**
 * Decides what a spoken sentence is: a command, a correction to the open card, or a new order.
 * Commands are checked first (spec §5.7), then corrections while a card is open (§5.6).
 */
export function interpret(text: string, opts: ParseOptions & { openDraft?: Draft }): Interpretation {
  const trimmed = text.trim()
  const lang = opts.lang ?? 'en'
  if (!trimmed) return { kind: 'nothing', message: translate(lang, 'p.empty') }

  const command = parseCommand(trimmed)
  if (command) return { kind: 'command', command }

  if (opts.openDraft) {
    const c = applyCorrection(opts.openDraft, trimmed, opts)
    if (c.changes.length || c.question) return { kind: 'correction', ...c }
    const fresh = parseOrder(trimmed, opts)
    if (fresh.looksLikeOrder && fresh.draft.name && fresh.draft.name !== opts.openDraft.name) {
      return { kind: 'question', message: translate(lang, 'p.cardOpen') }
    }
    return { kind: 'question', message: translate(lang, 'p.noChange') }
  }

  const { draft, looksLikeOrder } = parseOrder(trimmed, opts)
  if (!looksLikeOrder) return { kind: 'nothing', message: translate(lang, 'p.nothing') }
  return { kind: 'order', draft }
}

/** Customers whose name matches what was spoken. Exact full-name matches win over first-name matches. */
export function findCustomers(spoken: string, customers: Customer[]): Customer[] {
  const q = spoken.toLowerCase().replace(/[^a-z0-9 \u0900-\u097F]/g, '').trim()
  if (!q) return []
  const digits = q.replace(/\D/g, '')
  if (digits.length >= 4) {
    const byPhone = customers.filter(c => c.phone?.includes(digits))
    if (byPhone.length) return byPhone
  }
  const exact = customers.filter(c => c.name.toLowerCase() === q)
  if (exact.length) return exact
  const words = q.split(' ')
  const starts = customers.filter(c => {
    const n = c.name.toLowerCase().split(' ')
    return words.every((w, i) => n[i]?.startsWith(w))
  })
  if (starts.length) return starts
  const anyWord = customers.filter(c => c.name.toLowerCase().split(' ').some(p => words.includes(p)))
  if (anyWord.length) return anyWord
  // Sound-alike: Flow may write "Mira" for Meera, or "मीरा" / "रोहन" in Devanagari.
  const keys = words.map(soundKey)
  return customers.filter(c => {
    const n = c.name.toLowerCase().split(' ').map(soundKey)
    return keys.every((k, i) => n[i] === k) || keys.every(k => n.includes(k))
  })
}

// ---- name matching across spellings and scripts ----
const DEVA_CONS: Record<string, string> = {
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'n', 'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'n',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n', 'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm', 'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh',
  'ष': 'sh', 'स': 's', 'ह': 'h', 'ड़': 'r', 'ढ़': 'rh', 'ज़': 'z', 'फ़': 'f',
}
const DEVA_VOWEL: Record<string, string> = { 'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'ऋ': 'ri' }
const DEVA_MATRA: Record<string, string> = { 'ा': 'aa', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ृ': 'ri' }

/** Rough Devanagari → Latin for names: "मीरा" → "meeraa", "रोहन" → "rohan". */
export function romanize(word: string): string {
  if (!/[\u0900-\u097F]/.test(word)) return word
  const ch = [...word.normalize('NFC')]
  let out = ''
  for (let i = 0; i < ch.length; i++) {
    const c = ch[i] + (ch[i + 1] === '़' ? '़' : '')
    if (c.length > ch[i].length) i++
    const next = ch[i + 1]
    if (DEVA_CONS[c] !== undefined) {
      out += DEVA_CONS[c]
      if (next && DEVA_MATRA[next]) { out += DEVA_MATRA[next]; i++ }
      else if (next === '्') { i++ }
      else if (i < ch.length - 1) out += 'a' // inherent vowel, dropped at the end of the word
    } else if (DEVA_VOWEL[c]) out += DEVA_VOWEL[c]
    else if (c === 'ं' || c === 'ँ') out += 'n'
  }
  return out
}

/** Collapse spelling differences: Meera/Mira, Rohan/Rohaan, Shah/Sha, Vikas/Wikas. */
export function soundKey(word: string): string {
  return romanize(word.toLowerCase())
    .replace(/[^a-z]/g, '')
    .replace(/ee|ii|ie/g, 'i').replace(/oo|uu/g, 'u').replace(/aa/g, 'a')
    .replace(/w/g, 'v').replace(/ph/g, 'f').replace(/z/g, 'j')
    .replace(/([bcdgjkpt])h/g, '$1').replace(/h$/, '')
    .replace(/(.)\1+/g, '$1')
}

export { parseOrder } from './parseOrder'
export type { Command, DueFilter } from './commands'
