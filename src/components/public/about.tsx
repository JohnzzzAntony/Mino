'use client'

import { useApp } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { AnimatedCounter } from '@/components/shared/animated-counter'
import {
  Leaf,
  HandshakeIcon,
  ShieldCheck,
  Sparkles,
  TreePine,
  Recycle,
  Factory,
  Globe2,
  ArrowRight,
  HeartHandshake,
  Quote,
} from 'lucide-react'

const values = [
  {
    icon: Leaf,
    title: 'Sustainability',
    desc: '80%+ recycled content as a baseline, FSC & Green Seal certifications, and water stewardship built into every product line.',
    accent: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
  },
  {
    icon: HandshakeIcon,
    title: 'Partnership',
    desc: 'We manufacture with YANUODO and audit every mill annually. Our customers get a real partner, not a vendor.',
    accent: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
  },
  {
    icon: ShieldCheck,
    title: 'Responsibility',
    desc: 'Named for "the good way." Responsibility to land, workers, and customers — encoded in every invoice.',
    accent: 'text-rose-600',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
  },
  {
    icon: Sparkles,
    title: 'Quality',
    desc: 'Soft, strong, reliable. Commercial-grade paper that holds up in hospitality, foodservice, and janitorial settings.',
    accent: 'text-violet-600',
    bg: 'bg-violet-50 dark:bg-violet-950/40',
  },
]

const stats = [
  { icon: TreePine, value: 12840, label: 'Trees saved', suffix: '', decimals: 0 },
  { icon: Recycle, value: 82, label: '% avg recycled content', suffix: '%', decimals: 0 },
  { icon: Factory, value: 100, label: '% mills audited annually', suffix: '%', decimals: 0 },
  { icon: Globe2, value: 4, label: 'States served', suffix: '', decimals: 0 },
]

const team = [
  {
    name: 'Aki Mino',
    role: 'Co-founder & CEO',
    bio: 'Ojibwe heritage, 15 years in commercial procurement. Started Mino to make "the good way" the default, not the upsell.',
    initials: 'AM',
  },
  {
    name: 'Jordan Liang',
    role: 'Co-founder & Operations',
    bio: 'Leads our YANUODO partnership and supply chain. Spends 6 weeks a year on the mill floor.',
    initials: 'JL',
  },
  {
    name: 'Priya Shah',
    role: 'Head of Sustainability',
    bio: 'Tracks every metric you see on your portal dashboard. Former auditor at Green Seal.',
    initials: 'PS',
  },
]

