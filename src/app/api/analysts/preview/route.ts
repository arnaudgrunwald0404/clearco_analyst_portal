import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const analystId = url.searchParams.get('analystId')
    if (!analystId) {
      return NextResponse.json({ error: 'Missing analystId' }, { status: 400 })
    }

    const secret = process.env.PREVIEW_SECRET || process.env.NEXT_PUBLIC_ANALYST_PREVIEW_SECRET
    if (!secret) {
      return NextResponse.json({ error: 'Preview secret not configured' }, { status: 500 })
    }

    // Set the preview cookie and return success; cookie is validated in middleware too
    const res = NextResponse.json({ success: true })
    res.cookies.set('analyst_preview', '1', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/analysts',
      maxAge: 60 * 60 // 1 hour
    })
    res.headers.set('Cache-Control', 'private, no-store')
    res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
    return res
  } catch (e) {
    return NextResponse.json({ error: 'Failed to enable preview' }, { status: 500 })
  }
}


