import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { requireAuth } from '@/lib/auth-utils'

function normalizePrivateKey(raw?: string): string | undefined {
  if (!raw) return undefined
  // Convert escaped newlines
  const replaced = raw.replace(/\\n/g, '\n')
  // If PEM header is missing, add it
  if (!replaced.includes('BEGIN PRIVATE KEY')) {
    return `-----BEGIN PRIVATE KEY-----\n${replaced.replace(/\s+/g, '')}\n-----END PRIVATE KEY-----\n`
  }
  return replaced
}

async function getAuthClient() {
  const private_key = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY)
  const client_email = process.env.GOOGLE_CLIENT_EMAIL

  if (!client_email || !private_key) {
    throw new Error(`Missing Google credentials: GOOGLE_CLIENT_EMAIL=${!!client_email}, GOOGLE_PRIVATE_KEY=${!!private_key}`)
  }

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email, private_key },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly', 'https://www.googleapis.com/auth/drive.metadata.readonly'],
  })
  return await auth.getClient()
}

function extractSpreadsheetId(url: string): string | null {
  try {
    const idPart = url.split('/d/')[1]?.split('/')[0]
    return idPart || null
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult

    const { url } = await request.json()
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ success: false, error: 'url is required' }, { status: 400 })
    }

    const spreadsheetId = extractSpreadsheetId(url)
    if (!spreadsheetId) {
      return NextResponse.json({ 
        success: true, 
        data: { 
          isGoogleSheet: false, 
          url,
          displayUrl: url,
          title: null, 
          owner: null 
        } 
      })
    }

    try {
      const authClient = await getAuthClient()
      
      // Get file metadata from Drive API
      const drive = google.drive({ version: 'v3', auth: authClient as any })
      const fileResponse = await drive.files.get({
        fileId: spreadsheetId,
        fields: 'name,owners,webViewLink'
      })

      const file = fileResponse.data
      const title = (file as any).name || null
      const owner = file.owners?.[0]?.displayName || file.owners?.[0]?.emailAddress || null
      const webViewLink = file.webViewLink || url

      return NextResponse.json({ 
        success: true, 
        data: { 
          isGoogleSheet: true,
          url,
          displayUrl: webViewLink,
          title, 
          owner,
          spreadsheetId
        } 
      })
    } catch (error: any) {
      console.warn('Could not fetch Google Sheets metadata:', error.message)
      // Fallback - still return success but without metadata
      return NextResponse.json({ 
        success: true, 
        data: { 
          isGoogleSheet: true,
          url,
          displayUrl: url,
          title: null, 
          owner: null,
          error: 'Access denied or file not found'
        } 
      })
    }
  } catch (error: any) {
    console.error('Metadata fetch error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Failed to fetch metadata' 
    }, { status: 500 })
  }
}
