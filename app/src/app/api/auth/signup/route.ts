import { NextResponse } from 'next/server'
import { query } from '@/server/db'
import { COOKIE, cookieOptions, hashPassword, makeToken, normalisePhone } from '@/server/auth'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const name = typeof body.shopName === 'string' ? body.shopName.trim().slice(0, 120) : ''
  const phone = normalisePhone(body.phone)
  const password = typeof body.password === 'string' ? body.password : ''
  if (!name) return NextResponse.json({ error: 'Enter your shop name.', code: 'shopName' }, { status: 400 })
  if (!phone) return NextResponse.json({ error: 'Enter a 10-digit mobile number.', code: 'phone' }, { status: 400 })
  if (password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters.', code: 'password' }, { status: 400 })

  const exists = await query('select 1 from shops where phone = $1', [phone])
  if (exists.rowCount) return NextResponse.json({ error: 'This mobile number already has a shop. Sign in instead.', code: 'exists' }, { status: 409 })

  const settings = { shopName: name, shopPhone: `${phone.slice(0, 5)} ${phone.slice(5)}`, unit: 'in', countryCode: '91', messageLang: 'en' }
  const res = await query<{ id: string }>('insert into shops (name, phone, password_hash, settings) values ($1,$2,$3,$4) returning id',
    [name, phone, await hashPassword(password), settings])
  const out = NextResponse.json({ ok: true, shop: { name, phone } })
  out.cookies.set(COOKIE, makeToken(res.rows[0].id), cookieOptions)
  return out
}
