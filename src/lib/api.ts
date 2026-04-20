import useSWR from 'swr'
import { supabase } from '@/lib/supabase'

export interface University {
  id: string
  name: string
  theme_color: string
  location: string[]
  created_at: string
}

export interface Post {
  id: string
  univ_id: string
  type: 'text' | 'image'
  content: string | null
  image_url: string | null
  is_blur: boolean
  password_hash: string
  expires_at: string
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  post_id: string
  content: string
  password_hash: string
  created_at: string
}

export interface Reaction {
  id: string
  post_id: string
  emoji: string
  count: number
  created_at: string
}

// Universities
export function useUniversities() {
  return useSWR<University[]>('universities', async () => {
    const { data, error } = await supabase
      .from('universities')
      .select('*')
      .order('name')

    if (error) throw error
    return data || []
  })
}

// Posts
export function usePosts(univId?: string) {
  const key = univId ? `posts-${univId}` : 'posts'
  return useSWR<Post[]>(key, async () => {
    let query = supabase
      .from('posts')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (univId) {
      query = query.eq('univ_id', univId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  })
}

// Comments for a specific post
export function useComments(postId: string) {
  return useSWR<Comment[]>(`comments-${postId}`, async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  })
}

// Reactions for a specific post
export function useReactions(postId: string) {
  return useSWR<Reaction[]>(`reactions-${postId}`, async () => {
    const { data, error } = await supabase
      .from('reactions')
      .select('*')
      .eq('post_id', postId)

    if (error) throw error
    return data || []
  })
}

// Create post
export async function createPost(post: Omit<Post, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('posts')
    .insert(post)
    .select()
    .single()

  if (error) throw error
  return data
}

// Create comment
export async function createComment(comment: Omit<Comment, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('comments')
    .insert(comment)
    .select()
    .single()

  if (error) throw error
  return data
}

// Update or create reaction
export async function upsertReaction(postId: string, emoji: string, increment: boolean = true) {
  // First, check if reaction exists
  const { data: existing, error: fetchError } = await supabase
    .from('reactions')
    .select('*')
    .eq('post_id', postId)
    .eq('emoji', emoji)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw fetchError
  }

  if (existing) {
    // Update existing reaction
    const newCount = increment ? existing.count + 1 : Math.max(0, existing.count - 1)
    if (newCount === 0) {
      // Delete if count becomes 0
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('post_id', postId)
        .eq('emoji', emoji)
      if (error) throw error
      return null
    } else {
      const { data, error } = await supabase
        .from('reactions')
        .update({ count: newCount })
        .eq('post_id', postId)
        .eq('emoji', emoji)
        .select()
        .single()
      if (error) throw error
      return data
    }
  } else if (increment) {
    // Create new reaction
    const { data, error } = await supabase
      .from('reactions')
      .insert({
        post_id: postId,
        emoji,
        count: 1
      })
      .select()
      .single()
    if (error) throw error
    return data
  }

  return null
}

// Delete post (with password verification)
export async function deletePost(postId: string, password: string) {
  // First verify password by getting the post
  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('password_hash')
    .eq('id', postId)
    .single()

  if (fetchError) throw fetchError

  // Verify password (this should be done on server side, but for now client-side)
  const bcrypt = await import('bcryptjs')
  const isValidPassword = await bcrypt.compare(password, post.password_hash)

  if (!isValidPassword) {
    throw new Error('비밀번호가 일치하지 않습니다.')
  }

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)

  if (error) throw error
}

// Delete comment (with password verification)
export async function deleteComment(commentId: string, password: string) {
  // First verify password
  const { data: comment, error: fetchError } = await supabase
    .from('comments')
    .select('password_hash')
    .eq('id', commentId)
    .single()

  if (fetchError) throw fetchError

  const bcrypt = await import('bcryptjs')
  const isValidPassword = await bcrypt.compare(password, comment.password_hash)

  if (!isValidPassword) {
    throw new Error('비밀번호가 일치하지 않습니다.')
  }

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (error) throw error
}