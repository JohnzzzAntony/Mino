import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, requireRole } from '@/lib/session'
import { serializeOrder } from '@/lib/serialize'

function random4() {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

async function maybeCreateInvoice(orderId: string, companyId: string, total: number) {
  const existing = await db.invoice.findUnique({ where: { orderId } })
  if (existing) return existing
  const company = await db.company.findUnique({ where: { id: companyId } })
  const due = new Date()
  due.setDate(due.getDate() + (company?.netTermsDays ?? 30))
  let invoiceNumber = `INV-${random4()}`
  for (let i = 0; i < 5; i++) {
    const dup = await db.invoice.findUnique({ where: { invoiceNumber } })
    if (!dup) break
    invoiceNumber = `INV-${random4()}`
  }
  return db.invoice.create({
    data: {
      companyId,
      orderId,
      invoiceNumber,
      amount: total,
      dueDate: due,
      status: 'open',
    },
  })
}

// GET /api/admin/orders/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    try {
      requireRole(session, ['admin'])
    } catch {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { id } = await params

    const order = await db.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        company: true,
        approval: { include: { requestedByUser: true, approverUser: true } },
        invoice: true,
        user: true,
      },
    })
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ order: serializeOrder(order) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// PATCH /api/admin/orders/[id] — update status / carrier / tracking; auto-create invoice
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
    const { status, carrier, trackingNumber } = body ?? {}

    const order = await db.order.findUnique({ where: { id } })
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const data: any = {}
    if (status) data.status = String(status)
    if (carrier !== undefined) data.carrier = carrier ? String(carrier) : null
    if (trackingNumber !== undefined)
      data.trackingNumber = trackingNumber ? String(trackingNumber) : null

    await db.order.update({ where: { id }, data })

    if (status === 'delivered' || status === 'invoiced') {
      await maybeCreateInvoice(order.id, order.companyId, order.total)
    }

    const refreshed = await db.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        company: true,
        approval: { include: { requestedByUser: true, approverUser: true } },
        invoice: true,
        user: true,
      },
    })

    return NextResponse.json({ order: serializeOrder(refreshed) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
