#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function updateCalendarConnectionsTable() {
  console.log('🔄 Starting calendar connections table update...')

  try {
    // Drop existing table
    console.log('🗑️ Dropping existing table...')
    await supabase.rpc('drop_calendar_connections')

    // Create new table
    console.log('📝 Creating new table...')
    await supabase.rpc('create_calendar_connections_table')

    console.log('✅ Table update completed successfully!')
  } catch (error) {
    console.error('❌ Error updating table:', error)
    process.exit(1)
  }
}

updateCalendarConnectionsTable()