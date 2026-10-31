'use client'

import type { Order, Status } from '@/types'
import { useLang, type Key } from '@/i18n'
import { balanceOf } from '@/lib/messages'
import { rupees } from '@/parser/format'

export function StatusChip({ status }: { status: Status }) {
  const { t } = useLang()
  return <span className={`st st-${status}`}>{t(`st.${status}` as Key)}</span>
}

export function BalanceText({ order }: { order: Order }) {
  const { t } = useLang()
  const bal = balanceOf(order)
  if (bal === undefined) return <span className="bal">{t('bal.notSet')}</span>
  if (bal === 0) return <span className="bal">{t('bal.isPaid')}</span>
  return <span className="bal owed">{t('bal.due', { amount: rupees(bal) })}</span>
}

/** Status label outside components. */
export const statusKey = (s: Status) => `st.${s}` as Key

const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export const Icon = {
  today: () => (<svg viewBox="0 0 24 24" aria-hidden="true" {...P}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>),
  board: () => (<svg viewBox="0 0 24 24" aria-hidden="true" {...P}><rect x="3" y="4" width="5" height="16" rx="1.5" /><rect x="10" y="4" width="5" height="10" rx="1.5" /><rect x="17" y="4" width="4" height="13" rx="1.5" /></svg>),
  people: () => (<svg viewBox="0 0 24 24" aria-hidden="true" {...P}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c2 .7 3.2 2.4 3.6 5.2" /></svg>),
  settings: () => (<svg viewBox="0 0 24 24" aria-hidden="true" {...P}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></svg>),
  undo: () => (<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" {...P}><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>),
  sun: () => (<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" {...P}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>),
  moon: () => (<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" {...P}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></svg>),
  tape: () => (<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="#3B2F07" strokeWidth="2" strokeLinecap="round"><circle cx="10" cy="12" r="6.5" /><circle cx="10" cy="12" r="2" /><path d="M16.5 12H22v4h-5.5M18.5 12v2M20.5 12v2" /></svg>),
  whatsapp: () => (<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...P}><path d="M3.5 20.5 5 16a8.5 8.5 0 1 1 3.2 3.1Z" /><path d="M9 9.5c.3 2.2 2.3 4.2 4.5 4.6l1-1.1 1.8.8c-.2 1.2-1.1 1.9-2.3 1.8C10.8 15.3 8.7 13.2 8.4 10c-.1-1.2.6-2.1 1.8-2.3l.8 1.8Z" /></svg>),
  copy: () => (<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...P}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>),
  print: () => (<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...P}><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="7" /></svg>),
}
