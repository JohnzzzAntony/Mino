import { db } from './db'
import type { AuthUser, Role } from './store'
import { cookies } from 'next/headers'

// Mock session via a cookie holding the userId.
// (For demo only — production would use NextAuth/Supabase Auth.)

const SESSION_COOKIE = 'mino-session'

export async function getSession(): Promise<AuthUser | null> {
  const store = await cookies()
  const userId = store.get(SESSION_COOKIE)?.value
  if (!userId) return null
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      company: {
        include: {
          pricingTier: true,
        },
      },
    },
  })
  if (!user) return null
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
    companyId: user.companyId ?? undefined,
    companyName: user.company?.name,
    pricingTierId: user.company?.pricingTierId ?? undefined,
    pricingTierName: user.company?.pricingTier?.name,
    discountPercent: user.company?.pricingTier?.discountPercent,
    approvalThreshold: user.company?.approvalThreshold,
    netTermsDays: user.company?.netTermsDays,
  }
}

export async function setSession(userId: string) {
  const store = await cookies()
  store.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
}

export async function clearSession() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export function requireRole(user: AuthUser | null, roles: Role[]): AuthUser {
  if (!user || !roles.includes(user.role)) {
    throw new Error('Unauthorized')
  }
  return user
}
