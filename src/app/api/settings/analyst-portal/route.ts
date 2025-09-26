import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `cl${timestamp}${randomPart}`
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const vendorId = url.searchParams.get('vendorId') || undefined
    const vendorDomain = url.searchParams.get('vendorDomain') || undefined
    // Use service role key for server-side operations to bypass RLS
    const supabase = createServiceClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Fetch vendor-scoped portal settings from vendor_domains
    let query = supabase.from('vendor_domains').select('*').limit(1)
    if (vendorId) {
      query = supabase.from('vendor_domains').select('*').eq('id', vendorId).limit(1)
    } else if (vendorDomain) {
      query = supabase.from('vendor_domains').select('*').ilike('protected_domain', vendorDomain).limit(1)
    }

    const { data: vendorRow, error } = await query.single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching vendor domain for portal settings:', error)
      return NextResponse.json({ error: 'Failed to fetch portal settings' }, { status: 500 })
    }

    if (!vendorRow) {
      // No vendor row found; return empty defaults to avoid breaking UI
      return NextResponse.json({
        welcomeQuote: '',
        quoteAuthor: '',
        authorImageUrl: '',
        contactName: '',
        contactTitle: '',
        contactEmail: '',
        contactPhone: '',
        contactImageUrl: '',
        company_profile: {}
      })
    }

    const quoteAuthor = [vendorRow.portal_contact_name || '', vendorRow.portal_contact_title || '']
      .filter(Boolean)
      .join(', ')

    return NextResponse.json({
      welcomeQuote: vendorRow.portal_welcome_quote || '',
      quoteAuthor,
      authorImageUrl: vendorRow.portal_contact_image_url || '',
      contactName: vendorRow.portal_contact_name || '',
      contactTitle: vendorRow.portal_contact_title || '',
      contactEmail: vendorRow.portal_contact_email || '',
      contactPhone: vendorRow.portal_contact_phone || '',
      contactImageUrl: vendorRow.portal_contact_image_url || '',
      company_profile: vendorRow.company_profile || {}
    })
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
    const url = new URL(request.url)
    const vendorId = url.searchParams.get('vendorId') || undefined
    const vendorDomain = url.searchParams.get('vendorDomain') || undefined

    const body = await request.json()
    let { welcomeQuote, quoteAuthor, authorImageUrl, resources, contactName, contactTitle, contactEmail, contactPhone, contactImageUrl, companyProfile } = body

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
    
    // Use service role for vendor-scoped updates
    const supabase = createServiceClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Identify target vendor row
    let vendorQuery = supabase.from('vendor_domains').select('*').limit(1)
    if (vendorId) {
      vendorQuery = supabase.from('vendor_domains').select('*').eq('id', vendorId).limit(1)
    } else if (vendorDomain) {
      vendorQuery = supabase.from('vendor_domains').select('*').ilike('protected_domain', vendorDomain).limit(1)
    }
    const { data: vendorRow } = await vendorQuery.single()

    if (vendorRow) {
      // Update existing settings
      const { data: updatedVendor, error: updateError } = await supabase
        .from('vendor_domains')
        .update({
          portal_welcome_quote: welcomeQuote || '',
          portal_contact_name: contactName || '',
          portal_contact_title: contactTitle || '',
          portal_contact_email: contactEmail || '',
          portal_contact_phone: contactPhone || '',
          portal_contact_image_url: contactImageUrl || authorImageUrl || '',
          company_profile: companyProfile || null
        })
        .eq('id', vendorRow.id)
        .select()
        .single()
      
      if (updateError) {
        console.error('Error updating analyst portal settings:', updateError)
        const msg = String((updateError as any)?.message || updateError)
        const missingCols = msg.includes('column') && msg.includes('does not exist')
        if (missingCols) {
          return NextResponse.json(
            { error: 'Database is missing fields required by Analyst Portal settings (contact or company profile). Please run supabase/migrations/20250914_add_contact_fields_to_analyst_portal_settings.sql and supabase/migrations/20250926_add_company_profile_to_analyst_portal_settings.sql in your Supabase project, then try again.' },
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
        data: updatedVendor
      })
    } else {
      // No vendor row exists yet; create a vendor_domains row with provided values
      const newVendor = {
        id: generateId(),
        company_name: '',
        protected_domain: '',
        logo_url: '',
        industry_name: 'HR Technology',
        portal_welcome_quote: welcomeQuote || '',
        portal_contact_name: contactName || '',
        portal_contact_title: contactTitle || '',
        portal_contact_email: contactEmail || '',
        portal_contact_phone: contactPhone || '',
        portal_contact_image_url: contactImageUrl || authorImageUrl || '',
        company_profile: companyProfile || null
      }
      
      const { data: createdVendor, error: createError } = await supabase
        .from('vendor_domains')
        .insert(newVendor)
        .select()
        .single()
      
      if (createError) {
        console.error('Error creating analyst portal settings:', createError)
        const msg = String((createError as any)?.message || createError)
        const missingCols = msg.includes('column') && msg.includes('does not exist')
        if (missingCols) {
          return NextResponse.json(
            { error: 'Database is missing vendor_domains portal fields. Please run supabase/migrations/20250926_vendor_domains_add_portal_and_company_profile.sql in your Supabase project, then try again.' },
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
        data: createdVendor
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
