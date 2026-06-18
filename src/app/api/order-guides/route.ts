import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { serializeOrderGuide, buildCompanyContext } from '@/lib/serialize'
import { resolvePrice, round2 } from '@/lib/pricing'

// GET /api/order-guides — current user's company guides
export async function GET(_req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.companyId) {
      return NextResponse.json({ guides: [] })
    }
    const guides = await db.orderGuide.findMany({
      where: { companyId: session.companyId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ guides: guides.map(serializeOrderGuide) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/order-guides — create a guide for current user's company
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.companyId) {
      return NextResponse.json({ error: 'No company associated with user' }, { status: 400 })
    }

    const body = await req.json()
    const { name, items } = body ?? {}
    if (!name || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'name and items[] required' }, { status: 400 })
    }

    // Enrich items with product info + resolved price (best-effort; non-fatal)
    const productIds = items.map((i: any) => String(i.productId))
    const products = await db.product.findMany({ where: { id: { in: productIds } } })
    const company = await db.company.findUnique({
      where: { id: session.companyId },
      include: { pricingTier: true, priceOverrides: true },
    })
    const ctx = buildCompanyContext(company)

    const enriched = items.map((i: any) => {
      const product = products.find((p) => p.id === String(i.productId))
      if (!product) {
        return { productId: String(i.productId), quantity: parseInt(i.quantity) || 1 }
      }
      const override = company?.priceOverrides?.find((o) => o.productId === product.id)
      const { price } = resolvePrice(
        { basePrice: product.basePrice } as any,
        ctx,
        override?.price ?? null
      )
      return {
        productId: product.id,
        quantity: parseInt(i.quantity) || 1,
        productName: product.name,
        sku: product.sku,
        unitPrice: round2(price),
      }
    })

    const guide = await db.orderGuide.create({
      data: {
        companyId: session.companyId,
        userId: session.id,
        name: String(name).trim(),
        items: JSON.stringify(enriched),
      },
    })

    return NextResponse.json({ guide: serializeOrderGuide(guide) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
