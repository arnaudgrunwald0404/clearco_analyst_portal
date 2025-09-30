import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { detectHeaderRow, headerSignature, type HeaderMap, heuristicMapHeaders } from '@/lib/events/mapping'

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

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
    const sheets = google.sheets({ version: 'v4', auth: authClient as any })

    // Fetch active event source URLs from settings (Supabase)
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
          if (r?.is_active === true && typeof r?.url === 'string' && r.url.trim()) {
            sources.push(r.url.trim())
          }
        }
      }
    } catch (e) {
      console.warn('Warning: exception loading event sources.', e)
    }

    if (sources.length === 0) {
      throw new Error('No active event sources configured. Add and activate sources in Settings > Events.')
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
    let totalRows = 0
    let eventsProcessed = 0
    let sheetTitle = ''

    // Diagnostics for zero-results cases
    let debugHeaders: string[] = []
    let debugUniqueCountries: any[] = []
    let debugSampleCities: any[] = []

    for (const src of sources) {
      const spreadsheetId = extractSpreadsheetId(src)
      if (!spreadsheetId) {
        console.warn(`Skipping non-Google Sheets or invalid URL: ${src}`)
        continue
      }

      let meta: any
      try {
        meta = await sheets.spreadsheets.get({ spreadsheetId })
      } catch (e: any) {
        const status = e?.status || e?.code
        if (status === 403) {
          const callerEmail = process.env.GOOGLE_CLIENT_EMAIL || 'service-account-unknown'
          console.error(`Sheets 403 for spreadsheetId=${spreadsheetId}. The service account ${callerEmail} likely lacks access. Share the sheet with this email.`)
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

      // Load per-source selected tabs
      let selectedTabs: string[] | null = null
      try {
        const { data } = await service
          .from('event_sync_sources')
          .select('selected_tabs')
          .eq('url', src)
          .limit(1)
          .single()
        if (data?.selected_tabs) {
          if (Array.isArray(data.selected_tabs)) selectedTabs = data.selected_tabs
          else if (typeof data.selected_tabs === 'string') {
            try { const arr = JSON.parse(data.selected_tabs); if (Array.isArray(arr)) selectedTabs = arr } catch {}
          }
        }
      } catch {}

      const titles = (sheetsList.map((s: any) => s.properties?.title?.trim()).filter(Boolean) as string[])
      const tabsToSync = (selectedTabs && selectedTabs.length)
        ? titles.filter(t => selectedTabs!.map(x => x.toLowerCase()).includes(t.toLowerCase()))
        : titles.slice(0, 1)

      for (const t of tabsToSync) {
        sheetTitle = t
        // Read full sheet and detect header row like the Preview/Status endpoints
        const range = `${sheetTitle}!A1:Z`

        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range,
        })

        const vals = (response.data.values || []) as any[]
        if (!vals || vals.length === 0) continue

        const headerInfo = detectHeaderRow(vals)
        if (!headerInfo) continue

        const { headerRowIdx, headerCells: headerRow } = headerInfo
        const rows = vals.slice(headerRowIdx + 1)
        totalRows += rows.length
        
        // Detect headers from the header row (not the first data row)
        let headers: string[] = headerRow.length > 0 ? [...headerRow] : []
        debugHeaders = headers
        let cityField = 'City'
        let countryField = 'Country'
        let eventField = 'Event'
        let dateField = 'Date'
        let urlField = 'url'
        let organizerField = 'Organised by'
        let hashtagField = '#Hashtag'
        let contactField = 'Contact'
        let participationField = 'Participation'

      // Helper: detect if headerRow looks like actual headers
      const headerRowLc = headerRow.map((c: any) => (c?.toString()?.toLowerCase() || ''))
      const headerKeywords = ['city', 'location', 'country', 'event', 'date', 'url', 'organised', 'organized', 'organizer', 'contact', 'hashtag']
      const matchesKeywords = headerRowLc.some((c: string) => headerKeywords.some(k => c.includes(k)))

      if (headerRow.length > 0) {
        console.log('🔍 Header row (raw):', headerRow)
        
        if (matchesKeywords) {
          // Look for field names directly in header row
          for (let i = 0; i < headerRow.length; i++) {
            const cell = headerRowLc[i]
            if (cell.includes('city') || cell.includes('location')) {
              cityField = headerRow[i]
              console.log(`📍 Found city field: "${cityField}" at column ${i}`)
            }
            if (cell.includes('country')) {
              countryField = headerRow[i]
              console.log(`🌍 Found country field: "${countryField}" at column ${i}`)
            }
            if (cell.includes('event') || cell.includes('name') || cell.includes('title')) {
              eventField = headerRow[i]
              console.log(`🎯 Found event field: "${eventField}" at column ${i}`)
            }
            if (cell.includes('date')) {
              dateField = headerRow[i]
              console.log(`📅 Found date field: "${dateField}" at column ${i}`)
            }
            if (cell.includes('url') || cell.includes('link')) {
              urlField = headerRow[i]
              console.log(`🔗 Found URL field: "${urlField}" at column ${i}`)
            }
            if (cell.includes('organised') || cell.includes('organized') || cell.includes('organizer') || cell.includes('by')) {
              organizerField = headerRow[i]
              console.log(`👤 Found organizer field: "${organizerField}" at column ${i}`)
            }
            if (cell.includes('hashtag') || cell.includes('#')) {
              hashtagField = headerRow[i]
            }
            if (cell.includes('contact') || cell.includes('email')) {
              contactField = headerRow[i]
            }
          }
        // Use the actual header row so indices line up with the data
        headers = headerRow

        // Try to load a saved mapping for this source + sheet + header signature
        try {
          const sig = headerSignature(headers)
          const { data: cached } = await service
            .from('event_source_mappings')
            .select('mapping')
            .eq('source_url', src)
            .eq('sheet_title', sheetTitle)
            .eq('header_signature', sig)
            .limit(1)
            .single()
          const savedMap = (cached?.mapping || null) as HeaderMap | null
          if (savedMap) {
            console.log('🗺️ Using saved header mapping')
            const pick = (field: keyof HeaderMap, fallback: string) => {
              const idx = (savedMap as any)[field]
              return typeof idx === 'number' && headers[idx] != null ? headers[idx] : fallback
            }
            dateField = pick('Date', dateField)
            eventField = pick('Event', eventField)
            urlField = pick('url', urlField)
            cityField = pick('City', cityField)
            countryField = pick('Country', countryField)
            organizerField = pick('Organised by', organizerField)
            hashtagField = pick('#Hashtag', hashtagField)
            contactField = pick('Contact', contactField)
            participationField = pick('Participation', participationField)
          } else {
            // Fall back to heuristics if no saved mapping
            const inferred = heuristicMapHeaders(headers, rows)
            const pickInf = (field: keyof HeaderMap, fallback: string) => {
              const idx = (inferred as any)?.[field]
              return typeof idx === 'number' && headers[idx] != null ? headers[idx] : fallback
            }
            dateField = pickInf('Date', dateField)
            eventField = pickInf('Event', eventField)
            urlField = pickInf('url', urlField)
            cityField = pickInf('City', cityField)
            countryField = pickInf('Country', countryField)
            organizerField = pickInf('Organised by', organizerField)
            hashtagField = pickInf('#Hashtag', hashtagField)
            contactField = pickInf('Contact', contactField)
            participationField = pickInf('Participation', participationField)
          }
        } catch (mapErr) {
          console.warn('Mapping lookup failed, continuing with detected/heuristic fields', mapErr)
        }
        } else {
          // The first row is data, not headers. Infer columns by examining data patterns.
          console.warn('First row appears to be data, inferring columns...')

          // Build column-wise arrays
          const colCount = Math.max(...rows.map(r => r.length), headerRow.length)
          const cols: string[][] = Array.from({ length: colCount }, (_, i) => rows.map(r => r[i]).filter(Boolean).map(v => v.toString()))

          // Utilities for scoring
          const usCities = [
            'new york', 'los angeles', 'chicago', 'houston', 'phoenix', 'philadelphia', 'san antonio', 'san diego', 'dallas', 'san jose',
            'austin', 'jacksonville', 'fort worth', 'columbus', 'charlotte', 'san francisco', 'indianapolis', 'seattle', 'denver', 'washington',
            'boston', 'el paso', 'nashville', 'detroit', 'oklahoma city', 'portland', 'las vegas', 'memphis', 'louisville', 'baltimore',
            'milwaukee', 'albuquerque', 'tucson', 'fresno', 'sacramento', 'atlanta', 'kansas city', 'long beach', 'colorado springs', 'raleigh',
            'miami', 'virginia beach', 'omaha', 'oakland', 'minneapolis', 'tulsa', 'arlington', 'tampa', 'new orleans', 'wichita',
            'cleveland', 'bakersfield', 'aurora', 'honolulu', 'anaheim', 'santa ana', 'corpus christi', 'riverside', 'lexington', 'stockton',
            'henderson', 'st. paul', 'st. louis', 'cincinnati', 'pittsburgh', 'anchorage', 'greensboro', 'plano', 'newark', 'durham',
            'lincoln', 'chandler', 'chula vista', 'orlando', 'norfolk', 'laredo', 'madison', 'winston-salem', 'lubbock', 'baton rouge',
            'garland', 'glendale', 'arlington', 'hialeah', 'fremont', 'boise', 'richmond', 'spokane', 'baton rouge', 'tacoma'
          ]
          const canadianCities = [
            'toronto', 'montreal', 'vancouver', 'calgary', 'edmonton', 'ottawa', 'winnipeg', 'quebec city', 'hamilton', 'kitchener',
            'brampton', 'surrey', 'laval', 'halifax', 'london', 'victoria', 'vaughan', 'gatineau', 'longueuil', 'burnaby',
            'saskatoon', 'kingston', 'richmond', 'regina', 'kelowna', 'sherbrooke', "st. john's", 'barrie', 'saguenay', 'aberdeen',
            'fredericton', 'charlottetown', 'whitehorse', 'yellowknife', 'iqaluit'
          ]
          const usStateCodes = new Set([
            'al','ak','az','ar','ca','co','ct','de','fl','ga','hi','id','il','in','ia','ks','ky','la','me','md','ma','mi','mn','ms','mo','mt','ne','nv','nh','nj','nm','ny','nc','nd','oh','ok','or','pa','ri','sc','sd','tn','tx','ut','vt','va','wa','wv','wi','wy','dc'
          ])
          const isCityLike = (s: string) => {
            const lc = s.toLowerCase().trim()
            if (usCities.includes(lc) || canadianCities.includes(lc)) return true
            const m = lc.match(/,\s*([a-z]{2})$/)
            return !!(m && usStateCodes.has(m[1]))
          }
          const isCountryUSCanada = (s: string) => {
            const lc = s.toLowerCase().trim()
            return lc === 'usa' || lc === 'us' || lc === 'u.s.' || lc === 'u.s.a.' || lc === 'united states' || lc === 'united states of america' || lc === 'canada'
          }

          let bestCityIdx = -1
          let bestCityScore = -1
          let bestCountryIdx = -1
          let bestCountryScore = -1

          for (let i = 0; i < cols.length; i++) {
            const col = cols[i]
            let cityScore = 0
            let countryScore = 0
            for (const v of col) {
              if (isCityLike(v)) cityScore++
              if (isCountryUSCanada(v)) countryScore++
            }
            if (cityScore > bestCityScore) { bestCityScore = cityScore; bestCityIdx = i }
            if (countryScore > bestCountryScore) { bestCountryScore = countryScore; bestCountryIdx = i }
          }

          console.log(`🧭 Inferred city column index: ${bestCityIdx} (score ${bestCityScore})`)
          console.log(`🧭 Inferred country column index: ${bestCountryIdx} (score ${bestCountryScore})`)

          // Ensure headers length matches columns
          const colCountFinal = Math.max(cols.length, headers.length)
          if (headers.length < colCountFinal) {
            headers = Array.from({ length: colCountFinal }, (_, i) => headers[i] ?? `Col${i+1}`)
          }

          // Override detected indices with canonical field names
          if (bestCityIdx >= 0) {
            headers[bestCityIdx] = 'City'
            cityField = 'City'
          }
          if (bestCountryIdx >= 0) {
            headers[bestCountryIdx] = 'Country'
            countryField = 'Country'
          }
        }
      } else {
        headers = ['Date', 'Days', 'Event', '#Hashtag', 'Who should attend?', 'url', 'Organised by', 'City', 'Country', 'Contact']
      }
      
      // Debug: Log what we're finding
      console.log(`🔍 Using headers:`, headers)
      console.log(`📊 Processing ${rows.length} rows from sheet "${sheetTitle}"`)
      debugHeaders = headers
      
      const events = rows
        .map(row => {
          const event: { [key: string]: any } = {}
          headers.forEach((header, index) => {
            event[header] = row[index]
          })
          return event
        })
        .filter(event => {
          // Check both country and city for USA/Canada or accept virtual/online events
          const country = event[countryField]?.toString().toLowerCase().trim()
          const city = event[cityField]?.toString().toLowerCase().trim()
          const nameLc = event[eventField]?.toString().toLowerCase() || ''
          const hashLc = event[hashtagField]?.toString().toLowerCase() || ''

          const onlineRe = /(\bonline\b|\bvirtual\b|webinar|livestream|live\s*stream|remote|digital|podcast|streaming)/i
          const isVirtual = onlineRe.test(nameLc) || onlineRe.test(city || '') || onlineRe.test(country || '') || onlineRe.test(hashLc)
          
          // Major US cities
          const usCities = [
            'new york', 'los angeles', 'chicago', 'houston', 'phoenix', 'philadelphia', 'san antonio', 'san diego', 'dallas', 'san jose',
            'austin', 'jacksonville', 'fort worth', 'columbus', 'charlotte', 'san francisco', 'indianapolis', 'seattle', 'denver', 'washington',
            'boston', 'el paso', 'nashville', 'detroit', 'oklahoma city', 'portland', 'las vegas', 'memphis', 'louisville', 'baltimore',
            'milwaukee', 'albuquerque', 'tucson', 'fresno', 'sacramento', 'atlanta', 'kansas city', 'long beach', 'colorado springs', 'raleigh',
            'miami', 'virginia beach', 'omaha', 'oakland', 'minneapolis', 'tulsa', 'arlington', 'tampa', 'new orleans', 'wichita',
            'cleveland', 'bakersfield', 'aurora', 'honolulu', 'anaheim', 'santa ana', 'corpus christi', 'riverside', 'lexington', 'stockton',
            'henderson', 'st. paul', 'st. louis', 'cincinnati', 'pittsburgh', 'anchorage', 'greensboro', 'plano', 'newark', 'durham',
            'lincoln', 'chandler', 'chula vista', 'orlando', 'norfolk', 'laredo', 'madison', 'winston-salem', 'lubbock', 'baton rouge',
            'garland', 'glendale', 'arlington', 'hialeah', 'fremont', 'boise', 'richmond', 'spokane', 'baton rouge', 'tacoma'
          ]
          
          // Major Canadian cities
          const canadianCities = [
            'toronto', 'montreal', 'vancouver', 'calgary', 'edmonton', 'ottawa', 'winnipeg', 'quebec city', 'hamilton', 'kitchener',
            'brampton', 'surrey', 'laval', 'halifax', 'london', 'victoria', 'vaughan', 'gatineau', 'longueuil', 'burnaby',
            'saskatoon', 'kingston', 'richmond', 'regina', 'kelowna', 'sherbrooke', 'st. john\'s', 'barrie', 'saguenay', 'aberdeen',
            'fredericton', 'charlottetown', 'whitehorse', 'yellowknife', 'iqaluit'
          ]
          
          // Also accept US state codes in the location like "Grand Prairie, TX"
          const usStateCodes = new Set([
            'al','ak','az','ar','ca','co','ct','de','fl','ga','hi','id','il','in','ia','ks','ky','la','me','md','ma','mi','mn','ms','mo','mt','ne','nv','nh','nj','nm','ny','nc','nd','oh','ok','or','pa','ri','sc','sd','tn','tx','ut','vt','va','wa','wv','wi','wy','dc'
          ])
          let cityHasUSState = false
          const stateMatch = city?.match(/,\s*([a-z]{2})$/)
          if (stateMatch) {
            const code = stateMatch[1]
            cityHasUSState = usStateCodes.has(code)
          }
          
          // Check if country indicates USA/Canada
          const isCountryUSCanada = country === 'usa' || country === 'canada' || 
                                   country === 'united states' || country === 'us' ||
                                   country === 'u.s.' || country === 'u.s.a.' ||
                                   country === 'united states of america'
          
          // Check if city is in USA or Canada
          const isCityUSCanada = usCities.includes(city) || canadianCities.includes(city) || cityHasUSState
          
          const isUSCanada = isCountryUSCanada || isCityUSCanada
          const include = isUSCanada || isVirtual
          
          if (!include) {
            console.log(`🌍 Skipping event "${event[eventField]}" - ${cityField}: "${event[cityField]}", ${countryField}: "${event[countryField]}" (not USA/Canada and not virtual)`)
          } else {
            const reason = isVirtual ? 'virtual/online' : 'USA/Canada'
            console.log(`✅ Including event "${event[eventField]}" (${reason}) - ${cityField}: "${event[cityField]}", ${countryField}: "${event[countryField]}"`)
          }
          
          // Stash detection for payload mapping
          ;(event as any).__isVirtual = isVirtual

          return include
        })

      console.log(`✅ Found ${events.length} USA/Canada events out of ${rows.length} total rows in tab ${sheetTitle}`)
      
      // Debug: Show all unique countries found
      const allCountries = rows.map(row => {
        const event: { [key: string]: any } = {}
        headers.forEach((header, index) => {
          event[header] = row[index]
        })
        return event[countryField]
      }).filter(Boolean)
      
      const uniqueCountries = [...new Set(allCountries)]
      console.log(`🌍 All countries found in data:`, uniqueCountries)
      debugUniqueCountries = uniqueCountries
      
      // Capture a sample of cities for diagnostics
      const allCities = rows.map(row => {
        const event: { [key: string]: any } = {}
        headers.forEach((header, index) => {
          event[header] = row[index]
        })
        return event[cityField]
      }).filter(Boolean)
      debugSampleCities = Array.from(new Set(allCities)).slice(0, 20)
      
      eventsProcessed += events.length

      const payload = events.map(event => {
        const eventName = (event[eventField] || '').toString().trim()
        const startISO = event[dateField] ? new Date(event[dateField]).toISOString() : new Date().toISOString()
        const locationStr = [event[cityField], event[countryField]].filter(Boolean).join(', ')
        const id = crypto
          .createHash('sha1')
          .update(`${eventName}|${startISO}|${locationStr}`.toLowerCase())
          .digest('hex')
          .slice(0, 20)
        const rawParticipation = (event[participationField] || '').toString().toLowerCase()
        const participationStatus = rawParticipation.includes('sponsor') ? 'SPONSORING'
          : rawParticipation.includes('attend') ? 'ATTENDING'
          : rawParticipation.includes('consider') || rawParticipation.includes('tbd') || rawParticipation.includes('maybe') ? 'CONSIDERING'
          : null
        const isVirtual = (event as any).__isVirtual === true
        let type: 'CONFERENCE' | 'WEBINAR' | 'PODCAST' = 'CONFERENCE'
        const n = eventName.toLowerCase()
        if (n.includes('podcast')) type = 'PODCAST'
        else if (isVirtual || n.includes('webinar') || n.includes('virtual') || n.includes('online')) type = 'WEBINAR'
        
        return {
          id,
          eventName,
          startDate: startISO,
          location: locationStr,
          link: event[urlField],
          owner: event[organizerField],
          notes: [event[hashtagField], event[contactField]].filter(Boolean).join(' | ') || null,
          type,
          status: 'PLANNED',
          participationStatus,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      })

      const { error } = await service.from('Event').upsert(payload, { onConflict: 'id' })
      if (error) {
        const msg = (error as any)?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error))
        throw new Error(`Supabase upsert failed: ${msg}`)
      }
      }
    }

    if (eventsProcessed === 0) {
      return NextResponse.json({ success: true, message: 'No USA/Canada events to sync.', details: {
        sheetTitle,
        totalRows,
        headers: debugHeaders,
        uniqueCountries: debugUniqueCountries,
        sampleCities: debugSampleCities,
        note: 'If headers or cities look unexpected, check the sheet range and header names around row A10.'
      } })
    }

    return NextResponse.json({ 
      success: true, 
      message: `${eventsProcessed} events synced successfully.`,
      details: {
        spreadsheetId: sources[0] ? extractSpreadsheetId(sources[0]) : null,
        sheetTitle,
        totalRows,
        eventsProcessed,
        source: 'Google Sheets'
      }
    })
  } catch (error) {
    console.error('Error syncing events:', error)
    let errorMessage = 'An unknown error occurred'
    let errorStack: string | undefined
    let errorJson: any
    if (error instanceof Error) {
      errorMessage = error.message
      errorStack = error.stack
    } else if (typeof error === 'object') {
      try { errorJson = JSON.parse(JSON.stringify(error)) } catch {}
      try { errorMessage = (error as any)?.message || JSON.stringify(error) } catch {}
    } else {
      errorMessage = String(error)
    }
    return NextResponse.json({ success: false, error: 'Failed to sync events', details: errorMessage, stack: errorStack, raw: errorJson ?? String(error) }, { status: 500 })
  }
}
