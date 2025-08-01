require('dotenv').config({ path: '.env' })
const { createClient } = require('@supabase/supabase-js')

async function createUserProfilesTable() {
  console.log('🔧 Creating user_profiles table...\n')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  try {
    // Create the user_role enum if it doesn't exist
    console.log('📋 Step 1: Creating user_role enum...')
    const { error: enumError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ BEGIN
          CREATE TYPE user_role AS ENUM ('ADMIN', 'EDITOR', 'ANALYST');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `
    })

    if (enumError) {
      console.log('  ⚠️  Enum creation error (might already exist):', enumError.message)
    } else {
      console.log('  ✅ user_role enum created or already exists')
    }

    // Create the user_profiles table
    console.log('\n📋 Step 2: Creating user_profiles table...')
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_profiles (
          id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
          role user_role NOT NULL DEFAULT 'EDITOR',
          first_name TEXT,
          last_name TEXT,
          company TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
        );
      `
    })

    if (tableError) {
      console.log('  ❌ Table creation failed:', tableError.message)
      return
    }

    console.log('  ✅ user_profiles table created successfully')

    // Enable RLS
    console.log('\n📋 Step 3: Enabling RLS...')
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;'
    })

    if (rlsError) {
      console.log('  ⚠️  RLS enable error:', rlsError.message)
    } else {
      console.log('  ✅ RLS enabled')
    }

    // Create RLS policies
    console.log('\n📋 Step 4: Creating RLS policies...')
    const policies = [
      {
        name: 'Users can view own profile',
        sql: `
          CREATE POLICY "Users can view own profile" ON user_profiles
          FOR SELECT USING (auth.uid() = id);
        `
      },
      {
        name: 'Users can insert own profile',
        sql: `
          CREATE POLICY "Users can insert own profile" ON user_profiles
          FOR INSERT WITH CHECK (auth.uid() = id);
        `
      },
      {
        name: 'Users can update own profile',
        sql: `
          CREATE POLICY "Users can update own profile" ON user_profiles
          FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
        `
      },
      {
        name: 'Admins can view all profiles',
        sql: `
          CREATE POLICY "Admins can view all profiles" ON user_profiles
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM user_profiles 
              WHERE id = auth.uid() 
              AND role = 'ADMIN'
            )
          );
        `
      }
    ]

    for (const policy of policies) {
      const { error: policyError } = await supabase.rpc('exec_sql', {
        sql: policy.sql
      })

      if (policyError) {
        console.log(`  ⚠️  Policy "${policy.name}" error (might already exist):`, policyError.message)
      } else {
        console.log(`  ✅ Policy "${policy.name}" created`)
      }
    }

    // Create trigger function for auto-profile creation
    console.log('\n📋 Step 5: Creating trigger function...')
    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS trigger AS $$
        BEGIN
          INSERT INTO public.user_profiles (id, role, first_name, last_name, company)
          VALUES (
            NEW.id,
            'EDITOR',
            COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
            COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
            COALESCE(NEW.raw_user_meta_data->>'company', split_part(split_part(NEW.email, '@', 2), '.', 1))
          );
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    })

    if (triggerError) {
      console.log('  ⚠️  Trigger function error:', triggerError.message)
    } else {
      console.log('  ✅ Trigger function created')
    }

    // Create trigger
    console.log('\n📋 Step 6: Creating trigger...')
    const { error: triggerCreateError } = await supabase.rpc('exec_sql', {
      sql: `
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
      `
    })

    if (triggerCreateError) {
      console.log('  ⚠️  Trigger creation error:', triggerCreateError.message)
    } else {
      console.log('  ✅ Trigger created')
    }

    console.log('\n🎉 user_profiles table setup complete!')
    console.log('✅ Table created with RLS policies')
    console.log('✅ Auto-profile creation trigger installed')

  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

// Run the setup
createUserProfilesTable().catch(console.error) 