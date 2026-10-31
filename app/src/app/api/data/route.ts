import { NextResponse } from 'next/server'
import { currentShopId } from '@/server/auth'
import { loadShopData } from '@/server/data'

export async function GET() {
  const id = await currentShopId()
  if (!id) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  return NextResponse.json(await loadShopData(id))
}
