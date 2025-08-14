import { NextRequest, NextResponse } from 'next/server'
import { parseDate } from '@/lib/date-utils'

// Heuristic parser for pasted "data dump" text.
// It looks for lines starting with known labels (case-insensitive) such as:
// Name:, Organization:, Publication Date:, Submission Date:, Priority:, Status:, Link:, Notes:
// Multiple awards can be separated by blank lines or another Name: occurrence.
// This is intentionally conservative; it returns a minimal shape that the bulk API expects.
// You can later swap the parsing section with an actual LLM call if desired.

function normalize(str: string) {
  return str.trim()
}

function commitCurrent(current: any, out: any[]) {
  // Only push if at least one core field is present
  if (current.name || current.organization || current.publicationDate || current.submissionDate) {
    out.push({ ...current })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const text = (body?.text ?? '').toString()
    if (!text.trim()) {
      return NextResponse.json({ success: false, error: 'No text provided' }, { status: 400 })
    }

    const lines = text.split(/\r?\n/)
    const awards: any[] = []
    let current: any = {}

    const flushIfNewAward = () => {
      if (current && Object.keys(current).length > 0) {
        commitCurrent(current, awards)
        current = {}
      }
    }

    for (let raw of lines) {
      const line = raw.trim()
      if (!line) {
        // blank line = separator between awards
        flushIfNewAward()
        continue
      }

      const lower = line.toLowerCase()
      const [, key, value] = line.match(/^\s*([^:]+):\s*(.*)$/) || []
      if (key !== undefined) {
        const k = key.trim().toLowerCase()
        const v = value?.trim() ?? ''
        switch (true) {
          case ['name', 'award', 'award name', 'title'].includes(k):
            // If a new Name appears and current already has content, start a new record
            if (current.name || current.organization || current.publicationDate || current.submissionDate) {
              flushIfNewAward()
            }
            current.name = normalize(v)
            break
          case ['organization', 'organizer', 'host', 'sponsor'].includes(k):
            current.organization = normalize(v)
            break
          case ['publication date', 'publish date', 'pub date', 'announcement date'].includes(k):
            current.publicationDate = normalize(v)
            break
          case ['submission date', 'deadline', 'due date', 'process start date'].includes(k):
            current.submissionDate = normalize(v)
            break
          case ['priority', 'importance', 'priority level'].includes(k):
            current.priority = normalize(v).toUpperCase()
            break
          case ['status'].includes(k):
            current.status = normalize(v).toUpperCase()
            break
          case ['link', 'url', 'website'].includes(k):
            current.link = normalize(v)
            break
          case ['notes', 'comments', 'description'].includes(k):
            current.notes = normalize(v)
            break
          case ['owner', 'contact', 'contact info'].includes(k):
            current.owner = normalize(v)
            break
          case ['topics', 'product topics', 'keywords', 'tags'].includes(k):
            current.productTopics = normalize(v)
            break
          default:
            // Unrecognized labeled field: append to notes
            current.notes = current.notes ? `${current.notes}\n${line}` : line
        }
      } else {
        // No explicit label; attempt to infer minimal info, else append to notes
        current.notes = current.notes ? `${current.notes}\n${line}` : line
      }
    }

    // commit last
    flushIfNewAward()

    // Light normalization for dates and arrays
    for (const a of awards) {
      if (a.publicationDate) {
        const d = parseDate(a.publicationDate)
        if (d) a.publicationDate = d.toISOString().slice(0, 10)
      }
      if (a.submissionDate) {
        const d = parseDate(a.submissionDate)
        if (d) a.submissionDate = d.toISOString().slice(0, 10)
      }
      if (typeof a.productTopics === 'string' && a.productTopics.includes(',')) {
        a.productTopics = a.productTopics.split(',').map((t: string) => t.trim()).filter(Boolean)
      }
    }

    return NextResponse.json({ success: true, data: { awards } })
  } catch (err) {
    console.error('parse-dump error:', err)
    return NextResponse.json({ success: false, error: 'Failed to parse text' }, { status: 500 })
  }
}

