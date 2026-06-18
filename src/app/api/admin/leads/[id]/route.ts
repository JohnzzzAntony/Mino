import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, requireRole } from '@/lib/session'

// PATCH /api/admin/leads/[id] — update lead status; on 'approved', create Company + owner User
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
    const status = body?.status
    if (!['approved', 'rejected', 'contacted'].includes(status)) {
      return NextResponse.json(
        { error: "status must be 'approved' | 'rejected' | 'contacted'" },
        { status: 400 }
      )
    }

    const lead = await db.wholesaleLead.findUnique({ where: { id } })
    if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    let companyId: string | undefined
    let userId: string | undefined

    if (status === 'approved') {
      // Skip if lead already approved previously
      const existingCompany = await db.company.findFirst({ where: { name: lead.companyName } })
      if (existingCompany) {
        companyId = existingCompany.id
      } else {
        // Pick a default pricing tier (lowest discount)
        const tier = await db.pricingTier.findFirst({
          orderBy: { discountPercent: 'asc' },
        })
        const company = await db.company.create({
          data: {
            name: lead.companyName,
            status: 'approved',
            businessType: lead.businessType,
            monthlyVolume: lead.monthlyVolume,
            pricingTierId: tier?.id,
            netTermsDays: 30,
            approvalThreshold: 500,
          },
        })
        companyId = company.id

        // Create owner user (skip if email already exists)
        const existing = await db.user.findUnique({ where: { email: lead.email.toLowerCase() } })
        if (existing) {
          userId = existing.id
        } else {
          const user = await db.user.create({
            data: {
              email: lead.email.toLowerCase(),
              name: lead.contactName,
              password: 'demo1234',
              role: 'owner',
              companyId: company.id,
            },
          })
          userId = user.id
        }
      }
    }

    await db.wholesaleLead.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({ ok: true, companyId, userId })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
