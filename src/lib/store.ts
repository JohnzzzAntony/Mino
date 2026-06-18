'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ----- Types -----
export type Role = 'visitor' | 'purchaser' | 'approver' | 'owner' | 'admin'

export type View = 'public' | 'portal' | 'admin'

export type PublicRoute =
  | { view: 'public'; page: 'home' }
  | { view: 'public'; page: 'products'; categorySlug?: string }
  | { view: 'public'; page: 'product'; categorySlug: string; productSlug: string }
  | { view: 'public'; page: 'about' }
  | { view: 'public'; page: 'wholesale' }
  | { view: 'public'; page: 'blog' }
  | { view: 'public'; page: 'blog-post'; slug: string }
  | { view: 'public'; page: 'contact' }
  | { view: 'public'; page: 'login' }

export type PortalRoute =
  | { view: 'portal'; page: 'dashboard' }
  | { view: 'portal'; page: 'catalog'; categorySlug?: string }
  | { view: 'portal'; page: 'product'; productSlug: string }
  | { view: 'portal'; page: 'order-guides' }
  | { view: 'portal'; page: 'cart' }
  | { view: 'portal'; page: 'checkout' }
  | { view: 'portal'; page: 'orders' }
  | { view: 'portal'; page: 'order-detail'; id: string }
  | { view: 'portal'; page: 'invoices' }
  | { view: 'portal'; page: 'sustainability' }
  | { view: 'portal'; page: 'account' }
  | { view: 'portal'; page: 'account-users' }

export type AdminRoute =
  | { view: 'admin'; page: 'overview' }
  | { view: 'admin'; page: 'leads' }
  | { view: 'admin'; page: 'customers' }
  | { view: 'admin'; page: 'customer-detail'; id: string }
  | { view: 'admin'; page: 'products' }
  | { view: 'admin'; page: 'orders' }
  | { view: 'admin'; page: 'order-detail'; id: string }
  | { view: 'admin'; page: 'invoices' }
  | { view: 'admin'; page: 'reports' }

export type Route = PublicRoute | PortalRoute | AdminRoute

export interface CartItem {
  productId: string
  name: string
  sku: string
  unitPrice: number
  quantity: number
  image?: string
  unit?: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: Role
  companyId?: string
  companyName?: string
  pricingTierId?: string
  pricingTierName?: string
  discountPercent?: number
  approvalThreshold?: number
  netTermsDays?: number
}

interface AppState {
  // routing
  route: Route
  navigate: (route: Route) => void
  // auth (mock)
  user: AuthUser | null
  loginAs: (user: AuthUser) => void
  logout: () => void
  // cart
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  updateCartQty: (productId: string, quantity: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
  // ui
  theme: 'light' | 'dark'
  toggleTheme: () => void
  mobileMenuOpen: boolean
  setMobileMenu: (open: boolean) => void
}

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      route: { view: 'public', page: 'home' },
      navigate: (route) => {
        set({ route, mobileMenuOpen: false })
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
      },

      user: null,
      loginAs: (user) => set({ user }),
      logout: () =>
        set({
          user: null,
          route: { view: 'public', page: 'home' },
          cart: [],
        }),

      cart: [],
      addToCart: (item) =>
        set((s) => {
          const existing = s.cart.find((c) => c.productId === item.productId)
          if (existing) {
            return {
              cart: s.cart.map((c) =>
                c.productId === item.productId
                  ? { ...c, quantity: c.quantity + item.quantity }
                  : c
              ),
            }
          }
          return { cart: [...s.cart, item] }
        }),
      updateCartQty: (productId, quantity) =>
        set((s) => ({
          cart:
            quantity <= 0
              ? s.cart.filter((c) => c.productId !== productId)
              : s.cart.map((c) =>
                  c.productId === productId ? { ...c, quantity } : c
                ),
        })),
      removeFromCart: (productId) =>
        set((s) => ({ cart: s.cart.filter((c) => c.productId !== productId) })),
      clearCart: () => set({ cart: [] }),

      theme: 'light',
      toggleTheme: () =>
        set((s) => {
          const next = s.theme === 'light' ? 'dark' : 'light'
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', next === 'dark')
          }
          return { theme: next }
        }),
      mobileMenuOpen: false,
      setMobileMenu: (open) => set({ mobileMenuOpen: open }),
    }),
    {
      name: 'mino-app-state',
      partialize: (s) => ({
        cart: s.cart,
        theme: s.theme,
        user: s.user,
      }),
    }
  )
)

// Helper to derive current view from route
export function currentView(route: Route): View {
  return route.view
}

export function isPortal(route: Route): route is PortalRoute {
  return route.view === 'portal'
}

export function isAdmin(route: Route): route is AdminRoute {
  return route.view === 'admin'
}

export function isPublic(route: Route): route is PublicRoute {
  return route.view === 'public'
}
