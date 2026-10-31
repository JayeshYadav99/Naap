import { describe, expect, it } from 'vitest'
import { interpret } from './index'
import type { Draft } from '@/types'

// Real-style shop conversations (speaker labels included, as a transcript would have them).
const today = new Date(2026, 9, 31)
const read = (text: string): Draft => {
  const r = interpret(text, { today })
  if (r.kind !== 'order') throw new Error(`expected an order, got ${r.kind}`)
  return r.draft
}

const D1 = `Tailor: Haan bhai, shirt ka measurement start karte hain. Chest kitna aa raha hai?
Customer: 40 inch hai.
Tailor: Achha, waist?
Customer: 36 hai, aur shoulder 17 inch.
Tailor: Shirt ki length kitni rakhein?
Customer: 28 inch. Sleeve 24 rakhna.
Tailor: Collar?
Customer: 15.5 inch.
Tailor: Ek baar confirm kar deta hoon, chest 40, waist 36, shoulder 17, length 28, sleeve 24 aur collar 15.5.
Customer: Haan, bilkul sahi.`

const D2 = `Tailor: Chalo bhai, pant ka measurement lete hain. Waist bolo.
Customer: 34 inch.
Tailor: Hip?
Customer: 40 inch.
Tailor: Full length?
Customer: 41 inch... nahi, 40.5 kar dena.
Tailor: Theek hai, 40.5. Inseam?
Customer: 29 inch.
Tailor: Bottom 14 rakhein?
Customer: Haan, 14.5 kar do actually. Thoda loose chahiye.
Tailor: Okay, bottom 14.5. Thigh 23 inch hai.
Customer: Haan.`

const D3 = `Tailor: Jaldi se measurements note kar lo, customer ko jaana hai.
Helper: Haan bolo.
Tailor: Shirt chest 42, waist 39, shoulder 18, length 29, sleeve 25 aur collar 16 inch.
Helper: Chest 42 aur waist 39, correct?
Tailor: Haan. Aur ek minute, sleeve 24.5 kar dena. Baaki same.
Helper: Done.`

const D4 = `Tailor: Kem cho bhai, chalo measurement lai laiye. Shirt ni chest ketli che?
Customer: 41 inch che.
Tailor: Waist?
Customer: 37 che. Shoulder 17.5 rakhjo.
Tailor: Length 29 inch?
Customer: Haan, ane sleeve 24 inch. Collar 15.5 rakhjo.
Tailor: Fit regular rakhvu che ke slim?
Customer: Regular j rakhjo, tight nahi joie.`

const D5 = `Tailor: Aaj kya kya silwana hai?
Customer: Ek shirt aur ek pant silwani hai.
Tailor: Shirt ka chest 40, waist 36, shoulder 17.5 aur length 28 inch.
Customer: Sleeve 24 inch rakhna.
Tailor: Pant ka waist 34, hip 40, full length 40 aur inseam 29 inch.
Customer: Dono ka measurement same customer profile mein save karna.`

const D6 = `Tailor: Shirt ka chest 42 inch hai.
Helper: Waist?
Tailor: Abhi nahi liya.
Helper: Shoulder?
Tailor: 18 inch.
Helper: Sleeve?
Tailor: 25 inch. Length 29 inch.
Helper: Collar?
Tailor: Woh bhi pending hai. Baad mein le lenge.`

const D7 = `Tailor: Bhai, pant ka waist 36 inch likho.
Customer: Nahi bhaiya, 35.5 hai.
Tailor: Achha, 35.5. Hip 41 inch.
Customer: Full length 102 centimetre rakhna.
Tailor: 102 centimetre, okay. Bottom 15 inch.
Customer: Aur inseam 30 inch.
Tailor: Thigh 24 inch aur knee 18 inch.
Customer: Ek correction, bottom 14.5 kar dena.`

describe('Shop conversations (dataset from the user)', () => {
  it('1. men’s shirt, question and answer', () => {
    const d = read(D1)
    expect(d.items).toHaveLength(1)
    expect(d.items[0].garment).toBe('shirt')
    expect(d.items[0].measurements).toEqual({ chest: 40, waist: 36, shoulder: 17, length: 28, sleeve: 24, collar: 15.5 })
    expect(d.name).toBeUndefined()
  })
  it('2. trouser with corrections', () => {
    const d = read(D2)
    expect(d.items).toHaveLength(1)
    expect(d.items[0].garment).toBe('trouser')
    expect(d.items[0].measurements).toEqual({ waist: 34, hip: 40, length: 40.5, inseam: 29, bottom: 14.5, thigh: 23 })
  })
  it('3. fast speech with a late sleeve correction', () => {
    const d = read(D3)
    expect(d.items[0].measurements).toEqual({ chest: 42, waist: 39, shoulder: 18, length: 29, sleeve: 24.5, collar: 16 })
  })
  it('4. Gujarati-influenced Hinglish, fit regular (not slim, not tight)', () => {
    const d = read(D4)
    expect(d.items[0].measurements).toEqual({ chest: 41, waist: 37, shoulder: 17.5, length: 29, sleeve: 24, collar: 15.5 })
    expect(d.items[0].fit).toBe('regular')
  })
  it('5. shirt and pant for the same customer', () => {
    const d = read(D5)
    expect(d.items).toHaveLength(2)
    expect(d.items.find(i => i.garment === 'shirt')!.measurements).toEqual({ chest: 40, waist: 36, shoulder: 17.5, length: 28, sleeve: 24 })
    expect(d.items.find(i => i.garment === 'trouser')!.measurements).toEqual({ waist: 34, hip: 40, length: 40, inseam: 29 })
  })
  it('6. incomplete: waist and collar stay empty', () => {
    const d = read(D6)
    expect(d.items[0].measurements).toEqual({ chest: 42, shoulder: 18, sleeve: 25, length: 29 })
    expect(d.items[0].measurements.waist).toBeUndefined()
    expect(d.items[0].measurements.collar).toBeUndefined()
  })
  it('7. corrections and mixed units: bottom 14.5, length 102 cm', () => {
    const d = read(D7)
    const m = d.items[0].measurements
    expect(m.waist).toBe(35.5)
    expect(m.hip).toBe(41)
    expect(m.length).toBeCloseTo(102 / 2.54, 1)
    expect(d.items[0].cmSpoken).toContain('length')
    expect(m.bottom).toBe(14.5)
    expect(m.inseam).toBe(30)
    expect(m.thigh).toBe(24)
    expect(m.knee).toBe(18)
  })
})
