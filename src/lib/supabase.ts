import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types (will be updated when we create tables)
export type Database = {
  public: {
    Tables: {
      universities: {
        Row: {
          id: string
          name: string
          theme_color: string
          location: string[]
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          theme_color: string
          location: string[]
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          theme_color?: string
          location?: string[]
          created_at?: string
        }
      }
      posts: {
        Row: {
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
        Insert: {
          id?: string
          univ_id: string
          type: 'text' | 'image'
          content?: string | null
          image_url?: string | null
          is_blur?: boolean
          password_hash: string
          expires_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          univ_id?: string
          type?: 'text' | 'image'
          content?: string | null
          image_url?: string | null
          is_blur?: boolean
          password_hash?: string
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          content: string
          password_hash: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          content: string
          password_hash: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          content?: string
          password_hash?: string
          created_at?: string
        }
      }
      reactions: {
        Row: {
          id: string
          post_id: string
          emoji: string
          count: number
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          emoji: string
          count?: number
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          emoji?: string
          count?: number
          created_at?: string
        }
      }
    }
  }
}