import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']
const PREFERRED_TABS = ['2026', '2025'] as const

function normalizePrivateKey(raw?: string): string | undefined {
  if (!raw) return undefined
  const replaced = raw.replace(/\\n/g, '\n')
  if (!replaced.includes('BEGIN PRIVATE KEY')) {
    return `-----BEGIN PRIVATE KEY-----\n${replaced.replace(/\s+/g, '')}\n-----END PRIVATE KEY-----\n`
  }
  return replaced
}

function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `cl${timestamp}${randomPart}`
}

function parseDDMMYYYY(input: string): string | null {
  const m = input.match(/^\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\s*$/)
  if (!m) return null
  let day = parseInt(m[1], 10)
  let month = parseInt(m[2], 10)
  let year = parseInt(m[3], 10)
  if (year < 100) year += 2000
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const iso = new Date(Date.UTC(year, month - 1, day)).toISOString()
  return iso
}

function parseSheetDate(value: unknown, fallbackIso: string): string {
  if (value === undefined || value === null) return fallbackIso
  if (typeof value === 'number') {
    const epoch = Date.UTC(1899, 11, 30)
    const ms = Math.round(value * 24 * 60 * 60 * 1000)
    return new Date(epoch + ms).toISOString()
  }
  const str = String(value).trim()
  if (!str) return fallbackIso
  const ddmmyyyy = parseDDMMYYYY(str)
  if (ddmmyyyy) return ddmmyyyy
  if (/^\d+(\.\d+)?$/.test(str)) {
    const num = parseFloat(str)
    const epoch = Date.UTC(1899, 11, 30)
    const ms = Math.round(num * 24 * 60 * 60 * 1000)
    return new Date(epoch + ms).toISOString()
  }
  const d = new Date(str)
  if (isNaN(d.getTime())) return fallbackIso
  return d.toISOString()
}

function canonicalLink(input?: string | null): string | null {
  if (!input) return null
  const raw = input.trim()
  if (!raw) return null
  try {
    const u = new URL(raw)
    const path = u.pathname.replace(/\/$/, '')
    return `${u.protocol}//${u.hostname.toLowerCase()}${path}`
  } catch {
    return raw.replace(/\/$/, '').toLowerCase()
  }
}

function normalizeCountry(country?: string | null): 'USA' | 'Canada' | null {
  if (!country) return null
  const c = country.toString().toLowerCase().replace(/[^a-z]/g, '')
  const usaSet = new Set([
    'usa', 'us', 'unitedstates', 'unitedstatesofamerica', 'america'
  ])
  const caSet = new Set(['canada', 'ca'])
  if (usaSet.has(c)) return 'USA'
  if (caSet.has(c)) return 'Canada'
  return null
}

function makeStableKey(name: string | null | undefined, link: string | null | undefined, location: string | null | undefined): string {
  const n = (name || '').trim().toLowerCase()
  const lnk = canonicalLink(link) || ''
  const loc = (location || '').trim().toLowerCase()
  return lnk ? `${n}|${lnk}` : `${n}|${loc}`
}

async function getAuthenticatedClient() {
  const private_key = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY)
  const client_email = process.env.GOOGLE_CLIENT_EMAIL

  if (!client_email || !private_key) {
    throw new Error('Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY in environment')
  }

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email, private_key },
    scopes: SCOPES,
  })

  return await auth.getClient()
}

