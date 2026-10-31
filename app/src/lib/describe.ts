import type { Draft, Unit } from '@/types'
import { garmentLabel, measureLabel } from '@/parser/vocab'
import { formatDay } from '@/parser/dates'
import { fmtMeasure } from '@/parser/format'
import { translate, type Lang } from '@/i18n/translate'

/** One plain sentence the tailor can read (or hear) to check the whole card. */
export function describeDraft(d: Draft, unit: Unit, lang: Lang = 'en'): string {
  const t = (k: Parameters<typeof translate>[1], v?: Parameters<typeof translate>[2]) => translate(lang, k, v)
  const long = (iso: string) => formatDay(iso, { weekday: 'long', day: 'numeric', month: 'long' }, lang)
  const parts: string[] = []
  const who = d.name?.trim() || t('d.noName')
  const items = d.items.map(it => {
    const g = it.garment ? garmentLabel(it.garment, lang, it.quantity !== 1).toLowerCase() : t('d.garmentNot')
    const fit = it.fit ? t('d.fit', { fit: it.fit }) : ''
    const m = Object.entries(it.measurements).map(([k, v]) => `${measureLabel(k, it.garment, lang)} ${fmtMeasure(v, unit)}`).join(', ')
    return `${it.quantity} ${fit}${g}${m ? `: ${m}` : ''}${it.style ? ` (${it.style})` : ''}`
  })
  const stop = lang === 'hi' ? '।' : '.'
  parts.push(`${t(d.kind === 'alteration' ? 'd.alterFor' : 'd.orderFor', { name: who })} ${items.join(stop + ' ') || t('d.noGarment')}${stop}`)
  if (d.kind === 'alteration' && d.notes.length) parts.push(t('d.work', { w: d.notes.join('; ') }))
  if (d.trialDate) parts.push(t('d.trial', { date: long(d.trialDate) }))
  parts.push(d.dueDate ? t('d.delivery', { date: long(d.dueDate) }) : t('d.noDelivery'))
  if (d.total !== undefined) parts.push(t('d.money', { t: d.total, a: d.advance, b: Math.max(0, d.total - d.advance) }))
  else if (d.advance) parts.push(t('d.advOnly', { a: d.advance }))
  if (d.fabric) parts.push(t(d.fabric.from === 'shop' ? 'd.shopFab' : d.fabric.received === false ? 'd.fabPend' : 'd.fabRec'))
  return parts.join(' ')
}
