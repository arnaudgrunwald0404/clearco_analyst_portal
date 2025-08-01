/**
 * Jest test setup file
 * Configures the test environment and loads necessary environment variables
 */

import { config } from 'dotenv'

// Load environment variables from .env files
config({ path: '.env.local' })
config({ path: '.env' })

// Set test-specific environment variables if not already set
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required for tests')
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is required for tests')
}

// Set default test timeout
jest.setTimeout(30000) 