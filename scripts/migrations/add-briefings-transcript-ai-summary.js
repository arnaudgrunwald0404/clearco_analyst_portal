#!/usr/bin/env node

// Migration: Add transcript (TEXT) and ai_summary (JSONB) columns to briefings
// - transcript: large text field for full meeting transcript
// - ai_summary: JSON structure with 3 parts:
//   1) ["key topics", ...] -> array of strings
//   2) [[{ name, timestamp, follow_ups }, ...]] -> array of objects (speakers/sections)
//   3) [[{ name, timestamp, interesting_quotes }, ...]] -> array of objects
//
// This script is idempotent: it uses IF NOT EXISTS and will not error if run multiple times.

const { Pool } = require('pg')

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set. Aborting migration.')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  })

  const sql = `
    BEGIN;

    -- Add transcript column for full-text transcripts
    ALTER TABLE IF EXISTS public.briefings
      ADD COLUMN IF NOT EXISTS transcript text;

    COMMENT ON COLUMN public.briefings.transcript IS 'Full transcript text for the briefing';

    -- Add ai_summary JSONB column to store structured AI summary
    ALTER TABLE IF EXISTS public.briefings
      ADD COLUMN IF NOT EXISTS ai_summary jsonb;

    COMMENT ON COLUMN public.briefings.ai_summary IS 'AI summary JSON. Structure: [ key_topics: string[], highlights: {name: string, timestamp: string, follow_ups: string[]}[], quotes: {name: string, timestamp: string, interesting_quotes: string[]}[] ]';

    COMMIT;
  `

  try {
    const client = await pool.connect()
    try {
      await client.query(sql)
      console.log('✅ Migration applied: transcript (text) and ai_summary (jsonb) added to public.briefings')
    } finally {
      client.release()
    }
  } catch (err) {
    console.error('❌ Migration failed:', err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()

