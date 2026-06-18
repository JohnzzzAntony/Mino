'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from '@/hooks/use-toast'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  CartesianGrid,
} from 'recharts'
import {
  RefreshCw,
  Download,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Repeat,
  BarChart3,
  AlertCircle,
  Trophy,
  Building2,
} from 'lucide-react'
import {
  formatCurrency,
  formatNumber,
  prettifyStatus,
  classNames,
} from '@/lib/pricing'
import { ErrorState } from './leads'

type Range = '7' | '30' | '90'

interface ReportsData {
  totalRevenue: number
  ordersCount: number
  customersCount: number
  avgOrderValue: number
  topProducts: { name: string; qty: number; revenue: number }[]
  recentLeads: number
  statusBreakdown: { status: string; count: number }[]
  monthlyRevenue: { month: string; revenue: number }[]
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'oklch(0.7 0.02 95)',
  pending_approval: 'oklch(0.7 0.12 85)',
  approved: 'oklch(0.6 0.08 180)',
  submitted: 'oklch(0.6 0.08 180)',
  processing: 'oklch(0.65 0.1 60)',
  shipped: 'oklch(0.55 0.1 150)',
  delivered: 'oklch(0.55 0.1 150)',
  invoiced: 'oklch(0.5 0.07 145)',
}

const BUSINESS_TYPES = ['hotel', 'restaurant', 'janitorial', 'office', 'other']

