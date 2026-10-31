import { describe, expect, it } from 'vitest'
import { interpret, findCustomers } from './index'
import { addDays, toISO } from './dates'
import { validateDraft } from './validate'
import type { Customer, Draft } from '@/types'

// Saturday 31 October 2026
const today = new Date(2026, 9, 31)
const opts = { today }

function order(text: string): Draft {
  const r = interpret(text, opts)
  if (r.kind !== 'order') throw new Error(`expected order, got ${r.kind}: ${JSON.stringify(r)}`)
  return r.draft
}

describe('Spec §12 test sentences', () => {
  it('1. full Rohan order', () => {
    const d = order('Rohan Mehta, 98765 43210, shirt, chest 38, waist 32, shoulder 17, sleeve 24, length 29, collar 15 and a half, slim fit, two shirts, delivery next Friday, advance 500.')
    expect(d.name).toBe('Rohan Mehta')
    expect(d.phone).toBe('9876543210')
    expect(d.items).toHaveLength(1)
    expect(d.items[0]).toMatchObject({ garment: 'shirt', quantity: 2, fit: 'slim' })
    expect(d.items[0].measurements).toEqual({ chest: 38, waist: 32, shoulder: 17, sleeve: 24, length: 29, collar: 15.5 })
    expect(d.dueDate).toBe('2026-11-06')
    expect(d.advance).toBe(500)
    expect(d.unmatched).toEqual([])
  })

  it('2. Meera blouse with number words', () => {
    const d = order('Meera blouse bust thirty four waist thirty shoulder fourteen delivery tomorrow.')
    expect(d.name).toBe('Meera')
    expect(d.items[0]).toMatchObject({ garment: 'blouse', quantity: 1 })
    expect(d.items[0].measurements).toEqual({ chest: 34, waist: 30, shoulder: 14 })
    expect(d.dueDate).toBe(toISO(addDays(today, 1)))
    expect(d.phone).toBeUndefined()
    expect(d.total).toBeUndefined()
  })

  it('3. two garments for Aman, Saturday', () => {
    const d = order('Shirt chest 38 waist 32, trouser waist 32 length 40, for Aman, Saturday.')
    expect(d.name).toBe('Aman')
    expect(d.items).toHaveLength(2)
    expect(d.items[0]).toMatchObject({ garment: 'shirt', measurements: { chest: 38, waist: 32 } })
    expect(d.items[1]).toMatchObject({ garment: 'trouser', measurements: { waist: 32, length: 40 } })
    expect(d.dueDate).toBe('2026-11-07')
  })

  it('4. correction on the open card', () => {
    const d = order('Rohan Mehta, 98765 43210, shirt, chest 38, collar 15 and a half, delivery next Friday')
    const r = interpret('collar is 15 not 15 and a half', { ...opts, openDraft: d })
    expect(r.kind).toBe('correction')
    if (r.kind !== 'correction') return
    expect(r.draft.items[0].measurements.collar).toBe(15)
    expect(r.draft.items[0].measurements.chest).toBe(38)
    expect(r.changes[0]).toContain('15½ → 15')
  })

  it('5. ready Rohan is a command', () => {
    expect(interpret('ready Rohan', opts)).toEqual({ kind: 'command', command: { kind: 'status', status: 'ready', who: 'rohan' } })
    expect(interpret('Rohan is ready', opts)).toMatchObject({ kind: 'command', command: { status: 'ready', who: 'rohan' } })
  })

  it("6. what's due this week is a command", () => {
    expect(interpret("what's due this week", opts)).toEqual({ kind: 'command', command: { kind: 'due', filter: 'week' } })
  })

  it('7. kurta chest 140 warns about centimetres', () => {
    const d = order('kurta chest 140')
    expect(d.items[0]).toMatchObject({ garment: 'kurta', measurements: { chest: 140 } })
    const issues = validateDraft(d, { today, customers: [], orders: [] })
    expect(issues.find(i => i.field === 'm.0.chest')?.message).toMatch(/centimetres/)
  })

  it('8. no date -> delivery date flagged as missing', () => {
    const d = order('Priya trouser waist 28')
    expect(d.name).toBe('Priya')
    expect(d.dueDate).toBeUndefined()
    const issues = validateDraft(d, { today, customers: [], orders: [] })
    expect(issues.some(i => i.field === 'dueDate' && i.level === 'missing')).toBe(true)
  })

  it('9. empty and nonsense text save nothing', () => {
    expect(interpret('', opts).kind).toBe('nothing')
    const r = interpret('hello test', opts)
    expect(r.kind).toBe('nothing')
    if (r.kind === 'nothing') expect(r.message).toMatch(/couldn.t find an order or a command/)
  })

  it('10. two Rohans -> both returned so the app can ask', () => {
    const customers: Customer[] = [
      { id: 'a', name: 'Rohan Mehta', createdAt: '' },
      { id: 'b', name: 'Rohan Kapoor', createdAt: '' },
      { id: 'c', name: 'Meera Shah', createdAt: '' },
    ]
    expect(findCustomers('rohan', customers).map(c => c.id)).toEqual(['a', 'b'])
    expect(findCustomers('rohan mehta', customers).map(c => c.id)).toEqual(['a'])
  })
})

