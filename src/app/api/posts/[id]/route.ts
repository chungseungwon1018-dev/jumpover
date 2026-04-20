import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function DELETE(
  request: NextRequest,
  context: any
) {
  const params = await context.params
  try {
    const { password } = await request.json()
    if (!password) {
      return NextResponse.json({ error: 'Password is required.' }, { status: 400 })
    }

    const { data: post, error: fetchError } = await supabaseAdmin
      .from('posts')
      .select('password_hash')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const bcrypt = await import('bcryptjs')
    const isValid = password === post.password_hash
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid password.' }, { status: 401 })
    }

    const { error: deleteError } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Post deleted successfully.' })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
