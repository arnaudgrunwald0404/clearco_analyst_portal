import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `cl${timestamp}${randomPart}`
}

export async function GET() {
  try {
    // Use service role key for server-side operations to bypass RLS
    const supabase = createServiceClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Get the first (and only) analyst portal settings record
    const { data: settings, error } = await supabase
      .from('analyst_portal_settings')
      .select('*')
      .limit(1)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching analyst portal settings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch analyst portal settings' },
        { status: 500 }
      )
    }
    
    // If no settings exist, create default ones
    if (!settings) {
      // Fallback: try to auto-populate contact from admin users API / first matching user
      let contactFallback: any = {}
      try {
        const adminResp = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/users`, { cache: 'no-store' })
        const adminJson = await adminResp.json().catch(() => ({} as any))
        const firstUser = Array.isArray(adminJson?.data) ? adminJson.data[0] : null
        if (firstUser) {
          contactFallback = {
            contactName: `${firstUser.firstName || ''} ${firstUser.lastName || ''}`.trim(),
            contactTitle: firstUser.role || '',
            contactEmail: firstUser.email || ''
          }
        }
      } catch {}

      const defaultSettings = {
        id: generateId(),
        welcomeQuote: 'Welcome {first_name}, I am so glad you are here to learn more about {company_name}!',
        // Keep legacy quoteAuthor populated using the contact fields
        quoteAuthor: `${contactFallback.contactName || 'Arnaud Grunwald'}${contactFallback.contactTitle ? `, ${contactFallback.contactTitle}` : ', Chief Product Officer'}`,
        authorImageUrl: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const { data: newSettings, error: createError } = await supabase
        .from('analyst_portal_settings')
        .insert(defaultSettings)
        .select()
        .single()
      
      if (createError) {
        console.error('Error creating default analyst portal settings:', createError)
        return NextResponse.json(
          { error: 'Failed to create default analyst portal settings' },
          { status: 500 }
        )
      }
      
      return NextResponse.json(newSettings)
    }
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching analyst portal settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analyst portal settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    let { welcomeQuote, quoteAuthor, authorImageUrl, resources, contactName, contactTitle, contactEmail, contactPhone, contactImageUrl } = body

    // Backward compatibility: if only quoteAuthor is provided, split into name and title
    if (!contactName && !contactTitle && typeof quoteAuthor === 'string' && quoteAuthor?.trim()) {
      const parts = quoteAuthor.split(',')
      contactName = parts[0]?.trim() || ''
      contactTitle = parts.slice(1).join(',').trim()
    }
    // Always derive quoteAuthor from contact fields for legacy consumers
    if (contactName || contactTitle) {
      quoteAuthor = `${contactName || ''}${contactTitle ? `, ${contactTitle}` : ''}`.trim()
    }
    
    const supabase = await createClient()
    
    // Get existing settings or create if none exist
    const { data: existingSettings } = await supabase
      .from('analyst_portal_settings')
      .select('id')
      .limit(1)
      .single()
    
    if (existingSettings) {
      // Update existing settings
      const { data: updatedSettings, error: updateError } = await supabase
        .from('analyst_portal_settings')
        .update({
          welcomeQuote: welcomeQuote || '',
          quoteAuthor: quoteAuthor || '',
          authorImageUrl: authorImageUrl || '',
          contactName: contactName || '',
          contactTitle: contactTitle || '',
          contactEmail: contactEmail || '',
          contactPhone: contactPhone || '',
          contactImageUrl: contactImageUrl || '',
          updatedAt: new Date().toISOString()
        })
        .eq('id', existingSettings.id)
        .select()
        .single()
      
      if (updateError) {
        console.error('Error updating analyst portal settings:', updateError)
        const msg = String((updateError as any)?.message || updateError)
        const missingCols = msg.includes('column') && msg.includes('does not exist')
        if (missingCols) {
          return NextResponse.json(
            { error: 'Database is missing contact fields (contactName, contactTitle, contactEmail, contactPhone, contactImageUrl). Please run supabase/migrations/20250914_add_contact_fields_to_analyst_portal_settings.sql in your Supabase project and try again.' },
            { status: 400 }
          )
        }
        return NextResponse.json(
          { error: 'Failed to update analyst portal settings' },
          { status: 500 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'Analyst portal settings updated successfully',
        data: updatedSettings
      })
    } else {
      // Create new settings
      const newSettings = {
        id: generateId(),
        welcomeQuote: welcomeQuote || '',
        quoteAuthor: quoteAuthor || '',
        authorImageUrl: authorImageUrl || '',
        contactName: contactName || '',
        contactTitle: contactTitle || '',
        contactEmail: contactEmail || '',
        contactPhone: contactPhone || '',
        contactImageUrl: contactImageUrl || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const { data: createdSettings, error: createError } = await supabase
        .from('analyst_portal_settings')
        .insert(newSettings)
        .select()
        .single()
      
      if (createError) {
        console.error('Error creating analyst portal settings:', createError)
        const msg = String((createError as any)?.message || createError)
        const missingCols = msg.includes('column') && msg.includes('does not exist')
        if (missingCols) {
          return NextResponse.json(
            { error: 'Database is missing contact fields (contactName, contactTitle, contactEmail, contactPhone, contactImageUrl). Please run supabase/migrations/20250914_add_contact_fields_to_analyst_portal_settings.sql in your Supabase project and try again.' },
            { status: 400 }
          )
        }
        return NextResponse.json(
          { error: 'Failed to create analyst portal settings' },
          { status: 500 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'Analyst portal settings created successfully',
        data: createdSettings
      })
    }
  } catch (error) {
    console.error('Error updating analyst portal settings:', error)
    return NextResponse.json(
      { error: 'Failed to update analyst portal settings' },
      { status: 500 }
    )
  }
}
