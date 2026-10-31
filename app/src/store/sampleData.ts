import type { AppData, Customer, Order, Settings } from '@/types'
import { addDays, toISO } from '@/parser/dates'

export const DEFAULT_SETTINGS: Settings = {
  shopName: 'Sharma Tailors',
  shopPhone: '98200 45678',
  unit: 'in',
  countryCode: '91',
  messageLang: 'en',
}

/**
 * Made-up customers (spec §11) plus a few more so every due-list group has content.
 * Measurements follow common Indian size charts (e.g. bust 32–44 with shoulder 14–17 for blouses).
 * Dates are relative to today so the due list always looks alive.
 */
export function sampleData(now = new Date()): AppData {
  const day = (n: number) => toISO(addDays(now, n))
  const at = (n: number, hour = 11) => { const d = addDays(now, n); d.setHours(hour, 15); return d.toISOString() }

  const customers: Customer[] = [
    { id: 'c-rohan', name: 'Rohan Mehta', phone: '9876543210', createdAt: at(-243) },
    { id: 'c-meera', name: 'Meera Shah', phone: '9123456780', createdAt: at(-180) },
    { id: 'c-aman', name: 'Aman Verma', createdAt: at(-10) },
    { id: 'c-kavita', name: 'Kavita Desai', phone: '9988776655', createdAt: at(-3) },
    { id: 'c-rajesh', name: 'Rajesh Patel', createdAt: at(-1) },
    { id: 'c-sunita', name: 'Sunita Iyer', phone: '9820011223', createdAt: at(-5), notes: 'Prefers padded blouses.' },
    { id: 'c-imran', name: 'Imran Shaikh', phone: '9004055667', createdAt: at(-2) },
    { id: 'c-pooja', name: 'Pooja Nair', phone: '9769033445', createdAt: at(-7) },
  ]

  const orders = ([
    {
      id: 'o-rohan-2', customerId: 'c-rohan', createdAt: at(-4), dueDate: day(6), status: 'stitching',
      items: [{ garment: 'shirt', quantity: 2, fit: 'slim', measurements: { chest: 38, waist: 32, shoulder: 17, sleeve: 24, length: 29, collar: 15.5 } }],
      total: 1800, advance: 500,
      rawText: 'Rohan Mehta, 98765 43210, shirt, chest 38, waist 32, shoulder 17, sleeve 24, length 29, collar 15 and a half, slim fit, two shirts, advance 500.',
    },
    {
      id: 'o-meera-2', customerId: 'c-meera', createdAt: at(-6), dueDate: day(1), status: 'ready',
      items: [{ garment: 'blouse', quantity: 3, measurements: { chest: 34, waist: 30, shoulder: 14, sleeve: 12, length: 15 } }],
      total: 1500, advance: 1500,
      rawText: 'Meera Shah, 91234 56780, three blouses, bust 34, waist 30, shoulder 14, sleeve 12, length 15, total 1500, paid 1500.',
    },
    {
      id: 'o-aman-1', customerId: 'c-aman', createdAt: at(-10), dueDate: day(-2), status: 'stitching',
      items: [{ garment: 'trouser', quantity: 1, measurements: { waist: 34, hip: 40, length: 41, bottom: 15 } }],
      total: 900, advance: 0,
      rawText: 'Aman Verma trouser waist 34 hip 40 length 41 bottom 15, total 900.',
    },
    {
      id: 'o-kavita-1', customerId: 'c-kavita', createdAt: at(-3), dueDate: day(3), status: 'cutting',
      items: [{ garment: 'kurta', quantity: 2, measurements: { chest: 36, waist: 34, hip: 40, shoulder: 14.5, sleeve: 22, length: 40 } }],
      advance: 0,
      rawText: 'Kavita Desai, 99887 76655, do kurta, seena 36, kamar 34, hip 40, kandha saadhe chaudah, baju 22, lambai 40.',
    },
    {
      id: 'o-rajesh-1', customerId: 'c-rajesh', createdAt: at(-1), dueDate: day(9), status: 'new',
      items: [{ garment: 'suit', quantity: 1, fit: 'regular', measurements: { chest: 42, waist: 38, shoulder: 18, sleeve: 25, length: 30 } }],
      total: 7500, advance: 2000, fabric: { from: 'customer', received: false, detail: 'Navy wool, 3 m' },
      rawText: 'Rajesh Patel suit chest 42 waist 38 shoulder 18 sleeve 25 length 30 regular fit, total 7500, advance 2000.',
    },
    {
      id: 'o-rohan-1', customerId: 'c-rohan', createdAt: at(-243), dueDate: day(-236), status: 'delivered',
      items: [{ garment: 'shirt', quantity: 1, measurements: { chest: 37 } }],
      total: 650, advance: 650,
      rawText: 'Rohan Mehta shirt chest 37.',
    },
    {
      id: 'o-sunita-1', customerId: 'c-sunita', createdAt: at(-5), dueDate: day(0), status: 'stitching',
      items: [{ garment: 'blouse', quantity: 2, measurements: { chest: 36, waist: 30, shoulder: 15, sleeve: 10, length: 14.5, armhole: 16, neckFront: 7, neckBack: 9 } }],
      total: 1600, advance: 800, notes: 'Padded, hooks at the back.',
      rawText: 'Sunita Iyer, 98200 11223, two blouses, bust 36, waist 30, shoulder 15, sleeve 10, length 14 and a half, armhole 16, front neck 7, back neck 9, note padded, hooks at the back.',
    },
    {
      id: 'o-imran-1', customerId: 'c-imran', createdAt: at(-2), dueDate: day(14), status: 'new',
      items: [{ garment: 'sherwani', quantity: 1, measurements: { chest: 40, waist: 36, hip: 40, shoulder: 18, sleeve: 25, length: 42, collar: 16 } }],
      total: 12000, advance: 5000, notes: 'Wedding outfit.', trialDate: day(5),
      rawText: 'Imran Shaikh, 90040 55667, sherwani chest 40 waist 36 hip 40 shoulder 18 sleeve 25 length 42 neck 16, total 12000, advance 5000.',
    },
    {
      id: 'o-pooja-1', customerId: 'c-pooja', createdAt: at(-7), dueDate: day(2), status: 'stitching',
      items: [
        { garment: 'kurta', quantity: 1, measurements: { chest: 34, waist: 30, hip: 38, shoulder: 14, sleeve: 20, length: 42 } },
        { garment: 'salwar', quantity: 1, measurements: { waist: 30, hip: 40, length: 39, bottom: 14 } },
      ],
      total: 2200, advance: 1000,
      rawText: 'Pooja Nair kurta seena 34 kamar 30 hip 38 kandha 14 baju 20 lambai 42, salwar kamar 30 hip 40 lambai 39 mohri 14, total 2200 advance 1000.',
    },
    {
      id: 'o-meera-1', customerId: 'c-meera', createdAt: at(-180), dueDate: day(-172), status: 'delivered',
      items: [{ garment: 'blouse', quantity: 1, measurements: { chest: 33, waist: 29, shoulder: 14, sleeve: 12, length: 15 } }],
      total: 500, advance: 500,
      rawText: 'Meera blouse bust 33 waist 29 shoulder 14 sleeve 12 length 15.',
    },
  ] as Omit<Order, 'number'>[]).map(o => ({ ...o, number: 0 })) as Order[]

  // Token numbers in the order the work came in.
  ;[...orders].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).forEach((o, i) => { o.number = 41 + i })
  return { version: 1, settings: { ...DEFAULT_SETTINGS }, customers, orders }
}
