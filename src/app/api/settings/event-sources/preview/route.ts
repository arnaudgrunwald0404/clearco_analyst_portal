import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { detectHeaderRow, heuristicMapHeaders, headerSignature, type HeaderMap } from '@/lib/events/mapping'
import { requireAuth } from '@/lib/auth-utils'

function normalizePrivateKey(raw?: string): string | undefined {
  if (!raw) return undefined
  const replaced = raw.replace(/\\n/g, '\n')
  if (!replaced.includes('BEGIN PRIVATE KEY')) {
    return `-----BEGIN PRIVATE KEY-----\n${replaced.replace(/\s+/g, '')}\n-----END PRIVATE KEY-----\n`
  }
  return replaced
}

async function getAuthClient() {
  const private_key = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY)
  const client_email = process.env.GOOGLE_CLIENT_EMAIL
  if (!client_email || !private_key) {
    throw new Error('Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY in environment')
  }
  const auth = new google.auth.GoogleAuth({
    credentials: { client_email, private_key },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
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
      return NextResponse.json({ success: false, error: 'Invalid Google Sheets URL' }, { status: 400 })
    }

    const authClient = await getAuthClient()
    const sheets = google.sheets({ version: 'v4', auth: authClient })

    let meta: any
    try {
      meta = await sheets.spreadsheets.get({ spreadsheetId })
    } catch (e: any) {
      const status = e?.status || e?.code
      if (status === 403) {
        const callerEmail = process.env.GOOGLE_CLIENT_EMAIL || 'service-account-unknown'
        return NextResponse.json({
          success: false,
          error: 'Google Sheets access denied (403)',
          details: `Share the spreadsheet with ${callerEmail} (Viewer or higher) or use an OAuth token with access.`,
          spreadsheetId,
          callerEmail
        }, { status: 403 })
      }
      throw e
    }
    const sheetsList = meta.data.sheets || []

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const previews: any[] = []
    const allSheetTitles: string[] = []

    for (const sh of sheetsList) {
      const title = sh.properties?.title?.trim()
      if (!title) continue
      allSheetTitles.push(title)
      const range = `${title}!A1:Z`
      const resp = await sheets.spreadsheets.values.get({ spreadsheetId, range })
      const vals = (resp.data.values || []) as any[]
      if (!vals || vals.length === 0) continue
      const headerInfo = detectHeaderRow(vals)
      if (!headerInfo) continue
      const { headerRowIdx, headerCells } = headerInfo
      const dataRows = vals.slice(headerRowIdx + 1)
      if (dataRows.length === 0) continue

      const sig = headerSignature(headerCells)
      let mapping: HeaderMap | null = null
      try {
        const { data: cached } = await supabase
          .from('event_source_mappings')
          .select('mapping')
          .eq('source_url', url)
          .eq('sheet_title', title)
          .eq('header_signature', sig)
          .limit(1)
          .single()
        if (cached?.mapping) mapping = cached.mapping as HeaderMap
      } catch {}

      if (!mapping) mapping = heuristicMapHeaders(headerCells, dataRows)

      previews.push({
        sheetTitle: title,
        headers: headerCells,
        sampleRows: dataRows.slice(0, 5),
        headerSignature: sig,
        mapping
      })
    }

    return NextResponse.json({ success: true, data: previews, allSheetTitles })
  } catch (error: any) {
    console.error('Preview mapping error:', error)
    return NextResponse.json({ success: false, error: error?.message || 'Failed to build preview' }, { status: 500 })
  }
}

