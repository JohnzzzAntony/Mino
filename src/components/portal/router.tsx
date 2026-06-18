'use client'

import { useApp } from '@/lib/store'
import { PortalDashboard } from './dashboard'
import { PortalCatalog } from './catalog'
import { PortalProductDetail } from './product-detail'
import { PortalOrderGuides } from './order-guides'
import { PortalCart } from './cart'
import { PortalCheckout } from './checkout'
import { PortalOrders } from './orders'
import { PortalOrderDetail } from './order-detail'
import { PortalInvoices } from './invoices'
import { PortalSustainability } from './sustainability'
import { PortalAccount } from './account'
import { PortalAccountUsers } from './account-users'

export function PortalRouter() {
  const { route } = useApp()
  if (route.view !== 'portal') return null

  switch (route.page) {
    case 'dashboard':
      return <PortalDashboard />
    case 'catalog':
      return <PortalCatalog categorySlug={route.categorySlug} />
    case 'product':
      return <PortalProductDetail productSlug={route.productSlug} />
    case 'order-guides':
      return <PortalOrderGuides />
    case 'cart':
      return <PortalCart />
    case 'checkout':
      return <PortalCheckout />
    case 'orders':
      return <PortalOrders />
    case 'order-detail':
      return <PortalOrderDetail id={route.id} />
    case 'invoices':
      return <PortalInvoices />
    case 'sustainability':
      return <PortalSustainability />
    case 'account':
      return <PortalAccount />
    case 'account-users':
      return <PortalAccountUsers />
    default:
      return <PortalDashboard />
  }
}
