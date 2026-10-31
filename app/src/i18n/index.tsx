'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { isLang, LANG_COOKIE, LANGS, translate, type Lang, type T } from './translate'

export * from './translate'

interface Ctx { lang: Lang; setLang: (l: Lang) => void; t: T }
const LangContext = createContext<Ctx>({ lang: 'en', setLang: () => {}, t: (k, v) => translate('en', k, v) })

export function LangProvider({ initial, children }: { initial: Lang; children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initial)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_COOKIE)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (isLang(saved) && saved !== initial) setLangState(saved)
    } catch { /* ignore */ }
  }, [initial])
  useEffect(() => { document.documentElement.lang = lang === 'hi' ? 'hi' : 'en-IN' }, [lang])
  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try { localStorage.setItem(LANG_COOKIE, l) } catch { /* ignore */ }
    document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`
  }, [])
  const t = useCallback<T>((k, v) => translate(lang, k, v), [lang])
  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>
}

export const useLang = () => useContext(LangContext)

/** Compact language switcher used in the header, landing page and sign-in screen. */
export function LangSwitch({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = useLang()
  return (
    <div className="segmented lang-switch" role="group" aria-label={t('top.language')}>
      {LANGS.map(l => (
        <button key={l.code} type="button" lang={l.code} aria-pressed={lang === l.code} onClick={() => setLang(l.code)}>
          {compact ? (l.code === 'en' ? 'EN' : 'हि') : l.label}
        </button>
      ))}
    </div>
  )
}
