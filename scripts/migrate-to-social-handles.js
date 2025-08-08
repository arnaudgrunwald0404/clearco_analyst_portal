const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qimvwwfwakvgfvclqpue.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpbXZ3d2Z3YWt2Z2Z2Y2xxcHVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAwNDk4NiwiZXhwIjoyMDY2NTgwOTg2fQ.oAecaBcP5Bbkyl8ObKXugnvcCzqUWfVjry4cRAr_kNg'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})

async function migrateToSocialHandles() {
  console.log('🔄 Migrating social media data to SocialHandle table...\n')

  try {
    // Get all analysts with social media data
    const { data: analystsWithSocial, error: fetchError } = await supabase
      .from('analysts')
      .select('id, firstName, lastName, twitterHandle, linkedinUrl, personalWebsite')
      .or('twitterHandle.not.is.null,linkedinUrl.not.is.null,personalWebsite.not.is.null')

    if (fetchError) {
      console.error('❌ Error fetching analysts:', fetchError)
      return
    }

    console.log(`📊 Found ${analystsWithSocial.length} analysts with social media data`)

    if (analystsWithSocial.length === 0) {
      console.log('✅ No migration needed - no analysts have social media data')
      return
    }

    let migrated = 0
    let skipped = 0
    let errors = 0

    for (const analyst of analystsWithSocial) {
      console.log(`\n🔍 Processing ${analyst.firstName} ${analyst.lastName}...`)

      // Process Twitter handle
      if (analyst.twitterHandle) {
        try {
          // Check if already exists
          const { data: existing, error: checkError } = await supabase
            .from('SocialHandle')
            .select('id')
            .eq('analystId', analyst.id)
            .eq('platform', 'TWITTER')
            .eq('handle', analyst.twitterHandle)
            .limit(1)

          if (checkError) {
            console.error(`❌ Error checking existing Twitter handle:`, checkError)
            errors++
            continue
          }

          if (existing && existing.length > 0) {
            console.log(`⏭️  Twitter handle already exists: @${analyst.twitterHandle}`)
            skipped++
          } else {
            // Create new SocialHandle record
            const { error: insertError } = await supabase
              .from('SocialHandle')
              .insert({
                id: `sh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                analystId: analyst.id,
                platform: 'TWITTER',
                handle: analyst.twitterHandle,
                displayName: analyst.twitterHandle.startsWith('@') ? analyst.twitterHandle : `@${analyst.twitterHandle}`,
                isActive: true,
                updatedAt: new Date().toISOString()
              })

            if (insertError) {
              console.error(`❌ Error creating Twitter handle:`, insertError)
              errors++
            } else {
              console.log(`✅ Created Twitter handle: @${analyst.twitterHandle}`)
              migrated++
            }
          }
        } catch (error) {
          console.error(`❌ Error processing Twitter handle:`, error)
          errors++
        }
      }

      // Process LinkedIn URL
      if (analyst.linkedinUrl) {
        try {
          // Extract handle from LinkedIn URL
          const linkedinHandle = extractLinkedInHandle(analyst.linkedinUrl)
          
          // Check if already exists
          const { data: existing, error: checkError } = await supabase
            .from('SocialHandle')
            .select('id')
            .eq('analystId', analyst.id)
            .eq('platform', 'LINKEDIN')
            .eq('handle', linkedinHandle)
            .limit(1)

          if (checkError) {
            console.error(`❌ Error checking existing LinkedIn handle:`, checkError)
            errors++
            continue
          }

          if (existing && existing.length > 0) {
            console.log(`⏭️  LinkedIn handle already exists: ${linkedinHandle}`)
            skipped++
          } else {
            // Create new SocialHandle record
            const { error: insertError } = await supabase
              .from('SocialHandle')
              .insert({
                id: `sh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                analystId: analyst.id,
                platform: 'LINKEDIN',
                handle: linkedinHandle,
                displayName: linkedinHandle,
                isActive: true,
                updatedAt: new Date().toISOString()
              })

            if (insertError) {
              console.error(`❌ Error creating LinkedIn handle:`, insertError)
              errors++
            } else {
              console.log(`✅ Created LinkedIn handle: ${linkedinHandle}`)
              migrated++
            }
          }
        } catch (error) {
          console.error(`❌ Error processing LinkedIn handle:`, error)
          errors++
        }
      }

      // Process personal website
      if (analyst.personalWebsite) {
        try {
          // Check if already exists
          const { data: existing, error: checkError } = await supabase
            .from('SocialHandle')
            .select('id')
            .eq('analystId', analyst.id)
            .eq('platform', 'BLOG')
            .eq('handle', analyst.personalWebsite)
            .limit(1)

          if (checkError) {
            console.error(`❌ Error checking existing website:`, checkError)
            errors++
            continue
          }

          if (existing && existing.length > 0) {
            console.log(`⏭️  Website already exists: ${analyst.personalWebsite}`)
            skipped++
          } else {
            // Create new SocialHandle record
            const { error: insertError } = await supabase
              .from('SocialHandle')
              .insert({
                id: `sh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                analystId: analyst.id,
                platform: 'BLOG',
                handle: analyst.personalWebsite,
                displayName: analyst.personalWebsite,
                isActive: true,
                updatedAt: new Date().toISOString()
              })

            if (insertError) {
              console.error(`❌ Error creating website:`, insertError)
              errors++
            } else {
              console.log(`✅ Created website: ${analyst.personalWebsite}`)
              migrated++
            }
          }
        } catch (error) {
          console.error(`❌ Error processing website:`, error)
          errors++
        }
      }
    }

    console.log(`\n📊 Migration Summary:`)
    console.log(`   ✅ Migrated: ${migrated} handles`)
    console.log(`   ⏭️  Skipped: ${skipped} handles (already existed)`)
    console.log(`   ❌ Errors: ${errors} handles`)

    if (migrated > 0) {
      console.log(`\n💡 Next steps:`)
      console.log(`   1. Verify the migration was successful`)
      console.log(`   2. Update your social media crawler to use the new SocialHandle table`)
      console.log(`   3. Consider removing the legacy social media columns after testing`)
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

function extractLinkedInHandle(url) {
  // Extract handle from LinkedIn URL like https://www.linkedin.com/in/username/
  const match = url.match(/linkedin\.com\/in\/([^\/]+)/)
  return match ? match[1] : url
}

// Run the migration
migrateToSocialHandles()
  .then(() => {
    console.log('\n✅ Migration completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }) 