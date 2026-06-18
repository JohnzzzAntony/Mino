'use client'

import { useState } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api-client'
import {
  formatCurrency,
  classNames,
} from '@/lib/pricing'
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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Package,
  Save,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'

export function PortalCart() {
  const { cart, updateCartQty, removeFromCart, clearCart, user, navigate } = useApp()
  const [saveOpen, setSaveOpen] = useState(false)
  const [guideName, setGuideName] = useState('')
  const [saving, setSaving] = useState(false)

  const subtotal = cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0)
  const discountPercent = user?.discountPercent ?? 0
  const discountAmount = (subtotal * discountPercent) / 100
  const total = subtotal - discountAmount
  const threshold = user?.approvalThreshold ?? 0
  const exceedsThreshold = threshold > 0 && total > threshold

  const handleSaveGuide = async () => {
    if (!guideName.trim()) {
      toast.error('Please enter a name for the order guide')
      return
    }
    setSaving(true)
    try {
      await api('/api/order-guides', {
        method: 'POST',
        body: JSON.stringify({
          name: guideName.trim(),
          items: cart.map((c) => ({
            productId: c.productId,
            quantity: c.quantity,
            productName: c.name,
            sku: c.sku,
            unitPrice: c.unitPrice,
          })),
        }),
      })
      toast.success(`Order guide "${guideName.trim()}" saved`)
      setSaveOpen(false)
      setGuideName('')
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not save guide')
    } finally {
      setSaving(false)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <StepIndicator step={1} />
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
              <ShoppingCart className="h-8 w-8" />
            </span>
            <div>
              <h2 className="text-xl font-semibold">Your cart is empty</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Browse our catalog of eco-friendly paper products to start an order.
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

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <StepIndicator step={1} />

      {/* Approval threshold warning */}
      {exceedsThreshold && (
        <Card className="border-amber-300/70 bg-amber-50/70 dark:border-amber-800/60 dark:bg-amber-950/30">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="text-sm">
              <p className="font-semibold text-amber-900 dark:text-amber-100">
                This order exceeds your {formatCurrency(threshold)} approval threshold
              </p>
              <p className="mt-0.5 text-amber-800/80 dark:text-amber-200/80">
                It will be routed to your approver for review before being submitted to fulfillment.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Cart items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Cart Review</CardTitle>
                <CardDescription>
                  {cart.length} item{cart.length === 1 ? '' : 's'} in your cart
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSaveOpen(true)}
                >
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  Save as Guide
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-red-50"
                  onClick={() => {
                    clearCart()
                    toast.success('Cart cleared')
                  }}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Product</TableHead>
                    <TableHead className="hidden md:table-cell">SKU</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead className="text-right">Line Total</TableHead>
                    <TableHead className="pr-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="hidden h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted sm:block">
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
                                <Package className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
                            {item.unit && (
                              <p className="text-xs text-muted-foreground">per {item.unit}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {item.sku}
                      </TableCell>
                      <TableCell className="text-sm">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateCartQty(item.productId, item.quantity - 1)}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const v = parseInt(e.target.value || '0', 10)
                              if (!isNaN(v)) updateCartQty(item.productId, v)
                            }}
                            className="h-7 w-14 px-2 text-center"
                            min={1}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateCartQty(item.productId, item.quantity + 1)}
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </TableCell>
                      <TableCell className="pr-6">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-red-50"
                          onClick={() => {
                            removeFromCart(item.productId)
                            toast.success('Removed from cart')
                          }}
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Summary sidebar */}
        <div>
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Review and proceed to checkout</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-300">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Your discount ({discountPercent}%)
                    </span>
                    <span className="font-medium">−{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-base">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold">{formatCurrency(total)}</span>
                </div>
              </div>

              {user?.netTermsDays && (
                <div className="rounded-lg bg-muted/60 p-3 text-xs">
                  <p className="font-medium">Net {user.netTermsDays} payment terms</p>
                  <p className="mt-0.5 text-muted-foreground">
                    Invoice will be issued on shipment. Pay within {user.netTermsDays} days.
                  </p>
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={() => navigate({ view: 'portal', page: 'checkout' })}
              >
                Proceed to Checkout
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate({ view: 'portal', page: 'catalog' })}
              >
                <Package className="mr-1.5 h-4 w-4" />
                Continue Shopping
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save as guide dialog */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save cart as order guide</DialogTitle>
            <DialogDescription>
              Save these {cart.length} items as a reusable order guide for future orders.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="guide-name">Guide name</Label>
            <Input
              id="guide-name"
              placeholder="e.g. Weekly Restroom Restock"
              value={guideName}
              onChange={(e) => setGuideName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveGuide} disabled={saving}>
              {saving ? 'Saving…' : 'Save Guide'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: 'Cart Review' },
    { n: 2, label: 'Delivery & PO' },
    { n: 3, label: 'Approval / Confirm' },
  ]
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-2">
          <div
            className={classNames(
              'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              s.n < step
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                : s.n === step
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground'
            )}
          >
            <span
              className={classNames(
                'grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold',
                s.n < step
                  ? 'bg-emerald-600 text-white'
                  : s.n === step
                  ? 'bg-primary-foreground text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {s.n < step ? <CheckCircle2 className="h-3 w-3" /> : s.n}
            </span>
            <span className="whitespace-nowrap">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className="h-px w-4 bg-border sm:w-8" />
          )}
        </div>
      ))}
    </div>
  )
}
