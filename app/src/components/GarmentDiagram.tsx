'use client'

import type { Garment, Unit } from '@/types'
import { measureLabel } from '@/parser/vocab'
import { fmtMeasure } from '@/parser/format'
import { useLang } from '@/i18n'

type Family = 'top' | 'bottom' | 'blouse' | 'dress'
const FAMILY: Record<Garment, Family> = {
  shirt: 'top', kurta: 'top', suit: 'top', blazer: 'top', jacket: 'top', waistcoat: 'top', sherwani: 'top',
  trouser: 'bottom', pyjama: 'bottom', salwar: 'bottom',
  blouse: 'blouse', dress: 'dress', lehenga: 'dress',
}

// Simple flat outlines on a 240 x 300 board. Each measurement is a line with a label at (lx, ly).
const OUTLINE: Record<Family, string> = {
  top: 'M92 30 L120 40 L148 30 L190 46 L226 128 L204 138 L176 88 L176 262 L64 262 L64 88 L36 138 L14 128 L50 46 Z',
  blouse: 'M94 40 L120 64 L146 40 L186 54 L208 104 L188 112 L172 92 L176 168 L64 168 L68 92 L52 112 L32 104 L54 54 Z',
  bottom: 'M64 24 L176 24 L184 120 L196 284 L140 284 L124 120 L116 120 L100 284 L44 284 L56 120 Z',
  dress: 'M94 30 L120 46 L146 30 L176 42 L190 92 L172 98 L166 80 L162 130 L210 282 L30 282 L78 130 L74 80 L68 98 L50 92 L64 42 Z',
}

interface Line { key: string; x1: number; y1: number; x2: number; y2: number; lx: number; ly: number; anchor?: 'start' | 'middle' | 'end' }
const LINES: Record<Family, Line[]> = {
  top: [
    { key: 'collar', x1: 104, y1: 36, x2: 136, y2: 36, lx: 120, ly: 22 },
    { key: 'shoulder', x1: 50, y1: 50, x2: 190, y2: 50, lx: 120, ly: 64 },
    { key: 'chest', x1: 64, y1: 104, x2: 176, y2: 104, lx: 120, ly: 98 },
    { key: 'waist', x1: 64, y1: 160, x2: 176, y2: 160, lx: 120, ly: 154 },
    { key: 'hip', x1: 64, y1: 220, x2: 176, y2: 220, lx: 120, ly: 214 },
    { key: 'length', x1: 120, y1: 40, x2: 120, y2: 262, lx: 124, ly: 250, anchor: 'start' },
    { key: 'sleeve', x1: 190, y1: 46, x2: 226, y2: 128, lx: 252, ly: 152, anchor: 'end' },
    { key: 'armhole', x1: 64, y1: 88, x2: 50, y2: 50, lx: 10, ly: 80, anchor: 'start' },
    { key: 'bicep', x1: 30, y1: 92, x2: 54, y2: 80, lx: 4, ly: 104, anchor: 'start' },
    { key: 'cuff', x1: 14, y1: 128, x2: 36, y2: 138, lx: 4, ly: 154, anchor: 'start' },
  ],
  blouse: [
    { key: 'shoulder', x1: 54, y1: 54, x2: 186, y2: 54, lx: 120, ly: 48 },
    { key: 'neckFront', x1: 120, y1: 40, x2: 120, y2: 64, lx: 124, ly: 84, anchor: 'start' },
    { key: 'chest', x1: 66, y1: 110, x2: 174, y2: 110, lx: 120, ly: 104 },
    { key: 'waist', x1: 64, y1: 150, x2: 176, y2: 150, lx: 120, ly: 144 },
    { key: 'length', x1: 182, y1: 54, x2: 182, y2: 168, lx: 188, ly: 140, anchor: 'start' },
    { key: 'sleeve', x1: 186, y1: 54, x2: 208, y2: 104, lx: 252, ly: 126, anchor: 'end' },
    { key: 'armhole', x1: 68, y1: 92, x2: 54, y2: 54, lx: 8, ly: 86, anchor: 'start' },
  ],
  bottom: [
    { key: 'waist', x1: 64, y1: 30, x2: 176, y2: 30, lx: 120, ly: 46 },
    { key: 'hip', x1: 60, y1: 76, x2: 180, y2: 76, lx: 120, ly: 70 },
    { key: 'rise', x1: 120, y1: 24, x2: 120, y2: 120, lx: 124, ly: 104, anchor: 'start' },
    { key: 'thigh', x1: 54, y1: 140, x2: 102, y2: 140, lx: 50, ly: 136, anchor: 'end' },
    { key: 'knee', x1: 50, y1: 200, x2: 102, y2: 200, lx: 46, ly: 196, anchor: 'end' },
    { key: 'bottom', x1: 44, y1: 280, x2: 100, y2: 280, lx: 72, ly: 298 },
    { key: 'length', x1: 192, y1: 24, x2: 196, y2: 284, lx: 252, ly: 150, anchor: 'end' },
    { key: 'inseam', x1: 136, y1: 124, x2: 144, y2: 280, lx: 150, ly: 230, anchor: 'start' },
  ],
  dress: [
    { key: 'shoulder', x1: 64, y1: 42, x2: 176, y2: 42, lx: 120, ly: 36 },
    { key: 'chest', x1: 76, y1: 90, x2: 164, y2: 90, lx: 120, ly: 84 },
    { key: 'waist', x1: 78, y1: 130, x2: 162, y2: 130, lx: 120, ly: 124 },
    { key: 'hip', x1: 66, y1: 170, x2: 174, y2: 170, lx: 120, ly: 164 },
    { key: 'length', x1: 120, y1: 46, x2: 120, y2: 282, lx: 124, ly: 262, anchor: 'start' },
    { key: 'sleeve', x1: 176, y1: 42, x2: 190, y2: 92, lx: 252, ly: 112, anchor: 'end' },
  ],
}

/**
 * Flat 2D outline of the garment with each measurement drawn where it is taken.
 * Missing values show as "?" in amber so gaps are visible at a glance.
 */
export function GarmentDiagram({ garment, measurements, unclear, unit, title }: {
  garment: Garment
  measurements: Record<string, number>
  unclear: string[]
  unit: Unit
  title: string
}) {
  const { lang } = useLang()
  const fam = FAMILY[garment]
  const lines = LINES[fam]
  const described = lines.map(l => `${measureLabel(l.key, garment, lang)} ${measurements[l.key] !== undefined ? fmtMeasure(measurements[l.key], unit) : '?'}`).join(', ')
  return (
    <svg className="diagram" viewBox="-8 0 268 306" role="img" aria-label={`${title}: ${described}`}>
      <path d={OUTLINE[fam]} className="dg-body" />
      {lines.map(l => {
        const v = measurements[l.key]
        const missing = v === undefined
        const flag = unclear.includes(l.key)
        return (
          <g key={l.key} className={missing ? (flag ? 'dg-flag' : 'dg-missing') : 'dg-ok'}>
            <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} className="dg-line" />
            <text x={l.lx} y={l.ly} textAnchor={l.anchor ?? 'middle'} className="dg-text">
              {measureLabel(l.key, garment, lang)} {missing ? '?' : fmtMeasure(v, unit)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
