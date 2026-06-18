import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, requireRole } from '@/lib/session'

// PATCH /api/admin/invoices/[id] — update invoice status / paidAt
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
    const { status, paidAt } = body ?? {}
    if (!['paid', 'open', 'overdue'].includes(status)) {
      return NextResponse.json(
        { error: "status must be 'paid' | 'open' | 'overdue'" },
        { status: 400 }
      )
    }

    const invoice = await db.invoice.findUnique({ where: { id } })
    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const data: any = { status }
    if (status === 'paid') {
      data.paidAt = paidAt ? new Date(paidAt) : new Date()
    } else {
      // reset paidAt when reopening
      data.paidAt = null
    }

    await db.invoice.update({ where: { id }, data })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
