import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, requireRole } from '@/lib/session'
import { serializeInvoice } from '@/lib/serialize'

// GET /api/admin/invoices — all invoices
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

    const invoices = await db.invoice.findMany({
      where,
      include: { company: true, order: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ invoices: invoices.map(serializeInvoice) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
