'use client'

import { useApp } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AnimatedCounter } from '@/components/shared/animated-counter'
import {
  Leaf,
  Package,
  HandshakeIcon,
  Sparkles,
  ArrowRight,
  Recycle,
  TreePine,
  Droplets,
  ShieldCheck,
  Truck,
  Star,
  Quote,
  ChevronRight,
} from 'lucide-react'
import { useEffect, useState } from 'react'

function safeParseArr(v: any): string[] {
  if (Array.isArray(v)) return v
  if (typeof v === 'string') {
    try {
      const p = JSON.parse(v)
      return Array.isArray(p) ? p : []
    } catch {
      return []
    }
  }
  return []
}
function safeParseObj(v: any): Record<string, any> {
  if (v && typeof v === 'object') return v
  if (typeof v === 'string') {
    try {
      return JSON.parse(v)
    } catch {
      return {}
    }
  }
  return {}
}

interface Category {
  id: string
  name: string
  slug: string
  blurb: string | null
  icon: string | null
  _count?: { products: number }
}

interface Product {
  id: string
  name: string
  slug: string
  sku: string
  basePrice: number
  images: string[]
  rating: number
  bestSeller: boolean
  sustainabilityMetrics: string
}

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  author: string
  publishedAt: string | null
  coverImage: string | null
  tags: string
}

const whyMino = [
  {
    icon: Leaf,
    title: 'Sustainably sourced',
    desc: '80%+ recycled content as a baseline. FSC & Green Seal certified across the catalog.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
  },
  {
    icon: Package,
    title: 'Bulk-ready',
    desc: 'Case and pallet quantities, with high-capacity SKUs designed for commercial volume.',
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
  },
  {
    icon: HandshakeIcon,
    title: 'B2B pricing',
    desc: 'Tiered discounts, per-customer overrides, and net-terms invoicing — no card required.',
    color: 'text-rose-600',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
  },
  {
    icon: Sparkles,
    title: 'Ojibwe roots',
    desc: 'Named for "the good way." Responsibility to land, workers, and customers, always.',
    color: 'text-violet-600',
    bg: 'bg-violet-50 dark:bg-violet-950/40',
  },
]

const testimonials = [
  {
    quote:
      'Switching to Mino cut our paper spend by 12% and gave us a real sustainability story to tell guests. The portal makes reordering trivial.',
    name: 'Marie Cedar',
    role: 'Owner, Cedar Grove Inn',
    initials: 'MC',
  },
  {
    quote:
      'The approval workflow alone is worth it. Our purchasers submit, our approver signs off, and procurement just works. Invoices are clean.',
    name: 'Riley Summit',
    role: 'Operations, Summit Janitorial Co.',
    initials: 'RS',
  },
  {
    quote:
      'We compared four suppliers. Mino was the only one that treated sustainability as a baseline, not an upsell.',
    name: 'Sam Maple',
    role: 'GM, Maple & Oak Bistro',
    initials: 'SM',
  },
]

const impactStats = [
  { icon: TreePine, value: 12840, label: 'Trees saved', suffix: '', color: 'text-emerald-600' },
  { icon: Recycle, value: 2.1, label: 'M lbs recycled content', suffix: 'M', decimals: 1, color: 'text-amber-600' },
  { icon: Droplets, value: 6.4, label: 'M gallons water saved', suffix: 'M', decimals: 1, color: 'text-sky-600' },
  { icon: ShieldCheck, value: 92, label: '% products eco-certified', suffix: '%', color: 'text-violet-600' },
]

