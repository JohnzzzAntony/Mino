'use client'

import Link from 'next/link'
import { Leaf, Mail, MapPin, Phone, Twitter, Linkedin, Instagram, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { useApp } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

const footerSections = [
  {
    title: 'Products',
    links: [
      { label: 'Restroom Paper', slug: 'restroom-paper' },
      { label: 'Hand Drying Paper', slug: 'hand-drying-paper' },
      { label: 'Dining Paper', slug: 'dining-paper' },
      { label: 'All Products', slug: '' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Our Story', page: 'about' as const },
      { label: 'Wholesale', page: 'wholesale' as const },
      { label: 'Blog', page: 'blog' as const },
      { label: 'Contact', page: 'contact' as const },
    ],
  },
  {
    title: 'Portal',
    links: [
      { label: 'Dashboard', page: 'portal-dashboard' as const },
      { label: 'Orders', page: 'portal-orders' as const },
      { label: 'Invoices', page: 'portal-invoices' as const },
      { label: 'Sustainability', page: 'portal-sustainability' as const },
    ],
  },
]

export function PublicFooter() {
  const { navigate } = useApp()
  const [email, setEmail] = useState('')

  async function subscribe(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        toast.success('Subscribed!', { description: 'Welcome to the Mino newsletter.' })
        setEmail('')
      } else {
        toast.error('Could not subscribe', { description: 'Please try again later.' })
      }
    } catch {
      toast.error('Network error')
    }
  }

  return (
    <footer className="mt-auto border-t border-border/60 bg-secondary/40">
      {/* Newsletter band */}
      <div className="border-b border-border/60 bg-background">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 md:items-center lg:px-8">
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-foreground">
              Stock smarter, sustainably.
            </h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Get product updates, sustainability tips, and B2B procurement insights in your inbox
              once a month. No spam, ever.
            </p>
          </div>
          <form onSubmit={subscribe} className="flex w-full max-w-md gap-2 md:ml-auto">
            <Input
              type="email"
              required
              placeholder="you@business.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">
              Subscribe
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Main footer */}
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-5 lg:px-8">
        {/* Brand */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-base font-bold tracking-tight">MINO</span>
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Suppliers
              </span>
            </span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Eco-Friendly Hygiene Solutions. Soft. Sustainable. Responsible. B2B paper products
            sourced the good way.
          </p>
          <div className="mt-5 flex flex-col gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> 142 Cedar Ridge Rd, Asheville, NC 28801
            </span>
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" /> hello@mino.supplies
            </span>
            <span className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" /> (800) 555-0142
            </span>
          </div>
          <div className="mt-5 flex gap-2">
            {[Twitter, Linkedin, Instagram].map((Icon, i) => (
              <a
                key={i}
                href="#"
                onClick={(e) => e.preventDefault()}
                className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                aria-label="social link"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Link sections */}
        {footerSections.map((section) => (
          <div key={section.title}>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-foreground">
              {section.title}
            </h4>
            <ul className="mt-4 flex flex-col gap-2.5">
              {section.links.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => {
                      if ('slug' in link) {
                        navigate({ view: 'public', page: 'products', categorySlug: link.slug || undefined })
                      } else if (link.page.startsWith('portal-')) {
                        const portalPage = link.page.replace('portal-', '') as any
                        if (portalPage === 'dashboard' || portalPage === 'orders' || portalPage === 'invoices' || portalPage === 'sustainability') {
                          navigate({ view: 'portal', page: portalPage })
                        }
                      } else {
                        navigate({ view: 'public', page: link.page })
                      }
                    }}
                    className="text-left text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border/60 bg-background">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Mino Suppliers. All rights reserved.</p>
          <div className="flex gap-4">
            <button
              onClick={() => navigate({ view: 'public', page: 'home' })}
              className="transition-colors hover:text-primary"
            >
              Privacy
            </button>
            <button
              onClick={() => navigate({ view: 'public', page: 'home' })}
              className="transition-colors hover:text-primary"
            >
              Terms
            </button>
            <span>Made the good way.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
