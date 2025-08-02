require('dotenv').config({ path: '.env' })

const { Pool } = require('pg')

async function testPostgresDirect() {
  console.log('🔍 Testing direct PostgreSQL connection...\n')
  
  // Try the primary database URL first
  let connectionString = process.env.DATABASE_URL
  console.log('🔗 Using DATABASE_URL (pooler):', connectionString?.substring(0, 50) + '...')
  
  const pool = new Pool({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  })
  
  try {
    console.log('1. Testing basic connection...')
    const client = await pool.connect()
    console.log('✅ Successfully connected to PostgreSQL')
    
    console.log('\n2. Checking database version...')
    const versionResult = await client.query('SELECT version()')
    console.log('📊 Database version:', versionResult.rows[0].version.split(' ')[0], versionResult.rows[0].version.split(' ')[1])
    
    console.log('\n3. Listing all tables in public schema...')
    const tablesResult = await client.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)
    
    if (tablesResult.rows.length === 0) {
      console.log('⚠️  No tables found in public schema')
    } else {
      console.log('📋 Found tables:')
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name} (${row.table_type})`)
      })
    }
    
    console.log('\n4. Checking if CalendarConnection table exists...')
    const calendarTableResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'CalendarConnection' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `)
    
    if (calendarTableResult.rows.length === 0) {
      console.log('❌ CalendarConnection table does not exist')
      
      console.log('\n5. Creating CalendarConnection table...')
      await client.query(`
        CREATE TABLE IF NOT EXISTS "CalendarConnection" (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          user_id TEXT NOT NULL,
          provider TEXT NOT NULL DEFAULT 'google',
          title TEXT,
          email TEXT NOT NULL,
          access_token TEXT NOT NULL,
          refresh_token TEXT,
          token_expiry TIMESTAMPTZ,
          calendar_id TEXT,
          calendar_name TEXT,
          status TEXT NOT NULL DEFAULT 'ACTIVE',
          is_active BOOLEAN NOT NULL DEFAULT true,
          last_sync TIMESTAMPTZ,
          sync_in_progress BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        -- Grant permissions
        GRANT ALL ON "CalendarConnection" TO postgres;
        GRANT ALL ON "CalendarConnection" TO anon;
        GRANT ALL ON "CalendarConnection" TO authenticated;
        GRANT ALL ON "CalendarConnection" TO service_role;
      `)
      console.log('✅ CalendarConnection table created successfully')
    } else {
      console.log('✅ CalendarConnection table exists with columns:')
      calendarTableResult.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
      })
    }
    
    console.log('\n6. Testing the exact query our API uses...')
    try {
      const userId = 'd129d3b9-6cb7-4e77-ac3f-f233e1e047a0'
      const queryResult = await client.query(`
        SELECT id, title, email, "isActive", "lastSyncAt", "createdAt"
        FROM "CalendarConnection" 
        WHERE "userId" = $1 
        ORDER BY "createdAt" DESC
      `, [userId])
      
      console.log('✅ API query works directly')
      console.log('📊 Found connections:', queryResult.rows.length)
      if (queryResult.rows.length > 0) {
        console.log('📋 Sample record:', queryResult.rows[0])
      }
    } catch (queryError) {
      console.log('❌ API query failed:', queryError.message)
    }
    
    console.log('\n7. Testing insert permissions...')
    try {
      await client.query(`
        INSERT INTO "CalendarConnection" (
          id, user_id, provider, title, email, access_token, status, is_active, sync_in_progress, created_at, updated_at
        ) VALUES (
          'test-id-123', 'test-user-123', 'google', 'Test Calendar', 'test@example.com', 
          'encrypted-token', 'ACTIVE', true, false, NOW(), NOW()
        ) ON CONFLICT (id) DO NOTHING
      `)
      console.log('✅ Insert permissions work')
      
      // Clean up test record
      await client.query(`DELETE FROM "CalendarConnection" WHERE id = 'test-id-123'`)
    } catch (insertError) {
      console.log('❌ Insert permissions failed:', insertError.message)
    }
    
    client.release()
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    console.error('   Code:', error.code)
  } finally {
    await pool.end()
  }
  
  console.log('\n🏁 Direct PostgreSQL test completed')
}

testPostgresDirect().catch(console.error)
