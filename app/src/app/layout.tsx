import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { Atkinson_Hyperlegible, Bricolage_Grotesque, Noto_Sans_Devanagari } from 'next/font/google'
import { LangProvider } from '@/i18n'
import { isLang, LANG_COOKIE } from '@/i18n/translate'
import './globals.css'

// Atkinson Hyperlegible was designed for low-vision readers: clear 1/l/I and 3/8 shapes matter for measurements.
const body = Atkinson_Hyperlegible({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-body', display: 'swap' })
const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['600', '800'], variable: '--font-display', display: 'swap' })
// Hindi text falls back to Noto Sans Devanagari, which keeps the same weights and stays clear at small sizes.
const deva = Noto_Sans_Devanagari({ subsets: ['devanagari'], weight: ['400', '700'], variable: '--font-deva', display: 'swap' })

export const metadata: Metadata = {
  title: {
    default: "Naap · the tailor's voice measurement book",
    template: '%s · Naap',
  },
  description: 'Say the order while you measure. Naap turns it into a clean customer card, tracks due dates and balances, and drafts the WhatsApp message when it is ready. In English and Hindi.',
  applicationName: 'Naap',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F2F4F8' },
    { media: '(prefers-color-scheme: dark)', color: '#0D131F' },
  ],
}

/** Reads the saved language so the page streams in that language. */
async function WithSavedLang({ children }: { children: React.ReactNode }) {
  const saved = (await cookies()).get(LANG_COOKIE)?.value
  return <LangProvider initial={isLang(saved) ? saved : 'en'}>{children}</LangProvider>
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${body.variable} ${display.variable} ${deva.variable}`} suppressHydrationWarning>
      <body>
        {/* Static shell in English; the saved language streams in right after. */}
        <Suspense fallback={<LangProvider initial="en">{children}</LangProvider>}>
          <WithSavedLang>{children}</WithSavedLang>
        </Suspense>
      </body>
    </html>
  )
}
