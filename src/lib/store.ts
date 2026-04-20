import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface University {
  id: string
  name: string
  theme_color: string
  location: string[]
}

interface Post {
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

interface Comment {
  id: string
  post_id: string
  content: string
  password_hash: string
  created_at: string
}

interface Reaction {
  id: string
  post_id: string
  emoji: string
  count: number
  created_at: string
}

interface AppState {
  // Current university
  currentUniversity: University | null
  setCurrentUniversity: (university: University | null) => void

  // Universities list
  universities: University[]
  setUniversities: (universities: University[]) => void

  // Posts
  posts: Post[]
  setPosts: (posts: Post[]) => void
  addPost: (post: Post) => void
  updatePost: (post: Post) => void
  removePost: (postId: string) => void

  // Comments
  comments: Record<string, Comment[]> // postId -> comments
  setComments: (postId: string, comments: Comment[]) => void
  addComment: (postId: string, comment: Comment) => void
  removeComment: (postId: string, commentId: string) => void

  // Reactions
  reactions: Record<string, Reaction[]> // postId -> reactions
  setReactions: (postId: string, reactions: Reaction[]) => void
  updateReaction: (postId: string, emoji: string, count: number) => void

  // UI States
  isCreateModalOpen: boolean
  setIsCreateModalOpen: (open: boolean) => void

  isBlurMode: boolean
  setIsBlurMode: (blur: boolean) => void

  // Wall-hop badges (visited universities)
  visitedUniversities: string[]
  addVisitedUniversity: (univId: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Current university
      currentUniversity: null,
      setCurrentUniversity: (university) => set({ currentUniversity: university }),

      // Universities
      universities: [],
      setUniversities: (universities) => set({ universities }),

      // Posts
      posts: [],
      setPosts: (posts) => set({ posts }),
      addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),
      updatePost: (updatedPost) => set((state) => ({
        posts: state.posts.map(post =>
          post.id === updatedPost.id ? updatedPost : post
        )
      })),
      removePost: (postId) => set((state) => ({
        posts: state.posts.filter(post => post.id !== postId)
      })),

      // Comments
      comments: {},
      setComments: (postId, comments) => set((state) => ({
        comments: { ...state.comments, [postId]: comments }
      })),
      addComment: (postId, comment) => set((state) => ({
        comments: {
          ...state.comments,
          [postId]: [...(state.comments[postId] || []), comment]
        }
      })),
      removeComment: (postId, commentId) => set((state) => ({
        comments: {
          ...state.comments,
          [postId]: (state.comments[postId] || []).filter(c => c.id !== commentId)
        }
      })),

      // Reactions
      reactions: {},
      setReactions: (postId, reactions) => set((state) => ({
        reactions: { ...state.reactions, [postId]: reactions }
      })),
      updateReaction: (postId, emoji, count) => set((state) => {
        const currentReactions = state.reactions[postId] || []
        const existingIndex = currentReactions.findIndex(r => r.emoji === emoji)

        let newReactions
        if (existingIndex >= 0) {
          newReactions = [...currentReactions]
          newReactions[existingIndex] = { ...newReactions[existingIndex], count }
        } else {
          newReactions = [...currentReactions, {
            id: `${postId}-${emoji}`,
            post_id: postId,
            emoji,
            count,
            created_at: new Date().toISOString()
          }]
        }

        return {
          reactions: { ...state.reactions, [postId]: newReactions }
        }
      }),

      // UI States
      isCreateModalOpen: false,
      setIsCreateModalOpen: (open) => set({ isCreateModalOpen: open }),

      isBlurMode: false,
      setIsBlurMode: (blur) => set({ isBlurMode: blur }),

      // Wall-hop badges
      visitedUniversities: [],
      addVisitedUniversity: (univId) => set((state) => ({
        visitedUniversities: state.visitedUniversities.includes(univId)
          ? state.visitedUniversities
          : [...state.visitedUniversities, univId]
      })),
    }),
    {
      name: 'univ-jump-over-storage',
      partialize: (state) => ({
        visitedUniversities: state.visitedUniversities,
        isBlurMode: state.isBlurMode,
      }),
    }
  )
)