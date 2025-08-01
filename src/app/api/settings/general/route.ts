import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

type GeneralSettings = Database['public']['Tables']['GeneralSettings']['Row']
type GeneralSettingsInsert = Database['public']['Tables']['GeneralSettings']['Insert']

// Simple CUID-like ID generator
function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `cl${timestamp}${randomPart}`
}

// Cache duration in seconds (10 minutes for settings)
const CACHE_DURATION = 600; // 10 minutes
let settingsCache: any = null;
let cacheTimestamp: number = 0;

export async function GET() {
  try {
    const now = Date.now();
    
    // Return cached data if still valid
    if (settingsCache && (now - cacheTimestamp) < (CACHE_DURATION * 1000)) {
      return NextResponse.json({
        ...settingsCache,
        cached: true,
        cacheAge: Math.floor((now - cacheTimestamp) / 1000)
      });
    }

    const supabase = await createClient()

    // Get the first (and only) general settings record
    const { data: settings, error: fetchError } = await supabase
      .from('GeneralSettings')
      .select('*')
      .limit(1)
      .single()
    
    let finalSettings = settings;

    // If no settings exist, create default ones
    if (fetchError?.code === 'PGRST116' || !settings) {
      const defaultSettings: GeneralSettingsInsert = {
        id: generateId(),
        companyName: '',
        protectedDomain: '',
        logoUrl: '',
        industryName: 'HR Technology'
      }

      const { data: newSettings, error: createError } = await supabase
        .from('GeneralSettings')
        .insert(defaultSettings)
        .select()
        .single()

      if (createError) {
        console.error('Error creating default settings:', createError)
        throw new Error('Failed to create default settings')
      }

      finalSettings = newSettings
    } else if (fetchError) {
      console.error('Error fetching general settings:', fetchError)
      throw new Error('Failed to fetch general settings')
    }
    
    // Update cache
    settingsCache = finalSettings;
    cacheTimestamp = now;
    
    return NextResponse.json({
      ...finalSettings,
      cached: false,
      cacheAge: 0
    })
  } catch (error) {
    console.error('Error fetching general settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch general settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyName, protectedDomain, logoUrl, industryName } = body
    
    // Validate required fields
    if (!companyName || !protectedDomain || !industryName) {
      return NextResponse.json(
        { error: 'Company name, protected domain, and industry name are required' },
        { status: 400 }
      )
    }
    
    // Validate domain format - very basic check
    if (!protectedDomain.includes('.') || protectedDomain.length < 3) {
      return NextResponse.json(
        { error: 'Please enter a valid domain (e.g., company.com)' },
        { status: 400 }
      )
    }
    
    // Validate URL format if provided
    if (logoUrl && logoUrl.trim()) {
      // Allow relative paths (for uploaded files) and absolute URLs
      const trimmedUrl = logoUrl.trim()
      
      // If it's a relative path (starts with /), it's valid
      if (trimmedUrl.startsWith('/')) {
        // Valid relative path
      } else {
        // For absolute URLs, validate the format
        try {
          new URL(trimmedUrl)
        } catch {
          return NextResponse.json(
            { error: 'Please enter a valid logo URL or upload a file' },
            { status: 400 }
          )
        }
      }
    }
    
    const supabase = await createClient()

    // Check if settings already exist
    const { data: existingSettings } = await supabase
      .from('GeneralSettings')
      .select('*')
      .limit(1)
      .single()
    
    const updateData = {
      companyName: companyName.trim(),
      protectedDomain: protectedDomain.trim().toLowerCase(),
      logoUrl: logoUrl?.trim() || '',
      industryName: industryName.trim()
    }
    
    let settings
    if (existingSettings) {
      // Update existing settings
      const { data: updatedSettings, error: updateError } = await supabase
        .from('GeneralSettings')
        .update(updateData)
        .eq('id', existingSettings.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating settings:', updateError)
        throw new Error('Failed to update settings')
      }

      settings = updatedSettings
    } else {
      // Create new settings
      const newSettingsData: GeneralSettingsInsert = {
        id: generateId(),
        ...updateData
      }

      const { data: newSettings, error: createError } = await supabase
        .from('GeneralSettings')
        .insert(newSettingsData)
        .select()
        .single()

      if (createError) {
        console.error('Error creating settings:', createError)
        throw new Error('Failed to create settings')
      }

      settings = newSettings
    }
    
    // Invalidate cache when settings are updated
    settingsCache = null;
    cacheTimestamp = 0;
    
    console.log('✅ General settings updated successfully:', settings)
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('❌ Detailed error updating general settings:')
    console.error('Error type:', typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Full error object:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to update general settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
