'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api-client'
import {
  formatCurrency,
  classNames,
  formatDate,
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Calendar,
  Truck,
  FileText,
  AlertTriangle,
  Package,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'

interface SavedAddress {
  id: string
  label: string
  line1: string
  line2?: string | null
  city: string
  state: string
  zip: string
}

export function PortalCheckout() {
  const { cart, user, navigate, clearCart } = useApp()
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [newAddrOpen, setNewAddrOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null)

  // Form state
  const [deliveryDate, setDeliveryDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  )
  const [shippingAddressId, setShippingAddressId] = useState<string>('')
  const [poNumber, setPoNumber] = useState('')
  const [notes, setNotes] = useState('')

  // New address form
  const [newAddr, setNewAddr] = useState({
    label: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip: '',
  })

  useEffect(() => {
    api<{ orders: Order[] }>('/api/orders')
      .then((r) => {
        // Extract addresses from past orders (from shippingAddressJson)
        const seen = new Map<string, SavedAddress>()
        r.orders?.forEach((o) => {
          if (o.shippingAddressJson) {
            try {
              const a = JSON.parse(o.shippingAddressJson)
              const id = a.id || `${a.line1}-${a.zip}`
              if (!seen.has(id) && a.line1) {
                seen.set(id, { ...a, id })
              }
            } catch {}
          }
        })
        const list = Array.from(seen.values())
        setAddresses(list)
        if (list.length > 0 && !shippingAddressId) {
          setShippingAddressId(list[0].id)
        }
      })
      .catch(() => {})
  }, [])

  const subtotal = cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0)
  const discountPercent = user?.discountPercent ?? 0
  const discountAmount = (subtotal * discountPercent) / 100
  const total = subtotal - discountAmount
  const threshold = user?.approvalThreshold ?? 0
  const exceedsThreshold = threshold > 0 && total > threshold

  // Empty cart redirect
  if (cart.length === 0 && !submittedOrder) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-muted text-muted-foreground">
              <Package className="h-8 w-8" />
            </span>
            <div>
              <h2 className="text-xl font-semibold">Nothing to check out</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Add items to your cart before proceeding.
              </p>
            </div>
            <Button onClick={() => navigate({ view: 'portal', page: 'catalog' })}>
              <Package className="mr-1.5 h-4 w-4" />
              Browse Catalog
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Submitted confirmation state
  if (submittedOrder) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-50 to-amber-50 p-8 text-center dark:from-emerald-950/40 dark:to-amber-950/20">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-600 text-white shadow-lg">
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <h2 className="mt-4 text-2xl font-bold">Order submitted!</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {exceedsThreshold
                ? 'Your order is pending approval and will be reviewed shortly.'
                : 'Your order has been received and is being processed.'}
            </p>
          </div>
          <CardContent className="space-y-4 p-6">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order Number</span>
                <span className="font-semibold">
                  {submittedOrder.orderNumber ?? submittedOrder.poNumber ?? `#${submittedOrder.id.slice(-6)}`}
                </span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">{formatCurrency(submittedOrder.total ?? 0)}</span>
              </div>
              {submittedOrder.deliveryDate && (
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Date</span>
                  <span className="font-semibold">{formatDate(submittedOrder.deliveryDate)}</span>
                </div>
              )}
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge className="bg-amber-100 text-amber-800" variant="secondary">
                  {submittedOrder.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                className="flex-1"
                onClick={() =>
                  navigate({ view: 'portal', page: 'order-detail', id: submittedOrder.id })
                }
              >
                View Order Details
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate({ view: 'portal', page: 'dashboard' })}
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSubmit = async () => {
    if (!shippingAddressId && addresses.length === 0) {
      // Allow without saved address — pass raw newAddr if filled, else toast error
      if (!newAddr.line1 || !newAddr.city) {
        toast.error('Please add a shipping address')
        setNewAddrOpen(true)
        return
      }
    }
    if (!deliveryDate) {
      toast.error('Please select a delivery date')
      return
    }
    setSubmitting(true)
    try {
      const selectedAddr = addresses.find((a) => a.id === shippingAddressId)
      const shippingAddress = selectedAddr ?? (newAddr.line1 ? newAddr : null)
      const body: any = {
        items: cart,
        poNumber: poNumber || undefined,
        deliveryDate,
        shippingAddressId: selectedAddr?.id,
        shippingAddress,
        notes: notes || undefined,
      }
      const r = await api<{ order: Order }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      clearCart()
      setSubmittedOrder(r.order)
      toast.success('Order submitted successfully')
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to submit order')
    } finally {
      setSubmitting(false)
    }
  }

  const addNewAddress = () => {
    if (!newAddr.label || !newAddr.line1 || !newAddr.city || !newAddr.state || !newAddr.zip) {
      toast.error('Please fill in all required address fields')
      return
    }
    const id = `new-${Date.now()}`
    const addr: SavedAddress = { ...newAddr, id }
    setAddresses((prev) => [...prev, addr])
    setShippingAddressId(id)
    setNewAddrOpen(false)
    setNewAddr({ label: '', line1: '', line2: '', city: '', state: '', zip: '' })
    toast.success('Address added (this session only)')
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { n: 1, label: 'Cart Review', done: true },
          { n: 2, label: 'Delivery & PO', done: false, active: true },
          { n: 3, label: 'Approval / Confirm', done: false },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <div
              className={classNames(
                'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium',
                s.done
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : s.active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground'
              )}
            >
              <span
                className={classNames(
                  'grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold',
                  s.done
                    ? 'bg-emerald-600 text-white'
                    : s.active
                    ? 'bg-primary-foreground text-primary'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {s.done ? <CheckCircle2 className="h-3 w-3" /> : s.n}
              </span>
              <span className="whitespace-nowrap">{s.label}</span>
            </div>
            {i < 2 && <div className="h-px w-4 bg-border sm:w-8" />}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ view: 'portal', page: 'cart' })}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Cart
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: forms */}
        <div className="space-y-6 lg:col-span-2">
          {/* Delivery */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Delivery Date
              </CardTitle>
              <CardDescription>Choose your preferred delivery date</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="sm:max-w-xs"
                  min={new Date().toISOString().slice(0, 10)}
                />
                <p className="text-xs text-muted-foreground">
                  Standard delivery window is 3–7 business days from order confirmation.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" />
                  Ship To
                </CardTitle>
                <CardDescription>Select or add a shipping address</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setNewAddrOpen(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                New Address
              </Button>
            </CardHeader>
            <CardContent>
              {addresses.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <Truck className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium">No saved addresses</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Add a new shipping address to continue.
                  </p>
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => setNewAddrOpen(true)}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Address
                  </Button>
                </div>
              ) : (
                <Select value={shippingAddressId} onValueChange={setShippingAddressId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a shipping address" />
                  </SelectTrigger>
                  <SelectContent>
                    {addresses.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        <span className="font-medium">{a.label}:</span> {a.line1}, {a.city}, {a.state} {a.zip}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {shippingAddressId && (
                <div className="mt-3 rounded-lg border bg-muted/30 p-3 text-sm">
                  {(() => {
                    const a = addresses.find((x) => x.id === shippingAddressId)
                    if (!a) return null
                    return (
                      <>
                        <p className="font-medium">{a.label}</p>
                        <p className="text-muted-foreground">
                          {a.line1}
                          {a.line2 ? `, ${a.line2}` : ''}
                          <br />
                          {a.city}, {a.state} {a.zip}
                        </p>
                      </>
                    )
                  })()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* PO + Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                PO Number & Notes
              </CardTitle>
              <CardDescription>Optional purchase order reference and special instructions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="po">PO Number {user?.role === 'purchaser' && <span className="text-destructive">*</span>}</Label>
                <Input
                  id="po"
                  placeholder="e.g. PO-2024-0123"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Order Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any delivery instructions or special requests…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: summary */}
        <div>
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>
                {cart.length} item{cart.length === 1 ? '' : 's'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-64 space-y-2 overflow-y-auto scrollbar-thin">
                {cart.map((item) => (
                  <div key={item.productId} className="flex items-start gap-3 text-sm">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-muted-foreground">
                          <Package className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-xs font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Qty {item.quantity} × {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                    <span className="text-xs font-semibold">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-300">
                    <span>Discount ({discountPercent}%)</span>
                    <span className="font-medium">−{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-base">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold">{formatCurrency(total)}</span>
                </div>
              </div>

              {exceedsThreshold && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs dark:border-amber-800/60 dark:bg-amber-950/30">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-semibold text-amber-900 dark:text-amber-100">
                      Approval required
                    </p>
                    <p className="mt-0.5 text-amber-800/80 dark:text-amber-200/80">
                      This order exceeds your {formatCurrency(threshold)} threshold and will be routed for approval before fulfillment.
                    </p>
                  </div>
                </div>
              )}

              {user?.netTermsDays && (
                <p className="text-xs text-muted-foreground">
                  Invoice will be issued with Net {user.netTermsDays} terms on shipment.
                </p>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : exceedsThreshold ? (
                  'Submit for Approval'
                ) : (
                  'Submit Order'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New address dialog */}
      <Dialog open={newAddrOpen} onOpenChange={setNewAddrOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add new shipping address</DialogTitle>
            <DialogDescription>
              This address will be used for this order and saved for future use.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="addr-label">Label</Label>
              <Input
                id="addr-label"
                placeholder="e.g. Main Warehouse"
                value={newAddr.label}
                onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="addr-line1">Address Line 1</Label>
              <Input
                id="addr-line1"
                placeholder="123 Main St"
                value={newAddr.line1}
                onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="addr-line2">Address Line 2 (optional)</Label>
              <Input
                id="addr-line2"
                placeholder="Suite 100"
                value={newAddr.line2}
                onChange={(e) => setNewAddr({ ...newAddr, line2: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr-city">City</Label>
              <Input
                id="addr-city"
                value={newAddr.city}
                onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr-state">State</Label>
              <Input
                id="addr-state"
                placeholder="OR"
                value={newAddr.state}
                onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="addr-zip">ZIP</Label>
              <Input
                id="addr-zip"
                value={newAddr.zip}
                onChange={(e) => setNewAddr({ ...newAddr, zip: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewAddrOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addNewAddress}>Add Address</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
