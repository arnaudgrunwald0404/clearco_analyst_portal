import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/supabase'

interface RouteParams {
  params: { id: string }
}

// PATCH - Update calendar connection (active status and/or title)
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    console.log('🔍 [Calendar Connection] PATCH request started for ID:', params.id)
    
    const body = await request.json()
    const { isActive } = body // Remove title since it doesn't exist in the schema
    const connectionId = params.id

    // For now, we'll use a hardcoded user ID
    // In production, this should come from the session/auth
    const userId = 'd129d3b9-6cb7-4e77-ac3f-f233e1e047a0'

    const supabase = await createClient()

    // Verify the connection belongs to the user
    const { data: connection, error: fetchError } = await supabase
      .from('CalendarConnection')
      .select('id')
      .eq('id', connectionId)
      .eq('userId', userId)
      .single()

    if (fetchError || !connection) {
      console.error('Error fetching calendar connection:', fetchError)
      return NextResponse.json(
        { 
          success: false,
          error: 'Calendar connection not found or unauthorized' 
        },
        { status: 404 }
      )
    }

    // Build update data object
    const updateData: Partial<Database['public']['Tables']['CalendarConnection']['Update']> = {
      updatedAt: new Date().toISOString()
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive
    }

    // Update the connection
    const { data: updatedConnection, error: updateError } = await supabase
      .from('CalendarConnection')
      .update(updateData)
      .eq('id', connectionId)
      .select()
      .single()

    if (updateError || !updatedConnection) {
      console.error('❌ [Calendar Connection] Update failed:', updateError)
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to update calendar connection' 
        },
        { status: 500 }
      )
    }

    console.log('✅ [Calendar Connection] Update successful:', updatedConnection.title)

    return NextResponse.json({
      success: true,
      data: updatedConnection
    })

  } catch (error) {
    console.error('❌ [Calendar Connection] PATCH error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update calendar connection' 
      },
      { status: 500 }
    )
  }
}

// DELETE - Remove calendar connection
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    console.log('🔍 [Calendar Connection] DELETE request started for ID:', params.id)
    
    const connectionId = params.id
    const userId = 'd129d3b9-6cb7-4e77-ac3f-f233e1e047a0'

    const supabase = await createClient()

    // Verify the connection belongs to the user before deleting
    const { data: connection, error: fetchError } = await supabase
      .from('CalendarConnection')
      .select('id, title')
      .eq('id', connectionId)
      .eq('userId', userId)
      .single()

    if (fetchError || !connection) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Calendar connection not found' 
        },
        { status: 404 }
      )
    }

    // Delete the connection
    const { error: deleteError } = await supabase
      .from('CalendarConnection')
      .delete()
      .eq('id', connectionId)

    if (deleteError) {
      console.error('❌ [Calendar Connection] Delete failed:', deleteError)
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to delete calendar connection' 
        },
        { status: 500 }
      )
    }

    console.log(`🗑️ [Calendar Connection] Deleted: ${connection.title}`)

    return NextResponse.json({
      success: true,
      message: 'Calendar connection deleted successfully'
    })

  } catch (error) {
    console.error('❌ [Calendar Connection] DELETE error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete calendar connection' 
      },
      { status: 500 }
    )
  }
}