export function PublicAbout() {
  const { navigate } = useApp()

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border/60 bg-mesh-eco">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-amber-500/10" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
          <Badge className="mb-5 border-white/20 bg-white/15 text-white backdrop-blur-sm">
            <Leaf className="mr-1.5 h-3 w-3" />
            Our story
          </Badge>
          <h1 className="max-w-3xl text-balance text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
            The Mino Story
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/90 sm:text-xl">
            <em>Mino</em> is an Ojibwe word meaning &ldquo;good&rdquo; — but in a deeper sense it
            means <strong className="text-amber-200">doing things in a good way</strong>. A way that
            honors the land, the workers, and the future.
          </p>
          <p className="mt-3 max-w-2xl text-base text-white/80">
            That idea is the whole company. Every product, every partnership, every invoice.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={() => navigate({ view: 'public', page: 'wholesale' })}
              className="bg-amber-400 text-amber-950 hover:bg-amber-300"
            >
              Partner with Mino
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate({ view: 'public', page: 'products' })}
              className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              Browse products
            </Button>
          </div>
        </div>
      </section>

      {/* TWO-COLUMN STORY */}
      <section className="bg-background py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <div className="relative order-2 lg:order-1">
            <div className="absolute -left-4 -top-4 h-24 w-24 rounded-2xl bg-primary/10" />
            <div className="absolute -bottom-4 -right-4 h-32 w-32 rounded-full bg-amber-200/50 dark:bg-amber-500/20" />
            <img
              src="/images/story.jpg"
              alt="Sustainable forest — Mino sourcing"
              className="relative aspect-[4/3] w-full rounded-2xl object-cover shadow-xl"
            />
            <div className="relative -mt-6 ml-6 inline-flex items-center gap-3 rounded-xl border border-border/60 bg-background/95 p-3 shadow-lg backdrop-blur">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <TreePine className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold leading-tight">FSC &amp; Green Seal</p>
                <p className="text-xs text-muted-foreground">Certified supply chain</p>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              The good way
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              From Ojibwe roots to commercial reality
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We started Mino because B2B paper procurement was stuck in a race to the bottom —
              cheaper, thinner, less responsible. We believed procurement teams wanted a real
              alternative: paper that performs, sourced in a way you can stand behind.
            </p>
            <p className="mt-3 text-muted-foreground">
              We manufacture our core line with{' '}
              <strong className="text-foreground">YANUODO</strong>, a partner that shares our
              standards for recycled content, water stewardship, and fair labor. Together we audit
              every mill in our supply chain annually — not because a regulator asks, but because
              it&apos;s the good way.
            </p>
            <p className="mt-3 text-muted-foreground">
              The result: commercial-grade paper products with real sustainability metrics, custom
              B2B pricing, net-terms invoicing, and a portal that gives your team visibility into
              the impact of every order.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-4">
              {[
                { label: 'Recycled content', value: '80%+' },
                { label: 'Annual audits', value: '100%' },
                { label: 'Net terms', value: '15–45d' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-border/60 bg-secondary/30 p-4"
                >
                  <p className="text-2xl font-bold text-primary">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* VALUES GRID */}
      <section className="border-y border-border/60 bg-secondary/30 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              What we stand for
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Four values, no compromise
            </h2>
            <p className="mt-3 text-muted-foreground">
              The Mino way isn&apos;t a marketing line. It&apos;s the operating manual.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => {
              const Icon = v.icon
              return (
                <Card
                  key={v.title}
                  className="group relative overflow-hidden p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div
                    className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${v.bg}`}
                  >
                    <Icon className={`h-6 w-6 ${v.accent}`} />
                  </div>
                  <h3 className="text-lg font-semibold">{v.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{v.desc}</p>
                  <div className="absolute -bottom-px left-0 h-1 w-0 bg-primary transition-all group-hover:w-full" />
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* STATS BAND */}
      <section className="bg-background py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Collective impact
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Measured, not marketing
            </h2>
            <p className="mt-3 text-muted-foreground">
              Every customer sees their share of this impact on their portal dashboard. Real
              numbers, audited annually.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => {
              const Icon = s.icon
              return (
                <Card key={s.label} className="p-6 text-center">
                  <Icon className="mx-auto h-8 w-8 text-primary" />
                  <p className="mt-3 text-4xl font-bold tracking-tight">
                    <AnimatedCounter
                      value={s.value}
                      suffix={s.suffix}
                      decimals={s.decimals ?? 0}
                    />
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* YANUODO PARTNERSHIP QUOTE */}
      <section className="border-y border-border/60 bg-leaf-pattern py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-border/60 bg-background/90 p-8 text-center shadow-sm backdrop-blur-sm sm:p-12">
            <Quote className="mx-auto h-10 w-10 text-primary/30" />
            <p className="mt-4 text-xl font-medium leading-relaxed sm:text-2xl">
              &ldquo;We don&apos;t audit Mino because they pay us. We audit them because they ask
              us to. That&apos;s the difference between a vendor and a partner.&rdquo;
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">Y</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-sm font-semibold">YANUODO Manufacturing</p>
                <p className="text-xs text-muted-foreground">Mino production partner since 2019</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="bg-background py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              The team
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              People behind the good way
            </h2>
            <p className="mt-3 text-muted-foreground">
              A small team that has done this for a long time, and a partner network that holds us
              accountable.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {team.map((m) => (
              <Card key={m.name} className="p-6 text-center transition-all hover:-translate-y-1 hover:shadow-md">
                <Avatar className="mx-auto h-20 w-20">
                  <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                    {m.initials}
                  </AvatarFallback>
                </Avatar>
                <h3 className="mt-4 text-lg font-semibold">{m.name}</h3>
                <p className="text-sm font-medium text-primary">{m.role}</p>
                <p className="mt-3 text-sm text-muted-foreground">{m.bio}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="bg-background py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-mesh-eco px-6 py-16 text-center text-white sm:px-16">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-300/20 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-emerald-300/20 blur-2xl" />
            <div className="relative">
              <HeartHandshake className="mx-auto h-10 w-10 text-amber-200" />
              <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
                Partner with Mino
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-white/85">
                Apply for wholesale access. We&apos;ll review your inquiry in 1–2 business days, set
                up custom pricing, and you&apos;ll get portal access for your first order.
              </p>
              <Button
                size="lg"
                onClick={() => navigate({ view: 'public', page: 'wholesale' })}
                className="mt-6 bg-amber-400 text-amber-950 hover:bg-amber-300"
              >
                Become a customer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
