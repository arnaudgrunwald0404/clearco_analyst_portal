import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const analystId = searchParams.get('analystId')

    const supabase = await createClient()

    let query = supabase
      .from('analyst_access')
      .select(`
        id,
        analyst_id,
        is_active,
        last_login,
        created_at,
        updated_at,
        analysts!inner(
          id,
          firstName,
          lastName,
          email,
          company
        )
      `)

    if (analystId) {
      query = query.eq('analyst_id', analystId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching analyst access:', error)
      return NextResponse.json(
        { error: 'Failed to fetch analyst access' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in analyst access GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { analystId, password, isActive = true } = await request.json()

    if (!analystId || !password) {
      return NextResponse.json(
        { error: 'Analyst ID and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if analyst exists
    const { data: analyst, error: analystError } = await supabase
      .from('analysts')
      .select('id, email')
      .eq('id', analystId)
      .single()

    if (analystError || !analyst) {
      return NextResponse.json(
        { error: 'Analyst not found' },
        { status: 404 }
      )
    }

    // Hash the password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Check if access already exists
    const { data: existingAccess } = await supabase
      .from('analyst_access')
      .select('id')
      .eq('analyst_id', analystId)
      .single()

    if (existingAccess) {
      // Update existing access
      const { data, error } = await supabase
        .from('analyst_access')
        .update({
          password_hash: passwordHash,
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('analyst_id', analystId)
        .select()
        .single()

      if (error) {
        console.error('Error updating analyst access:', error)
        return NextResponse.json(
          { error: 'Failed to update analyst access' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Analyst access updated successfully',
        data
      })
    } else {
      // Create new access
      const { data, error } = await supabase
        .from('analyst_access')
        .insert({
          analyst_id: analystId,
          password_hash: passwordHash,
          is_active: isActive
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating analyst access:', error)
        return NextResponse.json(
          { error: 'Failed to create analyst access' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Analyst access created successfully',
        data
      })
    }
  } catch (error) {
    console.error('Error in analyst access POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const analystId = searchParams.get('analystId')

    if (!analystId) {
      return NextResponse.json(
        { error: 'Analyst ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('analyst_access')
      .delete()
      .eq('analyst_id', analystId)

    if (error) {
      console.error('Error deleting analyst access:', error)
      return NextResponse.json(
        { error: 'Failed to delete analyst access' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Analyst access deleted successfully'
    })
  } catch (error) {
    console.error('Error in analyst access DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 