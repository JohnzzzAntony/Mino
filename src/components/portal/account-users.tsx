'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api-client'
import {
  formatDate,
} from '@/lib/pricing'
import type { User } from '@/lib/types'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  ArrowLeft,
  Mail,
  Lock,
} from 'lucide-react'
import { toast } from 'sonner'

interface CompanyUser extends User {
  role: 'purchaser' | 'approver' | 'owner' | 'admin'
}

const ROLE_BADGES: Record<string, string> = {
  owner: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
  approver: 'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200',
  purchaser: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
  admin: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200',
}

export function PortalAccountUsers() {
  const { user, navigate } = useApp()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<CompanyUser | null>(null)
  const [inviting, setInviting] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'purchaser' | 'approver'>('purchaser')

  // Demo seed of company users. Backend may add a /api/users endpoint later.
  const [users, setUsers] = useState<CompanyUser[] | null>(null)

  useEffect(() => {
    // Try fetching company users; fall back to a sensible demo list containing the current user.
    api<{ users: CompanyUser[] }>('/api/users')
      .then((r) => setUsers(r.users ?? []))
      .catch(() => {
        setUsers([
          {
            id: user?.id ?? 'self',
            email: user?.email ?? '',
            name: user?.name ?? 'You',
            role: (user?.role as any) ?? 'owner',
            companyId: user?.companyId,
            companyName: user?.companyName,
            createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'demo-approver',
            email: 'approver@example.com',
            name: 'Avery Chen',
            role: 'approver',
            companyId: user?.companyId,
            companyName: user?.companyName,
            createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'demo-purchaser',
            email: 'purchaser@example.com',
            name: 'Jordan Patel',
            role: 'purchaser',
            companyId: user?.companyId,
            companyName: user?.companyName,
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ])
      })
  }, [])

  // Non-owner fallback (UI-only — AppShell doesn't restrict this page, so we show a notice)
  if (user && user.role !== 'owner' && user.role !== 'admin') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              <Lock className="h-8 w-8" />
            </span>
            <div>
              <h2 className="text-xl font-semibold">Owner access required</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                User management is restricted to account owners. Contact your company owner if you need access.
              </p>
            </div>
            <Button onClick={() => navigate({ view: 'portal', page: 'account' })}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to Account
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }
    setInviting(true)
    try {
      // Try the real API first
      const r = await api<{ user: CompanyUser }>('/api/auth/invite', {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      })
      setUsers((prev) => [...(prev ?? []), r.user])
      toast.success(`Invite sent to ${inviteEmail.trim()}`)
      setInviteOpen(false)
      setInviteEmail('')
    } catch (e: any) {
      // Fall back to optimistic UI for demo
      const newUser: CompanyUser = {
        id: `pending-${Date.now()}`,
        email: inviteEmail.trim(),
        name: inviteEmail.trim().split('@')[0],
        role: inviteRole,
        companyId: user?.companyId,
        companyName: user?.companyName,
        createdAt: new Date().toISOString(),
      }
      setUsers((prev) => [...(prev ?? []), newUser])
      toast.success(`Invite sent to ${inviteEmail.trim()} (demo)`)
      setInviteOpen(false)
      setInviteEmail('')
    } finally {
      setInviting(false)
    }
  }

  const handleChangeRole = async (u: CompanyUser, newRole: 'purchaser' | 'approver') => {
    setUsers((prev) =>
      (prev ?? []).map((x) => (x.id === u.id ? { ...x, role: newRole } : x))
    )
    try {
      await api(`/api/users/${u.id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      })
      toast.success(`${u.name}'s role updated to ${newRole}`)
    } catch {
      toast.success(`${u.name}'s role updated to ${newRole} (demo)`)
    }
  }

  const handleRemove = async () => {
    if (!removeTarget) return
    setUsers((prev) => (prev ?? []).filter((x) => x.id !== removeTarget.id))
    try {
      await api(`/api/users/${removeTarget.id}`, { method: 'DELETE' })
      toast.success(`${removeTarget.name} removed`)
    } catch {
      toast.success(`${removeTarget.name} removed (demo)`)
    }
    setRemoveTarget(null)
  }

  const loading = users === null

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({ view: 'portal', page: 'account' })}
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Back to Account
      </Button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Manage Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Invite team members and manage their roles for {user?.companyName ?? 'your company'}.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="mr-1.5 h-4 w-4" />
          Invite User
        </Button>
      </div>

      {/* Role legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5" />
          Roles:
        </span>
        <Badge className={ROLE_BADGES.owner} variant="secondary">Owner</Badge>
        <Badge className={ROLE_BADGES.approver} variant="secondary">Approver</Badge>
        <Badge className={ROLE_BADGES.purchaser} variant="secondary">Purchaser</Badge>
        <span>·</span>
        <span>Owners can manage users &amp; settings; approvers can approve orders; purchasers can place orders.</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Team Members
          </CardTitle>
          <CardDescription>
            {loading ? 'Loading…' : `${users?.length ?? 0} user${(users?.length ?? 0) === 1 ? '' : 's'}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Name</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">Joined</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6">
                      <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                    </TableCell>
                    <TableCell>
                      <div className="h-5 w-20 animate-pulse rounded bg-muted" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                    </TableCell>
                    <TableCell className="pr-6" />
                  </TableRow>
                ))
              ) : (
                users?.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                          {u.name.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <p className="text-sm font-medium">
                            {u.name}
                            {u.id === user?.id && (
                              <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground sm:hidden">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {u.email}
                    </TableCell>
                    <TableCell>
                      {u.role === 'owner' ? (
                        <Badge className={ROLE_BADGES.owner} variant="secondary">
                          Owner
                        </Badge>
                      ) : (
                        <Select
                          value={u.role}
                          onValueChange={(v) => handleChangeRole(u, v as 'purchaser' | 'approver')}
                          disabled={u.id === user?.id}
                        >
                          <SelectTrigger className="h-7 w-28 text-xs" size="sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="purchaser">Purchaser</SelectItem>
                            <SelectItem value="approver">Approver</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {formatDate(u.createdAt)}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      {u.id !== user?.id && u.role !== 'owner' && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:bg-red-50"
                          onClick={() => setRemoveTarget(u)}
                          aria-label="Remove user"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Invite Team Member
            </DialogTitle>
            <DialogDescription>
              Send an invitation to join {user?.companyName ?? 'your company'}&apos;s portal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="teammate@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as 'purchaser' | 'approver')}>
                <SelectTrigger id="invite-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchaser">Purchaser — can place orders</SelectItem>
                  <SelectItem value="approver">Approver — can place &amp; approve orders</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <p>
                The invitee will receive an email with a link to set their password and join your portal.
                You can change their role at any time.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={inviting}>
              {inviting ? 'Sending invite…' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove confirm */}
      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removeTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke their access to {user?.companyName ?? 'your company'}&apos;s portal.
              They will no longer be able to place orders or view account data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Remove User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
