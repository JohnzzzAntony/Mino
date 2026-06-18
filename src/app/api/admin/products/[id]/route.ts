import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, requireRole } from '@/lib/session'
import { serializeProduct } from '@/lib/serialize'

// PATCH /api/admin/products/[id] — update a product
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
    const data: any = {}
    const strFields = [
      'sku',
      'name',
      'slug',
      'categoryId',
      'description',
      'unit',
      'sdsUrl',
      'techSheetUrl',
      'status',
    ]
    for (const k of strFields) {
      if (body[k] !== undefined) data[k] = body[k] === null ? null : String(body[k])
    }
    const numFields = ['casePackSize', 'basePrice', 'rating']
    for (const k of numFields) {
      if (body[k] !== undefined) data[k] = Number(body[k])
    }
    if (body.bestSeller !== undefined) data.bestSeller = !!body.bestSeller
    if (body.specs !== undefined) data.specs = JSON.stringify(body.specs)
    if (body.certifications !== undefined) data.certifications = JSON.stringify(body.certifications)
    if (body.application !== undefined) data.application = JSON.stringify(body.application)
    if (body.images !== undefined) data.images = JSON.stringify(body.images)
    if (body.sustainabilityMetrics !== undefined)
      data.sustainabilityMetrics = JSON.stringify(body.sustainabilityMetrics)

    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updated = await db.product.update({
      where: { id },
      data,
      include: { category: true },
    })
    return NextResponse.json({ product: serializeProduct(updated), ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// DELETE /api/admin/products/[id] — soft delete (set status=discontinued)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    try {
      requireRole(session, ['admin'])
    } catch {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { id } = await params

    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.product.update({
      where: { id },
      data: { status: 'discontinued' },
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
