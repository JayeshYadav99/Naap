import { NextResponse } from 'next/server'
import { COOKIE, cookieOptions } from '@/server/auth'

export async function POST() {
  const out = NextResponse.json({ ok: true })
  out.cookies.set(COOKIE, '', { ...cookieOptions, maxAge: 0 })
  return out
}
