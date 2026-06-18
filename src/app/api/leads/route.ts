import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const BUSINESS_TYPES = ['Hotel', 'Restaurant', 'Janitorial', 'Other']
const VOLUMES = ['Small', 'Medium', 'Large']

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      companyName,
      contactName,
      email,
      phone,
      businessType,
      monthlyVolume,
      message,
    } = body ?? {}

    if (!companyName || !contactName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: companyName, contactName, email' },
        { status: 400 }
      )
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    if (businessType && !BUSINESS_TYPES.includes(businessType)) {
      return NextResponse.json({ error: 'Invalid business type' }, { status: 400 })
    }

    if (monthlyVolume && !VOLUMES.includes(monthlyVolume)) {
      return NextResponse.json({ error: 'Invalid monthly volume' }, { status: 400 })
    }

    const lead = await db.wholesaleLead.create({
      data: {
        companyName: String(companyName).slice(0, 160),
        contactName: String(contactName).slice(0, 160),
        email: String(email).slice(0, 160),
        phone: phone ? String(phone).slice(0, 60) : null,
        businessType: businessType || null,
        monthlyVolume: monthlyVolume || null,
        message: message ? String(message).slice(0, 8000) : null,
        status: 'new',
      },
    })

    return NextResponse.json({ ok: true, id: lead.id })
  } catch (err) {
    console.error('[POST /api/leads]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
