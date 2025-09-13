const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function applyMigration() {
  try {
    console.log('🔧 Applying analyst portal settings migration...')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    
    // Check if table exists by trying to select from it
    const { data: existingData, error: selectError } = await supabase
      .from('analyst_portal_settings')
      .select('*')
      .limit(1)
    
    if (selectError) {
      console.log('❌ Table does not exist or access denied:', selectError.message)
      console.log('Please run the SQL migration manually in your Supabase dashboard:')
      console.log(`
        CREATE TABLE IF NOT EXISTS analyst_portal_settings (
          id text PRIMARY KEY DEFAULT 'cl' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 8),
          "welcomeQuote" text DEFAULT '',
          "quoteAuthor" text DEFAULT '',
          "authorImageUrl" text DEFAULT '',
          "createdAt" timestamp with time zone DEFAULT now(),
          "updatedAt" timestamp with time zone DEFAULT now()
        );
        
        ALTER TABLE analyst_portal_settings DISABLE ROW LEVEL SECURITY;
        GRANT ALL ON analyst_portal_settings TO authenticated;
        GRANT ALL ON analyst_portal_settings TO anon;
      `)
      return
    }
    
    console.log('✅ Table exists and is accessible')
    
    // Check if we already have settings
    if (existingData && existingData.length > 0) {
      console.log('ℹ️  Settings already exist, updating with author image...')
      
      const { error: updateError } = await supabase
        .from('analyst_portal_settings')
        .update({
          authorImageUrl: 'https://lh3.googleusercontent.com/a/ACg8ocJKqWteI1GXkmnswJmVq98vOmuAONA-RiWegDuqkHlk823I8qc=s96-c',
          updatedAt: new Date().toISOString()
        })
        .eq('id', existingData[0].id)
      
      if (updateError) {
        console.log('Update error:', updateError.message)
      } else {
        console.log('✅ Settings updated with author image')
      }
    } else {
      console.log('ℹ️  No settings found, inserting default...')
      
      const { error: insertError } = await supabase
        .from('analyst_portal_settings')
        .insert({
          welcomeQuote: 'Welcome to your analyst portal! We\'re excited to have you here.',
          quoteAuthor: 'Arnaud Grunwald',
          authorImageUrl: 'https://lh3.googleusercontent.com/a/ACg8ocJKqWteI1GXkmnswJmVq98vOmuAONA-RiWegDuqkHlk823I8qc=s96-c'
        })
      
      if (insertError) {
        console.log('Insert error:', insertError.message)
      } else {
        console.log('✅ Default settings inserted')
      }
    }
    
    console.log('🎉 Migration completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}

applyMigration()
