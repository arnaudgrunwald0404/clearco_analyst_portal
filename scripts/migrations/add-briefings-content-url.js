#!/usr/bin/env node

// Migration: Add contentUrl (TEXT NULL) column to briefings
// Idempotent: uses IF NOT EXISTS so it can be run multiple times safely.

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

    -- Add contentUrl column for linking or storing uploaded asset path
    ALTER TABLE IF EXISTS public.briefings
      ADD COLUMN IF NOT EXISTS contentUrl text;

    COMMENT ON COLUMN public.briefings.contentUrl IS 'URL or relative path to briefing content (uploaded file or external link).';

    COMMIT;
  `

  try {
    const client = await pool.connect()
    try {
      await client.query(sql)
      console.log('✅ Migration applied: contentUrl (text) added to public.briefings')
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

