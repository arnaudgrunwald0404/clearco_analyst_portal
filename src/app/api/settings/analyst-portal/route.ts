import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `cl${timestamp}${randomPart}`
}

export async function GET() {
  try {
    const supabase = await createClient()
    
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
      const defaultSettings = {
        id: generateId(),
        welcomeQuote: '',
        quoteAuthor: '',
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
    const { welcomeQuote, quoteAuthor, authorImageUrl } = body
    
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
          updatedAt: new Date().toISOString()
        })
        .eq('id', existingSettings.id)
        .select()
        .single()
      
      if (updateError) {
        console.error('Error updating analyst portal settings:', updateError)
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
