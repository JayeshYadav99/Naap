import { describe, expect, it } from 'vitest'
import { interpret } from './index'

// The Hindi demo conversation, as Wispr Flow (Hinglish) would type it while the tailor keeps it listening.
// Tailor, customer and helper all speak; Flow writes no speaker names.
const today = new Date(2026, 9, 31)
export const DEMO_CONVERSATION = `Aaiye bhaiya, kya silwana hai? Do shirt banani hain. Naam bataiye? Rohan Mehta. Number? 98765 43210. Chaliye naap lete hain. Chest kitna aa raha hai... 38. 38 likh liya. Kamar 32. Kandha 17. Baju 24. Lambai kitni rakhein? 29 rakhna. Collar saadhe pandrah. Nahi bhaiya, collar 15 hi rakhna. Fitting kaisi chahiye, slim ya regular? Slim. Kab tak chahiye? Shukravar tak de dena. 500 advance de deta hoon. Theek hai, shirt, chest 38, kamar 32, kandha 17, baju 24, lambai 29, collar 15, slim, shukravar.`

describe('Hindi demo conversation (tailor, customer, helper)', () => {
  for (const [label, text] of [
    ['as Flow types it', DEMO_CONVERSATION],
    ['with speaker labels', DEMO_CONVERSATION.replace('Aaiye', 'Darzi: Aaiye').replace('Do shirt', 'Grahak: Do shirt').replace('38 likh', 'Helper: 38 likh')],
  ] as const) {
    it(label, () => {
      const r = interpret(text, { today, lang: 'hi' })
      expect(r.kind).toBe('order')
      if (r.kind !== 'order') return
      const d = r.draft
      expect(d.name).toBe('Rohan Mehta')
      expect(d.phone).toBe('9876543210')
      expect(d.items).toHaveLength(1)
      expect(d.items[0]).toMatchObject({ garment: 'shirt', quantity: 2, fit: 'slim' })
      expect(d.items[0].measurements).toEqual({ chest: 38, waist: 32, shoulder: 17, sleeve: 24, length: 29, collar: 15 })
      expect(d.dueDate).toBe('2026-11-06')
      expect(d.advance).toBe(500)
    })
  }
})
