import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(
  _request: Request,
  ctx: {
    params: Promise<{
      slug: string
    }>
  }
) {
  const { slug } = await ctx.params
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('increment_blog_article_view', {
    article_slug: slug,
  })

  if (error) {
    return NextResponse.json(
      { error: 'Нийтлэлийн үзэлтийг бүртгэж чадсангүй.' },
      { status: 500 }
    )
  }

  if (typeof data !== 'number') {
    return NextResponse.json(
      { error: 'Нийтлэл олдсонгүй.' },
      { status: 404 }
    )
  }

  return NextResponse.json({ viewCount: data })
}
