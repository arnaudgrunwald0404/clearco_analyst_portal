import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentVendorDomainId } from '@/lib/vendor-domain-utils'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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

    const updateData = {
      title,
      description: description || '',
      category,
      url,
      updatedAt: new Date().toISOString()
    }

    const { data: content, error } = await supabase
      .from('vendor_portal_content')
      .update(updateData)
      .eq('id', id)
      .eq('vendor_domain_id', vendorDomainId) // Ensure user can only update their own domain's content
      .select(`
        *,
        vendor_domains!inner(company_name, protected_domain)
      `)
      .single()

    if (error) {
      console.error('Error updating portal content:', error)
      return NextResponse.json({ error: 'Failed to update content' }, { status: 500 })
    }

    if (!content) {
      return NextResponse.json({ error: 'Content not found or access denied' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      data: content 
    })

  } catch (error) {
    console.error('Error in portal content update:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get vendor domain ID from current user
    const vendorDomainId = await getCurrentVendorDomainId()
    if (!vendorDomainId) {
      return NextResponse.json({ error: 'Authentication required or invalid domain' }, { status: 401 })
    }

    const { error } = await supabase
      .from('vendor_portal_content')
      .delete()
      .eq('id', id)
      .eq('vendor_domain_id', vendorDomainId) // Ensure user can only delete their own domain's content

    if (error) {
      console.error('Error deleting portal content:', error)
      return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Content deleted successfully' 
    })

  } catch (error) {
    console.error('Error in portal content deletion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

