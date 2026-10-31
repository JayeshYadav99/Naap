import 'server-only'
import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { cookies } from 'next/headers'

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>
export const COOKIE = 'naap_session'
const MAX_AGE = 60 * 60 * 24 * 60 // 60 days: a shop stays signed in on its counter laptop

function secret(): string {
  const s = process.env.AUTH_SECRET
  if (!s || s.length < 32) throw new Error('AUTH_SECRET is missing or too short')
  return s
}

export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await scrypt(pw, salt, 64)
  return `scrypt$${salt.toString('base64url')}$${key.toString('base64url')}`
}

export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [algo, saltB64, keyB64] = stored.split('$')
  if (algo !== 'scrypt' || !saltB64 || !keyB64) return false
  const expected = Buffer.from(keyB64, 'base64url')
  const key = await scrypt(pw, Buffer.from(saltB64, 'base64url'), expected.length)
  return timingSafeEqual(key, expected)
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

/** Session token: "<shopId>.<expiresAt>.<signature>". Stateless, signed with AUTH_SECRET. */
export function makeToken(shopId: string): string {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE
  const payload = `${shopId}.${exp}`
  return `${payload}.${sign(payload)}`
}

export function readToken(token: string | undefined): string | undefined {
  if (!token) return undefined
  const parts = token.split('.')
  if (parts.length !== 3) return undefined
  const [shopId, exp, sig] = parts
  const good = Buffer.from(sign(`${shopId}.${exp}`))
  const given = Buffer.from(sig)
  if (good.length !== given.length || !timingSafeEqual(good, given)) return undefined
  if (Number(exp) < Date.now() / 1000) return undefined
  return shopId
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: MAX_AGE,
}

/** The signed-in shop's id, or undefined. */
export async function currentShopId(): Promise<string | undefined> {
  const store = await cookies()
  return readToken(store.get(COOKIE)?.value)
}

/** 10-digit Indian mobile, digits only. */
export function normalisePhone(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined
  let d = raw.replace(/\D/g, '')
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2)
  return /^[6-9]\d{9}$/.test(d) ? d : undefined
}
