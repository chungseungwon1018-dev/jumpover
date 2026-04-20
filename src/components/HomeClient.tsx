'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Konva from 'konva'
import { motion } from 'framer-motion'
import useSWR from 'swr'
import { Stage, Layer, Line } from 'react-konva'
import Masonry from 'react-masonry-css'
import { supabase } from '@/lib/supabase'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const BACKGROUND_COLORS = [
  { value: '#FFFFFF', label: '흰색' },
  { value: '#FEF3C7', label: '크림' },
  { value: '#D1FAE5', label: '민트' },
  { value: '#E0E7FF', label: '라벤더' },
  { value: '#FEE2E2', label: '코랄' },
  { value: '#F5F3FF', label: '라일락' },
]

const FONT_STYLES = [
  { value: 'handwriting', label: '손글씨' },
  { value: 'gothic', label: '고딕' },
]

const EXPIRY_OPTIONS = [
  { value: 1, label: '1시간' },
  { value: 3, label: '3시간' },
  { value: 6, label: '6시간' },
  { value: 12, label: '12시간' },
  { value: 24, label: '24시간' },
]

const EMOJIS = ['👍', '❤️', '😂', '😢'] as const

// 색상 유틸리티 함수들
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '59, 130, 246'
}

const adjustColor = (hex: string, amount: number) => {
  const usePound = hex[0] === '#'
  const col = usePound ? hex.slice(1) : hex

  const num = parseInt(col, 16)
  let r = (num >> 16) + amount
  let g = (num >> 8 & 0x00FF) + amount
  let b = (num & 0x0000FF) + amount

  r = r > 255 ? 255 : r < 0 ? 0 : r
  g = g > 255 ? 255 : g < 0 ? 0 : g
  b = b > 255 ? 255 : b < 0 ? 0 : b

  return (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16)
}

const dataURLToBlob = (dataURL: string): Blob => {
  const [header, base64] = dataURL.split(',')
  const mimeMatch = header.match(/:(.*?);/)
  const mime = mimeMatch ? mimeMatch[1] : 'image/png'
  const binary = atob(base64)
  const array = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i += 1) {
    array[i] = binary.charCodeAt(i)
  }

  return new Blob([array], { type: mime })
}

const uploadCanvasDrawing = async (dataURL: string) => {
  const blob = dataURLToBlob(dataURL)
  const fileName = `drawings/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.png`

  const { error } = await supabase.storage.from('post-drawings').upload(fileName, blob, {
    cacheControl: '3600',
    upsert: true,
  })

  if (error) {
    throw new Error(error.message)
  }

  const publicUrlResponse = supabase.storage
    .from('post-drawings')
    .getPublicUrl(fileName)

  if (!publicUrlResponse.data?.publicUrl) {
    throw new Error('공개 URL을 생성하지 못했습니다.')
  }

  return publicUrlResponse.data.publicUrl
}

