'use client'

import {
  LayoutDashboard,
  Package,
  ListOrdered,
  ShoppingCart,
  Receipt,
  Leaf,
  Building2,
  Users,
  ChevronLeft,
  LogOut,
  Bell,
  Search,
} from 'lucide-react'
import { useApp, type PortalRoute } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ShoppingCart as CartIcon } from 'lucide-react'

const navItems: { label: string; icon: any; route: PortalRoute; roles?: string[] }[] = [
  { label: 'Dashboard', icon: LayoutDashboard, route: { view: 'portal', page: 'dashboard' } },
  { label: 'Catalog', icon: Package, route: { view: 'portal', page: 'catalog' } },
  { label: 'Order Guides', icon: ListOrdered, route: { view: 'portal', page: 'order-guides' } },
  { label: 'Orders', icon: Receipt, route: { view: 'portal', page: 'orders' } },
  { label: 'Invoices', icon: Receipt, route: { view: 'portal', page: 'invoices' } },
  { label: 'Sustainability', icon: Leaf, route: { view: 'portal', page: 'sustainability' } },
  { label: 'Account', icon: Building2, route: { view: 'portal', page: 'account' } },
  { label: 'Users', icon: Users, route: { view: 'portal', page: 'account-users' }, roles: ['owner'] },
]

export function PortalSidebar() {
  const { route, navigate, user, logout, cart } = useApp()
  if (!user) return null

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0)
  const isActive = (r: PortalRoute) =>
    route.view === 'portal' && route.page === r.page

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar lg:flex">
      {/* Brand */}
      <button
        onClick={() => navigate({ view: 'public', page: 'home' })}
        className="flex h-16 items-center gap-2 border-b border-border/60 px-5 text-left"
      >
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Leaf className="h-4 w-4" />
        </span>
        <span className="flex flex-col leading-none">
          <span className="text-sm font-bold tracking-tight">MINO Portal</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {user.companyName ?? 'Account'}
          </span>
        </span>
      </button>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 scrollbar-thin">
        {navItems
          .filter((item) => !item.roles || item.roles.includes(user.role))
          .map((item) => {
            const active = isActive(item.route)
            const Icon = item.icon
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.route)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.label === 'Cart' && cartCount > 0 && (
                  <Badge className="h-5 min-w-5 justify-center px-1 text-[10px]">{cartCount}</Badge>
                )}
              </button>
            )
          })}

        {/* Cart shortcut */}
        <button
          onClick={() => navigate({ view: 'portal', page: 'cart' })}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            isActive({ view: 'portal', page: 'cart' })
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          }`}
        >
          <CartIcon className="h-4 w-4" />
          <span className="flex-1 text-left">Cart</span>
          {cartCount > 0 && (
            <Badge className="h-5 min-w-5 justify-center px-1 text-[10px]">{cartCount}</Badge>
          )}
        </button>
      </nav>

      {/* User block */}
      <div className="border-t border-border/60 p-3">
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-sidebar-accent/60 px-3 py-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {user.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">{user.name}</p>
            <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ view: 'public', page: 'home' })}
            className="flex-1 justify-start text-xs"
          >
            <ChevronLeft className="mr-1 h-3.5 w-3.5" />
            Public site
          </Button>
          <Button variant="ghost" size="sm" onClick={logout} className="text-destructive">
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  )
}

export function PortalTopbar() {
  const { navigate, user, cart } = useApp()
  if (!user) return null
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0)

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/85 px-4 backdrop-blur-xl lg:px-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({ view: 'portal', page: 'dashboard' })}
        className="font-semibold"
      >
        MINO Portal
      </Button>
      <div className="hidden flex-1 sm:block">
        <Input placeholder="Search products, orders, invoices…" className="max-w-sm" />
      </div>
      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ view: 'portal', page: 'cart' })}
          className="relative"
        >
          <ShoppingCart className="h-4 w-4" />
          {cartCount > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center px-1 text-[10px]">
              {cartCount}
            </Badge>
          )}
        </Button>
        <span className="hidden text-xs text-muted-foreground sm:inline">
          {user.companyName}
        </span>
      </div>
    </header>
  )
}
