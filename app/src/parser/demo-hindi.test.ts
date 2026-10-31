import { describe, expect, it } from 'vitest'
import { interpret } from './index'
import type { Draft } from '@/types'

// The exact lines in the Hindi demo script (Flow set to Hinglish, so names stay in English letters).
const today = new Date(2026, 9, 31)
const opts = { today, lang: 'hi' as const }

describe('Hindi demo script', () => {
  let card: Draft
  it('order in Hinglish', () => {
    const r = interpret('Rohan Mehta, 98765 43210, shirt, seena 38, kamar 32, kandha 17, baju 24, lambai 29, gala saadhe pandrah, slim fitting, do shirt, shukravar delivery, advance 500', opts)
    expect(r.kind).toBe('order')
    if (r.kind !== 'order') return
    card = r.draft
    expect(card.name).toBe('Rohan Mehta')
    expect(card.items[0]).toMatchObject({ garment: 'shirt', quantity: 2, fit: 'slim', measurements: { chest: 38, waist: 32, shoulder: 17, sleeve: 24, length: 29, collar: 15.5 } })
    expect(card.dueDate).toBe('2026-11-06')
    expect(card.advance).toBe(500)
    expect(card.unmatched).toEqual([])
  })
  it('correction in Hinglish', () => {
    const r = interpret('gala pandrah inch kar do', { ...opts, openDraft: card })
    expect(r.kind).toBe('correction')
    if (r.kind === 'correction') expect(r.draft.items[0].measurements.collar).toBe(15)
  })
  it.each([
    ['Meera ka order taiyar hai', { kind: 'status', status: 'ready', who: 'meera' }],
    ['kiska paisa baaki hai', { kind: 'owed' }],
    ['is mahine kitne order aaye', { kind: 'stats', period: 'month' }],
    ['aaj ka hisaab', { kind: 'summary' }],
    ['kya ready hai', { kind: 'readyList' }],
    ['Rohan ka naap dikhao', { kind: 'show', who: 'rohan' }],
  ])('%s', (text, cmd) => {
    expect(interpret(text, opts)).toEqual({ kind: 'command', command: cmd })
  })
})
