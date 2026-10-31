'use client'

// Spoken answers through the browser's own voices. Picks the most natural voice on the device
// (Microsoft "Natural", Google, neural voices) so it sounds as human as the device allows.

const KEY = 'naap-speak'
type Listener = (on: boolean) => void
const listeners = new Set<Listener>()

export function speakingEnabled(): boolean {
  try { return localStorage.getItem(KEY) !== 'off' } catch { return true }
}
export function setSpeakingEnabled(on: boolean) {
  try { localStorage.setItem(KEY, on ? 'on' : 'off') } catch { /* ignore */ }
  if (!on) stopSpeaking()
  listeners.forEach(l => l(on))
}
export function onSpeakingChange(l: Listener) { listeners.add(l); return () => { listeners.delete(l) } }

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function score(v: SpeechSynthesisVoice, locale: string): number {
  const name = v.name.toLowerCase()
  let s = 0
  if (v.lang.toLowerCase() === locale.toLowerCase()) s += 20
  else if (v.lang.toLowerCase().startsWith(locale.slice(0, 2).toLowerCase())) s += 8
  else return -1
  if (/natural|neural|wavenet|premium|enhanced/.test(name)) s += 10
  if (/google/.test(name)) s += 6
  if (/microsoft/.test(name)) s += 3
  if (/compact|espeak/.test(name)) s -= 10
  return s
}

/** The most natural-sounding voice for this language on this device, if any. */
export function pickVoice(locale: string): SpeechSynthesisVoice | undefined {
  if (!canSpeak()) return undefined
  const voices = window.speechSynthesis.getVoices()
  let best: SpeechSynthesisVoice | undefined
  let bestScore = 0
  for (const v of voices) {
    const sc = score(v, locale)
    if (sc > bestScore) { best = v; bestScore = sc }
  }
  return best
}

// Voices load asynchronously in Chrome; touching the list early warms it up.
if (canSpeak()) {
  window.speechSynthesis.getVoices()
  window.speechSynthesis.addEventListener?.('voiceschanged', () => window.speechSynthesis.getVoices())
}

/** Make text sound natural when read: "Rs 16,700" -> "16,700 rupees", "15½" -> "15 and a half". */
export function forSpeech(text: string, lang: 'en' | 'hi'): string {
  const half = lang === 'hi' ? ' साढ़े' : ' and a half'
  return text
    .replace(/(?:Rs\.?|₹)\s?([\d,]+)/g, (_, n) => (lang === 'hi' ? `${n} रुपये` : `${n} rupees`))
    .replace(/(\d)½/g, `$1${half}`).replace(/(\d)¼/g, lang === 'hi' ? '$1 सवा' : '$1 and a quarter').replace(/(\d)¾/g, lang === 'hi' ? '$1 पौने' : '$1 and three quarters')
    .replace(/#(\d+)/g, lang === 'hi' ? 'ऑर्डर $1' : 'order $1')
}

export function speak(text: string, lang: 'en' | 'hi', force = false) {
  if (!canSpeak() || (!force && !speakingEnabled()) || !text.trim()) return
  const synth = window.speechSynthesis
  synth.cancel()
  const locale = lang === 'hi' ? 'hi-IN' : 'en-IN'
  const u = new SpeechSynthesisUtterance(forSpeech(text, lang))
  u.lang = locale
  const v = pickVoice(locale) ?? (lang === 'en' ? pickVoice('en-GB') ?? pickVoice('en-US') : undefined)
  if (v) u.voice = v
  u.rate = 1
  synth.speak(u)
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel()
}
