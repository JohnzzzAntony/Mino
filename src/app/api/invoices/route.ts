import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { serializeInvoice } from '@/lib/serialize'

// GET /api/invoices — list invoices (admin: all, customer: own company)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sp = req.nextUrl.searchParams
    const status = sp.get('status')

    const where: any = {}
    if (session.role !== 'admin') {
      where.companyId = session.companyId
    }
    if (status) where.status = status

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
