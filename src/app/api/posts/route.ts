import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const univId = searchParams.get('univ_id')

  let query = supabaseAdmin
    .from('posts')
    .select('*')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (univId) {
    query = query.eq('univ_id', univId)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ posts: data })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      univ_id,
      spot,
      type,
      content,
      image_url,
      is_blur = false,
      bg_color,
      font_style = 'gothic',
      password_hash,
      expires_at,
    } = body

    if (!univ_id || !type || !password_hash || !expires_at) {
      return NextResponse.json(
        { error: 'univ_id, type, password_hash, expires_at are required.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('posts')
      .insert([
        {
          univ_id,
          spot: spot ?? null,
          type,
          content: content ?? null,
          image_url: image_url ?? null,
          is_blur,
          bg_color: bg_color ?? '#FEF3C7',
          font_style,
          password_hash,
          expires_at,
        },
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ post: data })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
