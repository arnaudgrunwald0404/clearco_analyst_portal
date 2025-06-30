#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables from .env file
try {
  const envPath = join(process.cwd(), '.env')
  const envFile = readFileSync(envPath, 'utf8')
  const envVars = envFile.split('\n').reduce((acc, line) => {
    const [key, value] = line.split('=')
    if (key && value) {
      acc[key.trim()] = value.trim()
    }
    return acc
  }, {} as Record<string, string>)
  
  Object.assign(process.env, envVars)
} catch (error) {
  console.log('⚠️  Could not load .env file')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

async function checkDatabase() {
  console.log('🔍 Checking database connection...')
  console.log('URL:', supabaseUrl)
  console.log('Key (first 20 chars):', supabaseKey.substring(0, 20) + '...')
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Try to list tables
    const { data: tables, error } = await supabase.rpc('get_schema_tables')
    if (error) {
      console.log('Cannot list tables, trying direct query...')
      
      // Try a simple query to see what tables exist
      const { data, error: queryError } = await supabase
        .from('analysts')
        .select('count(*)')
        .limit(1)
      
      if (queryError) {
        console.error('❌ Query error:', queryError)
        
        // Try with different table names
        const possibleTables = ['analysts', 'user_profiles', 'profiles']
        for (const table of possibleTables) {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1)
          
          if (!error) {
            console.log(`✅ Found table: ${table}`)
            console.log('Sample record:', data)
          } else {
            console.log(`❌ No table: ${table}`)
          }
        }
      } else {
        console.log('✅ Connected to analysts table')
        console.log('Count data:', data)
      }
    } else {
      console.log('✅ Available tables:', tables)
    }
    
  } catch (error) {
    console.error('❌ Connection error:', error)
  }
}

checkDatabase()
