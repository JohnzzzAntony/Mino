'use client'

import { useApp } from '@/lib/store'
import { PublicHeader } from './public-header'
import { PublicFooter } from './public-footer'
import { PortalSidebar, PortalTopbar } from './portal-sidebar'
import { AdminSidebar } from './admin-sidebar'
import { PublicRouter } from '@/components/public/router'
import { PortalRouter } from '@/components/portal/router'
import { AdminRouter } from '@/components/admin/router'

export function AppShell({ children }: { children?: React.ReactNode }) {
  const { route, user } = useApp()

  // Guard portal & admin routes — require login
  const view =
    route.view === 'portal' && !user ? 'public' : route.view === 'admin' && (!user || user.role !== 'admin') ? 'public' : route.view

  if (view === 'public') {
    return (
      <div className="flex min-h-screen flex-col">
        <PublicHeader />
        <main className="flex-1">
          {children ?? <PublicRouter />}
        </main>
        <PublicFooter />
      </div>
    )
  }

  if (view === 'portal') {
    return (
      <div className="flex min-h-screen bg-background">
        <PortalSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <PortalTopbar />
          <main className="flex-1 p-4 lg:p-6">
            <PortalRouter />
          </main>
        </div>
      </div>
    )
  }

  // admin
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 p-4 lg:p-6">
          <AdminRouter />
        </main>
      </div>
    </div>
  )
}
