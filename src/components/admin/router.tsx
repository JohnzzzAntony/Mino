'use client'

import { useApp } from '@/lib/store'
import { AdminOverview } from './overview'
import { AdminLeads } from './leads'
import { AdminCustomers } from './customers'
import { AdminCustomerDetail } from './customer-detail'
import { AdminProducts } from './products'
import { AdminOrders } from './orders'
import { AdminOrderDetail } from './order-detail'
import { AdminInvoices } from './invoices'
import { AdminReports } from './reports'

export function AdminRouter() {
  const { route } = useApp()
  if (route.view !== 'admin') return null

  switch (route.page) {
    case 'overview':
      return <AdminOverview />
    case 'leads':
      return <AdminLeads />
    case 'customers':
      return <AdminCustomers />
    case 'customer-detail':
      return <AdminCustomerDetail id={route.id} />
    case 'products':
      return <AdminProducts />
    case 'orders':
      return <AdminOrders />
    case 'order-detail':
      return <AdminOrderDetail id={route.id} />
    case 'invoices':
      return <AdminInvoices />
    case 'reports':
      return <AdminReports />
    default:
      return <AdminOverview />
  }
}
