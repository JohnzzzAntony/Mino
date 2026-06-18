'use client'

import { useEffect, useState, useCallback } from 'react'
import { useApp } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  Receipt,
  Package,
  ArrowRight,
  Clock,
  UserPlus,
  AlertCircle,
  ChevronRight,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  statusColor,
  prettifyStatus,
  classNames,
} from '@/lib/pricing'
import type { Order, WholesaleLead, Invoice } from '@/lib/types'

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

interface OverviewState {
  reports: ReportsData | null
  leads: WholesaleLead[]
  orders: Order[]
  invoices: Invoice[]
  loading: boolean
  error: boolean
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'var(--muted-foreground)',
  pending_approval: 'oklch(0.7 0.12 85)',
  approved: 'oklch(0.6 0.08 180)',
  submitted: 'oklch(0.6 0.08 180)',
  processing: 'oklch(0.65 0.1 60)',
  shipped: 'oklch(0.55 0.1 150)',
  delivered: 'oklch(0.55 0.1 150)',
  invoiced: 'oklch(0.5 0.07 145)',
}

export function AdminOverview() {
  const { navigate } = useApp()
  const [state, setState] = useState<OverviewState>({
    reports: null,
    leads: [],
    orders: [],
    invoices: [],
    loading: true,
    error: false,
  })

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: false }))
    try {
      const [rep, lea, ord, inv] = await Promise.all([
        fetch('/api/admin/reports').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/admin/leads').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/admin/orders').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/admin/invoices').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ])
      setState({
        reports: rep ?? null,
        leads: lea?.leads ?? [],
        orders: ord?.orders ?? [],
        invoices: inv?.invoices ?? [],
        loading: false,
        error: !rep && !lea && !ord && !inv,
      })
    } catch {
      setState((s) => ({ ...s, loading: false, error: true }))
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (cancelled) return
      setState((s) => ({ ...s, loading: true, error: false }))
      try {
        const [rep, lea, ord, inv] = await Promise.all([
          fetch('/api/admin/reports').then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch('/api/admin/leads').then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch('/api/admin/orders').then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch('/api/admin/invoices').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ])
        if (cancelled) return
        setState({
          reports: rep ?? null,
          leads: lea?.leads ?? [],
          orders: ord?.orders ?? [],
          invoices: inv?.invoices ?? [],
          loading: false,
          error: !rep && !lea && !ord && !inv,
        })
      } catch {
        if (cancelled) return
        setState((s) => ({ ...s, loading: false, error: true }))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const r = state.reports
  const now = new Date()

  // Derive action queue counts
  const newLeads = state.leads.filter((l) => l.status === 'new' || l.status === 'contacted')
  const ordersToProcess = state.orders.filter(
    (o) => o.status === 'submitted' || o.status === 'processing' || o.status === 'pending_approval'
  )
  const overdueInvoices = state.invoices.filter((i) => i.status === 'overdue')

  // Derive recent activity from orders + leads (last 10)
  type Activity = {
    id: string
    type: 'lead' | 'order' | 'status'
    title: string
    subtitle: string
    when: string
  }
  const activities: Activity[] = [
    ...state.leads.map((l) => ({
      id: l.id,
      type: 'lead' as const,
      title: `New wholesale lead: ${l.companyName}`,
      subtitle: `${l.contactName} · ${l.businessType ?? 'Business'}`,
      when: l.createdAt,
    })),
    ...state.orders.map((o) => ({
      id: o.id,
      type: 'order' as const,
      title: `Order ${o.orderNumber ?? '#' + o.id.slice(-6)} · ${o.companyName ?? 'Company'}`,
      subtitle: `${formatCurrency(o.total)} · ${prettifyStatus(o.status)}`,
      when: o.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime())
    .slice(0, 10)

  const donutData = r?.statusBreakdown?.length
    ? r.statusBreakdown.map((s) => ({ name: prettifyStatus(s.status), value: s.count, status: s.status }))
    : Object.entries(
        state.orders.reduce<Record<string, number>>((acc, o) => {
          acc[o.status] = (acc[o.status] ?? 0) + 1
          return acc
        }, {})
      ).map(([status, count]) => ({ name: prettifyStatus(status), value: count, status }))

  const revenueData =
    r?.monthlyRevenue?.length
      ? r.monthlyRevenue.map((m) => ({ month: m.month, revenue: m.revenue }))
      : state.orders.reduce<{ month: string; revenue: number }[]>((acc, o) => {
          const d = new Date(o.createdAt)
          const key = d.toLocaleDateString('en-US', { month: 'short' })
          const ex = acc.find((a) => a.month === key)
          if (ex) ex.revenue += o.total
          else acc.push({ month: key, revenue: o.total })
          return acc
        }, []).slice(-8)

  const totalRevenueYTD = r?.totalRevenue ?? state.orders.reduce((s, o) => s + o.total, 0)
  const ordersThisMonth = state.orders.filter(
    (o) => new Date(o.createdAt).getMonth() === now.getMonth() && new Date(o.createdAt).getFullYear() === now.getFullYear()
  ).length
  const newLeadsCount = r?.recentLeads ?? newLeads.length
  const activeCustomers = r?.customersCount ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Overview</h1>
          <p className="text-sm text-muted-foreground">
            {now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate({ view: 'admin', page: 'reports' })}>
          View full reports
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>

      {state.error && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Data unavailable</p>
              <p className="text-xs text-amber-700 dark:text-amber-200">
                Some admin APIs are still being built. Showing partial data where available.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={load}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          subtitle="YTD"
          value={state.loading ? null : formatCurrency(totalRevenueYTD)}
          icon={Receipt}
          trend={12.4}
          loading={state.loading}
          tone="primary"
        />
        <StatCard
          title="Orders"
          subtitle="This month"
          value={state.loading ? null : String(ordersThisMonth)}
          icon={ShoppingCart}
          trend={8.1}
          loading={state.loading}
          tone="amber"
        />
        <StatCard
          title="New Leads"
          subtitle="Awaiting review"
          value={state.loading ? null : String(newLeadsCount)}
          icon={UserPlus}
          trend={-3.2}
          loading={state.loading}
          tone="teal"
        />
        <StatCard
          title="Active Customers"
          subtitle="Approved accounts"
          value={state.loading ? null : String(activeCustomers)}
          icon={Users}
          trend={4.7}
          loading={state.loading}
          tone="green"
        />
      </div>

      {/* Action queue */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Action queue</CardTitle>
          <CardDescription>Items needing your attention right now</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <ActionQueueItem
            label="Leads awaiting review"
            count={state.loading ? null : newLeads.length}
            icon={UserPlus}
            onClick={() => navigate({ view: 'admin', page: 'leads' })}
            tone="amber"
          />
          <ActionQueueItem
            label="Orders to process"
            count={state.loading ? null : ordersToProcess.length}
            icon={Package}
            onClick={() => navigate({ view: 'admin', page: 'orders' })}
            tone="teal"
          />
          <ActionQueueItem
            label="Invoices overdue"
            count={state.loading ? null : overdueInvoices.length}
            icon={Receipt}
            onClick={() => navigate({ view: 'admin', page: 'invoices' })}
            tone={overdueInvoices.length > 0 ? 'red' : 'muted'}
          />
        </CardContent>
      </Card>

      {/* Charts + Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Revenue trend</CardTitle>
            <CardDescription>Monthly revenue, last 8 months</CardDescription>
          </CardHeader>
          <CardContent>
            {state.loading ? (
              <Skeleton className="h-64 w-full" />
            ) : revenueData.length === 0 ? (
              <EmptyChart label="No revenue data yet" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={revenueData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.55 0.1 150)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="oklch(0.55 0.1 150)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.02 95)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 145)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 145)" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <RTooltip
                    formatter={(v: number) => [formatCurrency(v), 'Revenue']}
                    contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="oklch(0.5 0.09 150)" strokeWidth={2} fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Order status donut */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order status</CardTitle>
            <CardDescription>Breakdown by status</CardDescription>
          </CardHeader>
          <CardContent>
            {state.loading ? (
              <Skeleton className="h-64 w-full" />
            ) : donutData.length === 0 ? (
              <EmptyChart label="No orders yet" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {donutData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={STATUS_COLORS[entry.status] ?? 'var(--muted-foreground)'}
                      />
                    ))}
                  </Pie>
                  <RTooltip
                    formatter={(v: number, n: string) => [`${v} order${v === 1 ? '' : 's'}`, n]}
                    contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            {donutData.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
                {donutData.map((d, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[d.status] ?? 'var(--muted-foreground)' }}
                    />
                    {d.name} · {d.value}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent activity</CardTitle>
          <CardDescription>Last 10 events across leads &amp; orders</CardDescription>
        </CardHeader>
        <CardContent>
          {state.loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-muted-foreground">
              <Clock className="mb-2 h-8 w-8 text-muted-foreground/50" />
              No recent activity yet
            </div>
          ) : (
            <ol className="relative space-y-1 max-h-96 overflow-y-auto scrollbar-thin">
              {activities.map((a, i) => (
                <li
                  key={a.id + i}
                  className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <span
                    className={classNames(
                      'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full',
                      a.type === 'lead'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200'
                    )}
                  >
                    {a.type === 'lead' ? <UserPlus className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.subtitle}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDateTime(a.when)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  title,
  subtitle,
  value,
  icon: Icon,
  trend,
  loading,
  tone,
}: {
  title: string
  subtitle: string
  value: string | null
  icon: any
  trend: number
  loading: boolean
  tone: 'primary' | 'amber' | 'teal' | 'green'
}) {
  const toneMap = {
    primary: 'bg-primary/10 text-primary',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200',
    teal: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-200',
    green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200',
  }
  const up = trend >= 0
  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
            <p className="text-[11px] text-muted-foreground/70">{subtitle}</p>
          </div>
          <span className={classNames('grid h-9 w-9 place-items-center rounded-lg', toneMap[tone])}>
            <Icon className="h-4.5 w-4.5" />
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          {loading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <p className="text-2xl font-bold tracking-tight">{value}</p>
          )}
          {!loading && (
            <span
              className={classNames(
                'flex items-center gap-0.5 text-xs font-medium',
                up ? 'text-emerald-600' : 'text-red-600'
              )}
            >
              {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ActionQueueItem({
  label,
  count,
  icon: Icon,
  onClick,
  tone,
}: {
  label: string
  count: number | null
  icon: any
  onClick: () => void
  tone: 'amber' | 'teal' | 'red' | 'muted'
}) {
  const toneMap = {
    amber: 'border-amber-200 bg-amber-50 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/20',
    teal: 'border-teal-200 bg-teal-50 hover:bg-teal-100 dark:border-teal-900/50 dark:bg-teal-950/20',
    red: 'border-red-200 bg-red-50 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/20',
    muted: 'border-border bg-muted/40 hover:bg-muted',
  }
  const iconTone = {
    amber: 'bg-amber-500 text-white',
    teal: 'bg-teal-600 text-white',
    red: 'bg-red-500 text-white',
    muted: 'bg-muted-foreground text-background',
  }
  return (
    <button
      onClick={onClick}
      className={classNames(
        'flex items-center gap-3 rounded-xl border p-4 text-left transition-all hover:shadow-sm',
        toneMap[tone]
      )}
    >
      <span className={classNames('grid h-10 w-10 shrink-0 place-items-center rounded-lg', iconTone[tone])}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-bold leading-none">
          {count === null ? <span className="inline-block h-6 w-8 animate-pulse rounded bg-foreground/10" /> : count}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  )
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center text-center">
      <Clock className="mb-2 h-8 w-8 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}
