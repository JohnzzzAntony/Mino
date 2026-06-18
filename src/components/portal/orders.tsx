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
import type { Order } from '@/lib/types'
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
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  RefreshCw,
  Eye,
  Receipt,
  Filter,
} from 'lucide-react'
import { toast } from 'sonner'

const STATUS_OPTIONS = [
  'all',
  'draft',
  'pending_approval',
  'submitted',
  'processing',
  'shipped',
  'delivered',
  'invoiced',
] as const

const PAGE_SIZE = 10

export function PortalOrders() {
  const { navigate, addToCart } = useApp()
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    api<{ orders: Order[] }>('/api/orders')
      .then((r) => setOrders(r.orders ?? []))
      .catch(() => setOrders([]))
  }, [])

  const filtered = useMemo(() => {
    if (!orders) return []
    return orders
      .filter((o) => statusFilter === 'all' || o.status === statusFilter)
      .filter((o) => {
        if (!search.trim()) return true
        const q = search.toLowerCase()
        return (
          (o.orderNumber ?? '').toLowerCase().includes(q) ||
          (o.poNumber ?? '').toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [orders, statusFilter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const handleReorder = (o: Order) => {
    if (!o.items?.length) {
      toast.error('No items found to reorder')
      return
    }
    o.items.forEach((it) => {
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
    toast.success(`Added ${o.items.length} items to cart`)
    navigate({ view: 'portal', page: 'cart' })
  }

  const exportCsv = () => {
    if (filtered.length === 0) {
      toast.error('No orders to export')
      return
    }
    const headers = ['Order #', 'Date', 'PO #', 'Status', 'Items', 'Subtotal', 'Total']
    const rows = filtered.map((o) => [
      o.orderNumber ?? o.id.slice(-6),
      formatDate(o.createdAt),
      o.poNumber ?? '',
      prettifyStatus(o.status),
      String(o.items?.length ?? 0),
      o.subtotal.toFixed(2),
      o.total.toFixed(2),
    ])
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mino-orders-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported')
  }

  const loading = orders === null

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View, track, and reorder from your order history.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={loading || filtered.length === 0}>
          <Download className="mr-1.5 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-3">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            Order History
          </CardTitle>
          <CardDescription>
            {loading
              ? 'Loading…'
              : `${filtered.length} order${filtered.length === 1 ? '' : 's'} found`}
          </CardDescription>
          {/* Filters */}
          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by order # or PO #…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger className="w-full sm:w-44">
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
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {loading ? (
            <div className="space-y-2 px-6 pb-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : paged.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
                <Receipt className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-semibold">No orders found</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Try adjusting your filters or place your first order.
                </p>
              </div>
              <Button size="sm" onClick={() => navigate({ view: 'portal', page: 'catalog' })}>
                Browse Catalog
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Order #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="hidden sm:table-cell">PO #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((o) => (
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
                    <TableCell className="hidden text-right text-muted-foreground md:table-cell">
                      {o.items?.length ?? 0}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(o.total ?? 0)}
                    </TableCell>
                    <TableCell className="pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate({ view: 'portal', page: 'order-detail', id: o.id })
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span className="ml-1 hidden sm:inline">View</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleReorder(o)
                          }}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span className="ml-1 hidden sm:inline">Reorder</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <span className="text-sm font-medium">
              {safePage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
