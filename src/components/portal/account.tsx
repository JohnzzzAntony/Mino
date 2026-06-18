'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api-client'
import {
  formatCurrency,
} from '@/lib/pricing'
import type { Order, Address } from '@/lib/types'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Building2,
  Tag,
  Truck,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Users,
  Leaf,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'

type SavedAddress = Address

export function PortalAccount() {
  const { user, navigate } = useApp()
  const [orders, setOrders] = useState<Order[]>([])
  const [addresses, setAddresses] = useState<SavedAddress[]>([])

  useEffect(() => {
    api<{ orders: Order[] }>('/api/orders')
      .then((r) => {
        setOrders(r.orders ?? [])
        // Extract addresses from past orders
        const seen = new Map<string, SavedAddress>()
        r.orders?.forEach((o) => {
          if (o.shippingAddressJson) {
            try {
              const a = JSON.parse(o.shippingAddressJson)
              const id = a.id || `${a.line1}-${a.zip}`
              if (!seen.has(id) && a.line1) {
                seen.set(id, {
                  id,
                  companyId: user?.companyId ?? '',
                  label: a.label || 'Saved Address',
                  line1: a.line1,
                  line2: a.line2 ?? null,
                  city: a.city,
                  state: a.state,
                  zip: a.zip,
                  type: 'shipping',
                })
              }
            } catch {}
          }
        })
        setAddresses(Array.from(seen.values()))
      })
      .catch(() => {})
  }, [])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Account Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your company profile, pricing, and addresses.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Company profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Company Profile
            </CardTitle>
            <CardDescription>Your registered business information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Company Name" value={user?.companyName ?? '—'} />
            <InfoRow
              label="Account Status"
              value={
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200" variant="secondary">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Active
                </Badge>
              }
            />
            <InfoRow label="Business Type" value="Hospitality / Food Service" />
            <InfoRow label="Monthly Volume" value="$5,000 – $25,000" />
            <InfoRow label="Your Role" value={<Badge variant="outline" className="capitalize">{user?.role}</Badge>} />
            <InfoRow label="Email" value={user?.email ?? '—'} />
            <InfoRow label="Contact Name" value={user?.name ?? '—'} />
          </CardContent>
        </Card>

        {/* Pricing info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              Pricing & Terms
            </CardTitle>
            <CardDescription>Your negotiated pricing tier and payment terms</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow
              label="Pricing Tier"
              value={
                <Badge className="bg-primary/10 text-primary" variant="secondary">
                  <Leaf className="mr-1 h-3 w-3" />
                  {user?.pricingTierName ?? 'Standard'}
                </Badge>
              }
            />
            <InfoRow
              label="Discount"
              value={
                <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                  {user?.discountPercent ? `${user.discountPercent}% off list` : 'No discount'}
                </span>
              }
            />
            <InfoRow
              label="Net Terms"
              value={
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  Net {user?.netTermsDays ?? 30} days
                </span>
              }
            />
            <InfoRow
              label="Approval Threshold"
              value={
                <span className="font-medium">
                  {user?.approvalThreshold ? formatCurrency(user.approvalThreshold) : 'No limit'}
                </span>
              }
            />
            <Separator />
            <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
              <p>
                Orders above the approval threshold are routed to an approver within your company
                before being submitted for fulfillment.
              </p>
              <p className="mt-2">
                Contact your MINO account manager to discuss tier upgrades or custom pricing.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Addresses */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Saved Addresses
            </CardTitle>
            <CardDescription>
              {addresses.length} saved shipping {addresses.length === 1 ? 'address' : 'addresses'}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info('Demo: address editing is disabled in this preview')}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Address
          </Button>
        </CardHeader>
        <CardContent>
          {addresses.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Truck className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">No saved addresses yet</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Addresses are saved automatically when you place an order with a new shipping address.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => navigate({ view: 'portal', page: 'catalog' })}
              >
                Place an Order
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {addresses.map((a) => (
                <div key={a.id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                        <MapPin className="h-4 w-4" />
                      </span>
                      <span className="font-medium">{a.label}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => toast.info('Demo: address editing is disabled in this preview')}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:bg-red-50"
                        onClick={() => toast.info('Demo: address editing is disabled in this preview')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-muted-foreground">
                    <p>{a.line1}</p>
                    {a.line2 && <p>{a.line2}</p>}
                    <p>
                      {a.city}, {a.state} {a.zip}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manage users (owner only) */}
      {user?.role === 'owner' && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                User Management
              </CardTitle>
              <CardDescription>Manage team members and their roles</CardDescription>
            </div>
            <Button size="sm" onClick={() => navigate({ view: 'portal', page: 'account-users' })}>
              Manage Users
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              As the account owner, you can invite team members, assign roles (Purchaser or Approver),
              and manage access permissions.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}
