import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, requireRole } from '@/lib/session'
import { serializeProduct } from '@/lib/serialize'

// GET /api/admin/products — all products (no status filter)
export async function GET(_req: NextRequest) {
  try {
    const session = await getSession()
    try {
      requireRole(session, ['admin'])
    } catch {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const products = await db.product.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ products: products.map(serializeProduct) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/admin/products — create a product
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    try {
      requireRole(session, ['admin'])
    } catch {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const {
      sku,
      name,
      slug,
      categoryId,
      description,
      specs,
      certifications,
      application,
      unit,
      casePackSize,
      basePrice,
      images,
      sustainabilityMetrics,
      sdsUrl,
      techSheetUrl,
      status,
      bestSeller,
      rating,
    } = body ?? {}

    if (!sku || !name || !slug || !categoryId || basePrice == null) {
      return NextResponse.json(
        { error: 'sku, name, slug, categoryId, and basePrice are required' },
        { status: 400 }
      )
    }

    const product = await db.product.create({
      data: {
        sku: String(sku),
        name: String(name),
        slug: String(slug),
        categoryId: String(categoryId),
        description: description ? String(description) : '',
        specs: JSON.stringify(specs ?? {}),
        certifications: JSON.stringify(certifications ?? []),
        application: JSON.stringify(application ?? []),
        unit: unit ? String(unit) : 'case',
        casePackSize: Number(casePackSize ?? 1),
        basePrice: Number(basePrice),
        images: JSON.stringify(images ?? []),
        sustainabilityMetrics: JSON.stringify(
          sustainabilityMetrics ?? {
            recycledContent: '0%',
            treesSavedPerCase: 0,
            plasticSavedLbs: 0,
          }
        ),
        sdsUrl: sdsUrl ? String(sdsUrl) : null,
        techSheetUrl: techSheetUrl ? String(techSheetUrl) : null,
        status: status ? String(status) : 'active',
        bestSeller: !!bestSeller,
        rating: rating != null ? Number(rating) : 4.5,
      },
      include: { category: true },
    })

    return NextResponse.json({ product: serializeProduct(product) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
