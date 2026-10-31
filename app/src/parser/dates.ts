import type { Token } from './numbers'

export function toISO(d: Date): string {
  const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate()
  return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
export function fromISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
export function addDays(d: Date, n: number): Date {
  const x = startOfDay(d); x.setDate(x.getDate() + n); return x
}
export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86400000)
}

const WEEKDAYS: Record<string, number> = {
  sunday: 0, sun: 0, ravivar: 0, itwar: 0, itvaar: 0,
  monday: 1, mon: 1, somvar: 1, somvaar: 1,
  tuesday: 2, tue: 2, tues: 2, mangalvar: 2, mangalvaar: 2, mangal: 2,
  wednesday: 3, wed: 3, budhvar: 3, budhvaar: 3, budh: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4, guruvar: 4, guruvaar: 4, veervar: 4, brihaspativar: 4,
  friday: 5, fri: 5, shukravar: 5, shukravaar: 5, shukra: 5,
  saturday: 6, sat: 6, shanivar: 6, shanivaar: 6, shani: 6,
}
const MONTHS: Record<string, number> = {
  january: 0, jan: 0, february: 1, feb: 1, march: 2, mar: 2, april: 3, apr: 3, may: 4, june: 5, jun: 5,
  july: 6, jul: 6, august: 7, aug: 7, september: 8, sep: 8, sept: 8, october: 9, oct: 9,
  november: 10, nov: 10, december: 11, dec: 11,
}

export interface DateHit {
  date: Date
  start: number
  end: number // exclusive
  said: string
}

function upcomingWeekday(today: Date, wd: number): Date {
  let diff = (wd - today.getDay() + 7) % 7
  if (diff === 0) diff = 7
  return addDays(today, diff)
}
function nextDayOfMonth(today: Date, day: number, month?: number, year?: number): Date | undefined {
  if (day < 1 || day > 31) return undefined
  if (month !== undefined) {
    let y = year ?? today.getFullYear()
    let d = new Date(y, month, day)
    if (d.getMonth() !== month) return undefined
    if (year === undefined && daysBetween(today, d) < -7) { y++; d = new Date(y, month, day) }
    return d
  }
  let d = new Date(today.getFullYear(), today.getMonth(), day)
  if (daysBetween(today, d) < 0) d = new Date(today.getFullYear(), today.getMonth() + 1, day)
  return d
}

const ordinal = (low: string) => {
  const m = low.match(/^(\d{1,2})(st|nd|rd|th)?$/)
  return m ? +m[1] : undefined
}

/**
 * Finds the first delivery-date phrase in the tokens. Tokens are already numberized,
 * so "five days" arrives as [5, days].
 */
export function findDate(toks: Token[], today: Date): DateHit | undefined {
  const T = startOfDay(today)
  const low = (i: number) => toks[i]?.low ?? ''
  const num = (i: number) => toks[i]?.n
  const said = (s: number, e: number) => toks.slice(s, e).map(t => t.t).join(' ')

  for (let i = 0; i < toks.length; i++) {
    const w = low(i)
    const hit = (date: Date | undefined, s: number, e: number): DateHit | undefined =>
      date ? { date, start: s, end: e, said: said(s, e) } : undefined

    if (w === 'today' || w === 'aaj') return hit(T, i, i + 1)
    if (w === 'tomorrow' || w === 'tmrw' || w === 'kal') return hit(addDays(T, 1), i, i + 1)
    if (w === 'parso' || w === 'parson' || w === 'parsoon') return hit(addDays(T, 2), i, i + 1)
    if (w === 'day' && low(i + 1) === 'after' && low(i + 2) === 'tomorrow') return hit(addDays(T, 2), i, i + 3)

    // "next week", "in a week", "one week", "2 weeks", "5 days", "5 din"
    if ((w === 'next' || w === 'agle' || w === 'agla') && (low(i + 1) === 'week' || low(i + 1) === 'hafte' || low(i + 1) === 'hafta'))
      return hit(addDays(T, 7), i, i + 2)
    {
      let j = i
      if (w === 'in' || w === 'after' || w === 'within') j++
      let n = num(j)
      const k = j + 1
      if (n === undefined && (low(j) === 'a' || low(j) === 'ek')) n = 1
      if (n !== undefined && Number.isInteger(n) && n > 0 && n <= 90) {
        const unit = low(k)
        if (/^(day|days|din)$/.test(unit)) { let e = k + 1; if (/^(mein|me|baad)$/.test(low(e))) e++; return hit(addDays(T, n), i, e) }
        if (/^(week|weeks|hafte|hafta|haftey)$/.test(unit)) { let e = k + 1; if (/^(mein|me|baad)$/.test(low(e))) e++; return hit(addDays(T, 7 * n), i, e) }
      }
    }

    // Weekdays, optionally with "next" / "this" / "coming"
    if (w in WEEKDAYS) return hit(upcomingWeekday(T, WEEKDAYS[w]), i, i + 1)
    if ((w === 'next' || w === 'this' || w === 'coming' || w === 'agle' || w === 'is') && low(i + 1) in WEEKDAYS)
      return hit(upcomingWeekday(T, WEEKDAYS[low(i + 1)]), i, i + 2)

    // "15/11", "15/11/2026", "15-11"
    {
      const m = w.match(/^(\d{1,2})\s*\/\s*(\d{1,2})(?:\s*\/\s*(\d{2,4}))?$/)
      if (m) {
        const day = +m[1], mon = +m[2] - 1
        let year = m[3] ? +m[3] : undefined
        if (year !== undefined && year < 100) year += 2000
        if (mon >= 0 && mon < 12) { const d = nextDayOfMonth(T, day, mon, year); if (d) return hit(d, i, i + 1) }
      }
      if (num(i) !== undefined && Number.isInteger(num(i)) && low(i + 1) === '-' && num(i + 2) !== undefined) {
        const day = num(i)!, mon = num(i + 2)! - 1
        if (day <= 31 && mon >= 0 && mon < 12) { const d = nextDayOfMonth(T, day, mon); if (d) return hit(d, i, i + 3) }
      }
    }

    // "7 November", "7th Nov", "7 of November"
    {
      const day = ordinal(w)
      if (day !== undefined) {
        let j = i + 1
        if (low(j) === 'of') j++
        if (low(j) in MONTHS) {
          let e = j + 1
          let year: number | undefined
          if (num(e) !== undefined && num(e)! > 2000) { year = num(e); e++ }
          const d = nextDayOfMonth(T, day, MONTHS[low(j)], year)
          if (d) return hit(d, i, e)
        }
      }
    }
    // "November 7", "Nov 7th"
    if (w in MONTHS && !(w === 'may' && ordinal(low(i + 1)) === undefined)) {
      const day = ordinal(low(i + 1))
      if (day !== undefined) { const d = nextDayOfMonth(T, day, MONTHS[w]); if (d) return hit(d, i, i + 2) }
    }
    // "the 15th", "on 15th" (needs an ordinal suffix so we don't swallow measurements)
    if (/^\d{1,2}(st|nd|rd|th)$/.test(w) && (low(i - 1) === 'the' || low(i - 1) === 'on' || low(i - 1) === 'by' || low(i - 1) === 'delivery' || low(i - 1) === 'due')) {
      const d = nextDayOfMonth(T, ordinal(w)!)
      if (d) return hit(d, i, i + 1)
    }
  }
  return undefined
}

export function formatDay(iso: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }, lang: 'en' | 'hi' = 'en'): string {
  return fromISO(iso).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', opts)
}
