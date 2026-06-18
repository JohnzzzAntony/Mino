import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { round2 } from '@/lib/pricing'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// GET /api/sustainability — aggregate sustainability metrics for logged-in customer's company
export async function GET(_req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.companyId) {
      return NextResponse.json({
        treesSaved: 0,
        recycledLbs: 0,
        plasticSavedLbs: 0,
        waterSavedGal: 0,
        totalSpend: 0,
        ordersCount: 0,
        monthlyData: [],
      })
    }

    // Only count delivered/invoiced orders as "realized" sustainability
    const orders = await db.order.findMany({
      where: {
        companyId: session.companyId,
        status: { in: ['delivered', 'invoiced'] },
      },
      include: { items: { include: { product: true } } },
    })

    let treesSaved = 0
    let plasticSavedLbs = 0
    let waterSavedGal = 0
    let recycledLbs = 0
    let totalSpend = 0

    // monthly buckets for last 12 months
    const now = new Date()
    const buckets: { key: string; label: string; treesSaved: number; spend: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      buckets.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: MONTHS[d.getMonth()],
        treesSaved: 0,
        spend: 0,
      })
    }
    const bucketMap = new Map(buckets.map((b) => [b.key, b]))

    for (const order of orders) {
      totalSpend += order.total
      const d = new Date(order.createdAt)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      const b = bucketMap.get(key)
      if (b) b.spend += order.total

      for (const item of order.items) {
        let metrics: any = {}
        try {
          metrics = JSON.parse(item.product?.sustainabilityMetrics || '{}')
        } catch {}
        const qty = item.quantity
        treesSaved += Number(metrics.treesSavedPerCase ?? 0) * qty
        plasticSavedLbs += Number(metrics.plasticSavedLbs ?? 0) * qty
        waterSavedGal += Number(metrics.waterSavedGal ?? 0) * qty
        // approx recycled lbs = casePackSize * qty * 0.5
        recycledLbs += (item.product?.casePackSize ?? 1) * qty * 0.5
        if (b) b.treesSaved += Number(metrics.treesSavedPerCase ?? 0) * qty
      }
    }

    const monthlyData = buckets.map((b) => ({
      month: b.label,
      treesSaved: round2(b.treesSaved),
      spend: round2(b.spend),
    }))

    return NextResponse.json({
      treesSaved: round2(treesSaved),
      recycledLbs: round2(recycledLbs),
      plasticSavedLbs: round2(plasticSavedLbs),
      waterSavedGal: round2(waterSavedGal),
      totalSpend: round2(totalSpend),
      ordersCount: orders.length,
      monthlyData,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
