'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api-client'
import {
  formatCurrency,
  formatDate,
  classNames,
} from '@/lib/pricing'
import type { OrderGuide } from '@/lib/types'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
import {
  ListOrdered,
  Plus,
  ChevronDown,
  ShoppingCart,
  Trash2,
  Package,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'

export function PortalOrderGuides() {
  const { navigate, addToCart, cart } = useApp()
  const [guides, setGuides] = useState<OrderGuide[] | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<OrderGuide | null>(null)

  const refresh = () => {
    api<{ guides: OrderGuide[] }>('/api/order-guides')
      .then((r) => setGuides(r.guides ?? []))
      .catch(() => setGuides([]))
  }

  useEffect(() => {
    refresh()
  }, [])

  const handleAddAll = (g: OrderGuide) => {
    if (!g.items?.length) {
      toast.error('No items in this guide')
      return
    }
    g.items.forEach((it) => {
      addToCart({
        productId: it.productId,
        name: it.productName ?? 'Product',
        sku: it.sku ?? '',
        unitPrice: it.unitPrice ?? 0,
        quantity: it.quantity,
      })
    })
    toast.success(`Added ${g.items.length} items from "${g.name}" to cart`)
    navigate({ view: 'portal', page: 'cart' })
  }

  const handleAddItem = (it: OrderGuide['items'][number]) => {
    addToCart({
      productId: it.productId,
      name: it.productName ?? 'Product',
      sku: it.sku ?? '',
      unitPrice: it.unitPrice ?? 0,
      quantity: it.quantity,
    })
    toast.success(`Added ${it.productName ?? 'item'} to cart`)
  }

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error('Please enter a guide name')
      return
    }
    setSaving(true)
    try {
      await api('/api/order-guides', {
        method: 'POST',
        body: JSON.stringify({
          name: newName.trim(),
          items: cart.map((c) => ({
            productId: c.productId,
            quantity: c.quantity,
            productName: c.name,
            sku: c.sku,
            unitPrice: c.unitPrice,
          })),
        }),
      })
      toast.success(`Guide "${newName.trim()}" created`)
      setNewName('')
      setCreateOpen(false)
      refresh()
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not create guide')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await api(`/api/order-guides/${deleteTarget.id}`, { method: 'DELETE' })
      toast.success(`Guide "${deleteTarget.name}" deleted`)
      setGuides((prev) => (prev ?? []).filter((g) => g.id !== deleteTarget.id))
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not delete guide')
      // Optimistic UI fallback
      setGuides((prev) => (prev ?? []).filter((g) => g.id !== deleteTarget.id))
    }
    setDeleteTarget(null)
  }

  const loading = guides === null

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Order Guides</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Save frequently ordered items as reusable templates.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} disabled={cart.length === 0}>
          <Plus className="mr-1.5 h-4 w-4" />
          Create from Cart
          {cart.length === 0 && (
            <span className="ml-1.5 text-xs text-muted-foreground">(cart empty)</span>
          )}
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : (guides ?? []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-muted text-muted-foreground">
              <ListOrdered className="h-8 w-8" />
            </span>
            <div>
              <h2 className="text-xl font-semibold">No order guides yet</h2>
              <p className="mt-1 text-sm text-muted-foreground max-w-md">
                Order guides let you save a set of frequently ordered products as a template.
                Add items to your cart and click &quot;Create from Cart&quot; to save your first guide.
              </p>
            </div>
            <Button onClick={() => navigate({ view: 'portal', page: 'catalog' })}>
              <Package className="mr-1.5 h-4 w-4" />
              Browse Catalog
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(guides ?? []).map((g) => {
            const isOpen = openId === g.id
            const total = (g.items ?? []).reduce(
              (s, it) => s + (it.unitPrice ?? 0) * it.quantity,
              0
            )
            return (
              <Card key={g.id} className="overflow-hidden">
                <Collapsible open={isOpen} onOpenChange={(o) => setOpenId(o ? g.id : null)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <ListOrdered className="h-4 w-4 text-primary" />
                          <span className="truncate">{g.name}</span>
                        </CardTitle>
                        <CardDescription className="mt-1 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {g.items?.length ?? 0} items
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(g.createdAt)}
                          </span>
                          <span className="font-medium text-emerald-700 dark:text-emerald-300">
                            {formatCurrency(total)}
                          </span>
                        </CardDescription>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <ChevronDown
                            className={classNames(
                              'h-4 w-4 transition-transform',
                              isOpen && 'rotate-180'
                            )}
                          />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="space-y-2 border-t pt-4">
                      {(g.items ?? []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No items in this guide.</p>
                      ) : (
                        <div className="max-h-64 space-y-2 overflow-y-auto scrollbar-thin">
                          {(g.items ?? []).map((it, idx) => (
                            <div
                              key={`${it.productId}-${idx}`}
                              className="flex items-center gap-3 rounded-md border bg-muted/20 p-2 text-sm"
                            >
                              <span className="grid h-8 w-8 shrink-0 place-items-center rounded bg-muted text-muted-foreground">
                                <Package className="h-4 w-4" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">
                                  {it.productName ?? 'Product'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {it.sku ? `SKU ${it.sku} · ` : ''}Qty {it.quantity} ×{' '}
                                  {formatCurrency(it.unitPrice ?? 0)}
                                </p>
                              </div>
                              <span className="font-medium">
                                {formatCurrency((it.unitPrice ?? 0) * it.quantity)}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700"
                                onClick={() => handleAddItem(it)}
                                aria-label="Add to cart"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      <Separator />
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <Button size="sm" onClick={() => handleAddAll(g)}>
                          <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
                          Add All to Cart
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-red-50"
                          onClick={() => setDeleteTarget(g)}
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create guide from cart dialog */}
      <AlertDialog open={createOpen} onOpenChange={setCreateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Create Order Guide from Cart
            </AlertDialogTitle>
            <AlertDialogDescription>
              Save the {cart.length} item{cart.length === 1 ? '' : 's'} currently in your cart as a
              reusable order guide.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="guide-name">Guide name</Label>
            <Input
              id="guide-name"
              placeholder="e.g. Weekly Restroom Restock"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
            <div className="max-h-32 overflow-y-auto rounded-md border bg-muted/30 p-2 text-xs scrollbar-thin">
              {cart.map((c) => (
                <div key={c.productId} className="flex justify-between py-0.5">
                  <span className="truncate">{c.name}</span>
                  <span className="ml-2 text-muted-foreground">×{c.quantity}</span>
                </div>
              ))}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreate} disabled={saving}>
              {saving ? 'Saving…' : 'Create Guide'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{deleteTarget?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The order guide will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete Guide
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
