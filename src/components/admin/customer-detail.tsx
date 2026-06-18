'use client'

import { useEffect, useState, useCallback } from 'react'
import { useApp } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from '@/hooks/use-toast'
import {
  ArrowLeft,
  Building2,
  Users as UsersIcon,
  MapPin,
  ShoppingCart,
  Save,
  Ban,
  RefreshCw,
  AlertCircle,
  Mail,
  Phone,
} from 'lucide-react'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  statusColor,
  prettifyStatus,
  classNames,
} from '@/lib/pricing'
import type { Company, User, Address, Order, PricingTier } from '@/lib/types'
import { ErrorState } from './leads'

interface CustomerDetailData {
  customer: Company & { users: User[]; addresses: Address[]; orders: Order[] }
}

interface PricingTiersData {
  tiers: PricingTier[]
}

const STATIC_TIERS: PricingTier[] = [
  { id: 'tier-starter', name: 'Starter', discountPercent: 0 },
  { id: 'tier-bronze', name: 'Bronze', discountPercent: 5 },
  { id: 'tier-silver', name: 'Silver', discountPercent: 8 },
  { id: 'tier-gold', name: 'Gold', discountPercent: 12 },
  { id: 'tier-platinum', name: 'Platinum', discountPercent: 15 },
]

export function AdminCustomerDetail({ id }: { id: string }) {
  const { navigate } = useApp()
  const [data, setData] = useState<CustomerDetailData | null>(null)
  const [tiers, setTiers] = useState<PricingTier[]>(STATIC_TIERS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [suspendOpen, setSuspendOpen] = useState(false)

  // Editable fields
  const [pricingTierId, setPricingTierId] = useState<string>('')
  const [approvalThreshold, setApprovalThreshold] = useState<number>(0)
  const [netTermsDays, setNetTermsDays] = useState<number>(30)
  const [status, setStatus] = useState<string>('approved')

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [custRes, tierRes] = await Promise.all([
        fetch(`/api/admin/customers/${id}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/admin/pricing-tiers').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ])
      if (!custRes) {
        setError(true)
        return
      }
      setData(custRes)
      const c = custRes.customer
      setPricingTierId(c.pricingTierId ?? '')
      setApprovalThreshold(c.approvalThreshold)
      setNetTermsDays(c.netTermsDays)
      setStatus(c.status)
      if (tierRes?.tiers?.length) setTiers(tierRes.tiers)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function patch(body: Record<string, any>, successMsg: string) {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Updated', description: successMsg })
      await load()
    } catch {
      toast({ title: 'Update failed', description: 'Could not save changes.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <DetailSkeleton onBack={() => navigate({ view: 'admin', page: 'customers' })} />
  if (error || !data)
    return (
      <div className="space-y-4">
        <BackButton onClick={() => navigate({ view: 'admin', page: 'customers' })} />
        <Card>
          <CardContent>
            <ErrorState onRetry={load} message="This customer could not be loaded. The API may still be initializing." />
          </CardContent>
        </Card>
      </div>
    )

  const c = data.customer

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate({ view: 'admin', page: 'customers' })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{c.name}</h1>
              <Badge className={statusColor(c.status)} variant="outline">
                {prettifyStatus(c.status)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Customer since {formatDate(c.createdAt)} · ID {c.id.slice(-8)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Refresh
          </Button>
          {c.status !== 'suspended' ? (
            <Button variant="outline" size="sm" onClick={() => setSuspendOpen(true)} className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-300">
              <Ban className="mr-1.5 h-4 w-4" />
              Suspend
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => patch({ status: 'approved' }, 'Account reactivated.')}>
              Reactivate
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Company info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-primary" />
              Company info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoRow label="Legal name" value={c.name} />
            <InfoRow label="Status" value={prettifyStatus(c.status)} />
            <InfoRow label="Business type" value={c.businessType ? prettifyStatus(c.businessType) : '—'} />
            <InfoRow label="Monthly volume" value={c.monthlyVolume ? prettifyStatus(c.monthlyVolume) : '—'} />
            <InfoRow label="Pricing tier" value={c.pricingTierName ?? 'Default'} />
            <InfoRow label="Discount" value={c.discountPercent ? `${c.discountPercent}%` : '0%'} />
            <InfoRow label="Created" value={formatDate(c.createdAt)} />
          </CardContent>
        </Card>

        {/* Pricing config */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Pricing &amp; account config</CardTitle>
            <CardDescription>
              Changes apply immediately to all portal users in this company.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tier">Pricing tier</Label>
              <Select
                value={pricingTierId || 'none'}
                onValueChange={(v) => {
                  const val = v === 'none' ? '' : v
                  setPricingTierId(val)
                  patch({ pricingTierId: val || null }, 'Pricing tier updated.')
                }}
              >
                <SelectTrigger id="tier" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Default (no tier)</SelectItem>
                  {tiers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} · {t.discountPercent}% off
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Account status</Label>
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v)
                  patch({ status: v }, `Status updated to ${prettifyStatus(v)}.`)
                }}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="threshold">Approval threshold ($)</Label>
              <Input
                id="threshold"
                type="number"
                step="50"
                min="0"
                value={approvalThreshold}
                onChange={(e) => setApprovalThreshold(Number(e.target.value))}
                onBlur={() =>
                  patch({ approvalThreshold }, `Approval threshold set to ${formatCurrency(approvalThreshold)}.`)
                }
              />
              <p className="text-xs text-muted-foreground">Orders above this require approval.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="terms">Net terms (days)</Label>
              <Input
                id="terms"
                type="number"
                step="5"
                min="0"
                value={netTermsDays}
                onChange={(e) => setNetTermsDays(Number(e.target.value))}
                onBlur={() =>
                  patch({ netTermsDays }, `Net terms set to ${netTermsDays} days.`)
                }
              />
              <p className="text-xs text-muted-foreground">Days before invoices are overdue.</p>
            </div>

            <div className="sm:col-span-2 flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Saving…' : 'Edits auto-save on change / blur.'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UsersIcon className="h-4 w-4 text-primary" />
            Portal users
            <Badge variant="secondary" className="ml-1">{c.users.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {c.users.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">No portal users yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="hidden md:table-cell">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {c.users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-sm">
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {u.email}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={classNames('capitalize', statusColor(u.role))}>
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {formatDate(u.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Addresses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-primary" />
            Addresses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {c.addresses.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No addresses on file.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {c.addresses.map((a) => (
                <div key={a.id} className="rounded-lg border border-border bg-muted/30 p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium">{a.label}</span>
                    <Badge variant="secondary" className="capitalize text-[10px]">{a.type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{a.line1}</p>
                  {a.line2 && <p className="text-sm text-muted-foreground">{a.line2}</p>}
                  <p className="text-sm text-muted-foreground">
                    {a.city}, {a.state} {a.zip}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order history */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-4 w-4 text-primary" />
            Order history
            <Badge variant="secondary" className="ml-1">{c.orders.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {c.orders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="hidden md:table-cell">PO #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {c.orders.slice(0, 10).map((o) => (
                    <TableRow
                      key={o.id}
                      className="cursor-pointer"
                      onClick={() => navigate({ view: 'admin', page: 'order-detail', id: o.id })}
                    >
                      <TableCell className="font-medium">{o.orderNumber ?? '#' + o.id.slice(-6)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{o.poNumber ?? '—'}</TableCell>
                      <TableCell>
                        <Badge className={statusColor(o.status)} variant="outline">
                          {prettifyStatus(o.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(o.total)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suspend dialog */}
      <AlertDialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend {c.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              All portal users in this company will be blocked from placing orders. Existing orders
              and invoices are unaffected. You can reactivate the account at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setSuspendOpen(false)
                patch({ status: 'suspended' }, 'Account suspended. Users blocked from ordering.')
              }}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
            >
              <Ban className="mr-1.5 h-4 w-4" />
              Suspend account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick}>
      <ArrowLeft className="mr-1.5 h-4 w-4" />
      Back to customers
    </Button>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  )
}

function DetailSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-5">
      <BackButton onClick={onBack} />
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-32" />
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Skeleton className="h-64 lg:col-span-1" />
        <Skeleton className="h-64 lg:col-span-2" />
      </div>
      <Skeleton className="h-48" />
      <Skeleton className="h-48" />
    </div>
  )
}