export default function HomeClient() {
  const [selectedUniv, setSelectedUniv] = useState<string>('')
  const [content, setContent] = useState('')
  const [password, setPassword] = useState('')
  const [type, setType] = useState<'text' | 'image'>('text')
  const [bgColor, setBgColor] = useState(BACKGROUND_COLORS[0].value)
  const [expiryHour, setExpiryHour] = useState<number>(3)
  const [fontStyle, setFontStyle] = useState<string>(FONT_STYLES[0].value)
  const [spot, setSpot] = useState<string>('')
  const [selectedSpot, setSelectedSpot] = useState<string>('')
  const [isBlur, setIsBlur] = useState<boolean>(false)
  const [brushRadius, setBrushRadius] = useState<number>(4)
  const [brushColor, setBrushColor] = useState<string>('#000000')
  const [canvasWidth, setCanvasWidth] = useState<number>(720)
  const [submitting, setSubmitting] = useState(false)
  const [infoMessage, setInfoMessage] = useState('')
  const [posts, setPosts] = useState<any[]>([])
  const canvasRef = useRef<any>(null)
  const [lines, setLines] = useState<any[]>([])
  const [isDrawing, setIsDrawing] = useState(false)

  const handleMouseDown = (e: any) => {
    setIsDrawing(true)
    const pos = e.target.getStage().getPointerPosition()
    setLines([...lines, { tool: 'pen', points: [pos.x, pos.y], color: brushColor, width: brushRadius }])
  }

  const handleMouseMove = (e: any) => {
    if (!isDrawing) return
    const stage = e.target.getStage()
    const point = stage.getPointerPosition()
    let lastLine = lines[lines.length - 1]
    lastLine.points = lastLine.points.concat([point.x, point.y])
    lines.splice(lines.length - 1, 1, lastLine)
    setLines(lines.concat())
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
  }

  const getDataURL = () => {
    if (!canvasRef.current) return null
    return canvasRef.current.toDataURL()
  }

  const clearCanvas = () => {
    setLines([])
  }

  const undoLine = () => {
    if (lines.length === 0) return;
    setLines(lines.slice(0, -1));
  }
  const [commentsByPost, setCommentsByPost] = useState<Record<string, any[]>>({})
  const [reactionsByPost, setReactionsByPost] = useState<Record<string, any[]>>({})
  const [commentInput, setCommentInput] = useState<Record<string, string>>({})
  const [commentPassword, setCommentPassword] = useState<Record<string, string>>({})
  const [commentInfo, setCommentInfo] = useState<Record<string, string>>({})
  const [blurStates, setBlurStates] = useState<Record<string, boolean>>({})
  const [visitedUniversities, setVisitedUniversities] = useState<Set<string>>(new Set())
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'post' | 'comment'; postId?: string } | null>(null)
  const [deletePassword, setDeletePassword] = useState('')

  const filteredPosts = useMemo(() => {
    let filtered = posts
    
    // 만료된 게시글 제외 (선택적)
    filtered = filtered.filter((post: any) => {
      const expiresAt = new Date(post.expires_at)
      const now = new Date()
      const timeLeft = expiresAt.getTime() - now.getTime()
      return timeLeft > 0 // 만료되지 않은 게시글만 표시
    })
    
    // 스팟 필터 적용
    if (selectedSpot) {
      filtered = filtered.filter((post: any) => post.spot === selectedSpot)
    }
    
    return filtered
  }, [posts, selectedSpot])

  const { data: univData, error: univError } = useSWR('/api/universities', fetcher)
  const { data: postsData, error: postsError, mutate } = useSWR(
    selectedUniv ? `/api/posts?univ_id=${selectedUniv}` : '/api/posts',
    fetcher
  )

  const universities = useMemo(() => univData?.universities || [], [univData])

  // 선택된 대학의 테마 색상 가져오기
  const currentThemeColor = useMemo(() => {
    const selectedUniversity = universities.find((univ: any) => univ.id === selectedUniv)
    return selectedUniversity?.theme_color || '#3B82F6'
  }, [universities, selectedUniv])

  useEffect(() => {
    if (!selectedUniv && universities.length > 0) {
      setSelectedUniv(universities[0].id)
    }
  }, [universities, selectedUniv])

  useEffect(() => {
    const handleResize = () => {
      setCanvasWidth(Math.min(720, window.innerWidth - 64))
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 대학 선택 시 방문 기록 저장
  useEffect(() => {
    if (selectedUniv && !visitedUniversities.has(selectedUniv)) {
      const newVisited = new Set(visitedUniversities)
      newVisited.add(selectedUniv)
      setVisitedUniversities(newVisited)
      localStorage.setItem('visited-universities', JSON.stringify(Array.from(newVisited)))
    }
  }, [selectedUniv, visitedUniversities])

  useEffect(() => {
    // 로컬 스토리지에서 블러 상태 로드
    const savedBlurStates = localStorage.getItem('post-blur-states')
    if (savedBlurStates) {
      try {
        setBlurStates(JSON.parse(savedBlurStates))
      } catch (error) {
        console.error('Failed to parse blur states from localStorage:', error)
      }
    }

    // 로컬 스토리지에서 방문 기록 로드
    const savedVisited = localStorage.getItem('visited-universities')
    if (savedVisited) {
      try {
        const visitedArray = JSON.parse(savedVisited)
        setVisitedUniversities(new Set(visitedArray))
      } catch (error) {
        console.error('Failed to parse visited universities from localStorage:', error)
      }
    }
  }, [])

  useEffect(() => {
    if (postsData?.posts) {
      setPosts(postsData.posts)
    }
  }, [postsData])

  useEffect(() => {
    const loadCommentsAndReactions = async () => {
      if (!posts.length) {
        setCommentsByPost({})
        setReactionsByPost({})
        return
      }

      const nextComments: Record<string, any[]> = {}
      const nextReactions: Record<string, any[]> = {}

      await Promise.all(
        posts.map(async (post) => {
          const [commentsRes, reactionsRes] = await Promise.all([
            fetch(`/api/comments?post_id=${post.id}`).then((res) => res.json()),
            fetch(`/api/reactions?post_id=${post.id}`).then((res) => res.json()),
          ])

          nextComments[post.id] = commentsRes.comments || []
          nextReactions[post.id] = reactionsRes.reactions || []
        })
      )

      setCommentsByPost(nextComments)
      setReactionsByPost(nextReactions)
    }

    loadCommentsAndReactions()
  }, [posts])

  useEffect(() => {
    if (!selectedUniv) return

    const channel = supabase
      .channel(`public:posts:${selectedUniv}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts', filter: `univ_id=eq.${selectedUniv}` },
        (payload) => {
          if (payload.new) {
            setPosts((prev) => [payload.new, ...prev])
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts', filter: `univ_id=eq.${selectedUniv}` },
        (payload) => {
          if (payload.new) {
            setPosts((prev) => prev.map((item) => (item.id === payload.new.id ? payload.new : item)))
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'posts', filter: `univ_id=eq.${selectedUniv}` },
        (payload) => {
          if (payload.old) {
            setPosts((prev) => prev.filter((item) => item.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedUniv])

  useEffect(() => {
    if (!selectedUniv) return

    const handleCommentPayload = (payload: any) => {
      const postId = payload.new?.post_id || payload.old?.post_id
      if (!postId) return

      setCommentsByPost((prev) => {
        const currentComments = prev[postId] || []

        if (payload.eventType === 'INSERT' && payload.new) {
          return {
            ...prev,
            [postId]: [...currentComments, payload.new],
          }
        }

        if (payload.eventType === 'UPDATE' && payload.new) {
          return {
            ...prev,
            [postId]: currentComments.map((item) => (item.id === payload.new.id ? payload.new : item)),
          }
        }

        if (payload.eventType === 'DELETE' && payload.old) {
          return {
            ...prev,
            [postId]: currentComments.filter((item) => item.id !== payload.old.id),
          }
        }

        return prev
      })
    }

    const handleReactionPayload = (payload: any) => {
      const postId = payload.new?.post_id || payload.old?.post_id
      if (!postId) return

      setReactionsByPost((prev) => {
        const currentReactions = prev[postId] || []

        if (payload.eventType === 'INSERT' && payload.new) {
          return {
            ...prev,
            [postId]: [...currentReactions.filter((item) => item.emoji !== payload.new.emoji), payload.new],
          }
        }

        if (payload.eventType === 'UPDATE' && payload.new) {
          return {
            ...prev,
            [postId]: currentReactions.map((item) => (item.emoji === payload.new.emoji ? payload.new : item)),
          }
        }

        if (payload.eventType === 'DELETE' && payload.old) {
          return {
            ...prev,
            [postId]: currentReactions.filter((item) => item.emoji !== payload.old.emoji),
          }
        }

        return prev
      })
    }

    const commentChannel = supabase
      .channel(`public:comments:${selectedUniv}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments' },
        handleCommentPayload
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'comments' },
        handleCommentPayload
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'comments' },
        handleCommentPayload
      )
      .subscribe()

    const reactionChannel = supabase
      .channel(`public:reactions:${selectedUniv}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reactions' },
        handleReactionPayload
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reactions' },
        handleReactionPayload
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'reactions' },
        handleReactionPayload
      )
      .subscribe()

    return () => {
      supabase.removeChannel(commentChannel)
      supabase.removeChannel(reactionChannel)
    }
  }, [selectedUniv])

  const handleSubmit = async () => {
    if (!selectedUniv) {
      setInfoMessage('대학을 선택해주세요.')
      return
    }

    if (type === 'text' && !content.trim()) {
      setInfoMessage('게시글 내용을 입력해주세요.')
      return
    }

    if (type === 'image' && !canvasRef.current) {
      setInfoMessage('그림을 그려주세요.')
      return
    }

    if (!password.trim()) {
      setInfoMessage('삭제용 비밀번호를 입력해주세요.')
      return
    }

    setSubmitting(true)
    setInfoMessage('')

    const expires_at = new Date(Date.now() + expiryHour * 60 * 60 * 1000).toISOString()
    let image_url: string | null = null

    try {
      if (type === 'image') {
        // 그림을 이미지로 저장할 때만 배경색 적용
        const stage = canvasRef.current;
        const originalBg = stage.toDataURL();
        // 임시 배경색 레이어 추가
        const layer = stage.children[0];
        const bgRect = new Konva.Rect({
          x: 0, y: 0, width: canvasWidth, height: 320, fill: bgColor, listening: false
        });
        layer.add(bgRect);
        bgRect.moveToBottom();
        const dataUrl = stage.toDataURL();
        bgRect.destroy();
        // 원래대로 복구
        layer.batchDraw();
        if (!dataUrl) {
          throw new Error('그림을 이미지로 변환하지 못했습니다.')
        }
        image_url = await uploadCanvasDrawing(dataUrl)
      }

      const payload = {
        univ_id: selectedUniv,
        spot: spot || null,
        type,
        content: type === 'image' ? content.trim() || '그림 게시글' : content.trim(),
        image_url,
        is_blur: isBlur,
        bg_color: bgColor,
        font_style: fontStyle,
        password_hash: password,
        expires_at,
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '게시글 작성에 실패했습니다.')
      }

      if (type === 'image') {
        clearCanvas()
      }
      setContent('')
      setPassword('')
      setSpot('')
      setInfoMessage('게시글이 등록되었습니다.')
      // mutate() 제거: 실시간 구독(INSERT)이 새 게시글을 추가하므로 중복 방지
    } catch (error: any) {
      setInfoMessage(error.message || '오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCommentSubmit = async (postId: string) => {
    const commentText = commentInput[postId]?.trim() || ''
    const commentPw = commentPassword[postId]?.trim() || ''

    if (!commentText) {
      setCommentInfo((prev) => ({ ...prev, [postId]: '댓글 내용을 입력해주세요.' }))
      return
    }
    if (!commentPw) {
      setCommentInfo((prev) => ({ ...prev, [postId]: '댓글 삭제 비밀번호를 입력해주세요.' }))
      return
    }

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, content: commentText, password_hash: commentPw }),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '댓글 작성에 실패했습니다.')
      }

      // setCommentsByPost((prev) => ({
      //   ...prev,
      //   [postId]: [...(prev[postId] || []), result.comment],
      // }))
      // mutate() 제거: 실시간 구독(INSERT)이 댓글을 추가하므로 중복 방지
      setCommentInput((prev) => ({ ...prev, [postId]: '' }))
      setCommentPassword((prev) => ({ ...prev, [postId]: '' }))
      setCommentInfo((prev) => ({ ...prev, [postId]: '댓글이 등록되었습니다.' }))
    } catch (error: any) {
      setCommentInfo((prev) => ({ ...prev, [postId]: error.message || '오류가 발생했습니다.' }))
    }
  }

  const handleReaction = async (postId: string, emoji: string) => {
    try {
      const response = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, emoji, increment: true }),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '리액션 처리에 실패했습니다.')
      }

      setReactionsByPost((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []).filter((item) => item.emoji !== emoji), result.reaction].filter(Boolean),
      }))
    } catch (error: any) {
      setCommentInfo((prev) => ({ ...prev, [postId]: error.message || '오류가 발생했습니다.' }))
    }
  }

  const handleBlurToggle = (postId: string) => {
    setBlurStates((prev) => {
      const newStates = { ...prev, [postId]: !prev[postId] }
      // 로컬 스토리지에 저장
      localStorage.setItem('post-blur-states', JSON.stringify(newStates))
      return newStates
    })
  }

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-500"
      style={{ '--theme-color': currentThemeColor } as React.CSSProperties}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
          :root {
            --theme-color: ${currentThemeColor};
          }

          .theme-accent {
            color: var(--theme-color);
          }

          .theme-bg {
            background-color: var(--theme-color);
          }

          .theme-border {
            border-color: var(--theme-color);
          }

          .theme-shadow {
            box-shadow: 0 0 20px rgba(${hexToRgb(currentThemeColor)}, 0.3);
          }

          .ivy-stem {
            background: linear-gradient(to bottom, var(--theme-color), ${adjustColor(currentThemeColor, -20)});
          }

          .university-selector:hover {
            background-color: ${adjustColor(currentThemeColor, 10)};
          }

          .ivy-comments {
            position: relative;
            min-height: 100px;
            padding: 20px 0;
          }

          .ivy-stem {
            position: absolute;
            left: 50%;
            top: 0;
            bottom: 0;
            width: 3px;
            background: linear-gradient(to bottom, var(--theme-color), ${adjustColor(currentThemeColor, -20)});
            transform: translateX(-50%);
            border-radius: 2px;
            box-shadow: 0 0 4px rgba(${hexToRgb(currentThemeColor)}, 0.3);
          }

          .ivy-leaf {
            position: relative;
            margin: 15px 0;
            animation: leafGrow 0.6s ease-out forwards;
            opacity: 0;
            transform: scale(0.8);
          }

          .ivy-leaf-left {
            text-align: right;
            margin-right: 30px;
          }

          .ivy-leaf-right {
            text-align: left;
            margin-left: 30px;
          }

          .ivy-leaf-content {
            display: inline-block;
            max-width: 280px;
            background: linear-gradient(135deg, #f0fdf4, #dcfce7);
            border: 2px solid #bbf7d0;
            border-radius: 20px 20px 20px 5px;
            padding: 12px 16px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            position: relative;
            transition: all 0.3s ease;
          }

          .ivy-leaf-left .ivy-leaf-content {
            border-radius: 20px 20px 5px 20px;
          }

          .ivy-leaf-content:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
          }

          .ivy-leaf-content::before {
            content: '';
            position: absolute;
            width: 0;
            height: 0;
            border-style: solid;
          }

          .ivy-leaf-left .ivy-leaf-content::before {
            right: -8px;
            top: 15px;
            border-width: 8px 0 8px 8px;
            border-color: transparent transparent transparent #bbf7d0;
          }

          .ivy-leaf-right .ivy-leaf-content::before {
            left: -8px;
            top: 15px;
            border-width: 8px 8px 8px 0;
            border-color: transparent #bbf7d0 transparent transparent;
          }

          @keyframes leafGrow {
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          @media (max-width: 640px) {
            .ivy-leaf-left,
            .ivy-leaf-right {
              margin-left: 20px;
              margin-right: 20px;
              text-align: left;
            }

            .ivy-leaf-content {
              max-width: 100%;
              border-radius: 15px;
            }

            .ivy-leaf-content::before {
              display: none;
            }

            .ivy-stem {
              left: 20px;
            }
          }

          .post-content-blur {
            filter: blur(8px);
            user-select: none;
            transition: filter 0.3s ease;
          }

          .post-content-blur:hover {
            filter: blur(4px);
          }

          .post-expiring {
            animation: expiringPulse 2s ease-in-out infinite;
            border-color: #f97316;
            box-shadow: 0 0 20px rgba(249, 115, 22, 0.3);
          }

          .post-expired {
            opacity: 0.6;
            transform: scale(0.98);
            animation: expiredFade 3s ease-out forwards;
            pointer-events: none;
          }

          @keyframes expiringPulse {
            0%, 100% {
              transform: scale(1);
              box-shadow: 0 0 20px rgba(249, 115, 22, 0.3);
            }
            50% {
              transform: scale(1.02);
              box-shadow: 0 0 30px rgba(249, 115, 22, 0.5);
            }
          }

          .visit-badge {
            animation: badgePop 0.5s ease-out;
            transition: transform 0.2s ease;
          }

          .visit-badge:hover {
            transform: scale(1.1);
          }

          @keyframes badgePop {
            0% {
              transform: scale(0);
              opacity: 0;
            }
            50% {
              transform: scale(1.2);
              opacity: 0.8;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
      `}} />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold theme-accent">월담</p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">캠퍼스 담벼락</h1>
              <p className="mt-3 max-w-2xl text-base text-slate-600">
                실시간 익명 캔버스 커뮤니티를 위한 첫 번째 데모입니다.
              </p>
            </div>
            <div className="flex flex-col gap-3 items-end">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 ring-1 ring-slate-200">
                {selectedUniv && universities.find((u: any) => u.id === selectedUniv) 
                  ? '선택된 대학: ' + universities.find((u: any) => u.id === selectedUniv).name 
                  : '대학을 선택하세요'}
              </div>
              {visitedUniversities.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">방문한 대학:</span>
                  <div className="flex gap-1">
                    {Array.from(visitedUniversities).map((univId) => {
                      const univ = universities.find((u: any) => u.id === univId)
                      return univ ? (
                        <div
                          key={univId}
                          className="visit-badge w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: univ.theme_color, color: 'white' }}
                          title={univ.name + ' 방문'}
                        >
                          {univ.name.charAt(0)}
                        </div>
                      ) : null
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="mb-10 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">대학 선택</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {universities.map((univ: any) => (
              <button
                key={univ.id}
                className={
                  univ.id === selectedUniv
                    ? 'university-selector theme-bg text-white shadow-lg scale-105 rounded-2xl px-4 py-2 text-sm font-medium transition-all duration-300'
                    : 'university-selector bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-2xl px-4 py-2 text-sm font-medium transition-all duration-300'
                }
                onClick={() => setSelectedUniv(univ.id)}
              >
                {univ.name}
              </button>
            ))}
          </div>
          {univError && <p className="mt-4 text-sm text-red-600">대학 정보를 불러오는 중 오류가 발생했습니다.</p>}
        </section>

        <section className="mb-10 rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
          {/* 섹션 헤더 */}
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-xl font-semibold text-slate-900">새 게시글 작성</h2>
            <p className="mt-1 text-sm text-slate-500">익명으로 담벼락에 메시지를 남겨보세요.</p>
          </div>

          {/* 옵션 설정 바 */}
          <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              {/* 유형 토글 */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">유형</span>
                <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  <button
                    type="button"
                    onClick={() => setType('text')}
                    className={
                      'px-4 py-1.5 text-sm font-medium transition-colors ' +
                      (type === 'text' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100')
                    }
                  >
                    ✏️ 텍스트
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('image')}
                    className={
                      'px-4 py-1.5 text-sm font-medium transition-colors ' +
                      (type === 'image' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100')
                    }
                  >
                    🎨 그림
                  </button>
                </div>
              </div>

              {/* 구분선 */}
              <div className="hidden sm:block h-6 w-px bg-slate-200" />

              {/* 스팟 */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">스팟</span>
                <select
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:outline-none"
                  value={spot}
                  onChange={(event) => setSpot(event.target.value)}
                  disabled={!selectedUniv}
                >
                  <option value="">전체</option>
                  {selectedUniv && universities
                    .find((u: any) => u.id === selectedUniv)
                    ?.location?.map((location: string) => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                </select>
              </div>

              {/* 구분선 */}
              <div className="hidden sm:block h-6 w-px bg-slate-200" />

              {/* 만료 시간 */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">만료</span>
                <select
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:outline-none"
                  value={expiryHour}
                  onChange={(event) => setExpiryHour(Number(event.target.value))}
                >
                  {EXPIRY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* 구분선 */}
              <div className="hidden sm:block h-6 w-px bg-slate-200" />

              {/* 배경 색상 */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">배경</span>
                <div className="flex gap-1.5">
                  {BACKGROUND_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setBgColor(color.value)}
                      title={color.label}
                      className={
                        'h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ' +
                        (bgColor === color.value ? 'border-slate-900 scale-110' : 'border-slate-200')
                      }
                      style={{ backgroundColor: color.value }}
                    />
                  ))}
                </div>
              </div>

              {/* 구분선 */}
              {type === 'text' && <div className="hidden sm:block h-6 w-px bg-slate-200" />}

              {/* 폰트 스타일 (텍스트 전용) */}
              {type === 'text' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">폰트</span>
                  <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    {FONT_STYLES.map((fs) => (
                      <button
                        key={fs.value}
                        type="button"
                        onClick={() => setFontStyle(fs.value)}
                        className={
                          'px-3 py-1.5 text-sm font-medium transition-colors ' +
                          (fontStyle === fs.value ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100')
                        }
                      >
                        {fs.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 본문 작성 영역 */}
          <div className="p-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
              {/* 콘텐츠 입력 */}
              <div>
                {type === 'text' ? (
                  <textarea
                    className={
                      'min-h-[200px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition resize-none ' +
                      (fontStyle === 'handwriting' ? 'font-handwriting' : 'font-gothic')
                    }
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="익명으로 담벼락에 남길 내용을 적어보세요."
                    style={{ backgroundColor: bgColor }}
                  />
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden shadow-sm">
                    {/* 캔버스 도구 모음 */}
                    <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">브러시</span>
                        <input
                          type="range"
                          min={1}
                          max={20}
                          value={brushRadius}
                          onChange={(event) => setBrushRadius(Number(event.target.value))}
                          className="h-1.5 w-28 cursor-pointer appearance-none rounded-full bg-slate-200"
                        />
                        <span className="w-8 text-xs text-slate-500">{brushRadius}px</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">색상</span>
                        <input
                          type="color"
                          value={brushColor}
                          onChange={(event) => setBrushColor(event.target.value)}
                          className="h-7 w-10 cursor-pointer rounded-lg border border-slate-200"
                        />
                      </div>
                      <div className="ml-auto flex gap-2">
                        <button
                          type="button"
                          onClick={undoLine}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-50"
                        >
                          ↩ 실행취소
                        </button>
                        <button
                          type="button"
                          onClick={clearCanvas}
                          className="rounded-lg border border-red-200 bg-white px-3 py-1 text-xs text-red-500 transition hover:bg-red-50"
                        >
                          🗑 전체지우기
                        </button>
                      </div>
                    </div>
                    <Stage
                      width={canvasWidth}
                      height={320}
                      ref={canvasRef}
                      style={{ background: bgColor, display: 'block' }}
                      onMouseDown={handleMouseDown}
                      onMousemove={handleMouseMove}
                      onMouseup={handleMouseUp}
                    >
                      <Layer>
                        {lines.map((line, i) => (
                          <Line
                            key={i}
                            points={line.points}
                            stroke={line.color}
                            strokeWidth={line.width}
                            tension={0.5}
                            lineCap="round"
                            globalCompositeOperation={line.tool === 'eraser' ? 'destination-out' : 'source-over'}
                          />
                        ))}
                      </Layer>
                    </Stage>
                    <p className="px-4 py-2 text-xs text-slate-400 bg-white border-t border-slate-100">
                      그림을 그린 뒤 게시글을 등록하면 이미지가 저장됩니다.
                    </p>
                  </div>
                )}
              </div>

              {/* 사이드바: 설정 및 제출 */}
              <div className="flex flex-col gap-4">
                {/* 텍스트 미리보기 */}
                {type === 'text' && (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-4">
                    <p className="mb-2 text-xs font-medium text-slate-400 uppercase tracking-wide">미리보기</p>
                    <div
                      className={
                        'min-h-[80px] rounded-xl p-4 text-sm text-slate-800 ' +
                        (fontStyle === 'handwriting' ? 'font-handwriting' : 'font-gothic')
                      }
                      style={{ backgroundColor: bgColor }}
                    >
                      {content || <span className="text-slate-400">작성 내용이 표시됩니다.</span>}
                    </div>
                  </div>
                )}

                {/* 삭제 비밀번호 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">삭제 비밀번호</label>
                  <input
                    type="password"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="4자리 이상 입력"
                  />
                </div>

                {/* 블러 처리 */}
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-slate-100">
                  <input
                    type="checkbox"
                    id="blur-toggle"
                    className="h-4 w-4 rounded border-slate-300 cursor-pointer"
                    checked={isBlur}
                    onChange={(event) => setIsBlur(event.target.checked)}
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-700">스포일러 방지</p>
                    <p className="text-xs text-slate-500">클릭 전까지 블러 처리됩니다.</p>
                  </div>
                </label>

                {/* 제출 버튼 */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="mt-auto inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {submitting ? '등록 중...' : '게시글 등록 →'}
                </button>
                {infoMessage && (
                  <p className={
                    'text-sm text-center ' +
                    (infoMessage.includes('등록') ? 'text-emerald-600' : 'text-red-500')
                  }>
                    {infoMessage}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-slate-900">게시글</h2>
            {selectedUniv && (
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-700">스팟 필터:</label>
                <select
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm"
                  value={selectedSpot}
                  onChange={(event) => setSelectedSpot(event.target.value)}
                >
                  <option value="">전체</option>
                  {universities
                    .find((u: any) => u.id === selectedUniv)
                    ?.location?.map((location: string) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                </select>
              </div>
            )}
            <p className="text-sm text-slate-500">총 {filteredPosts.length}개</p>
          </div>

          {postsError && <p className="mt-4 text-sm text-red-600">게시글을 불러오는 중 오류가 발생했습니다.</p>}
          {!posts.length && !postsError && (
            <p className="mt-6 text-sm text-slate-500">현재 게시글이 없습니다. 첫 게시글을 작성해보세요.</p>
          )}

          <div className="mt-6 space-y-6">
            {filteredPosts.map((post: any) => {
              const comments = commentsByPost[post.id] || []
              const reactions = reactionsByPost[post.id] || []
              const postFontClass = post.font_style === 'handwriting' ? 'font-handwriting' : 'font-gothic'

              // 만료 시간 계산
              const expiresAt = new Date(post.expires_at)
              const now = new Date()
              const timeLeft = expiresAt.getTime() - now.getTime()
              const hoursLeft = timeLeft / (1000 * 60 * 60)
              const isExpiringSoon = hoursLeft <= 1 && hoursLeft > 0
              const isExpired = timeLeft <= 0

              return (
                <motion.article
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className={
                    'rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm transition-all duration-1000 ' +
                    (isExpired ? 'post-expired' : isExpiringSoon ? 'post-expiring' : '')
                  }
                >
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500">
                    <span>{new Date(post.created_at).toLocaleString()}</span>
                    <div className="flex items-center gap-3">
                      {post.spot && (
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-600">
                          📍 {post.spot}
                        </span>
                      )}
                      <span className={
                        'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ' +
                        (isExpired ? 'bg-red-100 text-red-600' :
                        isExpiringSoon ? 'bg-orange-100 text-orange-600 animate-pulse' :
                        'bg-white text-slate-600')
                      }>
                        {post.type}
                      </span>
                      <span className={
                        'text-xs ' +
                        (isExpired ? 'text-red-500' :
                        isExpiringSoon ? 'text-orange-500 animate-pulse' :
                        'text-slate-500')
                      }>
                        {isExpired ? '만료됨' :
                         hoursLeft < 1 ? Math.ceil(timeLeft / (1000 * 60)) + '분 남음' :
                         Math.ceil(hoursLeft) + '시간 남음'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteTarget({ id: post.id, type: 'post' })
                          setDeletePassword('')
                          setDeleteModalOpen(true)
                        }}
                        className="text-xs text-red-500 hover:text-red-700"
                        title="게시글 삭제"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  {post.type === 'text' ? (
                    <div
                      className={
                        'rounded-3xl p-5 cursor-pointer transition-all duration-300 ' +
                        (post.is_blur && !blurStates[post.id] ? 'post-content-blur' : '') + ' ' + postFontClass
                      }
                      style={{ backgroundColor: post.bg_color || bgColor }}
                      onClick={() => handleBlurToggle(post.id)}
                      title={post.is_blur && !blurStates[post.id] ? '클릭하여 내용 보기' : post.is_blur ? '클릭하여 블러 처리' : ''}
                    >
                      <p className="text-slate-800">{post.content || '내용 없음'}</p>
                      {post.is_blur && !blurStates[post.id] && (
                        <div className="mt-2 text-center text-sm text-slate-500 opacity-75">
                          클릭하여 내용 보기
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-3xl bg-slate-100 p-5">
                      <p className="mb-3 text-sm font-medium text-slate-700">{post.content || '그림 게시글'}</p>
                      {post.image_url && (
                        <img src={post.image_url} alt="post drawing" className="w-full rounded-2xl object-cover" />
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {EMOJIS.map((emoji) => {
                      const reaction = reactions.find((r) => r.emoji === emoji)
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleReaction(post.id, emoji)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm transition hover:bg-slate-100"
                        >
                          <span>{emoji}</span>
                          <span>{reaction?.count || 0}</span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4">
                    <h3 className="text-sm font-semibold text-slate-900">댓글</h3>
                    <div className="mt-4 relative">
                      {comments.length > 0 ? (
                        <div className="ivy-comments">
                          {/* 중앙 줄기 */}
                          <div className="ivy-stem"></div>
                          {comments.map((comment, index) => (
                            <div
                              key={comment.id}
                              className={'ivy-leaf ' + (index % 2 === 0 ? 'ivy-leaf-left' : 'ivy-leaf-right')}
                              style={{ animationDelay: index * 0.1 + 's' }}
                            >
                              <div className="ivy-leaf-content">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm text-slate-800">{comment.content}</p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeleteTarget({ id: comment.id, type: 'comment', postId: post.id })
                                      setDeletePassword('')
                                      setDeleteModalOpen(true)
                                    }}
                                    className="text-xs text-red-400 hover:text-red-600 flex-shrink-0"
                                  >
                                    ✕
                                  </button>
                                </div>
                                <p className="mt-2 text-xs text-slate-500">{new Date(comment.created_at).toLocaleString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">댓글이 없습니다.</p>
                      )}
                    </div>

                    <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
                      <div className="space-y-3">
                        <textarea
                          rows={2}
                          className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none"
                          value={commentInput[post.id] || ''}
                          onChange={(event) =>
                            setCommentInput((prev) => ({ ...prev, [post.id]: event.target.value }))
                          }
                          placeholder="댓글 내용을 입력하세요"
                        />
                        <input
                          type="password"
                          className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none"
                          value={commentPassword[post.id] || ''}
                          onChange={(event) =>
                            setCommentPassword((prev) => ({ ...prev, [post.id]: event.target.value }))
                          }
                          placeholder="삭제 비밀번호"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCommentSubmit(post.id)}
                        className="inline-flex h-full items-center justify-center rounded-3xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        댓글 작성
                      </button>
                    </div>
                    {commentInfo[post.id] && (
                      <p className="mt-3 text-sm text-slate-600">{commentInfo[post.id]}</p>
                    )}
                  </div>
                </motion.article>
              )
            })}
          </div>
        </section>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              {deleteTarget?.type === 'post' ? '게시글 삭제' : '댓글 삭제'}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              삭제 비밀번호를 입력하세요.
            </p>
            <input
              type="password"
              className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="비밀번호"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && deletePassword && deleteTarget) {
                  const url = deleteTarget.type === 'post' ? `/api/posts/${deleteTarget.id}` : `/api/comments/${deleteTarget.id}`
                  fetch(url, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: deletePassword }),
                  })
                    .then(res => res.json())
                    .then(data => {
                      if (data.error) {
                        alert('삭제 실패: ' + data.error)
                      } else {
                        if (deleteTarget.type === 'post') {
                          mutate()
                        } else if (deleteTarget.postId) {
                          setCommentsByPost(prev => ({
                            ...prev,
                            [deleteTarget.postId!]: prev[deleteTarget.postId!].filter(c => c.id !== deleteTarget.id)
                          }))
                        }
                        setDeleteModalOpen(false)
                        setDeletePassword('')
                      }
                    })
                }
              }}
            />
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false)
                  setDeletePassword('')
                }}
                className="flex-1 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
              >
                취소
              </button>
              <button
                onClick={() => {
                  if (deletePassword && deleteTarget) {
                    const url = deleteTarget.type === 'post' ? `/api/posts/${deleteTarget.id}` : `/api/comments/${deleteTarget.id}`
                    fetch(url, {
                      method: 'DELETE',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ password: deletePassword }),
                    })
                      .then(res => res.json())
                      .then(data => {
                        if (data.error) {
                          alert('삭제 실패: ' + data.error)
                        } else {
                          if (deleteTarget.type === 'post') {
                            mutate()
                          } else if (deleteTarget.postId) {
                            setCommentsByPost(prev => ({
                              ...prev,
                              [deleteTarget.postId!]: prev[deleteTarget.postId!].filter(c => c.id !== deleteTarget.id)
                            }))
                          }
                          setDeleteModalOpen(false)
                          setDeletePassword('')
                        }
                      })
                  }
                }}
                className="flex-1 rounded-2xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:bg-red-300"
                disabled={!deletePassword}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
