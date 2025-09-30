import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-utils'

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const authUser = authResult as any

    const body = await request.json()
    const {
      firstName,
      lastName,
      title,
      company,
      email,
      linkedinUrl,
      twitterHandle
    } = body

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { success: false, error: 'First name, last name, and email are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Find the analyst by their current email (from auth)
    const { data: analyst, error: findError } = await supabase
      .from('analysts')
      .select('id')
      .eq('email', authUser.email)
      .single()

    if (findError || !analyst) {
      return NextResponse.json(
        { success: false, error: 'Analyst not found' },
        { status: 404 }
      )
    }

    // Update the analyst profile
    const { error: updateError } = await supabase
      .from('analysts')
      .update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        title: title?.trim() || null,
        company: company?.trim() || null,
        email: email.trim(),
        linkedinUrl: linkedinUrl?.trim() || null,
        twitterHandle: twitterHandle?.trim() || null,
        updatedAt: new Date().toISOString()
      })
      .eq('id', analyst.id)

    if (updateError) {
      console.error('Error updating analyst profile:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    })

  } catch (error) {
    console.error('Error in update profile API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

