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

    const { data: comment, error: fetchError } = await supabaseAdmin
      .from('comments')
      .select('password_hash')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const bcrypt = await import('bcryptjs')
    const isValid = password === comment.password_hash
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid password.' }, { status: 401 })
    }

    const { error: deleteError } = await supabaseAdmin
      .from('comments')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Comment deleted successfully.' })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