describe('Numbers, Hinglish and dates', () => {
  it('fractions', () => {
    const d = order('Shirt sleeve twenty four and a quarter, shoulder seventeen and three quarters, collar 15 1/2, chest 38 point five')
    expect(d.items[0].measurements).toEqual({ sleeve: 24.25, shoulder: 17.75, collar: 15.5, chest: 38.5 })
  })
  it('Hinglish fields and Hindi number words', () => {
    const d = order('Pooja kurta seena chautis kamar battis lambai byalis, aasteen saadhe bees, parso')
    expect(d.name).toBe('Pooja')
    expect(d.items[0]).toMatchObject({ garment: 'kurta', measurements: { chest: 34, waist: 32, length: 42, sleeve: 20.5 } })
    expect(d.dueDate).toBe(toISO(addDays(today, 2)))
  })
  it('"do kurta" is two kurtas', () => {
    expect(order('Sunil do kurta chest 40').items[0].quantity).toBe(2)
  })
  it('dates', () => {
    expect(order('shirt chest 38 delivery 7 November').dueDate).toBe('2026-11-07')
    expect(order('shirt chest 38 delivery 7th Nov').dueDate).toBe('2026-11-07')
    expect(order('shirt chest 38 delivery 15/11').dueDate).toBe('2026-11-15')
    expect(order('shirt chest 38 in 5 days').dueDate).toBe('2026-11-05')
    expect(order('shirt chest 38 next week').dueDate).toBe('2026-11-07')
  })
  it('money', () => {
    const d = order('Ravi 2 shirts chest 40, price 900 each, Rs 500 advance')
    expect(d.total).toBe(1800)
    expect(d.advance).toBe(500)
    expect(order('shirt chest 40 total 1800 paid 1000').advance).toBe(1000)
  })
  it('cm spoken for one value', () => {
    const d = order('shirt chest 97 cm waist 32')
    expect(d.items[0].measurements.chest).toBeCloseTo(38.19, 1)
    expect(d.items[0].measurements.waist).toBe(32)
  })
  it('notes', () => {
    expect(order('Rohan shirt chest 38, note: pocket on left').notes).toEqual(['pocket on left'])
  })
  it('measurement without a number stays blank and flagged', () => {
    const d = order('Rohan shirt chest 38 collar')
    expect(d.items[0].measurements.collar).toBeUndefined()
    expect(d.items[0].unclear).toContain('collar')
  })
})

describe('Corrections', () => {
  const base = () => order('Rohan Mehta shirt chest 38 collar 15.5 slim fit delivery Friday advance 500')
  const fix = (d: Draft, t: string) => interpret(t, { ...opts, openDraft: d })
  it('change X to N', () => {
    const r = fix(base(), 'change collar to 15')
    expect(r.kind === 'correction' && r.draft.items[0].measurements.collar).toBe(15)
  })
  it('make delivery Saturday', () => {
    const r = fix(base(), 'make delivery Saturday')
    expect(r.kind === 'correction' && r.draft.dueDate).toBe('2026-11-07')
  })
  it('advance 1000', () => {
    const r = fix(base(), 'advance 1000')
    expect(r.kind === 'correction' && r.draft.advance).toBe(1000)
  })
  it('add note', () => {
    const r = fix(base(), 'add note pocket on left')
    expect(r.kind === 'correction' && r.draft.notes).toEqual(['pocket on left'])
  })
  it('remove the fit', () => {
    const r = fix(base(), 'remove the fit')
    expect(r.kind === 'correction' && r.draft.items[0].fit).toBeUndefined()
  })
  it("that's wrong, name is Rohan Mehra", () => {
    const r = fix(base(), "that's wrong, name is Rohan Mehra")
    expect(r.kind === 'correction' && r.draft.name).toBe('Rohan Mehra')
  })
  it('ambiguous correction asks a question', () => {
    const two = order('Aman shirt chest 38 waist 32, trouser waist 32 length 40, Saturday')
    const r = fix(two, 'waist 34')
    expect(r.kind).toBe('correction')
    if (r.kind === 'correction') expect(r.question).toMatch(/shirt or trouser/)
  })
})

describe('Commands', () => {
  it.each([
    ['delivered Rohan', { kind: 'status', status: 'delivered', who: 'rohan' }],
    ["Rohan's measurements", { kind: 'show', who: 'rohan' }],
    ['show Meera', { kind: 'show', who: 'meera' }],
    ['due tomorrow', { kind: 'due', filter: 'tomorrow' }],
    ['balance Rohan', { kind: 'balance', who: 'rohan' }],
    ['paid 1000 Rohan', { kind: 'paid', who: 'rohan', amount: 1000 }],
    ['Rohan paid 1000', { kind: 'paid', who: 'rohan', amount: 1000 }],
    ['undo', { kind: 'undo' }],
    ['Rohan ka order taiyar hai', { kind: 'status', status: 'ready', who: 'rohan' }],
  ])('%s', (text, cmd) => {
    expect(interpret(text, opts)).toEqual({ kind: 'command', command: cmd })
  })
})

