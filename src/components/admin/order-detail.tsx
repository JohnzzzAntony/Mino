'use client'

import { useEffect, useState, useCallback } from 'react'
import { useApp } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
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
  ArrowLeft,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  Package,
  FileText,
  MapPin,
  Building2,
  RefreshCw,
  Check,
  Download,
} from 'lucide-react'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  statusColor,
  prettifyStatus,
  classNames,
} from '@/lib/pricing'
import type { Order } from '@/lib/types'
import { ErrorState } from './leads'

const STATUS_FLOW = [
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'invoiced', label: 'Invoiced' },
]

const TIMELINE_STEPS = [
  { key: 'submitted', label: 'Submitted', icon: Clock },
  { key: 'approved', label: 'Approved', icon: CheckCircle2 },
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
  { key: 'invoiced', label: 'Invoiced', icon: FileText },
]

function statusIndex(status: string): number {
  const i = TIMELINE_STEPS.findIndex((s) => s.key === status)
  return i === -1 ? 0 : i
}

export function AdminOrderDetail({ id }: { id: string }) {
  const { navigate } = useApp()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [statusValue, setStatusValue] = useState('')
  const [carrier, setCarrier] = useState('')
  const [tracking, setTracking] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`/api/admin/orders/${id}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const o = (data.order ?? data) as Order
      setOrder(o)
      setStatusValue(o.status)
      setCarrier(o.carrier ?? '')
      setTracking(o.trackingNumber ?? '')
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function saveStatus() {
    if (!order) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: statusValue,
          carrier: carrier || undefined,
          trackingNumber: tracking || undefined,
        }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Order updated', description: `Status set to ${prettifyStatus(statusValue)}.` })
      await load()
    } catch {
      toast({ title: 'Update failed', description: 'Could not update order.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function resolveApproval(decision: 'approved' | 'rejected') {
    if (!order?.approval) return
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      })
      if (!res.ok) throw new Error()
      toast({
        title: decision === 'approved' ? 'Order approved' : 'Order rejected',
        description: `Approval request ${decision}.`,
      })
      await load()
    } catch {
      toast({ title: 'Action failed', description: 'Could not resolve approval.', variant: 'destructive' })
    }
  }

  if (loading) return <DetailSkeleton onBack={() => navigate({ view: 'admin', page: 'orders' })} />
  if (error || !order)
    return (
      <div className="space-y-4">
        <BackButton onClick={() => navigate({ view: 'admin', page: 'orders' })} />
        <Card>
          <CardContent>
            <ErrorState onRetry={load} message="This order could not be loaded." />
          </CardContent>
        </Card>
      </div>
    )

  const currentStep = statusIndex(order.status)
  let shipAddr: any = null
  try {
    shipAddr = order.shippingAddressJson ? JSON.parse(order.shippingAddressJson) : null
  } catch {
    shipAddr = null
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate({ view: 'admin', page: 'orders' })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{order.orderNumber}</h1>
              <Badge className={statusColor(order.status)} variant="outline">{prettifyStatus(order.status)}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Placed {formatDateTime(order.createdAt)} by {order.userName ?? 'Unknown user'}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Items */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Order items</CardTitle>
            <CardDescription>{order.items.length} line item{order.items.length === 1 ? '' : 's'}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="hidden sm:table-cell">SKU</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell className="font-medium">{it.productName}</TableCell>
                      <TableCell className="hidden sm:table-cell font-mono text-xs text-muted-foreground">{it.sku}</TableCell>
                      <TableCell className="text-right">{it.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(it.unitPrice)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(it.unitPrice * it.quantity)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Separator />
            <div className="flex justify-end gap-8 px-6 py-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Subtotal</p>
                <p className="font-medium">{formatCurrency(order.subtotal)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(order.total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Side: customer + status update */}
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4 text-primary" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <button
                onClick={() => navigate({ view: 'admin', page: 'customer-detail', id: order.companyId })}
                className="block text-left font-medium text-primary hover:underline"
              >
                {order.companyName ?? 'Company'}
              </button>
              <p className="text-xs text-muted-foreground">PO #: {order.poNumber ?? '—'}</p>
              <p className="text-xs text-muted-foreground">Order date: {formatDate(order.createdAt)}</p>
              {order.deliveryDate && (
                <p className="text-xs text-muted-foreground">Delivery date: {formatDate(order.deliveryDate)}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Update status</CardTitle>
              <CardDescription>Current: {prettifyStatus(order.status)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">New status</Label>
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
                    <Label className="text-xs">Carrier</Label>
                    <Input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="UPS, FedEx…" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tracking number</Label>
                    <Input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="1Z…" />
                  </div>
                </>
              )}
              <Button onClick={saveStatus} disabled={saving || statusValue === order.status} className="w-full">
                {saving ? 'Saving…' : 'Update order'}
              </Button>
            </CardContent>
          </Card>

          {shipAddr && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4 text-primary" />
                  Shipping address
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {shipAddr.label && <p className="font-medium text-foreground">{shipAddr.label}</p>}
                <p>{shipAddr.line1}</p>
                {shipAddr.line2 && <p>{shipAddr.line2}</p>}
                <p>{shipAddr.city}, {shipAddr.state} {shipAddr.zip}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Approval + invoice */}
      <div className="grid gap-5 lg:grid-cols-2">
        {order.approval && (
          <Card className={order.approval.status === 'pending' ? 'border-amber-300' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-amber-600" />
                Approval request
              </CardTitle>
              <CardDescription>
                Requested by {order.approval.requestedByName ?? order.approval.requestedBy} · {formatDateTime(order.approval.createdAt)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.approval.status === 'pending' ? (
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => resolveApproval('approved')} className="bg-emerald-600 hover:bg-emerald-700">
                    <Check className="mr-1.5 h-4 w-4" />
                    Approve order
                  </Button>
                  <Button onClick={() => resolveApproval('rejected')} variant="outline" className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-300">
                    <XCircle className="mr-1.5 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  {order.approval.status === 'approved' ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span>
                    {order.approval.status === 'approved' ? 'Approved' : 'Rejected'} by{' '}
                    <span className="font-medium">{order.approval.approverName ?? 'approver'}</span> on{' '}
                    {order.approval.resolvedAt ? formatDateTime(order.approval.resolvedAt) : '—'}
                  </span>
                </div>
              )}
              {order.approval.notes && (
                <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                  {order.approval.notes}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {order.invoice ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-primary" />
                Invoice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Invoice #</span>
                <span className="font-mono font-medium">{order.invoice.invoiceNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">{formatCurrency(order.invoice.amount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Due date</span>
                <span>{formatDate(order.invoice.dueDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge className={statusColor(order.invoice.status)} variant="outline">{prettifyStatus(order.invoice.status)}</Badge>
              </div>
              <Button variant="outline" size="sm" className="mt-2 w-full" disabled>
                <Download className="mr-1.5 h-4 w-4" />
                Download PDF
              </Button>
            </CardContent>
          </Card>
        ) : (
          order.status === 'delivered' && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">No invoice yet</p>
                <p className="text-xs text-muted-foreground">Order is delivered — generate an invoice.</p>
              </CardContent>
            </Card>
          )
        )}
      </div>

      {/* Tracking timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tracking timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col gap-0 sm:flex-row sm:items-start sm:gap-0">
            {TIMELINE_STEPS.map((step, i) => {
              const done = i <= currentStep
              const isLast = i === TIMELINE_STEPS.length - 1
              const Icon = step.icon
              return (
                <li key={step.key} className="flex flex-1 flex-col items-start gap-2 sm:flex-col sm:items-center">
                  <div className="flex w-full items-center sm:flex-col">
                    <span
                      className={classNames(
                        'grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 transition-colors',
                        done
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-muted-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    {!isLast && (
                      <span
                        className={classNames(
                          'h-0.5 flex-1 sm:mt-0 sm:h-px sm:w-full',
                          i < currentStep ? 'bg-primary' : 'bg-border'
                        )}
                      />
                    )}
                  </div>
                  <div className="sm:mt-2 sm:text-center">
                    <p className={classNames('text-xs font-medium', done ? 'text-foreground' : 'text-muted-foreground')}>
                      {step.label}
                    </p>
                    {step.key === 'shipped' && order.carrier && (
                      <p className="text-[10px] text-muted-foreground">{order.carrier}</p>
                    )}
                    {step.key === 'shipped' && order.trackingNumber && (
                      <p className="font-mono text-[10px] text-muted-foreground">{order.trackingNumber}</p>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick}>
      <ArrowLeft className="mr-1.5 h-4 w-4" />
      Back to orders
    </Button>
  )
}

function DetailSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-5">
      <BackButton onClick={onBack} />
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-32" />
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Skeleton className="h-64 lg:col-span-2" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-48" />
    </div>
  )
}
