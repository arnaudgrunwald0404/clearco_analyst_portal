import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('testimonials')
      .select('id, text, author, company, rating, created_at, is_published, display_order')
      .eq('is_published', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching testimonials:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch testimonials' }, { status: 500 })
    }

    const normalized = (data || []).map((t: any) => ({
      id: t.id,
      text: t.text,
      author: t.author,
      company: t.company,
      rating: Number(t.rating) || 5,
      date: t.created_at
    }))

    return NextResponse.json({ success: true, data: normalized })
  } catch (error) {
    console.error('Error in testimonials list:', error)
    return NextResponse.json(
      { success: false, error: 'Testimonials list not implemented yet' },
      { status: 501 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Placeholder implementation
    return NextResponse.json({
      success: true,
      message: 'Testimonials create endpoint - to be implemented'
    })
  } catch (error) {
    console.error('Error creating testimonial:', error)
    return NextResponse.json(
      { success: false, error: 'Testimonials create not implemented yet' },
      { status: 501 }
    )
  }
} 