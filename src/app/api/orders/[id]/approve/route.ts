import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, requireRole } from '@/lib/session'
import { serializeOrder } from '@/lib/serialize'

// POST /api/orders/[id]/approve — approver/owner/admin in same company approves a pending order
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    try {
      requireRole(session, ['approver', 'owner', 'admin'])
    } catch {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { id } = await params

    const order = await db.order.findUnique({
      where: { id },
      include: { approval: true },
    })
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // ownership check (admin allowed from any company)
    if (session.role !== 'admin' && order.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (!order.approval) {
      return NextResponse.json({ error: 'No approval request on this order' }, { status: 400 })
    }
    if (order.approval.status !== 'pending') {
      return NextResponse.json(
        { error: `Approval already ${order.approval.status}` },
        { status: 400 }
      )
    }

    await db.$transaction([
      db.approvalRequest.update({
        where: { orderId: order.id },
        data: {
          status: 'approved',
          approverId: session.id,
          resolvedAt: new Date(),
        },
      }),
      db.order.update({
        where: { id: order.id },
        data: { status: 'submitted' },
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
