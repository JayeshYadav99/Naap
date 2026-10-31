export type Status = 'new' | 'cutting' | 'stitching' | 'ready' | 'delivered'
export const STATUSES: Status[] = ['new', 'cutting', 'stitching', 'ready', 'delivered']
export const STATUS_LABEL: Record<Status, string> = {
  new: 'New',
  cutting: 'Cutting',
  stitching: 'Stitching',
  ready: 'Ready',
  delivered: 'Delivered',
}

export type Garment =
  | 'shirt' | 'trouser' | 'kurta' | 'pyjama' | 'blouse' | 'salwar' | 'suit'
  | 'blazer' | 'sherwani' | 'lehenga' | 'dress' | 'waistcoat' | 'jacket'

/** Measurement values are always stored in inches. */
export type Measurements = Record<string, number>

export interface Item {
  garment: Garment
  quantity: number
  fit?: string
  measurements: Measurements
  /** Style details in the tailor's words: "button-down collar, 2 pockets". */
  style?: string
}

export type OrderKind = 'stitching' | 'alteration'

export interface Fabric {
  from: 'customer' | 'shop'
  received?: boolean
  detail?: string
}

export interface Customer {
  id: string
  name: string
  phone?: string
  createdAt: string
  notes?: string
}

export interface Payment {
  amount: number
  at: string
}

export interface Order {
  id: string
  customerId: string
  createdAt: string
  /** Local calendar date, YYYY-MM-DD. */
  dueDate: string
  status: Status
  items: Item[]
  total?: number
  advance: number
  notes?: string
  rawText: string
  statusChangedAt?: string
  trialDate?: string
  kind?: OrderKind
  fabric?: Fabric
  /** Token number written on the slip and cloth tag. */
  number: number
  /** Payments after the first advance, for the daily summary. */
  payments?: Payment[]
}

export type Unit = 'in' | 'cm'
export type MessageLang = 'en' | 'hinglish' | 'hi'

export interface Settings {
  shopName: string
  shopPhone: string
  unit: Unit
  countryCode: string
  messageLang: MessageLang
}

export interface AppData {
  version: 1
  settings: Settings
  customers: Customer[]
  orders: Order[]
}

/** An order as understood from speech, before the tailor confirms it. */
export interface DraftItem {
  garment?: Garment
  quantity: number
  fit?: string
  measurements: Measurements
  style?: string
  /** Measurement names that were spoken without a clear number. */
  unclear: string[]
  /** Measurement names whose value was spoken in centimetres. */
  cmSpoken: string[]
}

export interface Draft {
  name?: string
  phone?: string
  items: DraftItem[]
  dueDate?: string
  dueSaid?: string
  trialDate?: string
  kind?: OrderKind
  fabric?: Fabric
  total?: number
  advance: number
  notes: string[]
  unmatched: string[]
  rawText: string
  /** Set when the tailor picks which existing customer this is. */
  customerId?: string
  /** Set when the tailor says it is a new person despite a match. */
  forceNewCustomer?: boolean
  /** Set when this card edits an order that was already saved. */
  editingOrderId?: string
}
