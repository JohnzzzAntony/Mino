'use client'

import { useEffect, useMemo, useState } from 'react'
import { useApp } from '@/lib/store'
import { formatCurrency } from '@/lib/pricing'
import type { Product, Category } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster } from '@/components/ui/sonner'
import { CatalogBreadcrumb } from '@/components/catalog/breadcrumb'
import { ProductCard, type CatalogProduct } from '@/components/catalog/product-card'
import { toast } from 'sonner'
import {
  Star,
  ShoppingCart,
  Plus,
  Minus,
  Download,
  Leaf,
  Recycle,
  TreePine,
  Droplets,
  Trash2,
  ShieldCheck,
  Award,
  Package,
  ChevronRight,
  LogIn,
} from 'lucide-react'

interface PublicProductDetailProps {
  categorySlug: string
  productSlug: string
}

interface DetailProduct extends Product {
  effectivePrice?: number
  isCustomPrice?: boolean
  discountPercent?: number
}

const SPEC_LABELS: Record<string, string> = {
  ply: 'Ply Count',
  sheetSize: 'Sheet Size',
  sheetsPerRoll: 'Sheets per Roll',
  rollsPerCase: 'Rolls per Case',
  dimensions: 'Case Dimensions',
  color: 'Color',
  material: 'Material',
}

const CERT_ICONS: Record<string, typeof ShieldCheck> = {
  'Green Seal': ShieldCheck,
  FSC: TreePine,
  'EPA Safer Choice': Leaf,
  Compostable: Recycle,
}

export function PublicProductDetail(props: PublicProductDetailProps) {
  // Keyed by productSlug so that navigating to a new product remounts the inner
  // component — useState initializers fire again, no sync setState needed in effects.
  return <PublicProductDetailInner key={props.productSlug} {...props} />
}

