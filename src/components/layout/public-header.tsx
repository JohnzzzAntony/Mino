'use client'

import { Leaf, Menu, X, ShoppingCart, User, ChevronDown, LogOut, LayoutDashboard, Shield } from 'lucide-react'
import { useApp } from '@/lib/store'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

const navLinks = [
  { label: 'Products', page: 'products' as const, hasMenu: true },
  { label: 'About', page: 'about' as const },
  { label: 'Wholesale', page: 'wholesale' as const },
  { label: 'Blog', page: 'blog' as const },
  { label: 'Contact', page: 'contact' as const },
]

const productCategories = [
  { name: 'Restroom Paper', slug: 'restroom-paper', desc: 'Bath tissue & jumbo rolls' },
  { name: 'Hand Drying Paper', slug: 'hand-drying-paper', desc: 'Multifold, singlefold & rolls' },
  { name: 'Dining Paper', slug: 'dining-paper', desc: 'Napkins, placemats & table rolls' },
]

export function PublicHeader() {
  const { route, navigate, user, logout, cart, mobileMenuOpen, setMobileMenu } = useApp()
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <button
          onClick={() => navigate({ view: 'public', page: 'home' })}
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
          aria-label="MINO home"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight text-foreground">MINO</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Suppliers
            </span>
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) =>
            link.hasMenu ? (
              <DropdownMenu key={link.label}>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground">
                    {link.label}
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-72">
                  <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground">
                    Shop by category
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {productCategories.map((c) => (
                    <DropdownMenuItem
                      key={c.slug}
                      onClick={() =>
                        navigate({ view: 'public', page: 'products', categorySlug: c.slug })
                      }
                      className="flex flex-col items-start gap-0.5 py-2"
                    >
                      <span className="text-sm font-medium">{c.name}</span>
                      <span className="text-xs text-muted-foreground">{c.desc}</span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => navigate({ view: 'public', page: 'products' })}
                    className="text-sm font-medium text-primary"
                  >
                    View all products →
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                key={link.label}
                onClick={() => navigate({ view: 'public', page: link.page })}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
              >
                {link.label}
              </button>
            )
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Role quick nav (only when logged in) */}
          {user && (
            <div className="hidden items-center gap-1 sm:flex">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ view: 'portal', page: 'dashboard' })}
                className="text-foreground/80"
              >
                <LayoutDashboard className="mr-1.5 h-4 w-4" />
                Portal
              </Button>
              {user.role === 'admin' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ view: 'admin', page: 'overview' })}
                  className="text-foreground/80"
                >
                  <Shield className="mr-1.5 h-4 w-4" />
                  Admin
                </Button>
              )}
            </div>
          )}

          {/* Cart (only when logged in as customer) */}
          {user && user.role !== 'admin' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({ view: 'portal', page: 'cart' })}
              className="relative"
              aria-label="Cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center px-1 text-[10px]">
                  {cartCount}
                </Badge>
              )}
            </Button>
          )}

          {/* Auth */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden text-sm font-medium sm:inline">{user.name.split(' ')[0]}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">{user.name}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                  {user.companyName && (
                    <span className="mt-1 inline-flex w-fit items-center rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                      {user.companyName}
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ view: 'portal', page: 'dashboard' })}>
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ view: 'portal', page: 'account' })}>
                  <User className="mr-2 h-4 w-4" /> Account
                </DropdownMenuItem>
                {user.role === 'admin' && (
                  <DropdownMenuItem onClick={() => navigate({ view: 'admin', page: 'overview' })}>
                    <Shield className="mr-2 h-4 w-4" /> Admin panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ view: 'public', page: 'login' })}
              className="hidden sm:inline-flex"
            >
              Log in
            </Button>
          )}

          {!user && (
            <Button
              size="sm"
              onClick={() => navigate({ view: 'public', page: 'wholesale' })}
              className="hidden sm:inline-flex"
            >
              Become a Customer
            </Button>
          )}

          {/* Mobile menu toggle */}
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-accent md:hidden"
            onClick={() => setMobileMenu(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileMenuOpen && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => navigate({ view: 'public', page: link.page })}
                className="rounded-md px-3 py-2 text-left text-sm font-medium text-foreground/80 hover:bg-accent"
              >
                {link.label}
              </button>
            ))}
            <div className="my-2 h-px bg-border" />
            {productCategories.map((c) => (
              <button
                key={c.slug}
                onClick={() =>
                  navigate({ view: 'public', page: 'products', categorySlug: c.slug })
                }
                className="rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent"
              >
                {c.name}
              </button>
            ))}
            <div className="my-2 h-px bg-border" />
            {!user ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate({ view: 'public', page: 'login' })}
                  className="justify-start"
                >
                  Log in
                </Button>
                <Button onClick={() => navigate({ view: 'public', page: 'wholesale' })}>
                  Become a Customer
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate({ view: 'portal', page: 'dashboard' })}
                  className="justify-start"
                >
                  Portal
                </Button>
                {user.role === 'admin' && (
                  <Button
                    variant="ghost"
                    onClick={() => navigate({ view: 'admin', page: 'overview' })}
                    className="justify-start"
                  >
                    Admin
                  </Button>
                )}
                <Button variant="ghost" onClick={logout} className="justify-start text-destructive">
                  Sign out
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
