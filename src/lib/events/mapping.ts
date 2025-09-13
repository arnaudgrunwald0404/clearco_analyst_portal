import crypto from 'crypto'
import { OpenAI } from 'openai'

export type CanonicalField = 'Date' | 'Days' | 'Event' | '#Hashtag' | 'Who should attend?' | 'url' | 'Organised by' | 'City' | 'Country' | 'Contact' | 'Participation'
export type HeaderMap = Partial<Record<CanonicalField, number>> // maps to column index

const FIELD_SYNONYMS: Record<CanonicalField, RegExp[]> = {
  Date: [/^date$/i, /^start(\s*date)?$/i, /^when$/i, /^start(s)?$/i, /\bdate\b/i],
  Days: [/^days?$/i, /^duration$/i],
  Event: [/^event$/i, /^title$/i, /^conference$/i, /^name$/i, /^meeting$/i],
  '#Hashtag': [/^#?hash\s*tag$/i, /^hashtag$/i, /^tag$/i],
  'Who should attend?': [/^who\s*should\s*attend\??$/i, /^audience$/i, /^attendees?$/i],
  url: [/^url$/i, /^link$/i, /^website$/i, /^site$/i, /^page$/i],
  'Organised by': [/^organis(e|z)d\s*by$/i, /^organizer$/i, /^host$/i, /^provider$/i],
  City: [/^city$/i, /^location$/i, /^town$/i],
  Country: [/^country$/i, /^nation$/i],
  Contact: [/^contact$/i, /^email$/i, /^phone$/i],
  Participation: [/^participation$/i, /^participation\s*status$/i, /^status$/i, /attend/i, /sponsor/i, /consider/i, /tbd/i, /maybe/i]
}

export function normalizeHeaderText(s: string): string {
  return s.trim().replace(/\s+/g, ' ').replace(/[\u200B-\u200D\uFEFF]/g, '')
}

export function detectHeaderRow(rows: any[][], maxScan = 20): { headerRowIdx: number, headerCells: string[] } | null {
  let bestIdx = -1
  let bestScore = -1
  for (let i = 0; i < Math.min(rows.length, maxScan); i++) {
    const row = rows[i] || []
    if (!row || row.length === 0) continue
    const nonEmpty = row.filter((c: any) => String(c || '').trim().length > 0).length
    const texty = row.filter((c: any) => /[A-Za-z]/.test(String(c))).length
    const numeric = row.filter((c: any) => /^\d+(?:[./-]\d+)?$/.test(String(c))).length
    const score = nonEmpty + texty - numeric // headers tend to be text-heavy
    if (score > bestScore) { bestScore = score; bestIdx = i }
  }
  if (bestIdx >= 0) {
    const headerCells = (rows[bestIdx] || []).map((c: any) => normalizeHeaderText(String(c || '')))
    return { headerRowIdx: bestIdx, headerCells }
  }
  return null
}

function scoreHeaderMatch(field: CanonicalField, header: string): number {
  const patterns = FIELD_SYNONYMS[field]
  for (const re of patterns) {
    if (re.test(header)) return 3
  }
  // substring fallbacks
  const low = header.toLowerCase()
  const contains: Record<CanonicalField, string[]> = {
    Date: ['date', 'when', 'start'],
    Days: ['day', 'duration'],
    Event: ['event', 'conference', 'title', 'name'],
    '#Hashtag': ['hash', 'tag', '#'],
    'Who should attend?': ['audience', 'attend', 'attendee'],
    url: ['url', 'link', 'web', 'site', 'page'],
    'Organised by': ['organis', 'organize', 'organiser', 'organizer', 'host', 'provider'],
    City: ['city', 'location', 'town'],
    Country: ['country', 'nation'],
    Contact: ['contact', 'email', 'phone'],
    Participation: ['participation', 'status', 'attend', 'sponsor', 'consider', 'tbd', 'maybe']
  }
  if (contains[field].some(k => low.includes(k))) return 1
  return 0
}

export function heuristicMapHeaders(headers: string[], sampleRows: any[][]): HeaderMap {
  const map: HeaderMap = {}
  const usedCols = new Set<number>()
  const tryAssign = (field: CanonicalField, scores: number[]) => {
    let bestIdx = -1, best = -1
    scores.forEach((s, i) => { if (!usedCols.has(i) && s > best) { best = s; bestIdx = i } })
    if (bestIdx >= 0 && best > 0) { (map as any)[field] = bestIdx; usedCols.add(bestIdx) }
  }

  const baseScores: Record<CanonicalField, number[]> = {} as any
  headers.forEach((h, idx) => {
    ;(Object.keys(FIELD_SYNONYMS) as CanonicalField[]).forEach(f => {
      baseScores[f] = baseScores[f] || Array(headers.length).fill(0)
      baseScores[f][idx] = scoreHeaderMatch(f, h)
    })
  })

  // Boost by sample data shape
  const isUrlLike = (v: any) => typeof v === 'string' && /https?:\/\//i.test(v)
  const isCountryLike = (v: any) => typeof v === 'string' && v.trim().length <= 20 && /[A-Za-z]/.test(v)
  const isCityLike = (v: any) => typeof v === 'string' && v.trim().length <= 40 && /[A-Za-z]/.test(v)
  const isDateLike = (v: any) => {
    if (typeof v === 'number') return true
    if (typeof v === 'string') {
      const s = v.trim()
      if (!s) return false
      if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(s)) return true
      const d = new Date(s)
      return !isNaN(d.getTime())
    }
    return false
  }

  const rowsToCheck = sampleRows.slice(0, 5)
  headers.forEach((_, idx) => {
    const colValues = rowsToCheck.map(r => r?.[idx]).filter(v => v !== undefined)
    const urlHits = colValues.filter(isUrlLike).length
    const dateHits = colValues.filter(isDateLike).length
    if (urlHits > 0) baseScores.url[idx] += 2
    if (dateHits > 0) baseScores.Date[idx] += 2
    // weak signals
    const textVals = colValues.filter(v => typeof v === 'string') as string[]
    const avgLen = textVals.length ? textVals.reduce((a, b) => a + b.length, 0) / textVals.length : 0
    if (avgLen <= 20 && textVals.length >= 2) baseScores.City[idx] += 0.5, baseScores.Country[idx] += 0.5
    // participation hints
    const partHits = textVals.filter(v => /sponsor|attend|consider|tbd|maybe|particip/i.test(v)).length
    if (partHits > 0) {
      baseScores.Participation = baseScores.Participation || Array(headers.length).fill(0)
      baseScores.Participation[idx] += 2
    }
  })

  // Assign in order of importance
  tryAssign('Date', baseScores.Date)
  tryAssign('Event', baseScores.Event)
  tryAssign('url', baseScores.url)
  tryAssign('City', baseScores.City)
  tryAssign('Country', baseScores.Country)
  tryAssign('Organised by', baseScores['Organised by'])
  tryAssign('Who should attend?', baseScores['Who should attend?'])
  tryAssign('#Hashtag', baseScores['#Hashtag'])
  tryAssign('Contact', baseScores.Contact)
  tryAssign('Days', baseScores.Days)
  tryAssign('Participation', baseScores.Participation || Array(headers.length).fill(0))

  return map
}

