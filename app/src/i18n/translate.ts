import { en, type Key } from './en'
import { hi } from './hi'

export type Lang = 'en' | 'hi'
export type { Key }

/** Languages offered in the switcher. Add a dictionary file and a row here to add a language. */
export const LANGS: { code: Lang; label: string; speech: string; locale: string }[] = [
  { code: 'en', label: 'English', speech: 'en-IN', locale: 'en-IN' },
  { code: 'hi', label: 'हिन्दी', speech: 'hi-IN', locale: 'hi-IN' },
]
const DICTS: Record<Lang, Record<Key, string>> = { en, hi }
export const LANG_COOKIE = 'naap-lang'

export type Vars = Record<string, string | number>
export function translate(lang: Lang, key: Key, vars?: Vars): string {
  const s = DICTS[lang]?.[key] ?? en[key] ?? key
  return vars ? s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`)) : s
}
export type T = (key: Key, vars?: Vars) => string

export const isLang = (v: unknown): v is Lang => v === 'en' || v === 'hi'
export const localeOf = (lang: Lang) => LANGS.find(l => l.code === lang)!.locale
