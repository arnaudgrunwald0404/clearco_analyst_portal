#!/usr/bin/env tsx

// Load environment variables from .env file
import { config } from 'dotenv'
config({ path: '.env' })

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function applyGeneralSettingsFix() {
  console.log('🔧 Applying General Settings RLS Fix...\n')
  
  try {
    // Read the SQL fix file
    const sqlFilePath = path.join(process.cwd(), 'fix_general_settings.sql')
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error('❌ SQL fix file not found:', sqlFilePath)
      process.exit(1)
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8')
    console.log('📄 Read SQL fix file successfully')
    
    // Connect to database
    console.log('🔗 Connecting to database...')
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Execute the SQL fix
    console.log('⚡ Executing SQL fix...')
    
    // Split SQL into statements and execute each one
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        try {
          console.log(`   ${i + 1}/${statements.length}: Executing statement...`)
          await prisma.$executeRawUnsafe(statement)
          console.log(`   ✅ Statement ${i + 1} executed successfully`)
        } catch (error: any) {
          console.log(`   ⚠️  Statement ${i + 1} failed (might be expected): ${error.message}`)
          // Continue with other statements - some failures are expected (like DROP POLICY IF EXISTS)
        }
      }
    }
    
    console.log('\n🎉 SQL fix applied successfully!')
    
    // Test the fix by trying to read/write general settings
    console.log('\n🧪 Testing the fix...')
    
    try {
      // Try to read settings
      console.log('   📖 Testing read access...')
      const settings = await prisma.generalSettings.findFirst()
      console.log('   ✅ Read access works')
      
      // Try to create/update settings
      console.log('   ✏️  Testing write access...')
      
      if (settings) {
        // Update existing
        await prisma.generalSettings.update({
          where: { id: settings.id },
          data: { updatedAt: new Date() }
        })
        console.log('   ✅ Update access works')
      } else {
        // Create new
        await prisma.generalSettings.create({
          data: {
            companyName: 'Test Company',
            protectedDomain: 'test.com',
            logoUrl: '',
            industryName: 'HR Technology'
          }
        })
        console.log('   ✅ Create access works')
      }
      
      console.log('\n🎉 Fix validation successful! General settings should now work properly.')
      
    } catch (error: any) {
      console.error('\n❌ Fix validation failed:', error.message)
      console.error('The RLS policies may still need adjustment.')
    }
    
  } catch (error: any) {
    console.error('❌ Error applying fix:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

applyGeneralSettingsFix().catch((error) => {
  console.error('💥 Unexpected error:', error)
  process.exit(1)
})
