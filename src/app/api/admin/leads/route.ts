import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, requireRole } from '@/lib/session'
import { serializeLead } from '@/lib/serialize'

// GET /api/admin/leads — list all wholesale leads
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    try {
      requireRole(session, ['admin'])
    } catch {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const sp = req.nextUrl.searchParams
    const status = sp.get('status')
    const where: any = status ? { status } : {}
    const leads = await db.wholesaleLead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ leads: leads.map(serializeLead) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
