import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { serializeProduct, buildCompanyContext } from '@/lib/serialize'
import { resolvePrice } from '@/lib/pricing'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const categorySlug = sp.get('category')
  const bestSeller = sp.get('bestSeller') === '1'
  const search = sp.get('q')
  const limit = parseInt(sp.get('limit') ?? '24')
  const offset = parseInt(sp.get('offset') ?? '0')
  const plyFilter = sp.getAll('ply')
  const appFilter = sp.getAll('application')
  const certFilter = sp.getAll('certification')
  const sort = sp.get('sort') ?? 'best'

  const session = await getSession()
  let companyContext: any = null
  let company: any = null
  if (session?.companyId) {
    company = await db.company.findUnique({
      where: { id: session.companyId },
      include: {
        pricingTier: true,
        priceOverrides: true,
      },
    })
    companyContext = buildCompanyContext(company)
  }

  const where: any = { status: 'active' }
  if (bestSeller) where.bestSeller = true
  if (categorySlug) {
    where.category = { slug: categorySlug }
  }
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { sku: { contains: search } },
      { description: { contains: search } },
    ]
  }

  // Post-filter for ply / application / certifications (stored as JSON strings)
  const allProducts = await db.product.findMany({
    where,
    include: { category: true },
    orderBy:
      sort === 'price-asc'
        ? { basePrice: 'asc' }
        : sort === 'price-desc'
        ? { basePrice: 'desc' }
        : sort === 'name'
        ? { name: 'asc' }
        : sort === 'rating'
        ? { rating: 'desc' }
        : { bestSeller: 'desc' },
  })

  let filtered = allProducts.filter((p) => {
    const specs = JSON.parse(p.specs || '{}')
    const applications = JSON.parse(p.application || '[]')
    const certs = JSON.parse(p.certifications || '[]')
    if (plyFilter.length && !plyFilter.includes(String(specs.ply))) return false
    if (appFilter.length && !appFilter.some((a) => applications.includes(a))) return false
    if (certFilter.length && !certFilter.some((c) => certs.includes(c))) return false
    return true
  })

  const total = filtered.length
  const paged = filtered.slice(offset, offset + limit)

  // Resolve pricing
  const result = paged.map((p) => {
    const dto = serializeProduct(p)
    const override = company?.priceOverrides?.find((o: any) => o.productId === p.id)
    const { price, isCustom, discountPercent } = resolvePrice(
      { basePrice: p.basePrice },
      companyContext,
      override?.price ?? null
    )
    return { ...dto, effectivePrice: price, isCustomPrice: isCustom, discountPercent }
  })

  return NextResponse.json({ products: result, total, offset, limit })
}
