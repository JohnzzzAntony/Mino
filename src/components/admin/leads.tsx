'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import {
  Search,
  Eye,
  Check,
  X,
  Phone,
  Mail,
  Building2,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MessageSquare,
} from 'lucide-react'
import {
  formatDateTime,
  statusColor,
  prettifyStatus,
  classNames,
} from '@/lib/pricing'
import type { WholesaleLead } from '@/lib/types'

type StatusFilter = 'all' | 'new' | 'contacted' | 'approved' | 'rejected'

export function AdminLeads() {
  const [leads, setLeads] = useState<WholesaleLead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [viewLead, setViewLead] = useState<WholesaleLead | null>(null)
  const [approveLead, setApproveLead] = useState<WholesaleLead | null>(null)
  const [rejectLead, setRejectLead] = useState<WholesaleLead | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/admin/leads')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLeads(data.leads ?? [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    return leads
      .filter((l) => statusFilter === 'all' || l.status === statusFilter)
      .filter((l) => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
          l.companyName.toLowerCase().includes(q) ||
          l.contactName.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [leads, statusFilter, search])

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { all: leads.length, new: 0, contacted: 0, approved: 0, rejected: 0 }
    for (const l of leads) c[l.status as StatusFilter] = (c[l.status as StatusFilter] ?? 0) + 1
    return c
  }, [leads])

  async function patchStatus(id: string, status: WholesaleLead['status'], reason?: string) {
    setBusy(id + status)
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason }),
      })
      if (!res.ok) throw new Error()
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)))
      if (status === 'approved') {
        toast({ title: 'Lead approved', description: 'Company created + invite email sent.' })
      } else if (status === 'rejected') {
        toast({ title: 'Lead rejected', description: 'The lead has been marked as rejected.' })
      } else {
        toast({ title: 'Marked as contacted', description: 'Lead status updated to Contacted.' })
      }
    } catch {
      toast({ title: 'Update failed', description: 'Could not update lead status. Try again.', variant: 'destructive' })
    } finally {
      setBusy(null)
      setApproveLead(null)
      setRejectLead(null)
      setRejectReason('')
    }
  }

  function exportCsv() {
    const headers = ['Company', 'Contact', 'Email', 'Phone', 'Business Type', 'Monthly Volume', 'Status', 'Created']
    const rows = filtered.map((l) => [
      l.companyName,
      l.contactName,
      l.email,
      l.phone ?? '',
      l.businessType ?? '',
      l.monthlyVolume ?? '',
      l.status,
      new Date(l.createdAt).toISOString(),
    ])
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    downloadCsv(csv, 'mino-leads.csv')
    toast({ title: 'Export ready', description: `${rows.length} leads exported to CSV.` })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Wholesale Leads</h1>
          <p className="text-sm text-muted-foreground">
            Review and approve inbound wholesale inquiries.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={classNames('mr-1.5 h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="mr-1.5 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search company, contact, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(['all', 'new', 'contacted', 'approved', 'rejected'] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={classNames(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  statusFilter === s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                )}
              >
                {s === 'all' ? 'All' : prettifyStatus(s)}
                <span className="ml-1.5 opacity-70">{counts[s]}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {error ? (
            <ErrorState onRetry={load} />
          ) : loading ? (
            <TableSkeleton rows={6} cols={8} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No leads found"
              subtitle={search || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'New wholesale inquiries will appear here.'}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="hidden md:table-cell">Email / Phone</TableHead>
                    <TableHead className="hidden lg:table-cell">Type</TableHead>
                    <TableHead className="hidden lg:table-cell">Volume</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <div className="font-medium">{l.companyName}</div>
                        <div className="text-xs text-muted-foreground">{l.contactName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{l.contactName}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground md:hidden">
                          <Mail className="h-3 w-3" />
                          {l.email}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate">{l.email}</span>
                        </div>
                        {l.phone && (
                          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {l.phone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        {l.businessType ? prettifyStatus(l.businessType) : '—'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm capitalize">
                        {l.monthlyVolume ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColor(l.status)} variant="outline">
                          {prettifyStatus(l.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {formatDateTime(l.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {l.status === 'new' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => patchStatus(l.id, 'contacted')}
                              disabled={busy === l.id + 'contacted'}
                              title="Mark as contacted"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span className="sr-only">Contact</span>
                            </Button>
                          )}
                          {(l.status === 'new' || l.status === 'contacted') && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setApproveLead(l)}
                                disabled={busy === l.id + 'approved'}
                                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/50 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                              >
                                <Check className="h-3.5 w-3.5" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setRejectLead(l)}
                                disabled={busy === l.id + 'rejected'}
                                className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/30"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => setViewLead(l)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View dialog */}
      <Dialog open={!!viewLead} onOpenChange={(o) => !o && setViewLead(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewLead?.companyName}</DialogTitle>
            <DialogDescription>
              Submitted {viewLead && formatDateTime(viewLead.createdAt)}
            </DialogDescription>
          </DialogHeader>
          {viewLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Detail label="Contact" value={viewLead.contactName} />
                <Detail label="Email" value={viewLead.email} />
                <Detail label="Phone" value={viewLead.phone ?? '—'} />
                <Detail label="Business type" value={viewLead.businessType ? prettifyStatus(viewLead.businessType) : '—'} />
                <Detail label="Monthly volume" value={viewLead.monthlyVolume ?? '—'} />
                <Detail label="Status" value={prettifyStatus(viewLead.status)} />
              </div>
              {viewLead.message && (
                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Message</p>
                  <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm leading-relaxed">
                    {viewLead.message}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                {(viewLead.status === 'new' || viewLead.status === 'contacted') && (
                  <>
                    <Button
                      onClick={() => {
                        const l = viewLead
                        setViewLead(null)
                        setApproveLead(l)
                      }}
                    >
                      <CheckCircle2 className="mr-1.5 h-4 w-4" />
                      Approve lead
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const l = viewLead
                        setViewLead(null)
                        setRejectLead(l)
                      }}
                      className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-300"
                    >
                      <XCircle className="mr-1.5 h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve confirm */}
      <AlertDialog open={!!approveLead} onOpenChange={(o) => !o && setApproveLead(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve {approveLead?.companyName}?</AlertDialogTitle>
            <AlertDialogDescription>
              A company account will be created and an invite email sent to{' '}
              <span className="font-medium text-foreground">{approveLead?.email}</span>. The lead
              will be marked as approved and the contact becomes the account owner.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => approveLead && patchStatus(approveLead.id, 'approved')}
              disabled={busy === approveLead?.id + 'approved'}
              className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800"
            >
              {busy === approveLead?.id + 'approved' ? 'Approving…' : 'Approve & create account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject confirm */}
      <AlertDialog open={!!rejectLead} onOpenChange={(o) => !o && setRejectLead(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject {rejectLead?.companyName}?</AlertDialogTitle>
            <AlertDialogDescription>
              The lead will be marked as rejected. You can optionally provide a reason that will be
              stored in the audit log (not emailed to the contact).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Reason for rejection (optional)…"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => rejectLead && patchStatus(rejectLead.id, 'rejected', rejectReason)}
              disabled={busy === rejectLead?.id + 'rejected'}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
            >
              {busy === rejectLead?.id + 'rejected' ? 'Rejecting…' : 'Reject lead'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium">{value}</p>
    </div>
  )
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function TableSkeleton({ rows = 6, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function ErrorState({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <AlertCircle className="h-10 w-10 text-amber-500" />
      <div>
        <p className="font-medium">Data unavailable</p>
        <p className="text-sm text-muted-foreground">
          {message ?? 'The admin API is still being built. Please retry in a moment.'}
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Retry
        </Button>
      )}
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: any
  title: string
  subtitle: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </span>
      <p className="font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{subtitle}</p>
    </div>
  )
}