describe('Order numbers, garments, help and summary', () => {
  it.each([
    ['ready 47', { kind: 'status', status: 'ready', who: '47' }],
    ['delivered order 47', { kind: 'status', status: 'delivered', who: '47' }],
    ['ready Rohan kurta', { kind: 'status', status: 'ready', who: 'rohan', garment: 'kurta' }],
    ['Rohan ka kurta taiyar hai', { kind: 'status', status: 'ready', who: 'rohan', garment: 'kurta' }],
    ['help', { kind: 'help' }],
    ["today's summary", { kind: 'summary' }],
    ['aaj ka hisaab', { kind: 'summary' }],
  ])('%s', (text, cmd) => {
    expect(interpret(text, opts)).toEqual({ kind: 'command', command: cmd })
  })
  it('a garment with measurements is still an order', () => {
    expect(interpret('Rohan kurta chest 40', opts).kind).toBe('order')
    expect(interpret('Sunil do kurta', opts).kind).not.toBe('command')
  })
})

describe('Trial, fabric, alterations', () => {
  it('trial date separate from delivery', () => {
    const d = order('Imran sherwani chest 40, trial Tuesday, delivery 14 Nov')
    expect(d.trialDate).toBe('2026-11-03')
    expect(d.dueDate).toBe('2026-11-14')
  })
  it('fabric', () => {
    expect(order('Rohan shirt chest 38, own fabric, Friday').fabric).toEqual({ from: 'customer', received: true })
    expect(order('Rohan shirt chest 38, cloth later, Friday').fabric).toEqual({ from: 'customer', received: false })
    expect(order('Rohan shirt chest 38, shop fabric, Friday').fabric).toEqual({ from: 'shop', received: true })
  })
  it('alteration order', () => {
    const d = order('Ravi pant shorten 1 inch, 50 rupees, kal')
    expect(d.kind).toBe('alteration')
    expect(d.items[0].garment).toBe('trouser')
    expect(d.total).toBe(50)
    expect(d.notes[0]).toBe('shorten 1 inch')
    expect(d.dueDate).toBe('2026-11-01')
  })
})

describe('Hindi in Devanagari', () => {
  it('order', () => {
    const d = order('रोहन शर्ट सीना ३८ कमर 32 गला साढ़े पंद्रह, दो शर्ट, शुक्रवार डिलीवरी, एडवांस 500')
    expect(d.name).toBe('रोहन')
    expect(d.items[0]).toMatchObject({ garment: 'shirt', quantity: 2, measurements: { chest: 38, waist: 32, collar: 15.5 } })
    expect(d.dueDate).toBe('2026-11-06')
    expect(d.advance).toBe(500)
  })
  it('number words and dates', () => {
    const d = order('मीरा ब्लाउज़ सीना चौंतीस कमर तीस लंबाई पंद्रह, परसों')
    expect(d.items[0]).toMatchObject({ garment: 'blouse', measurements: { chest: 34, waist: 30, length: 15 } })
    expect(d.dueDate).toBe('2026-11-02')
  })
  it('hindi commands', () => {
    expect(interpret('मीरा का ऑर्डर तैयार है', opts)).toMatchObject({ kind: 'command', command: { kind: 'status', status: 'ready', who: 'मीरा' } })
    expect(interpret('आज का हिसाब', opts)).toMatchObject({ kind: 'command', command: { kind: 'summary' } })
  })
  it('correction', () => {
    const d = order('रोहन शर्ट सीना 38 गला साढ़े पंद्रह शुक्रवार')
    const r = interpret('गला पंद्रह', { ...opts, openDraft: d })
    expect(r.kind === 'correction' && r.draft.items[0].measurements.collar).toBe(15)
  })
})

describe('From the mixed-language audio recordings', () => {
  it('self-correction inside one sentence: last value wins', () => {
    expect(order('shirt chest 41, sleeve 25, no, make it 24.5').items[0].measurements.sleeve).toBe(24.5)
    expect(order('kurta sleeve 25 nahi 24').items[0].measurements.sleeve).toBe(24)
    expect(order('shirt collar 15 sorry 15.5, chest 40').items[0].measurements).toMatchObject({ collar: 15.5, chest: 40 })
  })
  it('a value said as "not provided" stays blank and flagged', () => {
    const d = order('shirt chest 41, waist measurement is not provided')
    expect(d.items[0].measurements.waist).toBeUndefined()
    expect(d.items[0].unclear).toContain('waist')
  })
  it('chatter before the order is not a name', () => {
    expect(order('Hamai, shirtanuma pleihe, waist 37 inches, shoulder 17, sleeve 24').name).toBeUndefined()
    expect(order('Lada pati lako, chabi chaliis, kamar chebriis, chest 40, waist 36').name).toBeUndefined()
    expect(order('haan chalo likho, shirt chest 40').name).toBeUndefined()
    expect(order('okay so, shirt chest 40').name).toBeUndefined()
  })
  it('real names before a garment, number or measurement still work', () => {
    expect(order('Ravi 2 shirts chest 40').name).toBe('Ravi')
    expect(order('Meera bust 34 blouse').name).toBe('Meera')
  })
})
