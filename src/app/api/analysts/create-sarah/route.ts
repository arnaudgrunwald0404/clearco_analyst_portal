import { NextResponse, NextRequest } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Simple guard: allow in development or when a valid admin token is provided
    const isDev = process.env.NODE_ENV !== 'production'
    const adminToken = request.headers.get('x-admin-token')
    const isAuthorized = isDev || (adminToken && adminToken === process.env.DEV_ADMIN_TOKEN)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Supabase service configuration missing' }, { status: 500 })
    }

    const supabase = createServiceClient(supabaseUrl, serviceKey)

    // Check if Sarah Chen already exists
    const { data: existingSarah, error: checkError } = await supabase
      .from('analysts')
      .select('*')
      .eq('email', 'sarah.chen@analystcompany.com')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking for existing Sarah Chen:', checkError);
      return NextResponse.json({ error: 'Error checking for existing Sarah Chen: ' + checkError.message }, { status: 500 });
    }

    if (existingSarah) {
      return NextResponse.json({ 
        success: true, 
        data: existingSarah,
        message: 'Sarah Chen already exists in analysts table'
      });
    }

    // Create Sarah Chen analyst record
    const sarahChenData = {
      firstName: 'Sarah',
      lastName: 'Chen',
      email: 'sarah.chen@analystcompany.com',
      company: 'AnalystCompany',
      title: 'Vice President Analyst',
      type: 'Analyst',
      influence: 'VERY_HIGH',
      status: 'ACTIVE',
      relationshipHealth: 'GOOD',
      keyThemes: 'HR Technology, Future of Work, Employee Experience',
      bio: 'Leading expert in HR technology and future of work trends at AnalystCompany',
      location: 'San Francisco, CA',
      linkedinUrl: 'https://www.linkedin.com/in/sarah-chen-analyst',
      twitterHandle: '@sarahchenanalyst',
      personalWebsite: 'https://sarahchen.analystcompany.com'
    };

    const { data: newSarahChen, error: createError } = await supabase
      .from('analysts')
      .insert(sarahChenData)
      .select()
      .single();

    if (createError) {
      console.error('Error creating Sarah Chen:', createError);
      return NextResponse.json({ error: 'Error creating Sarah Chen: ' + createError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: newSarahChen,
      message: 'Sarah Chen created successfully in analysts table'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Unexpected error occurred' }, { status: 500 });
  }
} 