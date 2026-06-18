import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, requireRole } from '@/lib/session'
import { serializeOrder, buildCompanyContext } from '@/lib/serialize'
import { resolvePrice, round2 } from '@/lib/pricing'

// GET /api/orders — list orders (admin: all, customer: own company)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sp = req.nextUrl.searchParams
    const status = sp.get('status')
    const limit = parseInt(sp.get('limit') ?? '50')

    const where: any = {}
    if (session.role !== 'admin') {
      where.companyId = session.companyId
    }
    if (status) where.status = status

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

// POST /api/orders — create order (purchaser/approver/owner)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    try {
      requireRole(session, ['purchaser', 'approver', 'owner'])
    } catch {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (!session.companyId) {
      return NextResponse.json({ error: 'No company associated with user' }, { status: 400 })
    }

    const body = await req.json()
    const { items, poNumber, deliveryDate, shippingAddressId, notes } = body ?? {}
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'items[] required' }, { status: 400 })
    }

    // Load company w/ overrides + pricing tier
    const company = await db.company.findUnique({
      where: { id: session.companyId },
      include: { pricingTier: true, priceOverrides: true },
    })
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 400 })
    }
    const companyContext = buildCompanyContext(company)

    // Fetch products
    const productIds = items.map((i: any) => String(i.productId))
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
    })

    // Resolve shipping address snapshot if provided
    let shippingAddressJson: string | null = null
    if (shippingAddressId) {
      const addr = await db.address.findUnique({ where: { id: String(shippingAddressId) } })
      if (addr && addr.companyId === company.id) {
        shippingAddressJson = JSON.stringify({
          label: addr.label,
          line1: addr.line1,
          line2: addr.line2,
          city: addr.city,
          state: addr.state,
          zip: addr.zip,
        })
      }
    }

    // Compute line items + sustainability summary
    let subtotal = 0
    let treesSaved = 0
    let plasticSavedLbs = 0
    let waterSavedGal = 0
    let recycledLbs = 0

    const lineItems = items.map((i: any) => {
      const product = products.find((p) => p.id === String(i.productId))
      if (!product) throw new Error(`Product ${i.productId} not found`)
      const qty = parseInt(i.quantity)
      if (!qty || qty < 1) throw new Error('Invalid quantity')

      const override = company.priceOverrides?.find((o) => o.productId === product.id)
      const { price } = resolvePrice(
        { basePrice: product.basePrice } as any,
        companyContext,
        override?.price ?? null
      )
      const lineTotal = round2(price * qty)
      subtotal = round2(subtotal + lineTotal)

      // sustainability metrics
      let metrics: any = {}
      try {
        metrics = JSON.parse(product.sustainabilityMetrics || '{}')
      } catch {}
      const trees = Number(metrics.treesSavedPerCase ?? 0) * qty
      const plastic = Number(metrics.plasticSavedLbs ?? 0) * qty
      const water = Number(metrics.waterSavedGal ?? 0) * qty
      treesSaved += trees
      plasticSavedLbs += plastic
      waterSavedGal += water
      // approx recycled lbs = casePackSize * qty * 0.5
      recycledLbs += (product.casePackSize ?? 1) * qty * 0.5

      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: qty,
        unitPrice: price,
      }
    })

    const total = round2(subtotal)

    const sustainabilitySummary = {
      treesSaved: round2(treesSaved),
      plasticSavedLbs: round2(plasticSavedLbs),
      waterSavedGal: round2(waterSavedGal),
      recycledLbs: round2(recycledLbs),
    }

    // Approval flow
    const needsApproval =
      company.approvalThreshold != null && total > company.approvalThreshold
    const status = needsApproval ? 'pending_approval' : 'submitted'

    // Pick first approver in the company (if any)
    let approverId: string | null = null
    if (needsApproval) {
      const approver = await db.user.findFirst({
        where: { companyId: company.id, role: { in: ['approver', 'owner'] } },
        orderBy: { createdAt: 'asc' },
      })
      approverId = approver?.id ?? null
    }

    // Generate a PO number if not provided
    const finalPoNumber = poNumber ? String(poNumber) : `PO-${Date.now().toString().slice(-8)}`

    const order = await db.order.create({
      data: {
        companyId: company.id,
        userId: session.id,
        poNumber: finalPoNumber,
        status,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        shippingAddressJson,
        subtotal,
        total,
        sustainabilitySummary: JSON.stringify(sustainabilitySummary),
        notes: notes ? String(notes) : null,
        items: {
          create: lineItems,
        },
        ...(needsApproval
          ? {
              approval: {
                create: {
                  requestedBy: session.id,
                  approverId,
                  status: 'pending',
                },
              },
            }
          : {}),
      },
      include: {
        items: { include: { product: true } },
        company: true,
        approval: { include: { requestedByUser: true, approverUser: true } },
        invoice: true,
        user: true,
      },
    })

    return NextResponse.json({ order: serializeOrder(order) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
