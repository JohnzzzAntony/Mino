'use client'

import { useEffect, useState } from 'react'
import { useApp, type CartItem } from '@/lib/store'
import { api } from '@/lib/api-client'
import {
  formatCurrency,
  formatDate,
  formatNumber,
  statusColor,
  prettifyStatus,
  classNames,
} from '@/lib/pricing'
import type { Order, Invoice } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  TrendingUp,
  ShoppingCart,
  Receipt,
  Clock,
  Leaf,
  TreePine,
  ArrowRight,
  Package,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'

interface SustData {
  treesSaved: number
  recycledLbs: number
  plasticSavedLbs: number
  waterSavedGal: number
  monthlyData: { month: string; treesSaved: number; spend: number }[]
  ordersCount: number
  totalSpend: number
}

export function PortalDashboard() {
  const { user, navigate, addToCart, cart } = useApp()
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [invoices, setInvoices] = useState<Invoice[] | null>(null)
  const [sust, setSust] = useState<SustData | null>(null)
  const [approving, setApproving] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api<{ orders: Order[] }>('/api/orders').catch(() => ({ orders: [] })),
      api<{ invoices: Invoice[] }>('/api/invoices').catch(() => ({ invoices: [] })),
      api<SustData>('/api/sustainability').catch(() => null),
    ]).then(([o, i, s]) => {
      setOrders(o.orders ?? [])
      setInvoices(i.invoices ?? [])
      setSust(s)
    })
  }, [])

  // Stats
  const ytdSpend = sust?.totalSpend ?? orders?.reduce((s, o) => s + (o.total ?? 0), 0) ?? 0
  const avgOrder = orders && orders.length > 0 ? ytdSpend / orders.length : 0
  const openInvoices = invoices?.filter((i) => i.status !== 'paid') ?? []
  const openBalance = openInvoices.reduce((s, i) => s + (i.amount ?? 0), 0)
  const pendingApprovals = orders?.filter((o) => o.status === 'pending_approval') ?? []
  const recentOrders = (orders ?? []).slice(0, 5)
  const lastOrder = orders?.[0]

  const handleApprove = async (id: string) => {
    setApproving(id)
    try {
      await api(`/api/orders/${id}/approve`, { method: 'POST' })
      toast.success('Order approved')
      const o = await api<{ orders: Order[] }>('/api/orders').catch(() => ({ orders: [] }))
      setOrders(o.orders ?? [])
    } catch (e: any) {
      toast.error(e?.message ?? 'Approval API pending')
    } finally {
      setApproving(null)
    }
  }

  const handleReject = async (id: string) => {
    setApproving(id)
    try {
      await api(`/api/orders/${id}/reject`, { method: 'POST' })
      toast.success('Order rejected')
      const o = await api<{ orders: Order[] }>('/api/orders').catch(() => ({ orders: [] }))
      setOrders(o.orders ?? [])
    } catch (e: any) {
      toast.error(e?.message ?? 'Approval API pending')
    } finally {
      setApproving(null)
    }
  }

  const reorderAll = () => {
    if (!lastOrder?.items?.length) {
      toast.error('No items to reorder')
      return
    }
    lastOrder.items.forEach((it) => {
      addToCart({
        productId: it.productId,
        name: it.productName,
        sku: it.sku,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
        image: it.product?.images?.[0],
        unit: it.product?.unit,
      })
    })
    toast.success(`Added ${lastOrder.items.length} items to cart`)
    navigate({ view: 'portal', page: 'cart' })
  }

  const reorderItem = (it: Order['items'][number]) => {
    addToCart({
      productId: it.productId,
      name: it.productName,
      sku: it.sku,
      unitPrice: it.unitPrice,
      quantity: it.quantity,
      image: it.product?.images?.[0],
      unit: it.product?.unit,
    })
    toast.success(`Added ${it.productName} to cart`)
  }

  const loading = orders === null

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Customer Portal
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome back, {user?.companyName ?? user?.name ?? 'there'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's a snapshot of your account activity.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {user?.pricingTierName && (
            <Badge className="bg-primary/10 text-primary" variant="secondary">
              <Leaf className="mr-1 h-3 w-3" />
              {user.pricingTierName}
              {user.discountPercent ? ` · ${user.discountPercent}% off` : ''}
            </Badge>
          )}
          {user?.role === 'admin' && (
            <Badge variant="outline" className="text-amber-700">
              <AlertTriangle className="mr-1 h-3 w-3" /> Admin viewing
            </Badge>
          )}
          <Button
            size="sm"
            onClick={() => navigate({ view: 'portal', page: 'catalog' })}
          >
            <ShoppingCart className="mr-1.5 h-4 w-4" />
            Browse Catalog
          </Button>
        </div>
      </div>

      {/* Pending Approval alert */}
      {!loading && user && (user.role === 'approver' || user.role === 'owner') && pendingApprovals.length > 0 && (
        <Card className="border-amber-300/70 bg-amber-50/70 dark:border-amber-800/60 dark:bg-amber-950/30">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
                <Clock className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  {pendingApprovals.length} order{pendingApprovals.length === 1 ? '' : 's'} awaiting your approval
                </p>
                <p className="text-xs text-amber-800/80 dark:text-amber-200/80">
                  Review and approve orders placed by your team.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {pendingApprovals.slice(0, 2).map((o) => (
                <div key={o.id} className="flex items-center gap-1.5 rounded-lg border border-amber-300/60 bg-background p-1 pl-2">
                  <span className="text-xs font-medium">{o.orderNumber ?? o.poNumber ?? 'Order'}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700"
                    disabled={approving === o.id}
                    onClick={() => handleApprove(o.id)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-destructive hover:bg-red-50"
                    disabled={approving === o.id}
                    onClick={() => handleReject(o.id)}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate({ view: 'portal', page: 'orders' })}
              >
                View All
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="YTD Spend"
          value={loading ? null : formatCurrency(ytdSpend)}
          icon={TrendingUp}
          accent="emerald"
          sub={`${orders?.length ?? 0} orders this year`}
        />
        <StatCard
          label="Avg Order Value"
          value={loading ? null : formatCurrency(avgOrder)}
          icon={ShoppingCart}
          accent="amber"
          sub="Across all placed orders"
        />
        <StatCard
          label="Open Invoices"
          value={loading ? null : `${openInvoices.length} · ${formatCurrency(openBalance)}`}
          icon={Receipt}
          accent="rose"
          sub="Net-terms balance outstanding"
        />
        <StatCard
          label="Pending Approvals"
          value={loading ? null : formatNumber(pendingApprovals.length)}
          icon={Clock}
          accent="violet"
          sub={pendingApprovals.length > 0 ? 'Awaiting review' : 'All caught up'}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Your last 5 orders</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ view: 'portal', page: 'orders' })}
            >
              View All
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="px-0">
            {loading ? (
              <div className="space-y-2 px-6 pb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <EmptyRow
                title="No orders yet"
                desc="Place your first order from the catalog."
                cta="Browse Catalog"
                onClick={() => navigate({ view: 'portal', page: 'catalog' })}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Order #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="hidden sm:table-cell">PO#</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="pr-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((o) => (
                    <TableRow
                      key={o.id}
                      className="cursor-pointer"
                      onClick={() => navigate({ view: 'portal', page: 'order-detail', id: o.id })}
                    >
                      <TableCell className="pl-6 font-medium">
                        {o.orderNumber ?? o.poNumber ?? `#${o.id.slice(-6)}`}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(o.createdAt)}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {o.poNumber ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColor(o.status)} variant="secondary">
                          {prettifyStatus(o.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(o.total ?? 0)}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <Button size="sm" variant="ghost" className="h-7">
                          View
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Sustainability snapshot */}
        <Card className="overflow-hidden">
          <div className="relative bg-gradient-to-br from-primary/15 via-emerald-50 to-amber-50 p-6 dark:from-primary/20 dark:via-emerald-950/30 dark:to-amber-950/20">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Sustainability Snapshot
                </p>
                <h3 className="mt-1 text-lg font-semibold">Your impact this year</h3>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
                <TreePine className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-6 flex items-end gap-2">
              <span className="text-4xl font-bold text-emerald-700 dark:text-emerald-300">
                {sust ? formatNumber(sust.treesSaved) : '—'}
              </span>
              <span className="pb-1 text-sm text-muted-foreground">trees saved</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Equivalent to ~{sust ? formatNumber(Math.round(sust.recycledLbs)) : '—'} lbs of recycled content kept out of landfills.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 border-emerald-300 bg-background/70 text-emerald-700 hover:bg-emerald-50"
              onClick={() => navigate({ view: 'portal', page: 'sustainability' })}
            >
              See Full Impact
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Quick Reorder */}
      {lastOrder && lastOrder.items && lastOrder.items.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-primary" />
                Quick Reorder
              </CardTitle>
              <CardDescription>
                Items from your last order — {lastOrder.orderNumber ?? 'most recent'}
              </CardDescription>
            </div>
            <Button size="sm" onClick={reorderAll}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Reorder All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {lastOrder.items.map((it) => (
                <div
                  key={it.id}
                  className="flex w-56 shrink-0 flex-col rounded-lg border bg-card p-3 shadow-sm transition hover:shadow-md"
                >
                  <div className="mb-2 aspect-square w-full overflow-hidden rounded-md bg-muted">
                    {it.product?.images?.[0] ? (
                      <img
                        src={it.product.images[0]}
                        alt={it.productName}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-muted-foreground">
                        <Package className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <p className="line-clamp-2 text-sm font-medium">{it.productName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">SKU: {it.sku}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      {formatCurrency(it.unitPrice)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      Qty {it.quantity}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => reorderItem(it)}
                  >
                    <ShoppingCart className="mr-1 h-3.5 w-3.5" />
                    Reorder
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  sub,
}: {
  label: string
  value: string | null
  icon: any
  accent: 'emerald' | 'amber' | 'rose' | 'violet'
  sub?: string
}) {
  const accentMap: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300',
  }
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            {value === null ? (
              <Skeleton className="mt-2 h-7 w-24" />
            ) : (
              <p className="mt-1 truncate text-2xl font-bold tracking-tight">{value}</p>
            )}
            {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <span className={classNames('grid h-10 w-10 shrink-0 place-items-center rounded-xl', accentMap[accent])}>
            <Icon className="h-5 w-5" />
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyRow({
  title,
  desc,
  cta,
  onClick,
}: {
  title: string
  desc: string
  cta: string
  onClick: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Package className="h-6 w-6" />
      </span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
      <Button size="sm" onClick={onClick}>
        {cta}
      </Button>
    </div>
  )
}
