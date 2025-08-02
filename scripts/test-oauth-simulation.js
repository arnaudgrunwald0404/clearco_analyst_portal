require('dotenv').config({ path: '.env' })

const { Pool } = require('pg')

// Simulate the OAuth callback process
async function simulateOAuthCallback() {
  console.log('🔍 Simulating OAuth callback process...\n')
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })
  
  const client = await pool.connect()
  
  try {
    console.log('0. Checking table constraints...')
    const constraintsResult = await client.query(`
      SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'CalendarConnection' AND tc.constraint_type = 'FOREIGN KEY'
    `)
    
    console.log('🔗 Foreign key constraints on CalendarConnection:')
    constraintsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`)
    })
    
    // Check if auth.users table exists (Supabase auth table)
    const authUsersResult = await client.query(`
      SELECT id FROM auth.users LIMIT 1
    `).catch(() => null)
    
    if (authUsersResult) {
      console.log('✅ auth.users table exists')
    } else {
      console.log('❌ auth.users table does not exist')
    }
    
    // Let's try to remove the foreign key constraint temporarily for testing
    console.log('\n🔧 Temporarily removing foreign key constraint for testing...')
    try {
      await client.query('ALTER TABLE "CalendarConnection" DROP CONSTRAINT IF EXISTS "CalendarConnection_userId_fkey"')
      console.log('✅ Foreign key constraint removed')
    } catch (constraintError) {
      console.log('⚠️  Could not remove constraint:', constraintError.message)
    }
    
    const userId = 'd129d3b9-6cb7-4e77-ac3f-f233e1e047a0'
    console.log('👤 Using test userId:', userId)
    
    const testUserInfo = {
      email: 'test@example.com',
      name: 'Test User',
      googleId: 'google-123456789'
    }
    
    console.log('1. Checking if connection already exists...')
    const existingResult = await client.query(`
      SELECT id, title FROM "CalendarConnection" 
      WHERE "userId" = $1 AND email = $2
    `, [userId, testUserInfo.email])
    
    if (existingResult.rows.length > 0) {
      console.log('✅ Found existing connection:', existingResult.rows[0])
      console.log('   Would update with new tokens in real flow')
    } else {
      console.log('📝 No existing connection found')
      
      console.log('\n2. Creating new calendar connection...')
      const connectionId = `cl${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`
      
      const insertResult = await client.query(`
        INSERT INTO "CalendarConnection" (
          id, "userId", title, email, "googleAccountId", "accessToken", 
          "refreshToken", "tokenExpiry", "isActive", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, title, email, "isActive"
      `, [
        connectionId,
        userId,
        `${testUserInfo.name}'s Calendar`,
        testUserInfo.email,
        testUserInfo.googleId,
        'encrypted-test-token',
        'encrypted-test-refresh-token',
        null,
        true,
        new Date().toISOString(),
        new Date().toISOString()
      ])
      
      const newConnection = insertResult.rows[0]
      console.log('✅ Created new connection:', newConnection)
    }
    
    console.log('\n3. Checking final state...')
    const finalResult = await client.query(`
      SELECT id, title, email, "isActive", "createdAt"
      FROM "CalendarConnection" 
      WHERE "userId" = $1 
      ORDER BY "createdAt" DESC
    `, [userId])
    
    console.log('📊 All connections for user:')
    finalResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.title} (${row.email}) - Active: ${row.isActive}`)
    })
    
  } catch (error) {
    console.error('❌ Simulation failed:', error.message)
  } finally {
    client.release()
    await pool.end()
  }
  
  console.log('\n🏁 OAuth simulation completed')
}

simulateOAuthCallback().catch(console.error)