export function AdminReports() {
  const [range, setRange] = useState<Range>('30')
  const [data, setData] = useState<ReportsData | null>(null)
  const [customers, setCustomers] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [rep, cust, ord] = await Promise.all([
        fetch('/api/admin/reports').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/admin/customers').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/admin/orders').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ])
      if (!rep) {
        setError(true)
        // Still set orders/customers so we can derive fallbacks
        setCustomers(cust?.customers ?? [])
        setOrders(ord?.orders ?? [])
        return
      }
      setData(rep)
      setCustomers(cust?.customers ?? [])
      setOrders(ord?.orders ?? [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Derive fallback data from orders/customers if reports API unavailable
  const cutoff = useMemo(() => {
    const days = Number(range)
    return Date.now() - days * 24 * 60 * 60 * 1000
  }, [range])

  const rangeOrders = useMemo(
    () => orders.filter((o) => new Date(o.createdAt).getTime() >= cutoff),
    [orders, cutoff]
  )

  const totalRevenue = data?.totalRevenue ?? rangeOrders.reduce((s, o) => s + o.total, 0)
  const ordersCount = data?.ordersCount ?? rangeOrders.length
  const avgOrderValue = ordersCount > 0 ? totalRevenue / ordersCount : 0
  const customersCount = data?.customersCount ?? customers.length

  // Repeat order rate = customers with >1 order / total customers with orders
  const repeatRate = useMemo(() => {
    if (orders.length === 0) return 0
    const byCompany: Record<string, number> = {}
    for (const o of orders) byCompany[o.companyId] = (byCompany[o.companyId] ?? 0) + 1
    const withOrders = Object.keys(byCompany).length
    const repeat = Object.values(byCompany).filter((n) => n > 1).length
    return withOrders > 0 ? (repeat / withOrders) * 100 : 0
  }, [orders])

  // Revenue over time (AreaChart)
  const revenueOverTime = useMemo(() => {
    const buckets: Record<string, number> = {}
    const now = new Date()
    const days = Number(range)
    const bucketSize = days <= 7 ? 'day' : days <= 30 ? 'day' : 'week'
    const totalBuckets = days <= 7 ? 7 : days <= 30 ? 30 : 13
    for (let i = totalBuckets - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * (bucketSize === 'week' ? 7 : 1) * 24 * 60 * 60 * 1000)
      const key = bucketSize === 'week'
        ? `Wk ${Math.ceil((d.getDate() + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7)}`
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      buckets[key] = 0
    }
    const keys = Object.keys(buckets)
    for (const o of rangeOrders) {
      const od = new Date(o.createdAt)
      const key = bucketSize === 'week'
        ? `Wk ${Math.ceil((od.getDate() + new Date(od.getFullYear(), od.getMonth(), 1).getDay()) / 7)}`
        : od.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (buckets[key] !== undefined) buckets[key] += o.total
    }
    return keys.map((k) => ({ name: k, revenue: buckets[k] }))
  }, [rangeOrders, range])

  // Order status breakdown (Donut)
  const statusData = useMemo(() => {
    if (data?.statusBreakdown?.length) {
      return data.statusBreakdown.map((s) => ({ name: prettifyStatus(s.status), value: s.count, status: s.status }))
    }
    const byStatus: Record<string, number> = {}
    for (const o of rangeOrders) byStatus[o.status] = (byStatus[o.status] ?? 0) + 1
    return Object.entries(byStatus).map(([status, count]) => ({ name: prettifyStatus(status), value: count, status }))
  }, [data, rangeOrders])

  // Top products (BarChart)
  const topProducts = useMemo(() => {
    if (data?.topProducts?.length) return data.topProducts
    const byProduct: Record<string, { qty: number; revenue: number }> = {}
    for (const o of rangeOrders) {
      for (const it of o.items ?? []) {
        const k = it.productName ?? it.sku
        if (!byProduct[k]) byProduct[k] = { qty: 0, revenue: 0 }
        byProduct[k].qty += it.quantity
        byProduct[k].revenue += it.unitPrice * it.quantity
      }
    }
    return Object.entries(byProduct)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)
  }, [data, rangeOrders])

  // Customers by business type (BarChart)
  const customersByType = useMemo(() => {
    const byType: Record<string, number> = {}
    for (const c of customers) {
      const t = c.businessType ?? 'other'
      byType[t] = (byType[t] ?? 0) + 1
    }
    return Object.entries(byType).map(([type, count]) => ({ name: prettifyStatus(type), count }))
  }, [customers])

  // Top customers
  const topCustomers = useMemo(() => {
    const byCo: Record<string, { name: string; orders: number; spend: number }> = {}
    for (const o of orders) {
      const k = o.companyId
      if (!byCo[k]) byCo[k] = { name: o.companyName ?? 'Unknown', orders: 0, spend: 0 }
      byCo[k].orders += 1
      byCo[k].spend += o.total
    }
    return Object.entries(byCo)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 8)
  }, [orders])

  function exportTopProductsCsv() {
    const headers = ['Rank', 'Product', 'Qty Sold', 'Revenue']
    const rows = topProducts.map((p, i) => [i + 1, p.name, p.qty, p.revenue])
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    downloadCsv(csv, 'mino-top-products.csv')
  }

  function exportTopCustomersCsv() {
    const headers = ['Rank', 'Company', 'Orders', 'Total Spend']
    const rows = topCustomers.map((c, i) => [i + 1, c.name, c.orders, c.spend])
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    downloadCsv(csv, 'mino-top-customers.csv')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Performance across revenue, products, and customers.
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={range} onValueChange={(v) => setRange(v as Range)}>
            <SelectTrigger size="sm" className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={classNames('mr-1.5 h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Reports API unavailable</p>
              <p className="text-xs text-amber-700 dark:text-amber-200">
                Showing derived metrics from live order &amp; customer data where available.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total revenue" value={loading ? null : formatCurrency(totalRevenue)} icon={DollarSign} tone="primary" loading={loading} />
        <KpiCard label="Orders" value={loading ? null : formatNumber(ordersCount)} icon={ShoppingCart} tone="amber" loading={loading} />
        <KpiCard label="Avg order value" value={loading ? null : formatCurrency(avgOrderValue)} icon={TrendingUp} tone="teal" loading={loading} />
        <KpiCard label="Repeat order rate" value={loading ? null : `${repeatRate.toFixed(1)}%`} icon={Repeat} tone="green" loading={loading} />
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Revenue over time</CardTitle>
            <CardDescription>
              Last {range} days · {rangeOrders.length} orders in range
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-72 w-full" />
            ) : revenueOverTime.length === 0 ? (
              <EmptyChart label="No revenue in this period" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={revenueOverTime} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="revArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.55 0.1 150)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="oklch(0.55 0.1 150)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.02 95)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="oklch(0.5 0.02 145)" interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 145)" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <RTooltip
                    formatter={(v: number) => [formatCurrency(v), 'Revenue']}
                    contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="oklch(0.5 0.09 150)" strokeWidth={2} fill="url(#revArea)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order status</CardTitle>
            <CardDescription>Breakdown in this period</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-72 w-full" />
            ) : statusData.length === 0 ? (
              <EmptyChart label="No orders in this period" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                      {statusData.map((entry, i) => (
                        <Cell key={i} fill={STATUS_COLORS[entry.status] ?? 'oklch(0.7 0.02 95)'} />
                      ))}
                    </Pie>
                    <RTooltip
                      formatter={(v: number, n: string) => [`${v} order${v === 1 ? '' : 's'}`, n]}
                      contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                  {statusData.map((d, i) => (
                    <span key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[d.status] ?? 'oklch(0.7 0.02 95)' }} />
                      {d.name} · {d.value}
                    </span>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              Top products
            </CardTitle>
            <CardDescription>By revenue, last {range} days</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : topProducts.length === 0 ? (
              <EmptyChart label="No product sales in this period" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.02 95)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 145)" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="oklch(0.5 0.02 145)" width={120} />
                  <RTooltip
                    formatter={(v: number) => [formatCurrency(v), 'Revenue']}
                    contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }}
                  />
                  <Bar dataKey="revenue" fill="oklch(0.55 0.1 150)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-primary" />
              Customers by business type
            </CardTitle>
            <CardDescription>All active customers</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : customersByType.length === 0 ? (
              <EmptyChart label="No customer data" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={customersByType} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.02 95)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 145)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 145)" allowDecimals={false} />
                  <RTooltip
                    formatter={(v: number) => [`${v} customer${v === 1 ? '' : 's'}`, 'Count']}
                    contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }}
                  />
                  <Bar dataKey="count" fill="oklch(0.7 0.12 85)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables row */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Top products table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  Top products
                </CardTitle>
                <CardDescription>By units sold &amp; revenue</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={exportTopProductsCsv} disabled={topProducts.length === 0}>
                <Download className="mr-1 h-3.5 w-3.5" />
                CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : topProducts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No product data yet.</p>
            ) : (
              <div className="max-h-96 overflow-y-auto scrollbar-thin">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.map((p, i) => (
                      <TableRow key={p.name + i}>
                        <TableCell>
                          <span className={classNames(
                            'grid h-6 w-6 place-items-center rounded-full text-xs font-bold',
                            i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200' :
                            i === 1 ? 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200' :
                            i === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-200' :
                            'bg-muted text-muted-foreground'
                          )}>
                            {i + 1}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-right">{formatNumber(p.qty)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(p.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top customers table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4 text-primary" />
                  Top customers
                </CardTitle>
                <CardDescription>By total spend, all time</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={exportTopCustomersCsv} disabled={topCustomers.length === 0}>
                <Download className="mr-1 h-3.5 w-3.5" />
                CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : topCustomers.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No customer data yet.</p>
            ) : (
              <div className="max-h-96 overflow-y-auto scrollbar-thin">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Total spend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topCustomers.map((c, i) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <span className={classNames(
                            'grid h-6 w-6 place-items-center rounded-full text-xs font-bold',
                            i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200' :
                            i === 1 ? 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200' :
                            i === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-200' :
                            'bg-muted text-muted-foreground'
                          )}>
                            {i + 1}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-right">{c.orders}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(c.spend)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
  loading,
}: {
  label: string
  value: string | null
  icon: any
  tone: 'primary' | 'amber' | 'teal' | 'green'
  loading: boolean
}) {
  const toneMap = {
    primary: 'bg-primary/10 text-primary',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200',
    teal: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-200',
    green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200',
  }
  return (
    <Card>
      <CardContent className="flex items-start justify-between py-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-7 w-28" />
          ) : (
            <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
          )}
        </div>
        <span className={classNames('grid h-10 w-10 place-items-center rounded-lg', toneMap[tone])}>
          <Icon className="h-5 w-5" />
        </span>
      </CardContent>
    </Card>
  )
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center text-center">
      <BarChart3 className="mb-2 h-8 w-8 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
