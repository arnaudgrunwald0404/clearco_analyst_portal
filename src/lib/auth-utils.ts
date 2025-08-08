import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function requireAuth() {
  console.log('\n' + '-'.repeat(40))
  console.log('🔐 [Auth Utils] requireAuth started')
  console.log('🕐 [Auth Utils] Timestamp:', new Date().toISOString())
  
  try {
    console.log('🏗️ [Auth Utils] Creating Supabase client...')
    const supabase = await createClient();
    console.log('✅ [Auth Utils] Supabase client created successfully')
    
    console.log('👤 [Auth Utils] Getting user from auth...')
    const { data: { user }, error } = await supabase.auth.getUser();
    
    console.log('📊 [Auth Utils] Auth result:')
    console.log('  - User present:', !!user)
    console.log('  - Error present:', !!error)
    
    if (user) {
      console.log('  - User ID:', user.id)
      console.log('  - User email:', user.email || 'No email')
      console.log('  - User metadata:', JSON.stringify(user.user_metadata || {}, null, 2))
      console.log('  - User app metadata:', JSON.stringify(user.app_metadata || {}, null, 2))
    }
    
    if (error) {
      console.error('❌ [Auth Utils] Auth error details:', error)
      console.error('  - Error message:', error.message)
      console.error('  - Error name:', error.name)
      console.error('  - Full error:', error)
    }

    if (error || !user) {
      console.error('❌ [Auth Utils] Authentication failed - returning 401')
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [Auth Utils] Authentication successful - returning user')
    return user;
  } catch (authError) {
    console.error('💥 [Auth Utils] Unexpected error in requireAuth:')
    console.error('  - Error type:', authError instanceof Error ? authError.constructor.name : typeof authError)
    console.error('  - Error message:', authError instanceof Error ? authError.message : String(authError))
    console.error('  - Error stack:', authError instanceof Error ? authError.stack : 'No stack trace')
    console.error('  - Full error:', authError)
    
    return new NextResponse(
      JSON.stringify({ success: false, error: 'Authentication system error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
