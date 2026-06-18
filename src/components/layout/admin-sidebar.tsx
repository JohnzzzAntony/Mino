'use client'

import {
  LayoutDashboard,
  UserPlus,
  Building2,
  Package,
  ShoppingCart,
  Receipt,
  BarChart3,
  Leaf,
  LogOut,
  ChevronLeft,
} from 'lucide-react'
import { useApp, type AdminRoute } from '@/lib/store'
import { Button } from '@/components/ui/button'

const navItems: { label: string; icon: any; route: AdminRoute; badge?: string }[] = [
  { label: 'Overview', icon: LayoutDashboard, route: { view: 'admin', page: 'overview' } },
  { label: 'Leads', icon: UserPlus, route: { view: 'admin', page: 'leads' }, badge: 'new' },
  { label: 'Customers', icon: Building2, route: { view: 'admin', page: 'customers' } },
  { label: 'Products', icon: Package, route: { view: 'admin', page: 'products' } },
  { label: 'Orders', icon: ShoppingCart, route: { view: 'admin', page: 'orders' } },
  { label: 'Invoices', icon: Receipt, route: { view: 'admin', page: 'invoices' } },
  { label: 'Reports', icon: BarChart3, route: { view: 'admin', page: 'reports' } },
]

export function AdminSidebar() {
  const { route, navigate, user, logout } = useApp()
  if (!user) return null

  const isActive = (r: AdminRoute) => route.view === 'admin' && route.page === r.page

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border/60 bg-sidebar lg:flex">
      <button
        onClick={() => navigate({ view: 'public', page: 'home' })}
        className="flex h-16 items-center gap-2 border-b border-border/60 px-5 text-left"
      >
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-foreground text-background">
          <Leaf className="h-4 w-4" />
        </span>
        <span className="flex flex-col leading-none">
          <span className="text-sm font-bold tracking-tight">MINO Admin</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Staff console
          </span>
        </span>
      </button>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 scrollbar-thin">
        {navItems.map((item) => {
          const active = isActive(item.route)
          const Icon = item.icon
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.route)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-border/60 p-3">
        <div className="mb-2 rounded-lg bg-sidebar-accent/60 px-3 py-2">
          <p className="truncate text-xs font-semibold">{user.name}</p>
          <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ view: 'public', page: 'home' })}
            className="flex-1 justify-start text-xs"
          >
            <ChevronLeft className="mr-1 h-3.5 w-3.5" />
            Exit admin
          </Button>
          <Button variant="ghost" size="sm" onClick={logout} className="text-destructive">
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
