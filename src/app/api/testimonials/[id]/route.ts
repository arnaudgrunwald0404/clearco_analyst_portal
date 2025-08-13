import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Placeholder implementation
    return NextResponse.json({
      success: true,
      message: 'Testimonial endpoint - to be implemented'
    })
  } catch (error) {
    console.error('Error in testimonial:', error)
    return NextResponse.json(
      { success: false, error: 'Testimonial endpoint not implemented yet' },
      { status: 501 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: testimonialId } = await params
    console.log('📝 Testimonials PATCH request received for ID:', testimonialId)
    
    // Use service role client to ensure we can update testimonials
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Parse request body
    let body: any = {}
    try {
      body = await request.json()
      console.log('📝 Request body:', body)
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError)
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid JSON in request body' 
      }, { status: 400 })
    }

    // Validate updateable fields
    const updateData: any = {}
    
    if (typeof body.isPublished === 'boolean') {
      updateData.is_published = body.isPublished
    }
    
    if (typeof body.displayOrder === 'number') {
      updateData.display_order = body.displayOrder
    }
    
    if (body.context !== undefined) {
      updateData.context = body.context
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No valid fields to update' 
      }, { status: 400 })
    }

    // Update testimonial
    console.log('📝 Updating testimonial:', testimonialId, updateData)
    
    // First, verify the testimonial exists
    const { data: existingTestimonial, error: checkError } = await supabase
      .from('testimonials')
      .select('id')
      .eq('id', testimonialId)
      .single()
    
    if (checkError) {
      console.error('❌ Testimonial not found:', checkError)
      return NextResponse.json({ 
        success: false, 
        error: 'Testimonial not found' 
      }, { status: 404 })
    }
    
    // Now perform the update
    const { data, error } = await supabase
      .from('testimonials')
      .update(updateData)
      .eq('id', testimonialId)
      .select('*')
      .single()

    if (error) {
      console.error('❌ Database error updating testimonial:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update testimonial',
        details: error.message 
      }, { status: 500 })
    }

    console.log('✅ Testimonial updated successfully:', data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('💥 Unexpected error in testimonials PATCH:', error)
    
    let errorMessage = 'Failed to update testimonial'
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message)
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: testimonialId } = await params
    console.log('🗑️ Testimonials DELETE request received for ID:', testimonialId)
    const supabase = await createClient()
    
    // Delete testimonial
    const { error } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', testimonialId)

    if (error) {
      console.error('❌ Database error deleting testimonial:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to delete testimonial',
        details: error.message 
      }, { status: 500 })
    }

    console.log('✅ Testimonial deleted successfully')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('💥 Unexpected error in testimonials DELETE:', error)
    
    let errorMessage = 'Failed to delete testimonial'
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message)
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
} 