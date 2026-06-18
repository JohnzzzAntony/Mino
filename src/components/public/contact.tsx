'use client'

import { useState } from 'react'
import { useApp } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import {
  MapPin,
  Mail,
  Phone,
  Clock,
  Send,
  Loader2,
  Twitter,
  Linkedin,
  Instagram,
  MessageSquare,
  ArrowRight,
} from 'lucide-react'

const contactInfo = [
  {
    icon: MapPin,
    label: 'Address',
    value: '142 Cedar Ridge Rd, Asheville, NC 28801',
    sub: 'Distribution across NC, SC, TN, GA',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'hello@mino.supplies',
    sub: 'We reply within 1 business day',
  },
  {
    icon: Phone,
    label: 'Phone',
    value: '(800) 555-0142',
    sub: 'Mon–Fri, 8am–6pm ET',
  },
  {
    icon: Clock,
    label: 'Hours',
    value: 'Mon–Fri: 8am – 6pm ET',
    sub: 'Sat: 9am – 1pm ET · Sun: Closed',
  },
]

const socials = [
  { icon: Twitter, label: 'Twitter / X', href: '#' },
  { icon: Linkedin, label: 'LinkedIn', href: '#' },
  { icon: Instagram, label: 'Instagram', href: '#' },
]

export function PublicContact() {
  const { navigate } = useApp()
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      toast.error('Missing fields', {
        description: 'Name, email, and message are required.',
      })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error('Could not send', {
          description: (data as any)?.error ?? 'Please try again.',
        })
        return
      }
      toast.success('Message sent!', {
        description: "We'll get back to you within 1 business day.",
      })
      setForm({ name: '', email: '', subject: '', message: '' })
    } catch {
      toast.error('Network error', { description: 'Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col">
      <SonnerToaster richColors position="top-center" />

      {/* HEADER */}
      <section className="relative overflow-hidden border-b border-border/60 bg-mesh-eco">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-amber-500/10" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <Badge className="mb-5 border-white/20 bg-white/15 text-white backdrop-blur-sm">
            <MessageSquare className="mr-1.5 h-3 w-3" />
            Contact
          </Badge>
          <h1 className="max-w-3xl text-balance text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Let&apos;s talk
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/90 sm:text-xl">
            Questions about products, custom pricing, sustainability reports, or your existing
            account? We&apos;re real humans and we read every message.
          </p>
        </div>
      </section>

      {/* MAIN */}
      <section className="bg-background py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.3fr_1fr] lg:gap-12 lg:px-8">
          {/* FORM */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl">Send us a message</CardTitle>
              <CardDescription>
                Fill out the form and we&apos;ll get back to you within 1 business day. For wholesale
                inquiries,{' '}
                <button
                  type="button"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  onClick={() => navigate({ view: 'public', page: 'wholesale' })}
                >
                  use the wholesale form
                </button>{' '}
                instead.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="name">
                      Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@business.com"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="What's this about?"
                    value={form.subject}
                    onChange={(e) => update('subject', e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="message">
                    Message <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    rows={6}
                    placeholder="Tell us how we can help…"
                    value={form.message}
                    onChange={(e) => update('message', e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    We&apos;ll never share your information. Period.
                  </p>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={submitting}
                    className="sm:flex-none"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send message
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* INFO COLUMN */}
          <div className="flex flex-col gap-6">
            <Card className="border-border/60 bg-secondary/30 p-6">
              <h3 className="text-lg font-semibold">Contact info</h3>
              <ul className="mt-5 flex flex-col gap-5">
                {contactInfo.map((c) => {
                  const Icon = c.icon
                  return (
                    <li key={c.label} className="flex gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {c.label}
                        </p>
                        <p className="mt-0.5 text-sm font-medium">{c.value}</p>
                        <p className="text-xs text-muted-foreground">{c.sub}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>

              <div className="mt-6 border-t border-border/60 pt-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Follow us
                </p>
                <div className="mt-3 flex gap-2">
                  {socials.map((s) => {
                    const Icon = s.icon
                    return (
                      <a
                        key={s.label}
                        href={s.href}
                        onClick={(e) => e.preventDefault()}
                        className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                        aria-label={s.label}
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    )
                  })}
                </div>
              </div>
            </Card>

            {/* MAP PLACEHOLDER */}
            <Card className="overflow-hidden border-border/60 p-0">
              <div className="relative aspect-[4/3] bg-mesh-eco">
                <div className="absolute inset-0 bg-leaf-pattern opacity-40" />
                <div className="absolute inset-0 grid place-items-center">
                  <div className="rounded-xl border border-white/20 bg-background/95 px-5 py-4 text-center shadow-lg backdrop-blur">
                    <MapPin className="mx-auto h-7 w-7 text-primary" />
                    <p className="mt-2 text-sm font-semibold">Asheville, NC</p>
                    <p className="text-xs text-muted-foreground">142 Cedar Ridge Rd, 28801</p>
                  </div>
                </div>
                {/* grid overlay for "map" feel */}
                <svg
                  className="absolute inset-0 h-full w-full text-white/10"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <pattern
                      id="mapgrid"
                      width="32"
                      height="32"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 32 0 L 0 0 0 32"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#mapgrid)" />
                </svg>
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground">
                  Serving customers across North Carolina, South Carolina, Tennessee, and Georgia.
                  Need delivery outside our region?{' '}
                  <button
                    type="button"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                    onClick={() => navigate({ view: 'public', page: 'wholesale' })}
                  >
                    Talk to us
                  </button>
                  .
                </p>
              </div>
            </Card>

            {/* CTA */}
            <Card className="border-border/60 bg-mesh-eco p-6 text-white">
              <h3 className="text-lg font-semibold">Looking to become a customer?</h3>
              <p className="mt-1 text-sm text-white/85">
                Skip the contact form and submit a wholesale inquiry directly.
              </p>
              <Button
                className="mt-4 w-full bg-amber-400 text-amber-950 hover:bg-amber-300"
                onClick={() => navigate({ view: 'public', page: 'wholesale' })}
              >
                Wholesale inquiry
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
