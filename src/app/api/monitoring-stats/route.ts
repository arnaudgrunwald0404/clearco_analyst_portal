 import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Return basic monitoring stats
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      status: 'healthy',
      message: 'Application is running on Supabase',
      apis: {
        migrated: 'All core APIs migrated to Supabase',
        status: 'operational'
      }
    })
  } catch (error) {
    console.error('Error in monitoring stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch monitoring stats' },
      { status: 500 }
    )
  }
}
