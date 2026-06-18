'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api-client'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
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
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft,
  Package,
  RefreshCw,
  Download,
  Truck,
  Clock,
  PackageCheck,
  ClipboardList,
  MapPin,
  User,
  FileText,
  Loader2,
  Check,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

export function PortalOrderDetail({ id }: { id: string }) {
  const { navigate, addToCart, user } = useApp()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)
  const [approvalNotes, setApprovalNotes] = useState('')

  useEffect(() => {
    setLoading(true)
    api<{ order: Order }>(`/api/orders/${id}`)
      .then((r) => setOrder(r.order))
      .catch(() => {
        toast.error('Order not found')
        navigate({ view: 'portal', page: 'orders' })
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleApprove = async (decision: 'approve' | 'reject') => {
    setApproving(true)
    try {
      await api(`/api/orders/${id}/${decision}`, {
        method: 'POST',
        body: JSON.stringify({ notes: approvalNotes }),
      })
      toast.success(`Order ${decision}d`)
      const r = await api<{ order: Order }>(`/api/orders/${id}`)
      setOrder(r.order)
      setApprovalNotes('')
    } catch (e: any) {
      toast.error(e?.message ?? 'Approval API pending')
    } finally {
      setApproving(false)
    }
  }

  const handleReorder = () => {
    if (!order?.items?.length) return
    order.items.forEach((it) => {
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
    toast.success(`Added ${order.items.length} items to cart`)
    navigate({ view: 'portal', page: 'cart' })
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!order) return null

  const trackingSteps = [
    { key: 'placed', label: 'Placed', icon: ClipboardList },
    { key: 'processing', label: 'Processing', icon: Package },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: PackageCheck },
  ]
  const statusOrder = ['draft', 'pending_approval', 'submitted', 'processing', 'shipped', 'delivered', 'invoiced']
  const currentStepIdx = (() => {
    const idx = statusOrder.indexOf(order.status)
    if (idx < 0) return 0
    if (order.status === 'invoiced') return 3
    if (idx <= 2) return 0 // placed
    if (idx === 3) return 1 // processing
    if (idx === 4) return 2 // shipped
    return 3 // delivered
  })()

  const shippingAddress = order.shippingAddressJson
    ? (() => {
        try {
          return JSON.parse(order.shippingAddressJson)
        } catch {
          return null
        }
      })()
    : null

  const isApprover = user?.role === 'approver' || user?.role === 'owner'
  const canApprove = order.status === 'pending_approval' && isApprover

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({ view: 'portal', page: 'orders' })}
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Back to Orders
      </Button>

      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  Order {order.orderNumber ?? order.poNumber ?? `#${order.id.slice(-6)}`}
                </h1>
                <Badge className={statusColor(order.status)} variant="secondary">
                  {prettifyStatus(order.status)}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Placed on {formatDateTime(order.createdAt)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleReorder}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Reorder
              </Button>
              {order.invoice && (
                <Button size="sm" variant="outline">
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Download Invoice
                </Button>
              )}
            </div>
          </div>

          <Separator className="my-4" />

          {/* Meta info grid */}
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <p className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
                <FileText className="h-3 w-3" /> PO Number
              </p>
              <p className="mt-1 font-medium">{order.poNumber ?? '—'}</p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
                <User className="h-3 w-3" /> Placed By
              </p>
              <p className="mt-1 font-medium">{order.userName ?? '—'}</p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
                <Clock className="h-3 w-3" /> Delivery Date
              </p>
              <p className="mt-1 font-medium">
                {order.deliveryDate ? formatDate(order.deliveryDate) : '—'}
              </p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
                <MapPin className="h-3 w-3" /> Ship To
              </p>
              <p className="mt-1 font-medium">
                {shippingAddress
                  ? `${shippingAddress.city}, ${shippingAddress.state}`
                  : order.companyName ?? '—'}
              </p>
            </div>
          </div>

          {order.approval && (
            <div className="mt-4 rounded-lg border bg-muted/30 p-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Approval</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge
                  className={statusColor(order.approval.status === 'approved' ? 'approved_status' : order.approval.status)}
                  variant="secondary"
                >
                  {prettifyStatus(order.approval.status)}
                </Badge>
                <span className="text-muted-foreground">
                  Requested by <span className="font-medium text-foreground">{order.approval.requestedByName ?? '—'}</span>
                </span>
                {order.approval.approverName && (
                  <span className="text-muted-foreground">
                    · Approved by <span className="font-medium text-foreground">{order.approval.approverName}</span>
                  </span>
                )}
              </div>
              {order.approval.notes && (
                <p className="mt-2 text-xs italic text-muted-foreground">"{order.approval.notes}"</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tracking timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" />
            Order Tracking
          </CardTitle>
          <CardDescription>
            {order.carrier && `Carrier: ${order.carrier}`}
            {order.trackingNumber && ` · Tracking #: ${order.trackingNumber}`}
            {!order.carrier && !order.trackingNumber && 'Order progress timeline'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-0 right-0 top-5 hidden h-0.5 bg-border sm:block" />
            <div
              className="absolute left-0 top-5 hidden h-0.5 bg-primary transition-all duration-500 sm:block"
              style={{ width: `${(currentStepIdx / (trackingSteps.length - 1)) * 100}%` }}
            />
            <div className="relative grid grid-cols-2 gap-4 sm:grid-cols-4">
              {trackingSteps.map((step, i) => {
                const isComplete = i < currentStepIdx
                const isCurrent = i === currentStepIdx
                const Icon = step.icon
                return (
                  <div key={step.key} className="flex flex-col items-center gap-2 text-center">
                    <span
                      className={classNames(
                        'z-10 grid h-10 w-10 place-items-center rounded-full border-2 transition-colors',
                        isComplete
                          ? 'border-primary bg-primary text-primary-foreground'
                          : isCurrent
                          ? 'border-primary bg-background text-primary ring-4 ring-primary/15'
                          : 'border-border bg-background text-muted-foreground'
                      )}
                    >
                      {isComplete ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </span>
                    <div>
                      <p className={classNames('text-xs font-medium', isCurrent || isComplete ? 'text-foreground' : 'text-muted-foreground')}>
                        {step.label}
                      </p>
                      {isCurrent && (
                        <p className="text-[10px] text-muted-foreground">In progress</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approval card */}
      {canApprove && (
        <Card className="border-amber-300/70 bg-amber-50/70 dark:border-amber-800/60 dark:bg-amber-950/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
              <Clock className="h-4 w-4" />
              Approval Required
            </CardTitle>
            <CardDescription className="text-amber-800/80 dark:text-amber-200/80">
              This order is awaiting your approval. Review the items and totals below, then approve or reject.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="approval-notes">Notes (optional)</Label>
              <Textarea
                id="approval-notes"
                placeholder="Add a note for the requester…"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => handleApprove('approve')}
                disabled={approving}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {approving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />}
                Approve Order
              </Button>
              <Button
                onClick={() => handleApprove('reject')}
                disabled={approving}
                variant="destructive"
              >
                <X className="mr-1.5 h-4 w-4" />
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Order Items
          </CardTitle>
          <CardDescription>
            {order.items?.length ?? 0} item{(order.items?.length ?? 0) === 1 ? '' : 's'}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Product</TableHead>
                <TableHead className="hidden sm:table-cell">SKU</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="pr-6 text-right">Line Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items?.map((it) => (
                <TableRow key={it.id}>
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <div className="hidden h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted sm:block">
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
                            <Package className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{it.productName}</p>
                        {it.product?.unit && (
                          <p className="text-xs text-muted-foreground">per {it.product.unit}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {it.sku}
                  </TableCell>
                  <TableCell className="text-right">{it.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(it.unitPrice)}</TableCell>
                  <TableCell className="pr-6 text-right font-medium">
                    {formatCurrency(it.unitPrice * it.quantity)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Totals */}
          <div className="ml-auto mr-6 mt-4 w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(order.subtotal ?? 0)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base">
              <span className="font-semibold">Total</span>
              <span className="font-bold">{formatCurrency(order.total ?? 0)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes (if any) */}
      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" />
              Order Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm italic text-muted-foreground">"{order.notes}"</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