export function PublicHome() {
  const { navigate } = useApp()
  const [categories, setCategories] = useState<Category[]>([])
  const [bestSellers, setBestSellers] = useState<Product[]>([])
  const [posts, setPosts] = useState<BlogPost[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/products?bestSeller=1&limit=4').then((r) => r.json()),
      fetch('/api/blog?limit=3').then((r) => r.json()),
    ]).then(([c, p, b]) => {
      setCategories(c.categories ?? c ?? [])
      setBestSellers(p.products ?? p ?? [])
      setPosts(b.posts ?? b ?? [])
    })
  }, [])

  const categoryImages: Record<string, string> = {
    'restroom-paper': '/images/cat-restroom.jpg',
    'hand-drying-paper': '/images/cat-hand-drying.jpg',
    'dining-paper': '/images/cat-dining.jpg',
  }

  return (
    <div className="flex flex-col">
      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/hero.jpg"
            alt="Eco-friendly paper products"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary/70 to-foreground/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
        </div>

        <div className="relative mx-auto flex max-w-7xl flex-col items-start px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <Badge className="mb-5 border-white/30 bg-white/15 text-white backdrop-blur-sm">
            <Leaf className="mr-1.5 h-3 w-3" />
            Eco-Friendly Hygiene Solutions
          </Badge>
          <h1 className="max-w-3xl text-balance text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Soft. Sustainable.
            <br />
            <span className="text-amber-200">Responsible.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/90 sm:text-xl">
            B2B paper products sourced the good way. Custom pricing, net terms, and a portal
            built for procurement teams that care about impact.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={() => navigate({ view: 'public', page: 'wholesale' })}
              className="bg-amber-400 text-amber-950 hover:bg-amber-300"
            >
              Become a Customer
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate({ view: 'public', page: 'products' })}
              className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              Browse Products
            </Button>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-white/80">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-200" /> FSC &amp; Green Seal certified
            </span>
            <span className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-amber-200" /> Net-terms invoicing
            </span>
            <span className="flex items-center gap-2">
              <Recycle className="h-4 w-4 text-amber-200" /> 80%+ recycled content
            </span>
          </div>
        </div>
      </section>

      {/* ---------- WHY MINO ---------- */}
      <section className="border-b border-border/60 bg-background py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Why Mino?</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Procurement with a conscience
            </h2>
            <p className="mt-3 text-muted-foreground">
              Every product, every partnership, every invoice — done the good way.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {whyMino.map((item) => {
              const Icon = item.icon
              return (
                <Card
                  key={item.title}
                  className="group relative overflow-hidden p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${item.bg}`}>
                    <Icon className={`h-6 w-6 ${item.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{item.desc}</p>
                  <div className="absolute -bottom-px left-0 h-1 w-0 bg-primary transition-all group-hover:w-full" />
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* ---------- SHOP BY CATEGORY ---------- */}
      <section className="bg-secondary/30 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">Catalog</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Shop by category</h2>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate({ view: 'public', page: 'products' })}
              className="hidden sm:inline-flex"
            >
              View all products
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {categories.length === 0
              ? [1, 2, 3].map((i) => (
                  <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
                ))
              : categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() =>
                      navigate({ view: 'public', page: 'products', categorySlug: cat.slug })
                    }
                    className="group relative h-72 overflow-hidden rounded-2xl text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
                  >
                    <img
                      src={categoryImages[cat.slug] ?? '/images/cat-restroom.jpg'}
                      alt={cat.name}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/30 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                      <p className="text-xs font-medium uppercase tracking-wider text-white/70">
                        {cat._count?.products ?? 0} products
                      </p>
                      <h3 className="mt-1 text-2xl font-bold">{cat.name}</h3>
                      <p className="mt-1 text-sm text-white/80">{cat.blurb}</p>
                      <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-amber-200 opacity-0 transition-opacity group-hover:opacity-100">
                        Browse category
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </button>
                ))}
          </div>
        </div>
      </section>

      {/* ---------- THE MINO STORY ---------- */}
      <section className="bg-background py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="relative">
            <div className="absolute -left-4 -top-4 h-24 w-24 rounded-2xl bg-primary/10" />
            <div className="absolute -bottom-4 -right-4 h-32 w-32 rounded-full bg-amber-200/40" />
            <img
              src="/images/story.jpg"
              alt="Sustainable forest"
              className="relative aspect-[4/3] w-full rounded-2xl object-cover shadow-xl"
            />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Our story</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              The Ojibwe meaning of &ldquo;Mino&rdquo;
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              <em>Mino</em> translates as &ldquo;good&rdquo; — but in a deeper sense, it means{' '}
              <strong className="text-foreground">doing things in a good way</strong>. A way that
              honors the land, the workers, and the future.
            </p>
            <p className="mt-3 text-muted-foreground">
              We manufacture our core line with YANUODO, a partner that shares our standards for
              recycled content, water stewardship, and fair labor. Together we audit every mill in
              our supply chain annually.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-4">
              {[
                { label: 'Recycled content', value: '80%+' },
                { label: 'Annual mill audits', value: '100%' },
                { label: 'Net terms', value: '15–45d' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border/60 bg-secondary/30 p-4">
                  <p className="text-2xl font-bold text-primary">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              className="mt-6"
              onClick={() => navigate({ view: 'public', page: 'about' })}
            >
              Read our story
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ---------- SUSTAINABILITY IMPACT STRIP ---------- */}
      <section className="bg-mesh-eco py-16 text-white sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-200">
              Collective impact
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Our customers, in numbers
            </h2>
            <p className="mt-3 text-white/80">
              Real impact, measured and reported back to every customer on their portal dashboard.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {impactStats.map((stat) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-sm"
                >
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                  <p className="mt-4 text-4xl font-bold tracking-tight">
                    <AnimatedCounter
                      value={stat.value}
                      suffix={stat.suffix ?? ''}
                      decimals={(stat as any).decimals ?? 0}
                    />
                  </p>
                  <p className="mt-1 text-sm text-white/80">{stat.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ---------- BEST SELLERS ---------- */}
      {bestSellers.length > 0 && (
        <section className="bg-background py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                  Best sellers
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                  Trusted by procurement teams
                </h2>
              </div>
              <Button
                variant="ghost"
                onClick={() => navigate({ view: 'public', page: 'products' })}
                className="hidden sm:inline-flex"
              >
                See all
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {bestSellers.map((p) => {
                const images = Array.isArray(p.images) ? p.images : safeParseArr(p.images)
                const metrics = p.sustainabilityMetrics && typeof p.sustainabilityMetrics === 'object'
                  ? p.sustainabilityMetrics
                  : safeParseObj(p.sustainabilityMetrics)
                return (
                  <Card
                    key={p.id}
                    className="group cursor-pointer overflow-hidden p-0 transition-all hover:-translate-y-1 hover:shadow-lg"
                    onClick={() =>
                      navigate({
                        view: 'public',
                        page: 'product',
                        categorySlug: 'restroom-paper',
                        productSlug: p.slug,
                      })
                    }
                  >
                    <div className="aspect-square overflow-hidden bg-muted">
                      <img
                        src={images[0] ?? '/images/product-tissue.jpg'}
                        alt={p.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-[10px]">
                          SKU {p.sku}
                        </Badge>
                        <span className="flex items-center gap-0.5 text-xs text-amber-500">
                          <Star className="h-3 w-3 fill-current" />
                          {p.rating}
                        </span>
                      </div>
                      <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug">
                        {p.name}
                      </h3>
                      <p className="mt-1 text-xs text-emerald-600">
                        ♻ {metrics.recycledContent ?? '80%'} recycled
                      </p>
                      <p className="mt-2 text-lg font-bold text-primary">
                        ${p.basePrice.toFixed(2)}
                        <span className="text-xs font-normal text-muted-foreground"> /case</span>
                      </p>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ---------- TESTIMONIALS ---------- */}
      <section className="border-y border-border/60 bg-secondary/30 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Trusted by
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Operators who care about impact
            </h2>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.name} className="flex flex-col p-6">
                <Quote className="h-8 w-8 text-primary/30" />
                <p className="mt-3 flex-1 text-sm leading-relaxed text-foreground/90">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {t.initials}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- BLOG PREVIEW ---------- */}
      {posts.length > 0 && (
        <section className="bg-background py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                  Resources
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                  From the blog
                </h2>
              </div>
              <Button
                variant="ghost"
                onClick={() => navigate({ view: 'public', page: 'blog' })}
                className="hidden sm:inline-flex"
              >
                All articles
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  className="group cursor-pointer overflow-hidden p-0 transition-all hover:-translate-y-1 hover:shadow-lg"
                  onClick={() => navigate({ view: 'public', page: 'blog-post', slug: post.slug })}
                >
                  <div className="aspect-[16/9] overflow-hidden bg-muted">
                    <img
                      src={post.coverImage ?? '/images/story.jpg'}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(post.tags) ? post.tags : safeParseArr(post.tags)).slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <h3 className="mt-2 line-clamp-2 font-semibold leading-snug">{post.title}</h3>
                    <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                      {post.excerpt}
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {post.author} ·{' '}
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : ''}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- CTA BAND ---------- */}
      <section className="bg-background py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-mesh-eco px-6 py-16 text-center text-white sm:px-16">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-300/20 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-emerald-300/20 blur-2xl" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to stock smarter?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-white/85">
                Apply for wholesale access. We&rsquo;ll review your inquiry in 1–2 business days,
                set up custom pricing, and you&rsquo;ll get portal access for your first order.
              </p>
              <Button
                size="lg"
                onClick={() => navigate({ view: 'public', page: 'wholesale' })}
                className="mt-6 bg-amber-400 text-amber-950 hover:bg-amber-300"
              >
                Request wholesale access
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
