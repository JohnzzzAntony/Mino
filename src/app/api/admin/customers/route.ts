import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, requireRole } from '@/lib/session'
import { serializeCompany } from '@/lib/serialize'

// GET /api/admin/customers — all companies with pricingTier + counts
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

    const companies = await db.company.findMany({
      where,
      include: {
        pricingTier: true,
        _count: { select: { orders: true, users: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const customers = companies.map((c) => ({
      ...serializeCompany(c),
      ordersCount: c._count.orders,
      usersCount: c._count.users,
    }))

    return NextResponse.json({ customers })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
