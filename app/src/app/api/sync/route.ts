import { NextResponse } from 'next/server'
import { currentShopId } from '@/server/auth'
import { tx } from '@/server/db'
import { applyOps, checkOps, type SyncOps } from '@/server/data'

export async function POST(req: Request) {
  const id = await currentShopId()
  if (!id) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  const text = await req.text()
  if (text.length > 2_000_000) return NextResponse.json({ error: 'Too much data at once.' }, { status: 413 })
  let ops: SyncOps
  try { ops = JSON.parse(text) } catch { return NextResponse.json({ error: 'Bad request.' }, { status: 400 }) }
  const problem = checkOps(ops)
  if (problem) return NextResponse.json({ error: problem }, { status: 400 })
  await tx(c => applyOps(c, id, ops))
  return NextResponse.json({ ok: true })
}
