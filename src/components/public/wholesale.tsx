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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  UserCog,
  Rocket,
  ShieldCheck,
  Truck,
  Recycle,
  BadgeCheck,
  Loader2,
} from 'lucide-react'

interface FormState {
  companyName: string
  contactName: string
  email: string
  phone: string
  businessType: string
  monthlyVolume: string
  message: string
}

const empty: FormState = {
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  businessType: '',
  monthlyVolume: '',
  message: '',
}

const steps = [
  {
    icon: ClipboardList,
    title: 'We review your inquiry',
    desc: 'A real person reads your submission and reaches out within 1–2 business days.',
  },
  {
    icon: UserCog,
    title: 'We set up your account + custom pricing',
    desc: 'Based on your volume and category mix, we build a tiered price list just for you.',
  },
  {
    icon: Rocket,
    title: 'You get portal access + your first order',
    desc: 'Log in, see your pricing, place your first order. Net terms from day one.',
  },
]

const certifications = [
  { icon: ShieldCheck, label: 'FSC Certified' },
  { icon: BadgeCheck, label: 'Green Seal' },
  { icon: Recycle, label: '80%+ Recycled' },
  { icon: Truck, label: 'Net-Terms Invoicing' },
]

export function PublicWholesale() {
  const { navigate } = useApp()
  const [form, setForm] = useState<FormState>(empty)
  const [submitting, setSubmitting] = useState(false)

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.companyName || !form.contactName || !form.email) {
      toast.error('Missing fields', {
        description: 'Company name, contact name, and email are required.',
      })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error('Could not submit', {
          description: (data as any)?.error ?? 'Please try again.',
        })
        return
      }
      toast.success('Inquiry submitted!', {
        description: 'We will reach out in 1–2 business days.',
      })
      setForm(empty)
    } catch {
      toast.error('Network error', { description: 'Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col">
      {/* MOUNT sonner toaster so toasts render on this view */}
      <SonnerToaster richColors position="top-center" />

      {/* HEADER */}
      <section className="relative overflow-hidden border-b border-border/60 bg-mesh-eco">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-amber-500/10" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <Badge className="mb-5 border-white/20 bg-white/15 text-white backdrop-blur-sm">
            Wholesale
          </Badge>
          <h1 className="max-w-3xl text-balance text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Partner with Mino Suppliers
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/90 sm:text-xl">
            Net-terms invoicing, custom pricing, and a dedicated portal built for procurement
            teams. We review every inquiry in 1–2 business days.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/85">
            {certifications.map((c) => {
              const Icon = c.icon
              return (
                <span key={c.label} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-amber-200" />
                  {c.label}
                </span>
              )
            })}
          </div>
        </div>
      </section>

      {/* MAIN GRID */}
      <section className="bg-background py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
            {/* FORM */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl">Wholesale inquiry</CardTitle>
                <CardDescription>
                  Tell us about your business. We&apos;ll follow up within 1–2 business days with
                  next steps and (if it&apos;s a fit) custom pricing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="grid gap-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="companyName">
                        Company Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="companyName"
                        placeholder="Cedar Grove Inn"
                        value={form.companyName}
                        onChange={(e) => update('companyName', e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="contactName">
                        Contact Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="contactName"
                        placeholder="Marie Cedar"
                        value={form.contactName}
                        onChange={(e) => update('contactName', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="email">
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="marie@cedargrove.com"
                        value={form.email}
                        onChange={(e) => update('email', e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={form.phone}
                        onChange={(e) => update('phone', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="businessType">Business Type</Label>
                      <Select
                        value={form.businessType}
                        onValueChange={(v) => update('businessType', v)}
                      >
                        <SelectTrigger id="businessType" className="w-full">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Hotel">Hotel / Hospitality</SelectItem>
                          <SelectItem value="Restaurant">Restaurant / Foodservice</SelectItem>
                          <SelectItem value="Janitorial">Janitorial / Facilities</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="monthlyVolume">Estimated Monthly Volume</Label>
                      <Select
                        value={form.monthlyVolume}
                        onValueChange={(v) => update('monthlyVolume', v)}
                      >
                        <SelectTrigger id="monthlyVolume" className="w-full">
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Small">Small (&lt; $1k / month)</SelectItem>
                          <SelectItem value="Medium">Medium ($1k – $5k / month)</SelectItem>
                          <SelectItem value="Large">Large ($5k+ / month)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="message">Message / Needs</Label>
                    <Textarea
                      id="message"
                      rows={5}
                      placeholder="Tell us what you buy today, what you'd like to switch, any spec requirements, delivery windows, etc."
                      value={form.message}
                      onChange={(e) => update('message', e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-muted-foreground">
                      By submitting you agree to be contacted by Mino Suppliers about your inquiry.
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
                          Submitting…
                        </>
                      ) : (
                        <>
                          Submit Inquiry
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* SIDEBAR */}
            <div className="flex flex-col gap-6">
              <Card className="border-border/60 bg-secondary/30 p-6">
                <h3 className="text-lg font-semibold">What happens next</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  A straightforward path from inquiry to first order.
                </p>

                <ol className="mt-6 flex flex-col gap-6">
                  {steps.map((s, i) => {
                    const Icon = s.icon
                    return (
                      <li key={s.title} className="relative flex gap-4">
                        {i < steps.length - 1 && (
                          <span className="absolute left-5 top-12 h-[calc(100%-1rem)] w-px bg-border" />
                        )}
                        <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                          <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                            {i + 1}
                          </span>
                        </span>
                        <div>
                          <p className="font-medium leading-tight">{s.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </Card>

              <Card className="border-border/60 p-6">
                <h3 className="text-lg font-semibold">Already a customer?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Skip the form and log in to your portal.
                </p>
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => navigate({ view: 'public', page: 'login' })}
                >
                  Customer log in
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Card>

              <Card className="border-border/60 bg-mesh-eco p-6 text-white">
                <h3 className="text-lg font-semibold">Why teams switch to Mino</h3>
                <ul className="mt-4 flex flex-col gap-3 text-sm">
                  {[
                    'Custom tiered pricing + per-SKU overrides',
                    'Net-terms invoicing (15–45 days)',
                    'Approval workflow built for procurement teams',
                    'Real sustainability metrics on every order',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
                      <span className="text-white/90">{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BADGES STRIP */}
      <section className="border-t border-border/60 bg-secondary/30 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Certified, audited, accountable
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {certifications.map((c) => {
              const Icon = c.icon
              return (
                <div
                  key={c.label}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border/60 bg-background p-5 text-center transition-colors hover:border-primary/40"
                >
                  <Icon className="h-7 w-7 text-primary" />
                  <span className="text-sm font-medium">{c.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
