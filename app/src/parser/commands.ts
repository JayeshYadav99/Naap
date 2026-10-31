import { normalizeScript, numberize, tokenize } from './numbers'
import { GARMENT_WORDS, MEASURE_PHRASES } from './vocab'
import type { Garment } from '@/types'

export type DueFilter = 'overdue' | 'today' | 'tomorrow' | 'week' | 'all'

export type Command =
  | { kind: 'status'; status: 'ready' | 'delivered' | 'cutting' | 'stitching'; who: string; garment?: Garment }
  | { kind: 'show'; who: string }
  | { kind: 'due'; filter: DueFilter }
  | { kind: 'balance'; who: string }
  | { kind: 'paid'; who: string; amount: number }
  | { kind: 'remind'; who: string; garment?: Garment }
  | { kind: 'undo' }
  | { kind: 'help' }
  | { kind: 'summary' }
  | { kind: 'owed' }
  | { kind: 'readyList' }
  | { kind: 'trials' }
  | { kind: 'fabricPending' }
  | { kind: 'stats'; period: 'today' | 'week' | 'month' }
  | { kind: 'phone'; who: string }
  | { kind: 'lastOrder'; who: string }

/** Questions about the whole shop, checked before the per-customer commands. */
function shopQuestion(t: string): Command | undefined {
  // "who still owes money", "kiska paisa baaki hai", "unpaid", "pending payments"
  if (/\b(owes?|owe money|unpaid|pending payments?|payment pending|dues)\b/.test(t) || /\b(kiska|kiske|kis ka|kaun|kin)\b.*\b(paisa|paise|baaki|bakaya|udhaar|udhar)\b/.test(t) || /\b(paisa|paise|udhaar|udhar)\b.*\bbaaki\b.*\b(kiska|kaun|kis)\b/.test(t))
    return { kind: 'owed' }
  // "what's ready", "kya ready hai", "kya taiyar hai", "ready for pickup"
  if (/^(what'?s|what is|which|kya|kaun sa|kaunse|kaun se|show)( orders?| kapde| order)? (ready|taiyar|tayyar)( hai| hain| for pickup)?$/.test(t) || /\b(ready for pickup|ready orders|pickup list|taiyar kapde)\b/.test(t))
    return { kind: 'readyList' }
  // "any trials this week", "trial kab hai", "trials"
  if (/\btrials?\b|\bfitting(s)? (this|is|kab)/.test(t) && !/\d/.test(t)) return { kind: 'trials' }
  // "whose fabric hasn't come", "kapda nahi aaya", "fabric pending"
  if (/\b(fabric|cloth|kapda|kapde|kapra)\b.*\b(pending|not (come|received|arrived)|nahi aaya|nahi aaye|baaki|hasn'?t come|missing)\b/.test(t) || /\b(whose|kiska|kiske) (fabric|cloth|kapda)\b/.test(t))
    return { kind: 'fabricPending' }
  // "how many orders this month", "kitna kamaya is mahine", "earnings this week"
  const period = /\b(month|mahine|mahina|maheene)\b/.test(t) ? 'month' : /\b(week|hafte|hafta)\b/.test(t) ? 'week' : /\b(today|aaj)\b/.test(t) ? 'today' : undefined
  if (/\b(how many|kitne|kitna|earn|earned|earnings|kamaya|kamai|income|sales|business|revenue|collection)\b/.test(t) && period && !/\b(due|pending)\b/.test(t))
    return { kind: 'stats', period }
  return undefined
}

const clean = (s: string) =>
  s.toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[.,!?;:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/** Strip possessives and Hindi postpositions from a spoken name. */
function who(s: string): string {
  return s
    .replace(/'s\b/g, '')
    .replace(/\b(ka|ki|ke|ko|ne|ji|bhai|order|orders|is|the|for|of|please|customer|mr|mrs|ms)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function hasMeasureWords(text: string): boolean {
  const toks = tokenize(text).map(t => t.low)
  return toks.some((_, i) => MEASURE_PHRASES.some(p => p.words.every((w, k) => toks[i + k] === w)))
}

/**
 * Recognises spoken commands. Runs before the order parser; anything with garment or
 * measurement words is treated as an order instead.
 */
export function parseCommand(raw: string): Command | undefined {
  const text = normalizeScript(raw)
  const t = clean(text)
  if (!t) return undefined
  if (/^(undo|undo that|undo last|go back|wapas|cancel last)$/.test(t)) return { kind: 'undo' }
  if (/^(help|madad|what can i (say|do)|how (do i|to|does)\b.*|kaise\b.*|\?)$/.test(t)) return { kind: 'help' }
  if (hasMeasureWords(text)) return undefined

  // A garment word alone ("ready Rohan kurta") narrows a status command; anything else with a garment is an order.
  const words = t.split(' ')
  const gIdx = words.findIndex(w => w in GARMENT_WORDS)
  if (gIdx >= 0) {
    const garment = GARMENT_WORDS[words[gIdx]]
    const rest = words.filter((_, i) => i !== gIdx).join(' ')
    if (/\d/.test(rest.replace(/#?\d+$/, '')) && !/^#?\d+$/.test(rest)) return undefined
    const inner = parseCommand(rest)
    if (inner && (inner.kind === 'status' || inner.kind === 'remind')) return { ...inner, garment }
    return undefined
  }

  const q = shopQuestion(t)
  if (q) return q

  // "Rohan's phone", "Rohan ka number", "phone number of Rohan"
  let pm: RegExpMatchArray | null
  if ((pm = t.match(/^(?:what is |what's )?(.+?)(?:'s| ka| ki| ke)? (?:phone|mobile|contact|number)(?: number)?(?: kya hai| batao| do| hai)?$/)) && who(pm[1]) && !/^\d+$/.test(pm[1]))
    return { kind: 'phone', who: who(pm[1]) }
  if ((pm = t.match(/^(?:phone|mobile|contact)(?: number)? (?:of |for )?(.+)$/)) && who(pm[1])) return { kind: 'phone', who: who(pm[1]) }
  // "Rohan's last order", "Rohan ka pichla order", "last order of Rohan"
  if ((pm = t.match(/^(.+?)(?:'s| ka| ki| ke)? (?:last|latest|previous|pichla|pichhla|aakhri) order(?: kya tha| dikhao| batao)?$/)) && who(pm[1])) return { kind: 'lastOrder', who: who(pm[1]) }
  if ((pm = t.match(/^(?:last|latest|previous) order (?:of |for )?(.+)$/)) && who(pm[1])) return { kind: 'lastOrder', who: who(pm[1]) }

  // Due lists
  if (/\b(due|pending|overdue|late|deliveries|baaki kaam|kya due)\b/.test(t) && !/\bbalance\b/.test(t)) {
    if (/\b(overdue|late)\b/.test(t)) return { kind: 'due', filter: 'overdue' }
    if (/\btomorrow|kal\b/.test(t)) return { kind: 'due', filter: 'tomorrow' }
    if (/\btoday|aaj\b/.test(t)) return { kind: 'due', filter: 'today' }
    if (/\bweek|hafte|hafta\b/.test(t)) return { kind: 'due', filter: 'week' }
    return { kind: 'due', filter: 'all' }
  }

  if (/\b(summary|hisaab|hisab|collection|kitna aaya|earned|received today|money today)\b/.test(t) || /^how much (did|have) (i|we)\b/.test(t)) return { kind: 'summary' }

  let m: RegExpMatchArray | null
  const READY = '(ready|taiyar|tayyar|taiyaar|done|finished|complete)'
  const DELIV = '(delivered|picked up|collected|handed over|de diya|le gaya|le gayi)'

  if ((m = t.match(new RegExp(`^(?:mark )?${READY} (.+)$`))) && who(m[2])) return { kind: 'status', status: 'ready', who: who(m[2]) }
  if ((m = t.match(new RegExp(`^(.+?) (?:is |ka |ki |order )*${READY}(?: hai| ho gaya| ho gayi)?$`))) && who(m[1])) return { kind: 'status', status: 'ready', who: who(m[1]) }
  if ((m = t.match(new RegExp(`^(?:mark )?(?:delivered|deliver) (.+)$`))) && who(m[1])) return { kind: 'status', status: 'delivered', who: who(m[1]) }
  if ((m = t.match(new RegExp(`^(.+?) (?:is |ka |ki |order |has )*${DELIV}(?: hai)?$`))) && who(m[1])) return { kind: 'status', status: 'delivered', who: who(m[1]) }
  if ((m = t.match(/^(?:start |mark )?(cutting|stitching) (?:for )?(.+)$/)) && who(m[2])) return { kind: 'status', status: m[1] as 'cutting' | 'stitching', who: who(m[2]) }
  if ((m = t.match(/^(.+?) (?:is )?(?:in |to )?(cutting|stitching)$/)) && who(m[1])) return { kind: 'status', status: m[2] as 'cutting' | 'stitching', who: who(m[1]) }

  // Payments: "paid 1000 Rohan", "Rohan paid 1000", "received 1000 from Rohan", "Rohan ne 1000 diye"
  {
    const toks = numberize(tokenize(text.replace(/[.,!?]/g, ' ')))
    const amtIdx = toks.findIndex(x => x.n !== undefined)
    const words = toks.map(x => x.low)
    const payWord = words.findIndex(w => /^(paid|pay|received|got|diye|diya|jama|payment)$/.test(w))
    if (amtIdx >= 0 && payWord >= 0) {
      const name = who(toks.filter((x, i) => i !== amtIdx && i !== payWord && x.n === undefined && !/^(rs|rupees|from|by|ne|me|mein|se|₹)$/.test(x.low)).map(x => x.low).join(' '))
      if (name) return { kind: 'paid', who: name, amount: toks[amtIdx].n! }
    }
  }

  if ((m = t.match(/^(?:balance|baaki|due amount|how much (?:does|is) )(?: for| of)? (.+?)(?: owe| owes| pending)?$/)) && who(m[1])) return { kind: 'balance', who: who(m[1]) }
  if ((m = t.match(/^(.+?)(?:'s)? (?:ka |ki )?(?:balance|baaki|hisaab|hisab)(?: kitna hai| kitna)?$/)) && who(m[1])) return { kind: 'balance', who: who(m[1]) }

  if ((m = t.match(/^(?:remind|reminder|message|send message to|whatsapp) (.+)$/)) && who(m[1])) return { kind: 'remind', who: who(m[1]) }

  if ((m = t.match(/^(?:show|open|find|search|lookup|look up|dikhao|measurements of|measurement of) (.+?)(?:'s)?(?: measurements?| naap| details)?$/)) && who(m[1])) return { kind: 'show', who: who(m[1]) }
  if ((m = t.match(/^(.+?)(?:'s| ka| ki| ke) ?(?:measurements?|naap|details|card|page)(?: dikhao| show)?$/)) && who(m[1])) return { kind: 'show', who: who(m[1]) }

  return undefined
}

