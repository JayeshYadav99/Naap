'use client'

import { useState } from 'react'
import type { Customer, Order, Settings } from '@/types'
import { MESSAGE_TYPES, buildMessage, whatsappLink, type MessageType } from '@/lib/messages'
import { useLang } from '@/i18n'
import { formatPhone } from '@/parser/format'
import { Icon } from './ui'

export function MessagePanel({ order, customer, settings, initial = 'ready', headline, onToast }: {
  order: Order
  customer: Customer
  settings: Settings
  initial?: MessageType
  headline?: string
  onToast: (msg: string) => void
}) {
  const { t } = useLang()
  const [type, setType] = useState<MessageType>(initial)
  const text = buildMessage(type, order, customer, settings)
  const id = `msg-${order.id}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      onToast(t('msg.copied'))
    } catch {
      const el = document.getElementById(id)
      if (el) { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s?.removeAllRanges(); s?.addRange(r) }
      onToast(t('msg.copyFallback'))
    }
  }

  return (
    <div className="result panel tone-ok" role="region" aria-label={t('msg.region')}>
      {headline && <h2>{headline}</h2>}
      <div className="segmented" role="group" aria-label={t('msg.type')}>
        {MESSAGE_TYPES.map(m => (
          <button key={m} type="button" aria-pressed={m === type} onClick={() => setType(m)}>{t(`msg.${m}`)}</button>
        ))}
      </div>
      <p className="bubble" id={id}>{text}</p>
      <div className="row-actions">
        <a className="btn btn-ok btn-lg" href={whatsappLink(customer.phone, text, settings.countryCode)} target="_blank" rel="noopener noreferrer">
          <Icon.whatsapp /> {t('msg.whatsapp')}
        </a>
        <button type="button" className="btn btn-ghost btn-lg" onClick={copy}><Icon.copy /> {t('msg.copy')}</button>
      </div>
      <p className="hint">
        {customer.phone ? t('msg.hintPhone', { phone: formatPhone(customer.phone) }) : t('msg.hintNoPhone')}
      </p>
    </div>
  )
}
