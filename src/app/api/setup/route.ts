import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    // Check if universities table has data
    const { data: universities, error: universitiesError } = await supabaseAdmin
      .from('universities')
      .select('*')

    if (universitiesError) {
      return NextResponse.json(
        { error: 'Failed to fetch universities', details: universitiesError.message },
        { status: 500 }
      )
    }

    // Check if post-drawings bucket exists
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()

    if (bucketsError) {
      return NextResponse.json(
        { error: 'Failed to check storage buckets', details: bucketsError.message },
        { status: 500 }
      )
    }

    const postDrawingsBucket = buckets.find(bucket => bucket.name === 'post-drawings')

    // If no universities exist, return empty array
    if (!universities || universities.length === 0) {
      return NextResponse.json({
        message: 'No universities found. Please run the SQL schema first.',
        universities: [],
        storage: {
          postDrawingsBucket: postDrawingsBucket || null,
          buckets: buckets
        }
      })
    }

    return NextResponse.json({
      universities,
      storage: {
        postDrawingsBucket: postDrawingsBucket || null,
        buckets: buckets
      },
      message: 'Setup check completed successfully'
    })
  } catch (error) {
    console.error('Error in setup API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    // Create post-drawings bucket if it doesn't exist
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()

    if (bucketsError) {
      return NextResponse.json(
        { error: 'Failed to check storage buckets', details: bucketsError.message },
        { status: 500 }
      )
    }

    const postDrawingsBucket = buckets.find(bucket => bucket.name === 'post-drawings')

    if (!postDrawingsBucket) {
      // Create the bucket
      const { data: createData, error: createError } = await supabaseAdmin.storage.createBucket('post-drawings', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      })

      if (createError) {
        return NextResponse.json(
          { error: 'Failed to create post-drawings bucket', details: createError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'post-drawings bucket created successfully',
        bucket: createData
      })
    } else {
      return NextResponse.json({
        message: 'post-drawings bucket already exists',
        bucket: postDrawingsBucket
      })
    }
  } catch (error) {
    console.error('Error in setup POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}