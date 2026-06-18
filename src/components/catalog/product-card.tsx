'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Star,
  Recycle,
  ShoppingCart,
  ArrowRight,
  BookmarkPlus,
  Award,
} from 'lucide-react'
import { useApp, type Role } from '@/lib/store'
import { formatCurrency } from '@/lib/pricing'
import type { Product } from '@/lib/types'
import { toast } from 'sonner'

export interface CatalogProduct extends Product {
  effectivePrice?: number
  isCustomPrice?: boolean
  discountPercent?: number
}

interface ProductCardProps {
  product: CatalogProduct
  /** which view this card lives in — drives navigation target */
  view: 'public' | 'portal'
  /** optional category slug for public navigation */
  categorySlug?: string
  className?: string
}

const canShop = (role: Role | undefined) =>
  role === 'purchaser' || role === 'approver' || role === 'owner'

export function ProductCard({
  product,
  view,
  categorySlug,
  className,
}: ProductCardProps) {
  const { navigate, addToCart, user } = useApp()

  const images = Array.isArray(product.images) ? product.images : []
  const cover = images[0] ?? '/images/product-tissue.jpg'
  const metrics = product.sustainabilityMetrics ?? ({} as any)
  const recycled = metrics.recycledContent ?? '—'
  const recycledPct = parseInt(String(recycled).replace(/[^\d]/g, ''), 10) || 0

  const effectivePrice =
    typeof product.effectivePrice === 'number'
      ? product.effectivePrice
      : product.basePrice
  const isCustom = !!product.isCustomPrice
  const showOriginal = isCustom && effectivePrice < product.basePrice

  const gotoDetail = () => {
    if (view === 'portal') {
      navigate({ view: 'portal', page: 'product', productSlug: product.slug })
    } else {
      navigate({
        view: 'public',
        page: 'product',
        categorySlug: categorySlug ?? product.category?.slug ?? 'restroom-paper',
        productSlug: product.slug,
      })
    }
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addToCart({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      unitPrice: effectivePrice,
      quantity: 1,
      image: cover,
      unit: product.unit,
    })
    toast.success('Added to cart', {
      description: `${product.name} · 1 ${product.unit}`,
    })
  }

  const handleAddToGuide = (e: React.MouseEvent) => {
    e.stopPropagation()
    toast.info('Order Guides coming soon', {
      description: 'You will be able to save products to reusable order guides.',
    })
  }

  const shop = canShop(user?.role)

  return (
    <Card
      onClick={gotoDetail}
      className={`group relative cursor-pointer overflow-hidden p-0 transition-all hover:-translate-y-1 hover:shadow-lg ${
        className ?? ''
      }`}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={cover}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Top-left badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.bestSeller && (
            <Badge className="bg-amber-400 text-amber-950 shadow-sm hover:bg-amber-300">
              <Award className="mr-1 h-3 w-3" /> Best Seller
            </Badge>
          )}
          {showOriginal && (
            <Badge className="bg-emerald-600 text-white shadow-sm hover:bg-emerald-600">
              −{product.discountPercent ?? 0}%
            </Badge>
          )}
        </div>

        {/* Top-right SKU */}
        <Badge
          variant="secondary"
          className="absolute right-2 top-2 bg-white/90 text-foreground shadow-sm"
        >
          SKU {product.sku}
        </Badge>

        {/* Order guide icon (portal only) */}
        {view === 'portal' && shop && (
          <button
            type="button"
            onClick={handleAddToGuide}
            aria-label="Add to order guide"
            className="absolute bottom-2 right-2 grid size-8 place-items-center rounded-full bg-white/90 text-foreground shadow-sm transition-all hover:bg-white"
          >
            <BookmarkPlus className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-0.5 text-xs text-amber-600">
            <Star className="h-3 w-3 fill-current" />
            <span className="font-medium">{product.rating?.toFixed(1) ?? '—'}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
            <Recycle className="h-3 w-3" />
            {recycled} recycled
          </span>
        </div>

        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug">
          {product.name}
        </h3>

        <div className="flex flex-wrap gap-1">
          {(product.certifications ?? []).slice(0, 2).map((c) => (
            <Badge key={c} variant="outline" className="px-1.5 py-0 text-[10px] font-normal">
              {c}
            </Badge>
          ))}
        </div>

        {/* Price */}
        <div className="mt-1 flex flex-col">
          {isCustom && (
            <span className="text-[11px] font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              Your price
            </span>
          )}
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-primary">
              {formatCurrency(effectivePrice)}
            </span>
            {showOriginal && (
              <span className="text-xs text-muted-foreground line-through">
                {formatCurrency(product.basePrice)}
              </span>
            )}
            <span className="text-[11px] font-normal text-muted-foreground">
              / {product.unit}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Case pack: {product.casePackSize}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-2 flex items-center gap-2">
          {shop ? (
            <Button
              size="sm"
              onClick={handleAddToCart}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Add to Cart
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={gotoDetail}
              className="flex-1"
            >
              Details
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
          {shop && view === 'public' && (
            <Button size="sm" variant="ghost" onClick={gotoDetail}>
              Details
            </Button>
          )}
        </div>
      </div>

      {/* Recycled content bar */}
      {recycledPct > 0 && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-muted">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${Math.min(recycledPct, 100)}%` }}
            aria-hidden
          />
        </div>
      )}
    </Card>
  )
}

/** Skeleton placeholder for loading states */
export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden p-0">
      <div className="aspect-square animate-pulse bg-muted" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-6 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-8 w-full animate-pulse rounded bg-muted" />
      </div>
    </Card>
  )
}
