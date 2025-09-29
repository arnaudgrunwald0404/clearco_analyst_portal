import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentVendorDomainId } from '@/lib/vendor-domain-utils'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Debug: Check user session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('🔍 [Portal Content] User session:', { 
      hasUser: !!user, 
      email: user?.email, 
      userError: userError?.message 
    })
    
    // Get vendor domain ID from current user
    const vendorDomainId = await getCurrentVendorDomainId()
    console.log('🔍 [Portal Content] Vendor domain ID:', vendorDomainId)
    
    // Check if user is from allowed domain (admin access)
    const email = user?.email || ''
    const domain = email.split('@')[1]?.toLowerCase()
    const allowedDomains = (process.env.NEXT_PUBLIC_SUPABASE_ALLOWED_DOMAINS || '').split(',').map(d => d.trim().toLowerCase()).filter(d => d.length > 0)
    const isAdminUser = allowedDomains.includes(domain)
    
    console.log('🔍 [Portal Content] Admin check:', { email, domain, isAdminUser, allowedDomains })
    
    if (!vendorDomainId && !isAdminUser) {
      return NextResponse.json({ error: 'Authentication required or invalid domain' }, { status: 401 })
    }
    
    // Fetch content - for admin users, show all content; for vendor users, show only their content
    let query = supabase
      .from('vendor_portal_content')
      .select(`
        *,
        vendor_domains!inner(company_name, protected_domain)
      `)
    
    // If not an admin user, filter by vendor domain
    if (!isAdminUser && vendorDomainId) {
      query = query.eq('vendor_domain_id', vendorDomainId)
    }
    
    const { data: content, error } = await query.order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching portal content:', error)
      return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: content || [] 
    })

  } catch (error) {
    console.error('Error in portal content API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    // Get vendor domain ID from current user
    const vendorDomainId = await getCurrentVendorDomainId()
    if (!vendorDomainId) {
      return NextResponse.json({ error: 'Authentication required or invalid domain' }, { status: 401 })
    }
    
    const { title, description, category, url } = body

    if (!title || !category || !url) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, category, url' 
      }, { status: 400 })
    }

    // Generate ID
    const id = 'content_' + Math.random().toString(36).substr(2, 9)

    const contentData = {
      id,
      vendor_domain_id: vendorDomainId,
      title,
      description: description || '',
      category,
      url,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const { data: content, error } = await supabase
      .from('vendor_portal_content')
      .insert([contentData])
      .select(`
        *,
        vendor_domains!inner(company_name, protected_domain)
      `)
      .single()

    if (error) {
      console.error('Error creating portal content:', error)
      return NextResponse.json({ error: 'Failed to create content' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: content 
    })

  } catch (error) {
    console.error('Error in portal content creation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

