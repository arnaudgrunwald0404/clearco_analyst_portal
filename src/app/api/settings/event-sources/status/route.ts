import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { detectHeaderRow, heuristicMapHeaders, llmSuggestMapping, type HeaderMap } from '@/lib/events/mapping'
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
  try { return url.split('/d/')[1]?.split('/')[0] || null } catch { return null }
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

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Load per-source selected tabs
    let selectedTabs: string[] | null = null
    try {
      const { data } = await supabase
        .from('event_sync_sources')
        .select('selected_tabs')
        .eq('url', url)
        .limit(1)
        .single()
      if (data?.selected_tabs) {
        if (Array.isArray(data.selected_tabs)) selectedTabs = data.selected_tabs
        else if (typeof data.selected_tabs === 'string') {
          try { const arr = JSON.parse(data.selected_tabs); if (Array.isArray(arr)) selectedTabs = arr } catch {}
        }
      }
    } catch {}

    const authClient = await getAuthClient()
    const sheets = google.sheets({ version: 'v4', auth: authClient as any })
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

    const titles = (sheetsList.map((s: { properties?: { title?: string | null } }) => s.properties?.title?.trim()).filter(Boolean) as string[])
    const tabsToCheck = (selectedTabs && selectedTabs.length) ? titles.filter(t => selectedTabs!.map(x=>x.toLowerCase()).includes(t.toLowerCase())) : titles.slice(0, 1)

    const perTab: { tab: string, ready: boolean, reason?: string }[] = []

    for (const title of tabsToCheck) {
      try {
        const range = `${title}!A1:Z`
        const resp = await sheets.spreadsheets.values.get({ spreadsheetId, range })
        const vals = (resp.data.values || []) as any[]
        
        console.log(`\n=== ANALYZING TAB: ${title} ===`)
        console.log(`Raw data rows: ${vals.length}`)
        console.log(`First few rows:`, vals.slice(0, 3))
        
        const headerInfo = detectHeaderRow(vals)
        if (!headerInfo) { 
          console.log(`❌ No header detected for tab: ${title}`)
          perTab.push({ tab: title, ready: false, reason: 'No header detected' }); 
          continue 
        }
        
        const { headerRowIdx, headerCells } = headerInfo
        console.log(`✅ Header found at row ${headerRowIdx}:`, headerCells)
        
        const dataRows = vals.slice(headerRowIdx + 1)
        console.log(`Data rows available: ${dataRows.length}`)
        console.log(`Sample data:`, dataRows.slice(0, 2))
        
        if (dataRows.length === 0) { 
          console.log(`❌ No data rows for tab: ${title}`)
          perTab.push({ tab: title, ready: false, reason: 'No data rows' }); 
          continue 
        }

        let mapping: HeaderMap | null = heuristicMapHeaders(headerCells, dataRows)
        console.log(`🔍 Heuristic mapping result:`, mapping)
        
        const required: (keyof HeaderMap)[] = ['Date','Event']
        const missingRequired = required.some(k => mapping?.[k] == null)
        
        if (missingRequired) {
          console.log(`🤖 Trying LLM mapping for missing fields...`)
          const llm = await llmSuggestMapping(headerCells, dataRows)
          console.log(`🤖 LLM mapping result:`, llm)
          if (llm) mapping = { ...(mapping || {}), ...llm }
        }
        
        console.log(`📋 Final mapping:`, mapping)
        const stillMissing = required.filter(k => mapping?.[k] == null)
        
        if (stillMissing.length === 0) {
          console.log(`✅ Tab ${title} is ready!`)
          perTab.push({ tab: title, ready: true })
        } else {
          console.log(`❌ Tab ${title} missing fields:`, stillMissing)
          perTab.push({ tab: title, ready: false, reason: `Missing fields: ${stillMissing.join(', ')}. Headers available: ${headerCells.join(', ')}` })
        }
      } catch (tabError) {
        console.error(`Error analyzing tab ${title}:`, tabError)
        perTab.push({ tab: title, ready: false, reason: `Error accessing tab: ${tabError instanceof Error ? tabError.message : 'Unknown error'}` })
      }
    }

    const ready = perTab.every(t => t.ready)
    return NextResponse.json({ success: true, ready, perTab })
  } catch (error: any) {
    console.error('Status check error:', error)
    return NextResponse.json({ success: false, error: error?.message || 'Failed to check status' }, { status: 500 })
  }
}

