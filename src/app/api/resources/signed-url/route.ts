import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// Returns a signed URL for a private file in the "resources" bucket.
// Usage: GET /api/resources/signed-url?path=resources%2F<filename>&expiresIn=3600
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path') || ''
    const expiresIn = Math.max(60, Math.min(24 * 3600, Number(searchParams.get('expiresIn') || 3600)))

    if (!path || !path.startsWith('resources/')) {
      return NextResponse.json({ success: false, error: 'Invalid path' }, { status: 400 })
    }

    const key = path.replace(/^resources\//, '')

    const supabase = createServiceClient()
    const { data, error } = await supabase.storage
      .from('resources')
      .createSignedUrl(key, expiresIn)

    if (error || !data?.signedUrl) {
      console.error('Failed to create signed URL:', error)
      return NextResponse.json({ success: false, error: 'Failed to create signed URL' }, { status: 500 })
    }

    return NextResponse.json({ success: true, url: data.signedUrl, expiresIn })
  } catch (err) {
    console.error('Signed URL error:', err)
    return NextResponse.json({ success: false, error: 'Unexpected error' }, { status: 500 })
  }
}

