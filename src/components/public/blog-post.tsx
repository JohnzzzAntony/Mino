'use client'

import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useApp } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/pricing'
import type { BlogPost } from '@/lib/types'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Clock,
  User,
  Mail,
  Twitter,
  Linkedin,
} from 'lucide-react'

interface BlogPostResponse {
  post: BlogPost
  related: BlogPost[]
}

// Estimated reading time helper
function readingTime(content: string): number {
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 220))
}

// Lightweight markdown component overrides — Tailwind-styled, no @tailwindcss/typography needed.
const mdComponents = {
  h1: ({ children }: any) => (
    <h1 className="mt-10 text-3xl font-bold tracking-tight sm:text-4xl">{children}</h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="mt-8 border-b border-border/60 pb-2 text-2xl font-bold tracking-tight">
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="mt-6 text-xl font-semibold tracking-tight">{children}</h3>
  ),
  h4: ({ children }: any) => (
    <h4 className="mt-5 text-lg font-semibold tracking-tight">{children}</h4>
  ),
  p: ({ children }: any) => (
    <p className="leading-7 text-foreground/90 [&:not(:first-child)]:mt-4">{children}</p>
  ),
  ul: ({ children }: any) => (
    <ul className="my-4 list-disc space-y-1.5 pl-6 marker:text-primary">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="my-4 list-decimal space-y-1.5 pl-6 marker:text-primary marker:font-semibold">
      {children}
    </ol>
  ),
  li: ({ children }: any) => <li className="leading-7 text-foreground/90">{children}</li>,
  a: ({ children, href }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="my-6 border-l-4 border-primary/50 bg-secondary/40 px-4 py-2 italic text-foreground/90">
      {children}
    </blockquote>
  ),
  code: ({ children, className }: any) => {
    const isBlock = String(className ?? '').includes('language-')
    if (isBlock) {
      return (
        <code className="block overflow-x-auto rounded-lg border border-border/60 bg-secondary/60 p-4 text-sm font-mono">
          {children}
        </code>
      )
    }
    return (
      <code className="rounded bg-secondary px-1.5 py-0.5 text-sm font-mono text-primary">
        {children}
      </code>
    )
  },
  pre: ({ children }: any) => <pre className="my-4">{children}</pre>,
  hr: () => <hr className="my-8 border-border/60" />,
  strong: ({ children }: any) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }: any) => <em className="italic">{children}</em>,
  table: ({ children }: any) => (
    <div className="my-6 overflow-x-auto rounded-lg border border-border/60">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }: any) => <thead className="bg-secondary/60">{children}</thead>,
  th: ({ children }: any) => (
    <th className="border-b border-border/60 px-4 py-2 text-left font-semibold">{children}</th>
  ),
  td: ({ children }: any) => (
    <td className="border-b border-border/40 px-4 py-2 align-top">{children}</td>
  ),
  img: ({ src, alt }: any) => (
    <img
      src={typeof src === 'string' ? src : ''}
      alt={alt ?? ''}
      className="my-6 w-full rounded-xl border border-border/60"
    />
  ),
}

