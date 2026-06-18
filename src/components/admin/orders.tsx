'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useApp } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  Search,
  RefreshCw,
  Download,
  Eye,
  ShoppingCart,
  Truck,
  FileText,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import {
  formatCurrency,
  formatDate,
  statusColor,
  prettifyStatus,
  classNames,
} from '@/lib/pricing'
import type { Order } from '@/lib/types'
import { ErrorState, EmptyState, TableSkeleton } from './leads'

type StatusFilter = 'all' | 'pending_approval' | 'approved' | 'submitted' | 'processing' | 'shipped' | 'delivered' | 'invoiced'

const ORDER_STATUSES: StatusFilter[] = ['all', 'pending_approval', 'approved', 'submitted', 'processing', 'shipped', 'delivered', 'invoiced']

const STATUS_FLOW: { value: string; label: string }[] = [
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'invoiced', label: 'Invoiced' },
]

export function AdminOrders() {
  const { navigate } = useApp()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState<string>('')
  const [updateTarget, setUpdateTarget] = useState<Order | null>(null)
  const [statusValue, setStatusValue] = useState<string>('')
  const [carrier, setCarrier] = useState('')
  const [tracking, setTracking] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/admin/orders')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setOrders(data.orders ?? [])
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
    return orders
      .filter((o) => statusFilter === 'all' || o.status === statusFilter)
      .filter((o) => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
          (o.orderNumber ?? '').toLowerCase().includes(q) ||
          (o.companyName ?? '').toLowerCase().includes(q) ||
          (o.poNumber ?? '').toLowerCase().includes(q)
        )
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [orders, statusFilter, search])

  const allSelected = filtered.length > 0 && filtered.every((o) => selected.has(o.id))
  const someSelected = selected.size > 0

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((o) => o.id)))
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function openUpdate(o: Order) {
    setUpdateTarget(o)
    setStatusValue(o.status)
    setCarrier(o.carrier ?? '')
    setTracking(o.trackingNumber ?? '')
  }

  async function saveStatus(target?: Order | null, ids?: string[]) {
    const isBulk = !target && ids && ids.length > 0
    setSaving(true)
    try {
      if (isBulk) {
        await Promise.all(
          ids!.map((id) =>
            fetch(`/api/admin/orders/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: statusValue }),
            })
          )
        )
        setOrders((prev) => prev.map((o) => (ids!.includes(o.id) ? { ...o, status: statusValue as Order['status'] } : o)))
        toast({ title: 'Bulk update complete', description: `${ids!.length} orders updated to ${prettifyStatus(statusValue)}.` })
        setSelected(new Set())
      } else if (target) {
        const res = await fetch(`/api/admin/orders/${target.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: statusValue, carrier: carrier || undefined, trackingNumber: tracking || undefined }),
        })
        if (!res.ok) throw new Error()
        setOrders((prev) =>
          prev.map((o) =>
            o.id === target.id
              ? { ...o, status: statusValue as Order['status'], carrier: carrier || null, trackingNumber: tracking || null }
              : o
          )
        )
        toast({ title: 'Order updated', description: `${target.orderNumber} → ${prettifyStatus(statusValue)}.` })
      }
      setUpdateTarget(null)
      setStatusValue('')
      setCarrier('')
      setTracking('')
    } catch {
      toast({ title: 'Update failed', description: 'Could not update order status.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function generateInvoice(o: Order) {
    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: o.id }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Invoice generated', description: `Invoice created for ${o.orderNumber}.` })
      await load()
    } catch {
      toast({ title: 'Failed', description: 'Could not generate invoice.', variant: 'destructive' })
    }
  }

  function exportCsv() {
    const headers = ['Order #', 'Company', 'PO #', 'Status', 'Date', 'Items', 'Total']
    const rows = filtered.map((o) => [
      o.orderNumber ?? o.id,
      o.companyName ?? '',
      o.poNumber ?? '',
      o.status,
      new Date(o.createdAt).toISOString(),
      o.items.length,
      o.total,
    ])
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    downloadCsv(csv, 'mino-orders.csv')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">All orders across all customers.</p>
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

      {/* Bulk action bar */}
      {someSelected && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium">
              {selected.size} order{selected.size === 1 ? '' : 's'} selected
            </p>
            <div className="flex items-center gap-2">
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger size="sm" className="w-[180px]">
                  <SelectValue placeholder="Choose new status…" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FLOW.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                disabled={!bulkStatus || saving}
                onClick={() => saveStatus(null, Array.from(selected))}
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                Apply
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search order #, PO, company…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger size="sm" className="w-[200px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s === 'all' ? 'All status' : prettifyStatus(s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {error ? (
            <ErrorState onRetry={load} />
          ) : loading ? (
            <TableSkeleton rows={8} cols={7} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={ShoppingCart} title="No orders found" subtitle={search || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Orders will appear here once customers start placing them.'} />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" />
                    </TableHead>
                    <TableHead className="min-w-[140px]">Order #</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="hidden lg:table-cell">PO #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((o) => (
                    <TableRow key={o.id} data-state={selected.has(o.id) ? 'selected' : undefined}>
                      <TableCell>
                        <Checkbox
                          checked={selected.has(o.id)}
                          onCheckedChange={() => toggleOne(o.id)}
                          aria-label={`Select ${o.orderNumber}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <button
                          onClick={() => navigate({ view: 'admin', page: 'order-detail', id: o.id })}
                          className="text-left hover:underline"
                        >
                          {o.orderNumber ?? '#' + o.id.slice(-6)}
                        </button>
                      </TableCell>
                      <TableCell className="text-sm">{o.companyName ?? '—'}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{o.poNumber ?? '—'}</TableCell>
                      <TableCell>
                        <Badge className={statusColor(o.status)} variant="outline">{prettifyStatus(o.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(o.total)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {o.status === 'delivered' && !o.invoice && (
                            <Button size="sm" variant="ghost" onClick={() => generateInvoice(o)} title="Generate invoice" className="text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300">
                              <FileText className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => openUpdate(o)}>
                            <Truck className="mr-1 h-3.5 w-3.5" />
                            Update
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => navigate({ view: 'admin', page: 'order-detail', id: o.id })}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update status dialog */}
      <Dialog open={!!updateTarget} onOpenChange={(o) => !o && setUpdateTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update order {updateTarget?.orderNumber}</DialogTitle>
            <DialogDescription>
              {updateTarget?.companyName} · {formatCurrency(updateTarget?.total ?? 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={statusValue} onValueChange={setStatusValue}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_FLOW.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(statusValue === 'shipped' || statusValue === 'delivered') && (
              <>
                <div className="space-y-1.5">
                  <Label>Carrier</Label>
                  <Input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="UPS, FedEx, etc." />
                </div>
                <div className="space-y-1.5">
                  <Label>Tracking number</Label>
                  <Input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="1Z…" />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateTarget(null)}>Cancel</Button>
            <Button onClick={() => saveStatus(updateTarget)} disabled={saving || !statusValue}>
              {saving ? 'Saving…' : 'Update order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
