import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { serializeBlogPost } from '@/lib/serialize'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const limit = parseInt(sp.get('limit') ?? '20')
  const posts = await db.blogPost.findMany({
    where: { publishedAt: { not: null } },
    orderBy: { publishedAt: 'desc' },
    take: limit,
  })
  return NextResponse.json({ posts: posts.map(serializeBlogPost) })
}
