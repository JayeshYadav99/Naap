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
  return customers.filter(c => c.name.toLowerCase().split(' ').some(p => words.includes(p)))
}

export { parseOrder } from './parseOrder'
export type { Command, DueFilter } from './commands'
