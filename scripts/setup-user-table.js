/**
 * Setup User Table Script
 * 
 * This script creates the User table and default users in Supabase.
 * Run this script to set up authentication for the analyst portal.
 * 
 * Usage: node scripts/setup-user-table.js
 */

const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

console.log('🚀 Setting up User table in Supabase...')

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupUserTable() {
  try {
    console.log('📋 Creating User table...')
    
    // Create User table using SQL
    const createTableSQL = `
      -- Create user role enum if it doesn't exist
      DO $$ BEGIN
          CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'VENDOR_ADMIN', 'VENDOR_USER', 'ANALYST');
      EXCEPTION
          WHEN duplicate_object THEN null;
      END $$;
      
      -- Create User table (PascalCase to match authentication code)
      CREATE TABLE IF NOT EXISTS "User" (
          "id" TEXT PRIMARY KEY DEFAULT ('usr' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 25)),
          "email" TEXT UNIQUE NOT NULL,
          "name" TEXT NOT NULL,
          "role" user_role NOT NULL DEFAULT 'VENDOR_USER',
          "password" TEXT, -- For password authentication (hashed)
          "profileImageUrl" TEXT,
          "company" TEXT,
          "title" TEXT,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "lastLoginAt" TIMESTAMP WITH TIME ZONE,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
      CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
      CREATE INDEX IF NOT EXISTS "User_isActive_idx" ON "User"("isActive");
      
      -- Disable RLS and grant permissions
      ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
      GRANT ALL ON "User" TO authenticated;
      GRANT ALL ON "User" TO anon;
      
      -- Create function to update updatedAt on change
      CREATE OR REPLACE FUNCTION update_user_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW."updatedAt" = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      -- Create trigger to automatically update updatedAt
      DROP TRIGGER IF EXISTS trigger_update_user_updated_at ON "User";
      CREATE TRIGGER trigger_update_user_updated_at
          BEFORE UPDATE ON "User"
          FOR EACH ROW
          EXECUTE FUNCTION update_user_updated_at();
    `
    
    const { error: tableError } = await supabase.rpc('exec_sql', { 
      sql: createTableSQL 
    })
    
    if (tableError) {
      console.error('Error creating User table:', tableError)
      // Try alternative approach using direct SQL execution
      console.log('🔄 Trying alternative approach...')
      
      // Check if User table already exists
      const { data: tables, error: checkError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'User')
      
      if (checkError) {
        console.error('Error checking table existence:', checkError)
        return false
      }
      
      if (tables && tables.length > 0) {
        console.log('✅ User table already exists')
      } else {
        console.error('❌ Could not create User table. Please run the SQL manually in Supabase SQL editor.')
        console.log('📄 SQL to run:')
        console.log(createTableSQL)
        return false
      }
    } else {
      console.log('✅ User table created successfully')
    }
    
    console.log('👥 Creating default users...')
    
    // Hash passwords for default users
    const hashedPassword = await bcrypt.hash('password', 10)
    
    // Default users
    const defaultUsers = [
      {
        id: 'usr_admin_001',
        email: 'admin@clearcompany.com',
        name: 'Admin User',
        role: 'VENDOR_ADMIN',
        password: hashedPassword,
        company: 'ClearCompany',
        title: 'Administrator',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'usr_analyst_001',
        email: 'sarah.chen@clearcompany.com',
        name: 'Sarah Chen',
        role: 'ANALYST',
        password: hashedPassword,
        company: 'ClearCompany',
        title: 'Industry Analyst',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
    
    for (const user of defaultUsers) {
      const { error: insertError } = await supabase
        .from('User')
        .upsert(user, { onConflict: 'email' })
      
      if (insertError) {
        console.error(`Error creating user ${user.email}:`, insertError)
      } else {
        console.log(`✅ Created user: ${user.email} (${user.role})`)
      }
    }
    
    console.log('🎉 User table setup completed successfully!')
    console.log('')
    console.log('🔐 Default login credentials:')
    console.log('  Admin: admin@clearcompany.com / password')
    console.log('  Analyst: sarah.chen@clearcompany.com / password')
    console.log('')
    console.log('🏠 Admin users will be redirected to: /')
    console.log('📊 Analyst users will be redirected to: /portal')
    
    return true
    
  } catch (error) {
    console.error('❌ Error setting up User table:', error)
    return false
  }
}

// Run the setup
setupUserTable()
  .then((success) => {
    if (success) {
      console.log('✅ Setup completed successfully')
      process.exit(0)
    } else {
      console.log('❌ Setup failed')
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error('❌ Setup failed with error:', error)
    process.exit(1)
  }) 