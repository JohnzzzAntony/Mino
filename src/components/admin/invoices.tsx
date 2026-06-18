'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/hooks/use-toast'
import {
  RefreshCw,
  Download,
  Receipt,
  Search,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
} from 'lucide-react'
import {
  formatCurrency,
  formatDate,
  statusColor,
  prettifyStatus,
  classNames,
} from '@/lib/pricing'
import type { Invoice } from '@/lib/types'
import { ErrorState, EmptyState, TableSkeleton } from './leads'

type StatusFilter = 'all' | 'open' | 'paid' | 'overdue'

export function AdminInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [dateRange, setDateRange] = useState<'30' | '90' | '365' | 'all'>('365')
  const [markPaidTarget, setMarkPaidTarget] = useState<Invoice | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/admin/invoices')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setInvoices(data.invoices ?? [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const cutoff = dateRange === 'all' ? 0 : Date.now() - Number(dateRange) * 24 * 60 * 60 * 1000
    return invoices
      .filter((inv) => statusFilter === 'all' || inv.status === statusFilter)
      .filter((inv) => cutoff === 0 || new Date(inv.createdAt).getTime() >= cutoff)
      .filter((inv) => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
          inv.invoiceNumber.toLowerCase().includes(q) ||
          (inv.companyName ?? '').toLowerCase().includes(q) ||
          (inv.orderNumber ?? '').toLowerCase().includes(q)
        )
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [invoices, statusFilter, dateRange, search])

  const stats = useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
    let outstanding = 0
    let overdue = 0
    let paidThisMonth = 0
    for (const inv of invoices) {
      if (inv.status === 'open') outstanding += inv.amount
      if (inv.status === 'overdue') {
        overdue += inv.amount
        outstanding += inv.amount
      }
      if (inv.status === 'paid' && inv.paidAt && new Date(inv.paidAt).getTime() >= monthStart) {
        paidThisMonth += inv.amount
      }
    }
    return { outstanding, overdue, paidThisMonth, total: invoices.length }
  }, [invoices])

  async function markPaid(inv: Invoice) {
    setBusy(inv.id)
    try {
      const res = await fetch(`/api/admin/invoices/${inv.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' }),
      })
      if (!res.ok) throw new Error()
      setInvoices((prev) =>
        prev.map((i) =>
          i.id === inv.id ? { ...i, status: 'paid', paidAt: new Date().toISOString() } : i
        )
      )
      toast({ title: 'Invoice marked paid', description: `${inv.invoiceNumber} paid in full.` })
      setMarkPaidTarget(null)
    } catch {
      toast({ title: 'Update failed', description: 'Could not mark invoice as paid.', variant: 'destructive' })
    } finally {
      setBusy(null)
    }
  }

  function exportCsv() {
    const headers = ['Invoice #', 'Company', 'Order #', 'Issue Date', 'Due Date', 'Amount', 'Status', 'Paid At']
    const rows = filtered.map((i) => [
      i.invoiceNumber,
      i.companyName ?? '',
      i.orderNumber ?? '',
      new Date(i.createdAt).toISOString(),
      new Date(i.dueDate).toISOString(),
      i.amount,
      i.status,
      i.paidAt ? new Date(i.paidAt).toISOString() : '',
    ])
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    downloadCsv(csv, 'mino-invoices.csv')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground">Track outstanding balances and payment status.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={classNames('mr-1.5 h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="mr-1.5 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Top bar stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Outstanding"
          value={loading ? null : formatCurrency(stats.outstanding)}
          icon={Clock}
          tone="amber"
          loading={loading}
        />
        <StatTile
          label="Overdue"
          value={loading ? null : formatCurrency(stats.overdue)}
          icon={AlertCircle}
          tone={stats.overdue > 0 ? 'red' : 'muted'}
          loading={loading}
        />
        <StatTile
          label="Paid this month"
          value={loading ? null : formatCurrency(stats.paidThisMonth)}
          icon={CheckCircle2}
          tone="green"
          loading={loading}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search invoice #, company, order…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger size="sm" className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
              <SelectTrigger size="sm" className="w-[140px]">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last 12 months</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {error ? (
            <ErrorState onRetry={load} />
          ) : loading ? (
            <TableSkeleton rows={6} cols={7} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={Receipt} title="No invoices found" subtitle={search || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Invoices are created automatically when orders are delivered.'} />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[140px]">Invoice #</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead className="hidden md:table-cell">Order #</TableHead>
                    <TableHead className="hidden lg:table-cell">Issued</TableHead>
                    <TableHead className="hidden lg:table-cell">Due</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((inv) => {
                    const isOverdue = inv.status === 'overdue' || (inv.status === 'open' && new Date(inv.dueDate).getTime() < Date.now())
                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono font-medium">{inv.invoiceNumber}</TableCell>
                        <TableCell className="text-sm">{inv.companyName ?? '—'}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{inv.orderNumber ?? '—'}</TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{formatDate(inv.createdAt)}</TableCell>
                        <TableCell className="hidden lg:table-cell text-xs">
                          <span className={isOverdue ? 'font-medium text-red-600' : 'text-muted-foreground'}>
                            {formatDate(inv.dueDate)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(inv.amount)}</TableCell>
                        <TableCell>
                          <Badge className={statusColor(isOverdue && inv.status === 'open' ? 'overdue' : inv.status)} variant="outline">
                            {prettifyStatus(isOverdue && inv.status === 'open' ? 'overdue' : inv.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            {inv.status !== 'paid' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setMarkPaidTarget(inv)}
                                disabled={busy === inv.id}
                                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/50 dark:text-emerald-300"
                              >
                                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                Mark paid
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" disabled title="Download PDF">
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mark paid confirm */}
      <AlertDialog open={!!markPaidTarget} onOpenChange={(o) => !o && setMarkPaidTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark {markPaidTarget?.invoiceNumber} as paid?</AlertDialogTitle>
            <AlertDialogDescription>
              {markPaidTarget && (
                <>
                  This will record {formatCurrency(markPaidTarget.amount)} as received from{' '}
                  <span className="font-medium text-foreground">{markPaidTarget.companyName}</span>. The
                  payment date will be set to today.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => markPaidTarget && markPaid(markPaidTarget)}
              disabled={busy === markPaidTarget?.id}
              className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800"
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              {busy === markPaidTarget?.id ? 'Saving…' : 'Confirm payment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function StatTile({
  label,
  value,
  icon: Icon,
  tone,
  loading,
}: {
  label: string
  value: string | null
  icon: any
  tone: 'amber' | 'red' | 'green' | 'muted'
  loading: boolean
}) {
  const toneMap = {
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200',
    red: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-200',
    green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200',
    muted: 'bg-muted text-muted-foreground',
  }
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-7 w-24" />
          ) : (
            <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
          )}
        </div>
        <span className={classNames('grid h-11 w-11 place-items-center rounded-lg', toneMap[tone])}>
          <Icon className="h-5 w-5" />
        </span>
      </CardContent>
    </Card>
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
