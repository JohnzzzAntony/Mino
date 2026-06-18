import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const existing = await db.newsletterSignup.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ ok: true, message: 'Already subscribed' })
  }

  await db.newsletterSignup.create({ data: { email } })
  return NextResponse.json({ ok: true })
}
