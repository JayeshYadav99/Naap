'use client'

import dynamic from 'next/dynamic'
import { useLang } from '@/i18n'

function Loading() {
  const { t } = useLang()
  return <p className="loading wrap gutter" role="status">{t('loading')}</p>
}

// The shop counter reads the browser clock and localStorage, so it renders only in the browser.
const TailorApp = dynamic(() => import('./TailorApp'), { ssr: false, loading: () => <Loading /> })

export default function ClientApp() {
  return <TailorApp />
}