export function headerSignature(headers: string[]): string {
  const norm = headers.map(h => normalizeHeaderText(h).toLowerCase()).join('|')
  return crypto.createHash('sha1').update(norm).digest('hex')
}

export async function llmSuggestMapping(headers: string[], sampleRows: any[][]): Promise<HeaderMap | null> {
  if (!process.env.EVENTS_LLM_MAPPING_ENABLED || !/^true$/i.test(String(process.env.EVENTS_LLM_MAPPING_ENABLED))) {
    return null
  }
  if (!process.env.OPENAI_API_KEY) return null
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const cols = headers.map((h, i) => ({ col: i, header: h }))
  const sample = sampleRows.slice(0, 4).map(r => r.map(c => (typeof c === 'string' ? c.slice(0, 80) : c)))
  const system = 'You map spreadsheet columns to a fixed event schema. Return strict JSON mapping from field name to numeric column index. Only output JSON.'
  const user = JSON.stringify({
    schemaFields: ['Date','Days','Event','#Hashtag','Who should attend?','url','Organised by','City','Country','Contact','Participation'],
    columns: cols,
    sampleRows: sample
  })
  const res = await openai.chat.completions.create({
    model: process.env.EVENTS_LLM_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    temperature: 0.1,
    max_tokens: 300
  })
  const text = res.choices[0]?.message?.content || ''
  try {
    const obj = JSON.parse(text)
    const out: HeaderMap = {}
    const fields: CanonicalField[] = ['Date','Days','Event','#Hashtag','Who should attend?','url','Organised by','City','Country','Contact','Participation']
    fields.forEach(f => {
      const v = (obj as any)[f]
      if (typeof v === 'number') (out as any)[f] = v
    })
    return out
  } catch {
    return null
  }
}

