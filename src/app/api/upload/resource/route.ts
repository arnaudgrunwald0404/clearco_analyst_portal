import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// Upload endpoint for general downloadable resources displayed in the portal's Resources tab.
// Stores into Supabase Storage bucket "resources" and returns a public URL.
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    // Basic validation: max 100 MB for resources
    const maxSize = 100 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, error: 'File too large. Max 100MB.' }, { status: 400 })
    }

    // Optional whitelist by type (allow common docs/videos)
    const allowedTypes = new Set([
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
      'application/vnd.ms-powerpoint', // ppt
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
      'application/msword', // doc
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel', // xls
      'text/plain',
      'text/csv',
      'video/mp4',
      'video/quicktime',
      'application/zip',
      'application/x-zip-compressed',
      'image/png',
      'image/jpeg',
      'image/webp',
    ])
    if (file.type && !allowedTypes.has(file.type)) {
      // Still permit unknown types as long as size is acceptable
      // If you want strict enforcement, uncomment below:
      // return NextResponse.json({ success: false, error: `Unsupported file type: ${file.type}` }, { status: 400 })
    }

    const timestamp = Date.now()
    const safeName = (file.name || 'resource').replace(/[^a-zA-Z0-9._-]/g, '_')
    const filename = `${timestamp}-${safeName}`

    const supabase = createServiceClient()
    const buffer = Buffer.from(await file.arrayBuffer())

    // Ensure bucket exists (ignore error if it already exists)
    try {
      await supabase.storage.createBucket('resources', { public: false })
    } catch {}

    const { error: upErr } = await supabase.storage.from('resources').upload(filename, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false
    })
    if (upErr) {
      console.error('Supabase storage upload error:', upErr)
      return NextResponse.json({ success: false, error: 'Failed to store file' }, { status: 500 })
    }

    const path = `resources/${filename}`
    return NextResponse.json({ success: true, path })
  } catch (error) {
    console.error('Error uploading resource:', error)
    return NextResponse.json({ success: false, error: 'Failed to upload file' }, { status: 500 })
  }
}

