import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, requireRole } from '@/lib/session'

// POST /api/orders/[id]/reject — approver/owner/admin rejects a pending order
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    try {
      requireRole(session, ['approver', 'owner', 'admin'])
    } catch {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { id } = await params

    let notes: string | null = null
    try {
      const body = await req.json()
      notes = body?.notes ? String(body.notes) : null
    } catch {
      // body optional
    }

    const order = await db.order.findUnique({
      where: { id },
      include: { approval: true },
    })
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (session.role !== 'admin' && order.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (!order.approval) {
      return NextResponse.json({ error: 'No approval request on this order' }, { status: 400 })
    }

    await db.$transaction([
      db.approvalRequest.update({
        where: { orderId: order.id },
        data: {
          status: 'rejected',
          approverId: session.id,
          notes: notes ?? order.approval.notes,
          resolvedAt: new Date(),
        },
      }),
      db.order.update({
        where: { id: order.id },
        data: { status: 'draft' },
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
