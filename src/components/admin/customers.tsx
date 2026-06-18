'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useApp } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/hooks/use-toast'
import {
  Search,
  RefreshCw,
  Eye,
  Building2,
  Plus,
  Download,
  AlertCircle,
  ChevronRight,
} from 'lucide-react'
import {
  formatCurrency,
  formatDate,
  statusColor,
  prettifyStatus,
  classNames,
} from '@/lib/pricing'
import type { Company } from '@/lib/types'
import { ErrorState, EmptyState, TableSkeleton } from './leads'

type StatusFilter = 'all' | 'approved' | 'pending' | 'suspended'

interface CustomerRow extends Company {
  ordersCount?: number
  totalSpend?: number
}

export function AdminCustomers() {
  const { navigate } = useApp()
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/admin/customers')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setCustomers(data.customers ?? [])
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
    return customers
      .filter((c) => statusFilter === 'all' || c.status === statusFilter)
      .filter((c) => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
          c.name.toLowerCase().includes(q) ||
          (c.businessType ?? '').toLowerCase().includes(q)
        )
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [customers, statusFilter, search])

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { all: customers.length, approved: 0, pending: 0, suspended: 0 }
    for (const cu of customers) c[cu.status as StatusFilter] = (c[cu.status as StatusFilter] ?? 0) + 1
    return c
  }, [customers])

  function exportCsv() {
    const headers = ['Company', 'Status', 'Pricing Tier', 'Discount %', 'Net Terms (days)', 'Approval Threshold', 'Business Type', 'Monthly Volume', 'Created']
    const rows = filtered.map((c) => [
      c.name,
      c.status,
      c.pricingTierName ?? '',
      c.discountPercent ?? 0,
      c.netTermsDays,
      c.approvalThreshold,
      c.businessType ?? '',
      c.monthlyVolume ?? '',
      new Date(c.createdAt).toISOString(),
    ])
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    downloadCsv(csv, 'mino-customers.csv')
    toast({ title: 'Export ready', description: `${rows.length} customers exported.` })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Manage company accounts, pricing tiers, and terms.
          </p>
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
          <Button size="sm" onClick={() => navigate({ view: 'admin', page: 'leads' })}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add customer
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by company name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(['all', 'approved', 'pending', 'suspended'] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={classNames(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  statusFilter === s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                )}
              >
                {s === 'all' ? 'All' : prettifyStatus(s)}
                <span className="ml-1.5 opacity-70">{counts[s]}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {error ? (
            <ErrorState onRetry={load} />
          ) : loading ? (
            <TableSkeleton rows={6} cols={8} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No customers found"
              subtitle={search || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Approved wholesale leads will appear here as customers.'}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Pricing tier</TableHead>
                    <TableHead className="hidden md:table-cell">Discount</TableHead>
                    <TableHead className="hidden lg:table-cell">Net terms</TableHead>
                    <TableHead className="hidden lg:table-cell">Approval threshold</TableHead>
                    <TableHead className="hidden xl:table-cell">Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer"
                      onClick={() => navigate({ view: 'admin', page: 'customer-detail', id: c.id })}
                    >
                      <TableCell>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {c.businessType ? prettifyStatus(c.businessType) : '—'}
                          {c.monthlyVolume ? ` · ${c.monthlyVolume} volume` : ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColor(c.status)} variant="outline">
                          {prettifyStatus(c.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {c.pricingTierName ?? <span className="text-muted-foreground">Default</span>}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {c.discountPercent ? `${c.discountPercent}%` : '—'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        Net {c.netTermsDays}d
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        {formatCurrency(c.approvalThreshold)}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                        {formatDate(c.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate({ view: 'admin', page: 'customer-detail', id: c.id })
                          }}
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          View
                          <ChevronRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
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
