'use client'

import { useState } from 'react'
import { useApp, type AuthUser } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import {
  Leaf,
  Loader2,
  LogIn,
  AlertCircle,
  Sparkles,
  ArrowRight,
  KeyRound,
  ShieldCheck,
} from 'lucide-react'

interface DemoAccount {
  email: string
  password: string
  label: string
  role: string
  company: string
}

const demoAccounts: DemoAccount[] = [
  { email: 'admin@mino.supplies', password: 'admin1234', label: 'Admin', role: 'Mino staff', company: 'Mino Suppliers' },
]

export function PublicLogin() {
  const { navigate, loginAs } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function doLogin(emailVal: string, passwordVal: string) {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailVal, password: passwordVal }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = (data as any)?.error ?? 'Login failed'
        setError(msg)
        toast.error('Login failed', { description: msg })
        return
      }
      const user = (data as { user: AuthUser }).user
      loginAs(user)
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`, {
        description: user.companyName ? `Signed in to ${user.companyName}` : undefined,
      })
      const isAdmin = user.role === 'admin'
      navigate(
        isAdmin
          ? { view: 'admin', page: 'overview' }
          : { view: 'portal', page: 'dashboard' }
      )
    } catch {
      const msg = 'Network error. Please try again.'
      setError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError('Email and password are required.')
      return
    }
    void doLogin(email, password)
  }

  async function quickFill(acc: DemoAccount) {
    setEmail(acc.email)
    setPassword(acc.password)
    setError(null)
    toast.info('Filling demo credentials…', {
      description: `${acc.label} · ${acc.role}`,
    })
    // brief delay so user sees the fill happen
    await new Promise((r) => setTimeout(r, 200))
    void doLogin(acc.email, acc.password)
  }

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-leaf-pattern px-4 py-12 sm:px-6">
      <SonnerToaster richColors position="top-center" />

      {/* decorative bg */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-amber-300/15 blur-3xl" />

      <div className="relative grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        {/* LEFT: brand + form */}
        <div className="order-2 lg:order-1">
          <Card className="border-border/60 shadow-xl">
            <CardHeader className="space-y-3 text-center">
              <button
                onClick={() => navigate({ view: 'public', page: 'home' })}
                className="mx-auto flex items-center gap-2 transition-opacity hover:opacity-80"
                aria-label="MINO home"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <Leaf className="h-6 w-6" />
                </span>
                <span className="flex flex-col leading-none">
                  <span className="text-lg font-bold tracking-tight">MINO</span>
                  <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Suppliers
                  </span>
                </span>
              </button>
              <div>
                <CardTitle className="text-2xl">Welcome back</CardTitle>
                <CardDescription className="mt-1">
                  Sign in to your customer portal
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Could not sign in</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@business.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      onClick={() =>
                        toast.info('Password reset', {
                          description: 'Contact your admin or hello@mino.supplies to reset.',
                        })
                      }
                      className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" size="lg" disabled={submitting} className="mt-2">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Log In
                    </>
                  )}
                </Button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  or
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <p className="text-center text-sm text-muted-foreground">
                New to Mino?{' '}
                <button
                  type="button"
                  onClick={() => navigate({ view: 'public', page: 'wholesale' })}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Request wholesale access
                  <ArrowRight className="ml-1 inline h-3 w-3" />
                </button>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: demo accounts */}
        <div className="order-1 lg:order-2">
          <Card className="border-border/60 bg-secondary/40 p-6">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                <KeyRound className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-semibold">Demo accounts</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Click any account to auto-fill credentials and sign in. Perfect for exploring the
                  portal and admin panel.
                </p>
              </div>
            </div>

            <div className="mt-5 grid max-h-[28rem] gap-2 overflow-y-auto scrollbar-thin pr-1">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  disabled={submitting}
                  onClick={() => quickFill(acc)}
                  className="group flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background px-4 py-3 text-left transition-all hover:border-primary/50 hover:bg-accent/40 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                      {acc.label.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{acc.label}</p>
                      <p className="truncate text-xs text-muted-foreground">{acc.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="hidden rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground sm:inline">
                      {acc.role}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border/60 pt-5 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Mock auth — no real password is checked.</span>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <span>Each role unlocks different portal features.</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
