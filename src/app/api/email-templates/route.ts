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

    const { data: templates, error } = await supabase
      .from('EmailTemplate')
      .select('*')
      .order('updatedAt', { ascending: false })

    if (error) {
      console.error('Error fetching email templates:', error)
      return NextResponse.json(
        { error: 'Failed to fetch email templates' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      templates: templates || []
    })

  } catch (error) {
    console.error('Error fetching email templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, html } = await request.json()

    if (!name || !html) {
      return NextResponse.json(
        { error: 'Name and HTML content are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const templateData = {
      id: generateId(),
      name,
      description: description || '',
      html,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const { data: template, error } = await supabase
      .from('EmailTemplate')
      .insert(templateData)
      .select()
      .single()

    if (error) {
      console.error('Error creating email template:', error)
      return NextResponse.json(
        { error: 'Failed to create email template' },
        { status: 500 }
      )
    }

    console.log(`📧 Created email template: ${template.name}`)

    return NextResponse.json({
      success: true,
      data: template
    })

  } catch (error) {
    console.error('Error creating email template:', error)
    return NextResponse.json(
      { error: 'Failed to create email template' },
      { status: 500 }
    )
  }
} 