export async function POST() {
  try {
    const authClient = await getAuthenticatedClient()
    const sheets = google.sheets({ version: 'v4', auth: authClient })

    // Fetch event source URLs from settings (Supabase). Fallback to ENV if none configured.
    const service = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const sources: string[] = []
    try {
      const { data: srcRows, error: srcErr } = await service
        .from('event_sync_sources')
        .select('url,is_active')
        .order('created_at', { ascending: true })
      if (srcErr) {
        console.warn('Warning: failed to load event_sync_sources, will fallback to ENV.', srcErr)
      } else if (srcRows && srcRows.length > 0) {
        for (const r of srcRows as any[]) {
          if (r?.is_active !== false && typeof r?.url === 'string' && r.url.trim()) {
            sources.push(r.url.trim())
          }
        }
      }
    } catch (e) {
      console.warn('Warning: exception loading event sources, will fallback to ENV.', e)
    }

    if (sources.length === 0) {
      const envUrls = (process.env.EVENTS_GSHEET || '').split(',').map(s => s.trim()).filter(Boolean)
      sources.push(...envUrls)
    }

    if (sources.length === 0) {
      throw new Error('No event sources configured. Add sources in Settings > Events or set EVENTS_GSHEET in the environment.')
    }

    // Helper to extract spreadsheetId from a Google Sheets URL
    const extractSpreadsheetId = (url: string): string | null => {
      try {
        const idPart = url.split('/d/')[1]?.split('/')[0]
        return idPart || null
      } catch {
        return null
      }
    }

    const allRows: string[][] = []

    for (const src of sources) {
      const spreadsheetId = extractSpreadsheetId(src)
      if (!spreadsheetId) {
        console.warn(`Skipping non-Google Sheets or invalid URL: ${src}`)
        continue
      }

      const meta = await sheets.spreadsheets.get({ spreadsheetId })
      const sheetsList = meta.data.sheets || []
      const wanted = new Set(PREFERRED_TABS)
      const selectedTitles = sheetsList
        .map(s => s.properties?.title?.trim())
        .filter((t): t is string => !!t && wanted.has(t))
      if (selectedTitles.length === 0 && sheetsList[0]?.properties?.title) {
        selectedTitles.push(sheetsList[0].properties!.title!)
      }
      if (selectedTitles.length === 0) {
        console.warn(`Unable to determine first sheet title for spreadsheet ${spreadsheetId}. Skipping.`)
        continue
      }

      // Aggregate rows from all selected tabs for this spreadsheet
      for (const title of selectedTitles) {
        const range = `${title}!A10:J`
        const resp = await sheets.spreadsheets.values.get({ spreadsheetId, range })
        const vals = (resp.data.values || []).slice(1) // skip header row per tab
        if (vals.length > 0) allRows.push(...(vals as any))
      }
    }

    if (allRows.length === 0) {
      return NextResponse.json({ success: true, message: 'No data found in selected tabs across all sources.' })
    }

    const headers = ['Date', 'Days', 'Event', '#Hashtag', 'Who should attend?', 'url', 'Organised by', 'City', 'Country', 'Contact']
    const rawEvents = allRows.map(row => {
      const item: Record<string, any> = {}
      headers.forEach((h, idx) => {
        item[h] = row[idx]
      })
      return item
    })

    const filtered = rawEvents
      .map(e => ({ ...e, _normalizedCountry: normalizeCountry(e?.Country) }))
      .filter(e => e._normalizedCountry === 'USA' || e._normalizedCountry === 'Canada')

    if (filtered.length === 0) {
      return NextResponse.json({ success: true, message: 'No USA/Canada events to sync.' })
    }

    const supabase = service

    // Build stable key -> id map from existing events
    const existingMap = new Map<string, string>()
    {
      const { data: existing, error } = await supabase
        .from('Event')
        .select('id,eventName,location,link')
      if (error) throw new Error(`Fetch existing failed: ${error.message}`)
      if (existing) {
        for (const e of existing as any[]) {
          const key = makeStableKey(e.eventName, e.link, e.location)
          if (key) existingMap.set(key, e.id)
        }
      }
    }

    const nowIso = new Date().toISOString()
    const batchKeys = new Set<string>()
    const upsertRows: any[] = []
    let insertCount = 0
    let updateCount = 0
    let batchSkipped = 0

    for (const ev of filtered) {
      const normalizedCountry = normalizeCountry(ev._normalizedCountry || ev.Country)
      const location = [ev.City, normalizedCountry].filter(Boolean).join(', ') || null
      const eventName = ev.Event || 'Untitled Event'
      const link = ev.url || null
      const key = makeStableKey(eventName, link, location)
      if (batchKeys.has(key)) { batchSkipped++; continue }
      batchKeys.add(key)

      const startDate = ev.Date ? parseSheetDate(ev.Date, nowIso) : nowIso

      const row = {
        eventName,
        link,
        type: 'CONFERENCE',
        audienceGroups: ev['Who should attend?']
          ? JSON.stringify(String(ev['Who should attend?']).split(',').map((s: string) => s.trim()).filter(Boolean))
          : null,
        startDate,
        participationTypes: null,
        owner: ev['Organised by'] || null,
        location,
        status: 'PLANNED',
        notes: [ev['#Hashtag'], ev['Contact']].filter(Boolean).join(' | ') || null,
        updatedAt: nowIso,
      }

      const existingId = existingMap.get(key)
      if (existingId) {
        upsertRows.push({ id: existingId, ...row })
        updateCount++
      } else {
        upsertRows.push({ id: generateId(), createdAt: nowIso, ...row })
        insertCount++
      }
    }

    if (upsertRows.length === 0) {
      return NextResponse.json({ success: true, message: 'No changes (all duplicates in-batch).', inserted: 0, updated: 0, skippedInBatch: batchSkipped })
    }

    const { error: upsertError } = await supabase.from('Event').upsert(upsertRows, { onConflict: 'id' })
    if (upsertError) throw new Error(upsertError.message)

    return NextResponse.json({ success: true, message: `Upsert complete. Inserted: ${insertCount}, Updated: ${updateCount}, Skipped in batch: ${batchSkipped}.`, inserted: insertCount, updated: updateCount, skippedInBatch: batchSkipped })
  } catch (error: any) {
    console.error('Error syncing events:', error)
    const details = error?.message || (error instanceof Error ? error.message : JSON.stringify(error))
    return NextResponse.json({ success: false, error: 'Failed to sync events', details }, { status: 500 })
  }
}