export function PublicBlogPost({ slug }: { slug: string }) {
  const { navigate } = useApp()
  const [data, setData] = useState<BlogPostResponse | null>(null)
  // Derived loading state: we know we're "loading" for `slug` until the
  // matching data arrives. This avoids calling setState synchronously in
  // the effect body (which would trip react-hooks/set-state-in-effect).
  const [loadedSlug, setLoadedSlug] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const loading = loadedSlug !== slug && !notFound

  useEffect(() => {
    let mounted = true
    fetch(`/api/blog/${encodeURIComponent(slug)}`)
      .then(async (r) => {
        if (!mounted) return null
        if (!r.ok) {
          return { __notFound: true } as const
        }
        return r.json()
      })
      .then((d) => {
        if (!mounted || !d) return
        if ((d as any).__notFound) {
          setNotFound(true)
          setData(null)
          return
        }
        setData(d as BlogPostResponse)
        setLoadedSlug(slug)
        setNotFound(false)
      })
      .catch(() => {
        if (mounted) setNotFound(true)
      })
    return () => {
      mounted = false
    }
  }, [slug])

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-4 aspect-[16/8] w-full rounded-2xl" />
        <Skeleton className="mt-8 h-10 w-3/4" />
        <div className="mt-6 flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="mt-8 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (notFound || !data?.post) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6 lg:px-8">
        <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">Article not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The article you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => navigate({ view: 'public', page: 'blog' })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to blog
        </Button>
      </div>
    )
  }

  const { post, related } = data
  const minutes = readingTime(post.content || '')
  const authorInitials = post.author
    .split(' ')
    .map((n) => n.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="flex flex-col">
      <article>
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-border/60 bg-mesh-eco">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-amber-500/15" />
          <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ view: 'public', page: 'blog' })}
              className="mb-6 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              All articles
            </Button>

            <div className="flex flex-wrap gap-1.5">
              {(post.tags ?? []).map((t) => (
                <Badge
                  key={t}
                  className="border-white/20 bg-white/15 text-white backdrop-blur-sm"
                >
                  {t}
                </Badge>
              ))}
            </div>

            <h1 className="mt-4 text-balance text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl">
              {post.title}
            </h1>
            <p className="mt-4 text-lg text-white/85">{post.excerpt}</p>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/85">
              <span className="flex items-center gap-2">
                <Avatar className="h-8 w-8 border-2 border-white/30">
                  <AvatarFallback className="bg-white/20 text-xs font-semibold text-white">
                    {authorInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-white">{post.author}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-amber-200" />
                {formatDate(post.publishedAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-amber-200" />
                {minutes} min read
              </span>
            </div>
          </div>
        </section>

        {/* COVER IMAGE */}
        {post.coverImage && (
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="-mt-8 overflow-hidden rounded-2xl border border-border/60 bg-background shadow-xl">
              <img
                src={post.coverImage}
                alt={post.title}
                className="aspect-[16/8] w-full object-cover"
              />
            </div>
          </div>
        )}

        {/* CONTENT */}
        <section className="bg-background py-12 sm:py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="md-content space-y-1 text-base">
              <ReactMarkdown components={mdComponents}>{post.content || ''}</ReactMarkdown>
            </div>

            {/* AUTHOR + SHARE FOOTER */}
            <div className="mt-12 flex flex-col gap-4 border-t border-border/60 pt-8 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                    {authorInitials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{post.author}</p>
                  <p className="text-xs text-muted-foreground">Mino Suppliers</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Share
                </span>
                {[Twitter, Linkedin, Mail].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    aria-label="share"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* BACK BUTTON */}
            <div className="mt-8">
              <Button
                variant="outline"
                onClick={() => navigate({ view: 'public', page: 'blog' })}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to all articles
              </Button>
            </div>
          </div>
        </section>
      </article>

      {/* RELATED */}
      {related && related.length > 0 && (
        <section className="border-t border-border/60 bg-secondary/30 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                  Keep reading
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                  Related articles
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
              {related.map((p) => (
                <Card
                  key={p.id}
                  className="group flex cursor-pointer flex-col overflow-hidden p-0 transition-all hover:-translate-y-1 hover:shadow-lg"
                  onClick={() => navigate({ view: 'public', page: 'blog-post', slug: p.slug })}
                >
                  <div className="aspect-[16/9] overflow-hidden bg-muted">
                    {p.coverImage ? (
                      <img
                        src={p.coverImage}
                        alt={p.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-secondary text-muted-foreground">
                        <BookOpen className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <div className="flex flex-wrap gap-1">
                      {(p.tags ?? []).slice(0, 2).map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px]">
                          {t}
                        </Badge>
                      ))}
                    </div>
                    <h3 className="line-clamp-2 font-semibold leading-snug">{p.title}</h3>
                    <p className="line-clamp-2 flex-1 text-sm text-muted-foreground">
                      {p.excerpt}
                    </p>
                    <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                        <User className="h-3 w-3" />
                        {p.author}
                      </span>
                      <span>{formatDate(p.publishedAt)}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
