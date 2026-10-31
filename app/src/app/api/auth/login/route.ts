import { NextResponse } from 'next/server'
import { query } from '@/server/db'
import { COOKIE, cookieOptions, makeToken, normalisePhone, verifyPassword } from '@/server/auth'

const WRONG = 'Mobile number or password is wrong.'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const phone = normalisePhone(body.phone)
  const password = typeof body.password === 'string' ? body.password : ''
  if (!phone || !password) return NextResponse.json({ error: WRONG, code: 'wrong' }, { status: 401 })

  const r = await query<{ id: string; name: string; password_hash: string; failed_logins: number; locked_until: Date | null }>(
    'select id, name, password_hash, failed_logins, locked_until from shops where phone = $1', [phone])
  const shop = r.rows[0]
  if (!shop) return NextResponse.json({ error: WRONG, code: 'wrong' }, { status: 401 })
  if (shop.locked_until && shop.locked_until > new Date()) {
    return NextResponse.json({ error: 'Too many wrong tries. Wait 10 minutes and try again.', code: 'locked' }, { status: 429 })
  }
  if (!(await verifyPassword(password, shop.password_hash))) {
    // 5 wrong tries locks the account for 10 minutes.
    await query(`update shops set failed_logins = failed_logins + 1,
      locked_until = case when failed_logins + 1 >= 5 then now() + interval '10 minutes' else null end where id = $1`, [shop.id])
    return NextResponse.json({ error: WRONG, code: 'wrong' }, { status: 401 })
  }
  await query('update shops set failed_logins = 0, locked_until = null where id = $1', [shop.id])
  const out = NextResponse.json({ ok: true, shop: { name: shop.name, phone } })
  out.cookies.set(COOKIE, makeToken(shop.id), cookieOptions)
  return out
}
