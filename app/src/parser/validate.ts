import type { Customer, Draft, Garment, Order } from '@/types'
import { daysBetween, fromISO } from './dates'
import { fmtNum } from './format'
import { garmentLabel, measureLabel } from './vocab'
import { translate, type Lang } from '@/i18n/translate'

export type Level = 'missing' | 'warn' | 'info'
export interface Issue {
  /** "name", "garment.0", "dueDate", "m.0.chest", "phone" */
  field: string
  level: Level
  message: string
}

type Range = [number, number]
const BASE: Record<string, Range> = {
  chest: [28, 60], waist: [22, 55], hip: [28, 60], shoulder: [12, 24], sleeve: [18, 34],
  collar: [12, 20], armhole: [12, 24], bicep: [9, 20], cuff: [6, 12], thigh: [16, 36], knee: [12, 26],
  bottom: [8, 24], inseam: [22, 38], rise: [8, 16], frontLength: [11, 20], backLength: [11, 20],
  neckFront: [3, 12], neckBack: [3, 14],
}
const LENGTH: Partial<Record<Garment, Range>> = {
  shirt: [24, 36], kurta: [28, 50], trouser: [30, 46], pyjama: [30, 46], salwar: [30, 46],
  blouse: [12, 20], suit: [26, 34], blazer: [26, 34], jacket: [24, 34], waistcoat: [20, 30],
  sherwani: [36, 48], dress: [30, 60], lehenga: [34, 46],
}
const SLEEVE: Partial<Record<Garment, Range>> = {
  blouse: [3, 22], dress: [3, 30], lehenga: [3, 22], kurta: [6, 34],
}

export function rangeFor(key: string, garment?: Garment): Range | undefined {
  if (key === 'length' && garment) return LENGTH[garment]
  if (key === 'length') return [12, 60]
  if (key === 'sleeve' && garment && SLEEVE[garment]) return SLEEVE[garment]
  return BASE[key]
}

/** Warns about unusual measurements. Never blocks saving. */
export function measurementIssues(key: string, value: number, garment?: Garment, cmSpoken = false, lang: Lang = 'en'): string | undefined {
  const r = rangeFor(key, garment)
  if (!r) return undefined
  const [lo, hi] = r
  const what = `${garment ? garmentLabel(garment, lang).toLowerCase() + ' ' : ''}${measureLabel(key, garment, lang).toLowerCase()}`
  if (value > 70 && hi <= 60 && !cmSpoken) {
    return translate(lang, 'v.cm', { v: fmtNum(value), inch: fmtNum(Math.round((value / 2.54) * 4) / 4) })
  }
  if (value < lo) return translate(lang, 'v.small', { what, lo, hi })
  if (value > hi) return translate(lang, 'v.large', { what, lo, hi })
  return undefined
}

export interface ValidateContext {
  today: Date
  customers: Customer[]
  orders: Order[]
  lang?: Lang
}

export function validateDraft(d: Draft, ctx: ValidateContext): Issue[] {
  const issues: Issue[] = []
  const lang = ctx.lang ?? 'en'
  const t = (k: Parameters<typeof translate>[1], v?: Parameters<typeof translate>[2]) => translate(lang, k, v)
  if (!d.name?.trim()) issues.push({ field: 'name', level: 'missing', message: t('v.name') })
  if (!d.items.length) issues.push({ field: 'garment.0', level: 'missing', message: t('v.garment') })
  if (!d.dueDate) issues.push({ field: 'dueDate', level: 'missing', message: t('v.due') })
  else if (daysBetween(ctx.today, fromISO(d.dueDate)) < 0) issues.push({ field: 'dueDate', level: 'warn', message: t('v.past') })

  if (d.phone && !/^[6-9]\d{9}$/.test(d.phone)) issues.push({ field: 'phone', level: 'warn', message: t('v.phone') })

  d.items.forEach((it, i) => {
    if (!it.garment) issues.push({ field: `garment.${i}`, level: 'missing', message: t('v.whichGarment') })
    for (const key of it.unclear) issues.push({ field: `m.${i}.${key}`, level: 'missing', message: t('v.unclear', { label: measureLabel(key, it.garment, lang) }) })
    for (const [key, v] of Object.entries(it.measurements)) {
      const msg = measurementIssues(key, v, it.garment, it.cmSpoken.includes(key), lang)
      if (msg) issues.push({ field: `m.${i}.${key}`, level: 'warn', message: msg })
      if (it.cmSpoken.includes(key)) issues.push({ field: `m.${i}.${key}`, level: 'info', message: t('v.saidCm') })
    }
    const m = it.measurements
    if (m.sleeve !== undefined && m.chest !== undefined && m.sleeve > m.chest)
      issues.push({ field: `m.${i}.sleeve`, level: 'warn', message: t('v.sleeveChest') })
    if (m.waist !== undefined && m.chest !== undefined && m.waist > m.chest + 15)
      issues.push({ field: `m.${i}.waist`, level: 'warn', message: t('v.waistChest') })
    if (it.quantity < 1 || it.quantity > 50) issues.push({ field: `qty.${i}`, level: 'warn', message: t('v.qty') })
  })

  if (d.total !== undefined && d.advance > d.total) issues.push({ field: 'advance', level: 'warn', message: t('v.advance') })

  // Duplicate customer: same phone, different name -> ask, never merge silently.
  if (d.phone && !d.customerId && !d.forceNewCustomer) {
    const byPhone = ctx.customers.find(c => c.phone === d.phone)
    if (byPhone && d.name && byPhone.name.toLowerCase() !== d.name.trim().toLowerCase()) {
      issues.push({ field: 'customer', level: 'warn', message: t('v.dupPhone', { name: byPhone.name }) })
    }
  }
  return issues
}

/** Finds the existing customer this draft refers to, if any. */
export function matchCustomer(d: Draft, customers: Customer[]): { customer?: Customer; how?: 'id' | 'phone' | 'name'; conflict?: Customer } {
  if (d.customerId) { const c = customers.find(x => x.id === d.customerId); if (c) return { customer: c, how: 'id' } }
  if (d.forceNewCustomer) return {}
  const name = d.name?.trim().toLowerCase()
  if (d.phone) {
    const byPhone = customers.find(c => c.phone === d.phone)
    if (byPhone) {
      if (!name || byPhone.name.toLowerCase() === name) return { customer: byPhone, how: 'phone' }
      return { conflict: byPhone }
    }
  }
  if (name) {
    const byName = customers.filter(c => c.name.toLowerCase() === name && (!d.phone || !c.phone || c.phone === d.phone))
    if (byName.length === 1) return { customer: byName[0], how: 'name' }
  }
  return {}
}

/** Latest earlier measurements for a customer and garment, newest first. */
export function previousMeasurements(customerId: string, garment: Garment, orders: Order[], excludeOrderId?: string) {
  const list = orders
    .filter(o => o.customerId === customerId && o.id !== excludeOrderId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  for (const o of list) {
    const it = o.items.find(i => i.garment === garment && Object.keys(i.measurements).length)
    if (it) return { measurements: it.measurements, date: o.createdAt, orderId: o.id }
  }
  return undefined
}
