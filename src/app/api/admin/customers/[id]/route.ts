import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, requireRole } from '@/lib/session'
import {
  serializeCompany,
  serializeUser,
  serializeAddress,
  serializeOrder,
} from '@/lib/serialize'

// GET /api/admin/customers/[id] — single company with users, addresses, recent orders
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    try {
      requireRole(session, ['admin'])
    } catch {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { id } = await params

    const company = await db.company.findUnique({
      where: { id },
      include: {
        pricingTier: true,
        users: true,
        addresses: true,
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            items: true,
            approval: { include: { requestedByUser: true, approverUser: true } },
            invoice: true,
            user: true,
          },
        },
      },
    })
    if (!company) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({
      customer: {
        ...serializeCompany(company),
        users: company.users.map(serializeUser),
        addresses: company.addresses.map(serializeAddress),
        orders: company.orders.map(serializeOrder),
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// PATCH /api/admin/customers/[id] — update pricing tier / threshold / net terms / status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    try {
      requireRole(session, ['admin'])
    } catch {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { id } = await params

    const body = await req.json()
    const data: any = {}
    if (body.pricingTierId !== undefined) data.pricingTierId = body.pricingTierId || null
    if (body.approvalThreshold !== undefined)
      data.approvalThreshold = Number(body.approvalThreshold)
    if (body.netTermsDays !== undefined) data.netTermsDays = Number(body.netTermsDays)
    if (body.status !== undefined) data.status = String(body.status)

    const company = await db.company.findUnique({ where: { id } })
    if (!company) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.company.update({ where: { id }, data })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