function PublicProductDetailInner({ categorySlug, productSlug }: PublicProductDetailProps) {
  const { navigate, addToCart, user } = useApp()
  const [product, setProduct] = useState<DetailProduct | null>(null)
  const [related, setRelated] = useState<CatalogProduct[]>([])
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(0)
  const [qty, setQty] = useState(1)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/products/${productSlug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return
        if (!d) {
          setLoading(false)
          return
        }
        setProduct(d.product)
        setRelated(d.related ?? [])
        if (d.product?.category) setCategory(d.product.category)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [productSlug])

  const shop =
    user?.role === 'purchaser' || user?.role === 'approver' || user?.role === 'owner'

  const effectivePrice = useMemo(() => {
    if (!product) return 0
    return typeof product.effectivePrice === 'number' ? product.effectivePrice : product.basePrice
  }, [product])

  const showOriginal = !!product?.isCustomPrice && effectivePrice < product.basePrice

  const breadcrumbItems = useMemo(() => {
    return [
      { label: 'Home', onClick: () => navigate({ view: 'public', page: 'home' }) },
      {
        label: 'Products',
        onClick: () =>
          navigate({ view: 'public', page: 'products' }),
      },
      {
        label: category?.name ?? 'Category',
        onClick: () =>
          navigate({
            view: 'public',
            page: 'products',
            categorySlug: category?.slug ?? categorySlug,
          }),
      },
      { label: product?.name ?? 'Product' },
    ]
  }, [category, product, categorySlug, navigate])

  const handleAddToCart = () => {
    if (!product) return
    addToCart({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      unitPrice: effectivePrice,
      quantity: qty,
      image: product.images?.[0] ?? '/images/product-tissue.jpg',
      unit: product.unit,
    })
    toast.success('Added to cart', {
      description: `${product.name} · ${qty} ${product.unit}`,
    })
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="mb-4 h-5 w-72" />
        <div className="grid gap-8 lg:grid-cols-2">
          <Skeleton className="aspect-square w-full" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <p className="mt-2 text-muted-foreground">
          We couldn&apos;t find that product. It may have been discontinued or moved.
        </p>
        <Button
          className="mt-6"
          onClick={() => navigate({ view: 'public', page: 'products' })}
        >
          Browse all products
        </Button>
      </div>
    )
  }

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : ['/images/product-tissue.jpg']

  const metrics = product.sustainabilityMetrics ?? ({} as any)
  const recycledRaw = String(metrics.recycledContent ?? '0%')
  const recycledPct = parseInt(recycledRaw.replace(/[^\d]/g, ''), 10) || 0

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-right" />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <CatalogBreadcrumb items={breadcrumbItems} className="mb-6" />

        <div className="grid gap-10 lg:grid-cols-2">
          {/* LEFT: gallery */}
          <div className="flex flex-col gap-4">
            <Card className="relative overflow-hidden p-0">
              <div className="aspect-square bg-muted">
                <img
                  src={images[activeImage] ?? images[0]}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
              {product.bestSeller && (
                <Badge className="absolute left-4 top-4 bg-amber-400 text-amber-950 shadow-sm hover:bg-amber-300">
                  <Award className="mr-1 h-3 w-3" /> Best Seller
                </Badge>
              )}
              {showOriginal && (
                <Badge className="absolute right-4 top-4 bg-emerald-600 text-white shadow-sm hover:bg-emerald-600">
                  Save {product.discountPercent ?? 0}%
                </Badge>
              )}
            </Card>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`relative aspect-square overflow-hidden rounded-md border-2 bg-muted transition-all ${
                      activeImage === i
                        ? 'border-primary'
                        : 'border-transparent hover:border-border'
                    }`}
                  >
                    <img src={img} alt={`${product.name} thumbnail ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: info */}
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">SKU {product.sku}</Badge>
                <span className="inline-flex items-center gap-1 text-sm text-amber-600">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span className="font-medium">{product.rating?.toFixed(1) ?? '—'}</span>
                </span>
                {product.casePackSize > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Package className="h-3.5 w-3.5" />
                    Case of {product.casePackSize}
                  </span>
                )}
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                {product.name}
              </h1>
              {category && (
                <button
                  onClick={() =>
                    navigate({
                      view: 'public',
                      page: 'products',
                      categorySlug: category.slug,
                    })
                  }
                  className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  {category.name}
                  <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Price */}
            <div className="rounded-xl border border-border/60 bg-secondary/30 p-4">
              {product.isCustomPrice && (
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                  Your price
                </p>
              )}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-primary">
                  {formatCurrency(effectivePrice)}
                </span>
                {showOriginal && (
                  <span className="text-base text-muted-foreground line-through">
                    {formatCurrency(product.basePrice)}
                  </span>
                )}
                <span className="text-sm text-muted-foreground">/ {product.unit}</span>
              </div>
              {showOriginal && (
                <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                  You save {formatCurrency(product.basePrice - effectivePrice)} per {product.unit}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <p className="text-sm leading-relaxed text-foreground/90">
                {product.description}
              </p>
            </div>

            {/* Certifications */}
            {product.certifications?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.certifications.map((c) => {
                  const Icon = CERT_ICONS[c] ?? ShieldCheck
                  return (
                    <Badge
                      key={c}
                      variant="outline"
                      className="gap-1.5 border-emerald-300/60 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {c}
                    </Badge>
                  )
                })}
              </div>
            )}

            {/* Recycled highlight */}
            {recycledPct > 0 && (
              <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/60 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Recycle className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                      {recycledRaw} recycled content
                    </span>
                  </div>
                  <span className="text-xs text-emerald-700 dark:text-emerald-400">
                    Per case
                  </span>
                </div>
                <Progress value={recycledPct} className="mt-3 bg-emerald-100 [&>div]:bg-emerald-600" />
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <TreePine className="mx-auto mb-1 h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                    <p className="font-semibold text-foreground">
                      {metrics.treesSavedPerCase ?? 0}
                    </p>
                    <p className="text-muted-foreground">trees saved</p>
                  </div>
                  <div>
                    <Trash2 className="mx-auto mb-1 h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                    <p className="font-semibold text-foreground">
                      {metrics.plasticSavedLbs ?? 0} lbs
                    </p>
                    <p className="text-muted-foreground">no plastic</p>
                  </div>
                  <div>
                    <Droplets className="mx-auto mb-1 h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                    <p className="font-semibold text-foreground">
                      {metrics.waterSavedGal ?? 0} gal
                    </p>
                    <p className="text-muted-foreground">water saved</p>
                  </div>
                </div>
              </div>
            )}

            {/* Qty + Add to cart */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <div className="flex items-center rounded-md border border-input">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-r-none"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-10 w-14 border-0 bg-transparent text-center text-sm font-medium outline-none"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-l-none"
                  onClick={() => setQty((q) => q + 1)}
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {shop ? (
                <Button
                  size="lg"
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart · {formatCurrency(effectivePrice * qty)}
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate({ view: 'public', page: 'login' })}
                >
                  <LogIn className="h-4 w-4" />
                  Sign in to order
                </Button>
              )}
            </div>
            {shop && (
              <p className="text-xs text-muted-foreground">
                Subtotal for {qty} {product.unit}
                {qty > 1 ? 's' : ''} · {formatCurrency(effectivePrice * qty)}
              </p>
            )}
          </div>
        </div>

        <Separator className="my-10" />

        {/* Tabs */}
        <Tabs defaultValue="specs" className="w-full">
          <TabsList className="bg-muted">
            <TabsTrigger value="specs">Specifications</TabsTrigger>
            <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
            <TabsTrigger value="downloads">Downloads</TabsTrigger>
          </TabsList>

          {/* Specs */}
          <TabsContent value="specs">
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold">Product Specifications</h3>
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <tbody>
                    {Object.entries(product.specs ?? {}).map(([k, v], i) => (
                      <tr
                        key={k}
                        className={i % 2 === 0 ? 'bg-background' : 'bg-muted/40'}
                      >
                        <th className="w-1/3 px-4 py-2.5 text-left font-medium text-muted-foreground">
                          {SPEC_LABELS[k] ?? prettifyKey(k)}
                        </th>
                        <td className="px-4 py-2.5 text-foreground">{String(v)}</td>
                      </tr>
                    ))}
                    <tr className="bg-muted/40">
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                        Unit
                      </th>
                      <td className="px-4 py-2.5 text-foreground">{product.unit}</td>
                    </tr>
                    <tr className="bg-background">
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                        Case Pack
                      </th>
                      <td className="px-4 py-2.5 text-foreground">{product.casePackSize}</td>
                    </tr>
                    <tr className="bg-muted/40">
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                        Applications
                      </th>
                      <td className="px-4 py-2.5 text-foreground">
                        <div className="flex flex-wrap gap-1">
                          {(product.application ?? []).map((a) => (
                            <Badge key={a} variant="outline" className="capitalize">
                              {a}
                            </Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Sustainability */}
          <TabsContent value="sustainability">
            <Card className="p-6">
              <h3 className="mb-1 text-lg font-semibold">Sustainability Profile</h3>
              <p className="mb-5 text-sm text-muted-foreground">
                Measured per case, compared to conventional virgin-fiber equivalents.
              </p>
              <div className="grid gap-5 sm:grid-cols-2">
                <SustainCard
                  icon={Recycle}
                  label="Recycled Content"
                  value={recycledRaw}
                  pct={recycledPct}
                  color="emerald"
                />
                <SustainCard
                  icon={TreePine}
                  label="Trees Saved per Case"
                  value={`${metrics.treesSavedPerCase ?? 0} trees`}
                  pct={Math.min(100, ((metrics.treesSavedPerCase ?? 0) / 0.5) * 100)}
                  color="emerald"
                />
                <SustainCard
                  icon={Trash2}
                  label="Plastic Avoided per Case"
                  value={`${metrics.plasticSavedLbs ?? 0} lbs`}
                  pct={Math.min(100, ((metrics.plasticSavedLbs ?? 0) / 0.5) * 100)}
                  color="amber"
                />
                <SustainCard
                  icon={Droplets}
                  label="Water Saved per Case"
                  value={`${metrics.waterSavedGal ?? 0} gal`}
                  pct={Math.min(100, ((metrics.waterSavedGal ?? 0) / 300) * 100)}
                  color="emerald"
                />
              </div>

              <div className="mt-6 rounded-lg border border-border/60 bg-secondary/30 p-4">
                <p className="text-sm text-muted-foreground">
                  <Leaf className="mr-1 inline h-4 w-4 text-primary" />
                  All Mino products are sourced from audited mills with documented chain-of-custody.
                  Annual third-party audits verify recycled content, water stewardship, and fair labor.
                </p>
              </div>
            </Card>
          </TabsContent>

          {/* Downloads */}
          <TabsContent value="downloads">
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold">Documents &amp; Resources</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <DownloadCard
                  title="SDS Sheet"
                  description="Safety Data Sheet (PDF)"
                  href={product.sdsUrl ?? '#'}
                />
                <DownloadCard
                  title="Tech Spec Sheet"
                  description="Full technical specifications (PDF)"
                  href={product.techSheetUrl ?? '#'}
                />
              </div>
              {product.certifications?.length > 0 && (
                <div className="mt-6">
                  <h4 className="mb-2 text-sm font-semibold">Certifications</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.certifications.map((c) => (
                      <Badge key={c} variant="outline" className="gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-12">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  You may also like
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                  Related products
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  navigate({
                    view: 'public',
                    page: 'products',
                    categorySlug: category?.slug ?? categorySlug,
                  })
                }
              >
                View all
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  view="public"
                  categorySlug={category?.slug ?? categorySlug}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

// ---- helpers / sub-components ----

function prettifyKey(k: string) {
  return k
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim()
}

function SustainCard({
  icon: Icon,
  label,
  value,
  pct,
  color,
}: {
  icon: typeof Recycle
  label: string
  value: string
  pct: number
  color: 'emerald' | 'amber'
}) {
  return (
    <div className="rounded-xl border border-border/60 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon
            className={
              color === 'emerald'
                ? 'h-5 w-5 text-emerald-700 dark:text-emerald-400'
                : 'h-5 w-5 text-amber-700 dark:text-amber-400'
            }
          />
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </div>
        <span className="text-base font-bold text-foreground">{value}</span>
      </div>
      <Progress
        value={pct}
        className={
          'mt-3 ' +
          (color === 'emerald'
            ? 'bg-emerald-100 [&>div]:bg-emerald-600'
            : 'bg-amber-100 [&>div]:bg-amber-500')
        }
      />
    </div>
  )
}

function DownloadCard({
  title,
  description,
  href,
}: {
  title: string
  description: string
  href: string
}) {
  return (
    <a
      href={href}
      download
      className="group flex items-center justify-between rounded-xl border border-border/60 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <Download className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
    </a>
  )
}
