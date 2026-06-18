import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { serializeCategory } from '@/lib/serialize'

export async function GET() {
  const categories = await db.category.findMany({
    include: {
      _count: { select: { products: true } },
    },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({
    categories: categories.map(serializeCategory).map((c) => ({
      ...c,
      _count: { products: categories.find((x) => x.id === c.id)?._count.products ?? 0 },
    })),
  })
}
