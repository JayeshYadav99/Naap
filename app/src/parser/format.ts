/** 15.5 -> "15½", 24.25 -> "24¼", 17.75 -> "17¾", other decimals as-is. */
export function fmtNum(n: number): string {
  const whole = Math.floor(n)
  const frac = Math.round((n - whole) * 100) / 100
  const glyph: Record<number, string> = { 0.5: '½', 0.25: '¼', 0.75: '¾' }
  if (frac === 0) return String(whole)
  if (glyph[frac]) return whole === 0 ? glyph[frac] : `${whole}${glyph[frac]}`
  return String(Math.round(n * 10) / 10)
}

export function rupees(n: number): string {
  return 'Rs ' + n.toLocaleString('en-IN')
}

export function toUnit(inches: number, unit: 'in' | 'cm'): number {
  return unit === 'cm' ? Math.round(inches * 2.54 * 10) / 10 : inches
}
export function fromUnit(value: number, unit: 'in' | 'cm'): number {
  return unit === 'cm' ? Math.round((value / 2.54) * 100) / 100 : value
}
export function fmtMeasure(inches: number, unit: 'in' | 'cm'): string {
  return unit === 'cm' ? String(toUnit(inches, 'cm')) : fmtNum(inches)
}

export function formatPhone(p?: string): string {
  if (!p) return ''
  return p.length === 10 ? `${p.slice(0, 5)} ${p.slice(5)}` : p
}
