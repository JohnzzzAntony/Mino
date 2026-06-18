'use client'

import { useEffect, useMemo, useState } from 'react'
import { useApp } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/pricing'
import type { BlogPost } from '@/lib/types'
import { ArrowRight, ArrowLeft, BookOpen, Hash } from 'lucide-react'

export function PublicBlog() {
  const { navigate } = useApp()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTag, setActiveTag] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    fetch('/api/blog?limit=50')
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return
        setPosts(data.posts ?? [])
      })
      .catch(() => {
        if (mounted) setPosts([])
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    posts.forEach((p) => (p.tags ?? []).forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [posts])

  const filtered = useMemo(() => {
    if (!activeTag) return posts
    return posts.filter((p) => (p.tags ?? []).includes(activeTag))
  }, [posts, activeTag])

  return (
    <div className="flex flex-col">
      {/* HEADER */}
      <section className="relative overflow-hidden border-b border-border/60 bg-mesh-eco">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-amber-500/10" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <Badge className="mb-5 border-white/20 bg-white/15 text-white backdrop-blur-sm">
            <BookOpen className="mr-1.5 h-3 w-3" />
            Blog
          </Badge>
          <h1 className="max-w-3xl text-balance text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Resources &amp; Insights
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/90 sm:text-xl">
            Procurement tips, sustainability deep-dives, and operational playbooks for hospitality,
            foodservice, and janitorial teams.
          </p>
        </div>
      </section>

      {/* TAG FILTER */}
      {allTags.length > 0 && (
        <section className="border-b border-border/60 bg-background">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-4 sm:px-6 lg:px-8">
            <span className="mr-1 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Hash className="h-3 w-3" /> Tags
            </span>
            <button
              onClick={() => setActiveTag(null)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                activeTag === null
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
              }`}
            >
              All
            </button>
            {allTags.map((t) => {
              const active = activeTag === t
              return (
                <button
                  key={t}
                  onClick={() => setActiveTag(active ? null : t)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  }`}
                >
                  {t}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* GRID */}
      <section className="bg-background py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden p-0">
                  <Skeleton className="aspect-[16/9] w-full rounded-none" />
                  <div className="space-y-3 p-5">
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </Card>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="mx-auto max-w-md py-16 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No articles found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {activeTag
                  ? `No articles tagged "${activeTag}" yet. Try another tag or check back soon.`
                  : 'Articles will appear here soon.'}
              </p>
              {activeTag && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setActiveTag(null)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  View all
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {filtered.length} article{filtered.length === 1 ? '' : 's'}
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((post) => (
                  <Card
                    key={post.id}
                    className="group flex cursor-pointer flex-col overflow-hidden p-0 transition-all hover:-translate-y-1 hover:shadow-lg"
                    onClick={() =>
                      navigate({ view: 'public', page: 'blog-post', slug: post.slug })
                    }
                  >
                    <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                      {post.coverImage ? (
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center bg-secondary text-muted-foreground">
                          <BookOpen className="h-8 w-8" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-5">
                      <div className="flex flex-wrap gap-1">
                        {(post.tags ?? []).slice(0, 3).map((t) => (
                          <Badge key={t} variant="secondary" className="text-[10px]">
                            {t}
                          </Badge>
                        ))}
                      </div>
                      <h3 className="line-clamp-2 text-base font-semibold leading-snug">
                        {post.title}
                      </h3>
                      <p className="line-clamp-3 flex-1 text-sm text-muted-foreground">
                        {post.excerpt}
                      </p>
                      <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/80">{post.author}</span>
                        <span>{formatDate(post.publishedAt)}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* CTA */}
          {!loading && filtered.length > 0 && (
            <div className="mt-16 rounded-3xl border border-border/60 bg-secondary/30 p-8 text-center sm:p-12">
              <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Ready to put these insights to work?
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
                Apply for wholesale access and get custom pricing, net terms, and a portal built for
                your team.
              </p>
              <Button
                size="lg"
                className="mt-6"
                onClick={() => navigate({ view: 'public', page: 'wholesale' })}
              >
                Become a customer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
