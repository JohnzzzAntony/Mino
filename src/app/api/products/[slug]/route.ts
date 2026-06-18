import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { serializeProduct, buildCompanyContext } from '@/lib/serialize'
import { resolvePrice } from '@/lib/pricing'
import { getSession } from '@/lib/session'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const product = await db.product.findUnique({
    where: { slug },
    include: { category: true },
  })
  if (!product) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const session = await getSession()
  let companyContext: any = null
  let override: any = null
  if (session?.companyId) {
    const company = await db.company.findUnique({
      where: { id: session.companyId },
      include: { pricingTier: true, priceOverrides: true },
    })
    companyContext = buildCompanyContext(company)
    override = company?.priceOverrides?.find((o: any) => o.productId === product.id)
  }

  const dto = serializeProduct(product)
  const { price, isCustom, discountPercent } = resolvePrice(
    { basePrice: product.basePrice },
    companyContext,
    override?.price ?? null
  )

  // Related products
  const related = await db.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      status: 'active',
    },
    take: 4,
  })

  return NextResponse.json({
    product: { ...dto, effectivePrice: price, isCustomPrice: isCustom, discountPercent },
    related: related.map(serializeProduct),
  })
}
