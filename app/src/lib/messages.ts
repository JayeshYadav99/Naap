import type { Customer, Item, Order, Settings } from '@/types'
import { garmentLabel } from '@/parser/vocab'
import type { Lang } from '@/i18n/translate'
import { formatDay } from '@/parser/dates'

export type MessageType = 'ready' | 'reminder' | 'balance'
export const MESSAGE_TYPES: MessageType[] = ['ready', 'reminder', 'balance']

export function itemsText(items: Item[], lang: Lang = 'en'): string {
  const parts = items.map(it => `${it.quantity} ${garmentLabel(it.garment, lang, it.quantity !== 1).toLowerCase()}`)
  if (parts.length <= 1) return parts[0] ?? ''
  return parts.slice(0, -1).join(', ') + (lang === 'hi' ? ' और ' : ' and ') + parts.at(-1)
}

export function balanceOf(o: Pick<Order, 'total' | 'advance'>): number | undefined {
  return o.total === undefined ? undefined : Math.max(0, o.total - o.advance)
}

const firstName = (name: string) => name.split(' ')[0]

export function buildMessage(type: MessageType, order: Order, customer: Customer, s: Settings): string {
  const name = firstName(customer.name)
  const items = itemsText(order.items, s.messageLang === 'hi' ? 'hi' : 'en')
  const plural = order.items.reduce((n, it) => n + it.quantity, 0) > 1
  const bal = balanceOf(order)
  const rs = (n: number) => n.toLocaleString('en-IN')
  const date = formatDay(order.dueDate, { weekday: 'long', day: 'numeric', month: 'long' }, s.messageLang === 'hi' ? 'hi' : 'en')
  const shop = s.shopName

  if (s.messageLang === 'hi') {
    if (type === 'ready') return `नमस्ते ${name} जी, आपके ${items} (ऑर्डर #${order.number}) तैयार हैं। ${shop} से ले जाएँ।${bal ? ` बाकी: ₹${rs(bal)}।` : ''} धन्यवाद।`
    if (type === 'reminder') return `नमस्ते ${name} जी, याद दिलाना था कि आपके ${items} ${date} को ${shop} पर तैयार होंगे।`
    return `नमस्ते ${name} जी, आपके ऑर्डर का बाकी ₹${rs(bal ?? 0)} है। धन्यवाद, ${shop}।`
  }
  if (s.messageLang === 'hinglish') {
    if (type === 'ready') return `Namaste ${name} ji, aapke ${items} (order #${order.number}) taiyar hain. ${shop} se le jaayein.${bal ? ` Baaki: Rs ${rs(bal)}.` : ''} Dhanyavaad.`
    if (type === 'reminder') return `Namaste ${name} ji, yaad dilana tha ki aapke ${items} ${date} ko ${shop} par taiyar honge.`
    return `Namaste ${name} ji, aapke order ka baaki Rs ${rs(bal ?? 0)} hai. Dhanyavaad, ${shop}.`
  }
  if (type === 'ready') return `Hello ${name}, your ${items} (order #${order.number}) ${plural ? 'are' : 'is'} ready for pickup at ${shop}.${bal ? ` Balance to pay: Rs ${rs(bal)}.` : ''} Thank you.`
  if (type === 'reminder') return `Hello ${name}, a reminder that your ${items} will be ready on ${date} at ${shop}.`
  return `Hello ${name}, the balance for your order is Rs ${rs(bal ?? 0)}. Thank you, ${shop}.`
}

export function whatsappLink(phone: string | undefined, text: string, countryCode: string): string {
  const cc = countryCode.replace(/\D/g, '') || '91'
  const num = phone ? `${cc}${phone.replace(/\D/g, '')}` : ''
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`
}
