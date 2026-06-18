'use client'

import { useEffect, useMemo, useState } from 'react'
import { useApp } from '@/lib/store'
import { formatNumber } from '@/lib/pricing'
import type { Category } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Toaster } from '@/components/ui/sonner'
import { ProductCard, ProductCardSkeleton, type CatalogProduct } from '@/components/catalog/product-card'
import { ProductFilters, type FilterState } from '@/components/catalog/product-filters'
import { CatalogBreadcrumb } from '@/components/catalog/breadcrumb'
import {
  Filter,
  LayoutGrid,
  List,
  PackageOpen,
  SlidersHorizontal,
  X,
} from 'lucide-react'

interface PublicProductsProps {
  categorySlug?: string
}

const PAGE_SIZE = 12

type SortKey = 'best' | 'price-asc' | 'price-desc' | 'name' | 'rating'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'best', label: 'Best Sellers' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A to Z' },
  { value: 'rating', label: 'Top Rated' },
]

export function PublicProducts({ categorySlug }: PublicProductsProps) {
  const { navigate } = useApp()

  // ----- filter state -----
  // category is route-controlled (prop). The other filters live in component state.
  const [ply, setPly] = useState<number[]>([])
  const [applications, setApplications] = useState<string[]>([])
  const [certifications, setCertifications] = useState<string[]>([])
  const [sort, setSort] = useState<SortKey>('best')
  const [page, setPage] = useState(1)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [sheetOpen, setSheetOpen] = useState(false)

  // Build a FilterState view for the sidebar
  const filters: FilterState = {
    category: categorySlug,
    ply,
    applications,
    certifications,
  }

  // Wrap setFilters: category goes through navigate(); others update component state
  const setFilters = (next: FilterState) => {
    if (next.category !== categorySlug) {
      navigate({ view: 'public', page: 'products', categorySlug: next.category })
    }
    setPly(next.ply)
    setApplications(next.applications)
    setCertifications(next.certifications)
    setPage(1)
    setLoading(true)
  }

  const setSortWrapped = (next: SortKey) => {
    setSort(next)
    setPage(1)
    setLoading(true)
  }

  const goToPage = (p: number) => {
    setPage(p)
    setLoading(true)
  }

  // ----- data fetch -----
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    const sp = new URLSearchParams()
    sp.set('sort', sort)
    sp.set('limit', String(PAGE_SIZE))
    sp.set('offset', String((page - 1) * PAGE_SIZE))
    if (categorySlug) sp.set('category', categorySlug)
    ply.forEach((p) => sp.append('ply', String(p)))
    applications.forEach((a) => sp.append('application', a))
    certifications.forEach((c) => sp.append('certification', c))

    fetch(`/api/products?${sp.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        setProducts(d.products ?? [])
        setTotal(d.total ?? 0)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setProducts([])
        setTotal(0)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [categorySlug, ply, applications, certifications, sort, page])

  const clearFilters = () => {
    if (categorySlug) navigate({ view: 'public', page: 'products' })
    setPly([])
    setApplications([])
    setCertifications([])
    setPage(1)
    setLoading(true)
  }

  // ----- derived -----
  const activeCategory = useMemo(
    () => categories.find((c) => c.slug === filters.category),
    [categories, filters.category]
  )

  const breadcrumbItems = useMemo(() => {
    const items = [
      { label: 'Home', onClick: () => navigate({ view: 'public', page: 'home' }) },
      {
        label: 'Products',
        onClick: filters.category
          ? () => navigate({ view: 'public', page: 'products' })
          : undefined,
      },
    ]
    if (activeCategory) items.push({ label: activeCategory.name })
    return items
  }, [activeCategory, filters.category, navigate])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const end = Math.min(page * PAGE_SIZE, total)

  // ----- render -----
  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-right" />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb + header */}
        <CatalogBreadcrumb items={breadcrumbItems} className="mb-4" />

        <div className="flex flex-col gap-2 border-b border-border/60 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {activeCategory ? activeCategory.name : 'All Products'}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {activeCategory?.blurb ??
                  'Eco-friendly paper products for every commercial need.'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr]">
          {/* Sidebar (desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <Card className="p-4">
                <ProductFilters
                  categories={categories}
                  state={filters}
                  onChange={setFilters}
                  onClear={clearFilters}
                />
              </Card>
            </div>
          </aside>

          {/* Main */}
          <div className="min-w-0">
            {/* Toolbar */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-primary/60" />
                    Loading products…
                  </span>
                ) : (
                  <>
                    Showing <span className="font-medium text-foreground">{start}–{end}</span> of{' '}
                    <span className="font-medium text-foreground">{formatNumber(total)}</span> products
                  </>
                )}
              </p>

              <div className="flex items-center gap-2">
                {/* Mobile filter trigger */}
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden">
                      <SlidersHorizontal className="h-4 w-4" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-primary" />
                        Filter Products
                      </SheetTitle>
                    </SheetHeader>
                    <div className="px-4 pb-6">
                      <ProductFilters
                        categories={categories}
                        state={filters}
                        onChange={(next) => {
                          setFilters(next)
                        }}
                        onClear={clearFilters}
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Sort */}
                <Select value={sort} onValueChange={(v) => setSortWrapped(v as SortKey)}>
                  <SelectTrigger size="sm" className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* View toggle */}
                <div className="hidden items-center rounded-md border border-border p-0.5 sm:flex">
                  <Button
                    variant={view === 'grid' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setView('grid')}
                    aria-label="Grid view"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={view === 'list' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setView('list')}
                    aria-label="List view"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Active filter chips */}
            {(filters.category ||
              filters.ply.length > 0 ||
              filters.applications.length > 0 ||
              filters.certifications.length > 0) && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {activeCategory && (
                  <Badge variant="secondary" className="gap-1">
                    {activeCategory.name}
                    <button
                      onClick={() => setFilters({ ...filters, category: undefined })}
                      aria-label="Clear category"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.ply.map((p) => (
                  <Badge key={`ply-${p}`} variant="secondary" className="gap-1">
                    {p}-Ply
                    <button
                      onClick={() =>
                        setFilters({ ...filters, ply: filters.ply.filter((x) => x !== p) })
                      }
                      aria-label={`Remove ${p}-ply filter`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {filters.applications.map((a) => (
                  <Badge key={`app-${a}`} variant="secondary" className="gap-1">
                    <span className="capitalize">{a}</span>
                    <button
                      onClick={() =>
                        setFilters({
                          ...filters,
                          applications: filters.applications.filter((x) => x !== a),
                        })
                      }
                      aria-label={`Remove ${a} filter`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {filters.certifications.map((c) => (
                  <Badge key={`cert-${c}`} variant="secondary" className="gap-1">
                    {c}
                    <button
                      onClick={() =>
                        setFilters({
                          ...filters,
                          certifications: filters.certifications.filter((x) => x !== c),
                        })
                      }
                      aria-label={`Remove ${c} filter`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Button
                  variant="link"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={clearFilters}
                >
                  Clear all
                </Button>
              </div>
            )}

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <Card className="flex flex-col items-center justify-center gap-4 p-12 text-center">
                <div className="grid size-14 place-items-center rounded-full bg-secondary">
                  <PackageOpen className="h-7 w-7 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">No products found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try adjusting your filters or browse all products.
                  </p>
                </div>
                <Button onClick={clearFilters} variant="outline">
                  <X className="mr-2 h-4 w-4" />
                  Clear filters
                </Button>
              </Card>
            ) : view === 'grid' ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    view="public"
                    categorySlug={filters.category ?? p.category?.slug}
                  />
                ))}
              </div>
            ) : (
              <ListView products={products} categorySlug={filters.category} />
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="mt-10 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => goToPage(Math.max(1, page - 1))}
                        aria-disabled={page === 1}
                        className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {buildPageNumbers(page, totalPages).map((p, i) =>
                      p === '…' ? (
                        <PaginationItem key={`gap-${i}`}>
                          <span className="px-2 text-muted-foreground">…</span>
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={p}>
                          <PaginationLink
                            isActive={p === page}
                            onClick={() => goToPage(p)}
                            className="cursor-pointer"
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => goToPage(Math.min(totalPages, page + 1))}
                        aria-disabled={page === totalPages}
                        className={
                          page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ----- helpers -----

function buildPageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const out: (number | '…')[] = []
  out.push(1)
  if (current > 3) out.push('…')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    out.push(i)
  }
  if (current < total - 2) out.push('…')
  out.push(total)
  return out
}

// Compact list view (alternative to grid)
function ListView({
  products,
  categorySlug,
}: {
  products: CatalogProduct[]
  categorySlug?: string
}) {
  return (
    <div className="flex flex-col gap-3">
      {products.map((p) => (
        <ListRow key={p.id} product={p} categorySlug={categorySlug} />
      ))}
    </div>
  )
}

function ListRow({ product, categorySlug }: { product: CatalogProduct; categorySlug?: string }) {
  const { navigate, addToCart, user } = useApp()
  const effectivePrice =
    typeof product.effectivePrice === 'number' ? product.effectivePrice : product.basePrice
  const showOriginal = !!product.isCustomPrice && effectivePrice < product.basePrice
  const cover = product.images?.[0] ?? '/images/product-tissue.jpg'
  const shop =
    user?.role === 'purchaser' || user?.role === 'approver' || user?.role === 'owner'

  const goto = () =>
    navigate({
      view: 'public',
      page: 'product',
      categorySlug: categorySlug ?? product.category?.slug ?? 'restroom-paper',
      productSlug: product.slug,
    })

  return (
    <Card
      onClick={goto}
      className="group flex cursor-pointer flex-row items-stretch overflow-hidden p-0 transition-all hover:-translate-y-0.5 hover:shadow-md sm:flex-row"
    >
      <div className="hidden aspect-square w-32 shrink-0 overflow-hidden bg-muted sm:block">
        <img
          src={cover}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">
                SKU {product.sku}
              </Badge>
              {product.bestSeller && (
                <Badge className="bg-amber-400 text-amber-950 text-[10px]">Best Seller</Badge>
              )}
            </div>
            <h3 className="mt-1 line-clamp-1 font-semibold">{product.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-primary">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(effectivePrice)}
            </div>
            {showOriginal && (
              <div className="text-xs text-muted-foreground line-through">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.basePrice)}
              </div>
            )}
            <div className="text-xs text-muted-foreground">/ {product.unit}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {shop ? (
            <Button
              size="sm"
              onClick={(e) => {
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
              }}
            >
              Add to Cart
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={goto}>
              View Details
            </Button>
          )}
          <span className="text-xs text-emerald-700 dark:text-emerald-400">
            ♻ {product.sustainabilityMetrics?.recycledContent ?? '—'} recycled
          </span>
        </div>
      </div>
    </Card>
  )
}
