'use client'

import { useEffect, useMemo, useState } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api-client'
import {
  formatCurrency,
  formatDate,
  statusColor,
  prettifyStatus,
  classNames,
} from '@/lib/pricing'
import type { Invoice } from '@/lib/types'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Download,
  Receipt,
  AlertTriangle,
  Calendar,
  Wallet,
  Filter,
} from 'lucide-react'
import { toast } from 'sonner'

const STATUS_OPTIONS = ['all', 'open', 'paid', 'overdue'] as const

export function PortalInvoices() {
  const { navigate } = useApp()
  const [invoices, setInvoices] = useState<Invoice[] | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  useEffect(() => {
    api<{ invoices: Invoice[] }>('/api/invoices')
      .then((r) => setInvoices(r.invoices ?? []))
      .catch(() => setInvoices([]))
  }, [])

  const filtered = useMemo(() => {
    if (!invoices) return []
    return invoices
      .filter((i) => statusFilter === 'all' || i.status === statusFilter)
      .filter((i) => {
        if (fromDate && new Date(i.createdAt) < new Date(fromDate)) return false
        if (toDate && new Date(i.createdAt) > new Date(toDate + 'T23:59:59')) return false
        return true
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [invoices, statusFilter, fromDate, toDate])

  const openBalance = (invoices ?? [])
    .filter((i) => i.status !== 'paid')
    .reduce((s, i) => s + (i.amount ?? 0), 0)
  const nextDue = (invoices ?? [])
    .filter((i) => i.status !== 'paid')
    .map((i) => new Date(i.dueDate))
    .sort((a, b) => a.getTime() - b.getTime())[0]
  const overdueCount = (invoices ?? []).filter((i) => i.status === 'overdue').length

  const exportCsv = () => {
    if (filtered.length === 0) {
      toast.error('No invoices to export')
      return
    }
    const headers = ['Invoice #', 'Order #', 'Issue Date', 'Due Date', 'Amount', 'Status']
    const rows = filtered.map((i) => [
      i.invoiceNumber,
      i.orderNumber ?? '',
      formatDate(i.createdAt),
      formatDate(i.dueDate),
      i.amount.toFixed(2),
      prettifyStatus(i.status),
    ])
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mino-statement-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Statement exported')
  }

  const loading = invoices === null

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Invoices</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage and download your billing statements.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={loading || filtered.length === 0}>
          <Download className="mr-1.5 h-4 w-4" />
          Export Statement
        </Button>
      </div>

      {/* Balance bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="overflow-hidden">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
              <Wallet className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Open Balance
              </p>
              {loading ? (
                <Skeleton className="mt-1 h-7 w-24" />
              ) : (
                <p className="truncate text-2xl font-bold">{formatCurrency(openBalance)}</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <Calendar className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Next Due
              </p>
              {loading ? (
                <Skeleton className="mt-1 h-7 w-24" />
              ) : nextDue ? (
                <p className="truncate text-lg font-semibold">{formatDate(nextDue.toISOString())}</p>
              ) : (
                <p className="truncate text-lg font-semibold text-muted-foreground">All paid up</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className={classNames(overdueCount > 0 && 'border-red-300 dark:border-red-800/60')}>
          <CardContent className="flex items-center gap-4 p-5">
            <span
              className={classNames(
                'grid h-12 w-12 shrink-0 place-items-center rounded-xl',
                overdueCount > 0
                  ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <AlertTriangle className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Overdue Invoices
              </p>
              {loading ? (
                <Skeleton className="mt-1 h-7 w-12" />
              ) : (
                <p className="truncate text-2xl font-bold">{overdueCount}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-3">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            Invoice History
          </CardTitle>
          <CardDescription>
            {loading ? 'Loading…' : `${filtered.length} invoice${filtered.length === 1 ? '' : 's'} found`}
          </CardDescription>
          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === 'all' ? 'All Statuses' : prettifyStatus(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full sm:w-36"
                aria-label="From date"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full sm:w-36"
                aria-label="To date"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {loading ? (
            <div className="space-y-2 px-6 pb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
                <Receipt className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-semibold">No invoices found</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Try adjusting your filters.
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Invoice #</TableHead>
                  <TableHead className="hidden sm:table-cell">Order #</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((i) => (
                  <TableRow
                    key={i.id}
                    className={classNames(
                      i.status === 'overdue' && 'bg-red-50/40 dark:bg-red-950/10'
                    )}
                  >
                    <TableCell className="pl-6 font-medium">{i.invoiceNumber}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {i.orderNumber ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(i.createdAt)}
                    </TableCell>
                    <TableCell
                      className={classNames(
                        i.status === 'overdue' && 'font-semibold text-red-700 dark:text-red-300'
                      )}
                    >
                      {formatDate(i.dueDate)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(i.amount ?? 0)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColor(i.status)} variant="secondary">
                        {prettifyStatus(i.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2"
                        onClick={() => {
                          if (i.pdfUrl) {
                            window.open(i.pdfUrl, '_blank')
                          } else {
                            toast.info('Invoice PDF generation pending')
                          }
                        }}
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span className="ml-1 hidden sm:inline">PDF</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
