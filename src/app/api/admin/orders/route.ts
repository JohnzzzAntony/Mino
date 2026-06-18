import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, requireRole } from '@/lib/session'
import { serializeOrder } from '@/lib/serialize'

// GET /api/admin/orders — all orders
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
    const limit = parseInt(sp.get('limit') ?? '100')

    const where: any = status ? { status } : {}
    const orders = await db.order.findMany({
      where,
      include: {
        items: { include: { product: true } },
        company: true,
        approval: { include: { requestedByUser: true, approverUser: true } },
        invoice: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ orders: orders.map(serializeOrder) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
