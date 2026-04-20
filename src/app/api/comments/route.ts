import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get('post_id')

  if (!postId) {
    return NextResponse.json({ error: 'post_id is required.' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ comments: data })
}

export async function POST(request: NextRequest) {
  try {
    const { post_id, content, password_hash } = await request.json()

    if (!post_id || !content || !password_hash) {
      return NextResponse.json(
        { error: 'post_id, content, password_hash are required.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('comments')
      .insert([
        {
          post_id,
          content,
          password_hash,
        },
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ comment: data })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
