import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, requireRole } from '@/lib/session'
import { round2 } from '@/lib/pricing'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// GET /api/admin/reports — aggregate dashboard metrics
export async function GET(_req: NextRequest) {
  try {
    const session = await getSession()
    try {
      requireRole(session, ['admin'])
    } catch {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Revenue = sum of order totals where status in [delivered, invoiced]
    const revenueOrders = await db.order.findMany({
      where: { status: { in: ['delivered', 'invoiced'] } },
      select: { total: true, createdAt: true },
    })
    const totalRevenue = round2(revenueOrders.reduce((s, o) => s + o.total, 0))

    const ordersCount = await db.order.count()
    const customersCount = await db.company.count({ where: { status: 'approved' } })
    const avgOrderValue = ordersCount > 0 ? round2(totalRevenue / ordersCount) : 0

    // Top 5 products by qty sold
    const topProductsRows = await db.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    })
    const topProductIds = topProductsRows.map((r) => r.productId)
    const topProductMeta = await db.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, sku: true, basePrice: true },
    })
    const topProducts = topProductsRows.map((r) => {
      const meta = topProductMeta.find((p) => p.id === r.productId)
      return {
        productId: r.productId,
        name: meta?.name ?? 'Unknown',
        sku: meta?.sku ?? '',
        qty: r._sum.quantity ?? 0,
        quantity: r._sum.quantity ?? 0,
        revenue: round2((r._sum.quantity ?? 0) * (meta?.basePrice ?? 0)),
      }
    })

    // Status breakdown
    const statusGroups = await db.order.groupBy({
      by: ['status'],
      _count: { _all: true },
    })
    const statusBreakdown = statusGroups.map((g) => ({
      status: g.status,
      count: g._count._all,
    }))

    // Monthly revenue (last 12 months)
    const now = new Date()
    const buckets: { key: string; label: string; revenue: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      buckets.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: MONTHS[d.getMonth()],
        revenue: 0,
      })
    }
    const bucketMap = new Map(buckets.map((b) => [b.key, b]))
    for (const o of revenueOrders) {
      const d = new Date(o.createdAt)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      const b = bucketMap.get(key)
      if (b) b.revenue += o.total
    }
    const monthlyRevenue = buckets.map((b) => ({
      month: b.label,
      revenue: round2(b.revenue),
    }))

    const recentLeads = await db.wholesaleLead.count({ where: { status: 'new' } })

    return NextResponse.json({
      totalRevenue,
      ordersCount,
      customersCount,
      avgOrderValue,
      topProducts,
      statusBreakdown,
      monthlyRevenue,
      recentLeads,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
