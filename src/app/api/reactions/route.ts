import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get('post_id')

  if (!postId) {
    return NextResponse.json({ error: 'post_id is required.' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('reactions')
    .select('*')
    .eq('post_id', postId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ reactions: data })
}

export async function POST(request: NextRequest) {
  try {
    const { post_id, emoji, increment = true } = await request.json()

    if (!post_id || !emoji) {
      return NextResponse.json({ error: 'post_id and emoji are required.' }, { status: 400 })
    }

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('reactions')
      .select('*')
      .eq('post_id', post_id)
      .eq('emoji', emoji)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (existing) {
      const newCount = increment ? existing.count + 1 : Math.max(0, existing.count - 1)

      if (newCount === 0) {
        const { error: deleteError } = await supabaseAdmin
          .from('reactions')
          .delete()
          .eq('post_id', post_id)
          .eq('emoji', emoji)

        if (deleteError) {
          return NextResponse.json({ error: deleteError.message }, { status: 500 })
        }

        return NextResponse.json({ reaction: null })
      }

      const { data, error } = await supabaseAdmin
        .from('reactions')
        .update({ count: newCount })
        .eq('post_id', post_id)
        .eq('emoji', emoji)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ reaction: data })
    }

    if (increment) {
      const { data, error } = await supabaseAdmin
        .from('reactions')
        .insert([{ post_id, emoji, count: 1 }])
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ reaction: data })
    }

    return NextResponse.json({ reaction: null })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
