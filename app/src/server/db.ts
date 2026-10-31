import 'server-only'
import { Pool, type PoolClient } from 'pg'

// Neon's pooled endpoint. "require" is treated as full verification by pg today; say so explicitly.
function connectionString() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  return url.replace('sslmode=require', 'sslmode=verify-full')
}

const g = globalThis as unknown as { naapPool?: Pool; naapSchema?: Promise<void> }

export function pool(): Pool {
  if (!g.naapPool) g.naapPool = new Pool({ connectionString: connectionString(), max: 5, idleTimeoutMillis: 20_000 })
  return g.naapPool
}

const SCHEMA = `
create table if not exists shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  password_hash text not null,
  settings jsonb not null default '{}'::jsonb,
  failed_logins int not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists customers (
  shop_id uuid not null references shops(id) on delete cascade,
  id text not null,
  name text not null,
  phone text,
  notes text,
  created_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (shop_id, id)
);
create index if not exists customers_phone on customers (shop_id, phone);

create table if not exists orders (
  shop_id uuid not null references shops(id) on delete cascade,
  id text not null,
  customer_id text not null,
  number int not null,
  status text not null check (status in ('new','cutting','stitching','ready','delivered')),
  kind text,
  due_date date not null,
  trial_date date,
  total numeric(12,2),
  advance numeric(12,2) not null default 0,
  notes text,
  raw_text text not null default '',
  items jsonb not null,
  fabric jsonb,
  payments jsonb,
  created_at timestamptz not null,
  status_changed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (shop_id, id),
  foreign key (shop_id, customer_id) references customers(shop_id, id) on delete cascade
);
create index if not exists orders_due on orders (shop_id, status, due_date);
create index if not exists orders_number on orders (shop_id, number);
`

/** Creates the tables on first use. Safe to run many times. */
export function ensureSchema(): Promise<void> {
  if (!g.naapSchema) {
    g.naapSchema = pool().query(SCHEMA).then(() => undefined).catch(e => { g.naapSchema = undefined; throw e })
  }
  return g.naapSchema
}

export async function tx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  await ensureSchema()
  const c = await pool().connect()
  try {
    await c.query('begin')
    const out = await fn(c)
    await c.query('commit')
    return out
  } catch (e) {
    await c.query('rollback').catch(() => {})
    throw e
  } finally {
    c.release()
  }
}

export async function query<T extends object = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  await ensureSchema()
  return pool().query<T>(sql, params)
}
