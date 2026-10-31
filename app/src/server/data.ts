import 'server-only'
import type { PoolClient } from 'pg'
import type { AppData, Customer, Order, Settings } from '@/types'
import { DEFAULT_SETTINGS } from '@/store/sampleData'
import { query } from './db'

interface CustomerRow { id: string; name: string; phone: string | null; notes: string | null; created_at: Date }
interface OrderRow {
  id: string; customer_id: string; number: number; status: Order['status']; kind: Order['kind'] | null
  due_date: string; trial_date: string | null; total: string | null; advance: string; notes: string | null
  raw_text: string; items: Order['items']; fabric: Order['fabric'] | null; payments: Order['payments'] | null
  created_at: Date; status_changed_at: Date | null
}

const undef = <T,>(v: T | null): T | undefined => (v === null ? undefined : v)

export async function loadShopData(shopId: string): Promise<AppData> {
  const [shop, customers, orders] = await Promise.all([
    query<{ name: string; settings: Partial<Settings> }>('select name, settings from shops where id = $1', [shopId]),
    query<CustomerRow>('select id, name, phone, notes, created_at from customers where shop_id = $1', [shopId]),
    // dates as text so they stay local calendar dates (no timezone shift)
    query<OrderRow>(`select id, customer_id, number, status, kind, to_char(due_date, 'YYYY-MM-DD') as due_date,
      to_char(trial_date, 'YYYY-MM-DD') as trial_date, total, advance, notes, raw_text, items, fabric, payments,
      created_at, status_changed_at from orders where shop_id = $1`, [shopId]),
  ])
  const s = shop.rows[0]
  return {
    version: 1,
    settings: { ...DEFAULT_SETTINGS, shopPhone: '', ...s?.settings, shopName: s?.settings?.shopName ?? s?.name ?? DEFAULT_SETTINGS.shopName },
    customers: customers.rows.map((r): Customer => ({
      id: r.id, name: r.name, phone: undef(r.phone), notes: undef(r.notes), createdAt: r.created_at.toISOString(),
    })),
    orders: orders.rows.map((r): Order => ({
      id: r.id, customerId: r.customer_id, number: r.number, status: r.status, kind: undef(r.kind),
      dueDate: r.due_date, trialDate: undef(r.trial_date), total: r.total === null ? undefined : Number(r.total),
      advance: Number(r.advance), notes: undef(r.notes), rawText: r.raw_text, items: r.items,
      fabric: undef(r.fabric), payments: undef(r.payments), createdAt: r.created_at.toISOString(),
      statusChangedAt: r.status_changed_at?.toISOString(),
    })),
  }
}

export interface SyncOps {
  settings?: Settings
  upsertCustomers?: Customer[]
  deleteCustomers?: string[]
  upsertOrders?: Order[]
  deleteOrders?: string[]
}

const isStr = (v: unknown, max = 500): v is string => typeof v === 'string' && v.length <= max
const isDate = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
const STATUSES = ['new', 'cutting', 'stitching', 'ready', 'delivered']

/** Light shape checks so one bad client can't write junk. Returns an error message or undefined. */
export function checkOps(ops: SyncOps): string | undefined {
  const n = (ops.upsertCustomers?.length ?? 0) + (ops.upsertOrders?.length ?? 0) + (ops.deleteCustomers?.length ?? 0) + (ops.deleteOrders?.length ?? 0)
  if (n > 5000) return 'Too many changes at once'
  for (const c of ops.upsertCustomers ?? []) {
    if (!isStr(c.id, 80) || !isStr(c.name, 120) || !c.name.trim() || (c.phone !== undefined && !isStr(c.phone, 20)) || !isStr(c.createdAt, 40)) return 'Invalid customer'
  }
  for (const o of ops.upsertOrders ?? []) {
    if (!isStr(o.id, 80) || !isStr(o.customerId, 80) || !Number.isInteger(o.number) || !STATUSES.includes(o.status) || !isDate(o.dueDate)
      || (o.trialDate !== undefined && !isDate(o.trialDate)) || !Array.isArray(o.items) || o.items.length > 50
      || typeof o.advance !== 'number' || (o.total !== undefined && typeof o.total !== 'number') || !isStr(o.createdAt, 40)
      || (o.rawText !== undefined && !isStr(o.rawText, 4000)) || (o.notes !== undefined && !isStr(o.notes, 4000))) return 'Invalid order'
  }
  for (const id of [...(ops.deleteCustomers ?? []), ...(ops.deleteOrders ?? [])]) if (!isStr(id, 80)) return 'Invalid id'
  if (ops.settings && (!isStr(ops.settings.shopName, 120) || !['in', 'cm'].includes(ops.settings.unit))) return 'Invalid settings'
  return undefined
}

/** Applies a batch of changes for one shop inside a transaction. */
export async function applyOps(c: PoolClient, shopId: string, ops: SyncOps) {
  if (ops.settings) {
    await c.query('update shops set settings = $2, name = $3 where id = $1', [shopId, ops.settings, ops.settings.shopName])
  }
  for (const cu of ops.upsertCustomers ?? []) {
    await c.query(
      `insert into customers (shop_id, id, name, phone, notes, created_at) values ($1,$2,$3,$4,$5,$6)
       on conflict (shop_id, id) do update set name = excluded.name, phone = excluded.phone, notes = excluded.notes, updated_at = now()`,
      [shopId, cu.id, cu.name.trim(), cu.phone ?? null, cu.notes ?? null, cu.createdAt],
    )
  }
  for (const o of ops.upsertOrders ?? []) {
    await c.query(
      `insert into orders (shop_id, id, customer_id, number, status, kind, due_date, trial_date, total, advance, notes, raw_text, items, fabric, payments, created_at, status_changed_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       on conflict (shop_id, id) do update set customer_id = excluded.customer_id, number = excluded.number, status = excluded.status,
         kind = excluded.kind, due_date = excluded.due_date, trial_date = excluded.trial_date, total = excluded.total,
         advance = excluded.advance, notes = excluded.notes, raw_text = excluded.raw_text, items = excluded.items,
         fabric = excluded.fabric, payments = excluded.payments, status_changed_at = excluded.status_changed_at, updated_at = now()`,
      [shopId, o.id, o.customerId, o.number, o.status, o.kind ?? null, o.dueDate, o.trialDate ?? null, o.total ?? null, o.advance,
        o.notes ?? null, o.rawText ?? '', JSON.stringify(o.items), o.fabric ? JSON.stringify(o.fabric) : null,
        o.payments ? JSON.stringify(o.payments) : null, o.createdAt, o.statusChangedAt ?? null],
    )
  }
  if (ops.deleteOrders?.length) await c.query('delete from orders where shop_id = $1 and id = any($2)', [shopId, ops.deleteOrders])
  if (ops.deleteCustomers?.length) await c.query('delete from customers where shop_id = $1 and id = any($2)', [shopId, ops.deleteCustomers])
}
