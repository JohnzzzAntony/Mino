import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { setSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  const user = await db.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: {
      company: {
        include: { pricingTier: true },
      },
    },
  })

  if (!user || user.password !== password) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }
  if (user.company?.status === 'pending') {
    return NextResponse.json(
      { error: 'Your account is pending approval. We will email you when activated.' },
      { status: 403 }
    )
  }
  if (user.company?.status === 'suspended') {
    return NextResponse.json({ error: 'Account suspended. Contact support.' }, { status: 403 })
  }

  await setSession(user.id)

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      companyName: user.company?.name,
      pricingTierId: user.company?.pricingTierId,
      pricingTierName: user.company?.pricingTier?.name,
      discountPercent: user.company?.pricingTier?.discountPercent,
      approvalThreshold: user.company?.approvalThreshold,
      netTermsDays: user.company?.netTermsDays,
    },
  })
}
