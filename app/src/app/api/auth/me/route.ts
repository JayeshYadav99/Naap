import { NextResponse } from 'next/server'
import { query } from '@/server/db'
import { currentShopId } from '@/server/auth'

export async function GET() {
  const id = await currentShopId()
  if (!id) return NextResponse.json({ shop: null })
  const r = await query<{ name: string; phone: string }>('select name, phone from shops where id = $1', [id])
  return NextResponse.json({ shop: r.rows[0] ?? null })
}
